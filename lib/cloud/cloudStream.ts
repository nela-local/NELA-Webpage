import { getCloudBearerToken } from "./guestSession";
import { getApiBaseUrl } from "@/lib/nela-api";
import type {
  CloudChatRequest,
  CloudToolCall,
  GuestLimits,
  StreamFinishMeta,
} from "./types";

type StreamCallbacks = {
  onChunk: (chunk: string) => void;
  onThinking: (thinking: string) => void;
  onFinish: (meta?: StreamFinishMeta) => void;
  onError: (err: unknown) => void;
  signal?: AbortSignal;
};

class ToolCallAccumulator {
  private slots = new Map<
    number,
    { id: string; name: string; arguments: string }
  >();

  ingestDelta(value: Record<string, unknown>): void {
    const arr = (value as { choices?: Array<{ delta?: { tool_calls?: unknown[] } }> })
      .choices?.[0]?.delta?.tool_calls;
    if (!Array.isArray(arr)) return;

    for (const item of arr) {
      const rec = item as {
        index?: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      };
      const index = rec.index ?? 0;
      const entry = this.slots.get(index) ?? {
        id: "",
        name: "",
        arguments: "",
      };
      if (rec.id) entry.id = rec.id;
      if (rec.function?.name) entry.name = rec.function.name;
      if (rec.function?.arguments) entry.arguments += rec.function.arguments;
      this.slots.set(index, entry);
    }
  }

  finish(): CloudToolCall[] | undefined {
    if (this.slots.size === 0) return undefined;
    return [...this.slots.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, v]) => ({
        id: v.id || `call_${Math.random().toString(36).slice(2)}`,
        type: "function" as const,
        function: { name: v.name, arguments: v.arguments },
      }));
  }
}

function contentToPlain(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p) => {
        if (typeof p === "object" && p && "text" in p) {
          return String((p as { text?: string }).text ?? "");
        }
        return "";
      })
      .join("");
  }
  return null;
}

function extractStreamDelta(value: Record<string, unknown>): string | null {
  const top = contentToPlain(value.content);
  if (top) return top;
  const delta = (value as { choices?: Array<{ delta?: { content?: unknown } }> })
    .choices?.[0]?.delta?.content;
  return contentToPlain(delta);
}

function extractStreamReasoning(value: Record<string, unknown>): string | null {
  const delta = (value as {
    choices?: Array<{
      delta?: {
        reasoning?: string;
        reasoning_content?: string;
      };
    }>;
  }).choices?.[0]?.delta;
  if (!delta) return null;
  const r = delta.reasoning ?? delta.reasoning_content;
  return typeof r === "string" && r ? r : null;
}

function parseMetaFromHeaders(
  headers: Headers,
  guestLimits: GuestLimits | null,
): Partial<StreamFinishMeta> {
  const meta: Partial<StreamFinishMeta> = {};
  const model = headers.get("x-nela-selected-model");
  if (model) meta.model = model;
  const credits = headers.get("x-nela-credits-remaining");
  if (credits) meta.creditsRemaining = Number(credits);
  const trial = headers.get("x-nela-trial-credits-remaining");
  if (trial) meta.trialCreditsRemaining = Number(trial);
  const expires = headers.get("x-nela-trial-expires-at");
  if (expires) meta.trialExpiresAt = expires;

  const chatRemaining = headers.get("x-nela-guest-chat-remaining");
  const searchRemaining = headers.get("x-nela-guest-search-remaining");
  const guestExpires = headers.get("x-nela-guest-expires-at");
  if (chatRemaining && searchRemaining && guestExpires && guestLimits) {
    const chatRem = Number(chatRemaining);
    const searchRem = Number(searchRemaining);
    meta.guestLimits = {
      chat: {
        limit: guestLimits.chat.limit,
        used: guestLimits.chat.limit - chatRem,
        remaining: chatRem,
      },
      search: {
        limit: guestLimits.search.limit,
        used: guestLimits.search.limit - searchRem,
        remaining: searchRem,
      },
      expiresAt: guestExpires,
    };
  }

  return meta;
}

export async function streamCloudChat(
  request: CloudChatRequest,
  callbacks: StreamCallbacks,
  guestLimits?: GuestLimits | null,
): Promise<void> {
  const token = getCloudBearerToken();
  if (!token) {
    callbacks.onError(
      new Error("UNAUTHORIZED: Sign in or start a guest try session"),
    );
    return;
  }

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/v1/ai/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...request, stream: true }),
      signal: callbacks.signal,
    });
  } catch (err) {
    callbacks.onError(err);
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      (err as { message?: string; code?: string }).message ??
      `API ${res.status}`;
    const code = (err as { code?: string }).code;
    callbacks.onError(new Error(code ? `${code}: ${msg}` : msg));
    return;
  }

  const headerMeta = parseMetaFromHeaders(res.headers, guestLimits ?? null);
  const toolAcc = new ToolCallAccumulator();
  let finishReason: string | undefined;
  let streamModel: string | undefined;

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError(new Error("No response body"));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const pos = buffer.indexOf("\n");
        if (pos < 0) break;

        const line = buffer.slice(0, pos).replace(/\r$/, "");
        buffer = buffer.slice(pos + 1);
        if (!line.trim()) continue;

        const data = line.startsWith("data:")
          ? line.slice(5).trim()
          : line.trim();
        if (!data) continue;

        if (data === "[DONE]") {
          callbacks.onFinish({
            ...headerMeta,
            model: streamModel ?? headerMeta.model,
            tool_calls: toolAcc.finish(),
            finishReason,
          });
          return;
        }

        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(data) as Record<string, unknown>;
        } catch {
          continue;
        }

        if (typeof parsed.model === "string" && parsed.model) {
          streamModel = parsed.model;
        }

        const fr = (parsed as { choices?: Array<{ finish_reason?: string }> })
          .choices?.[0]?.finish_reason;
        if (fr) finishReason = fr;

        const text = extractStreamDelta(parsed);
        if (text) callbacks.onChunk(text);

        const thinking = extractStreamReasoning(parsed);
        if (thinking) callbacks.onThinking(thinking);

        toolAcc.ingestDelta(parsed);
      }
    }

    callbacks.onFinish({
      ...headerMeta,
      model: streamModel ?? headerMeta.model,
      tool_calls: toolAcc.finish(),
      finishReason,
    });
  } catch (err) {
    if (
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof Error && err.name === "AbortError")
    ) {
      callbacks.onFinish({ ...headerMeta, finishReason: "abort" });
      return;
    }
    callbacks.onError(err);
  }
}

export function streamCloudRound(
  request: Omit<CloudChatRequest, "stream">,
  callbacks: StreamCallbacks,
  guestLimits?: GuestLimits | null,
): Promise<StreamFinishMeta & { content: string; thinking: string }> {
  let content = "";
  let thinking = "";

  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
    callbacks.signal?.addEventListener("abort", onAbort, { once: true });
    if (callbacks.signal?.aborted) {
      onAbort();
      return;
    }

    streamCloudChat(
      { ...request, stream: true },
      {
        signal: callbacks.signal,
        onChunk: (chunk) => {
          content += chunk;
          callbacks.onChunk(chunk);
        },
        onThinking: (t) => {
          thinking += t;
          callbacks.onThinking(t);
        },
        onFinish: (meta) => {
          callbacks.signal?.removeEventListener("abort", onAbort);
          resolve({
            content,
            thinking,
            ...meta,
          });
        },
        onError: (err) => {
          callbacks.signal?.removeEventListener("abort", onAbort);
          reject(err);
        },
      },
      guestLimits,
    ).catch(reject);
  });
}
