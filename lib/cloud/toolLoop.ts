import { buildWebChatTools } from "./cloudTools";
import { streamCloudRound } from "./cloudStream";
import { mergeWebSearchResults } from "./mergeWebSearch";
import {
  extractWebPages,
  normalizeWebToolDepth,
  runWebSearchWithDepth,
} from "./webSearch";
import type {
  CloudChatMessage,
  CloudQualityMode,
  CloudToolCall,
  GuestLimits,
  WebSearchResult,
} from "./types";

const MAX_TOOL_ROUNDS = 4;

const WEB_TOOL_HINT_BASE =
  "You have web_search and web_extract tools for live public-web facts. " +
  "Call web_search ONLY when you need current or external information — never automatically. " +
  "Every web_search call MUST include query and depth (snippet | full | standard | deep). " +
  "Cite web results with inline [n] markers only (no raw URLs).";

const WEB_TOOL_HINT_ARTIFACTS =
  "For HTML reports or presentations, wrap output in <nela-artifact type=\"text/html\" title=\"...\">...</nela-artifact> with a complete document.";

const WEB_TOOL_HINT_NO_ARTIFACTS =
  "Do not generate HTML artifacts, slide decks, or <nela-artifact> blocks. Answer in normal chat prose and markdown only.";

function injectToolHint(
  messages: CloudChatMessage[],
  allowArtifacts: boolean,
): CloudChatMessage[] {
  const hint = allowArtifacts
    ? `${WEB_TOOL_HINT_BASE} ${WEB_TOOL_HINT_ARTIFACTS}`
    : `${WEB_TOOL_HINT_BASE} ${WEB_TOOL_HINT_NO_ARTIFACTS}`;
  const firstSystem = messages.findIndex((m) => m.role === "system");
  if (firstSystem >= 0) {
    const existing = messages[firstSystem]!.content;
    const text =
      typeof existing === "string" ? existing : "";
    return [
      ...messages.slice(0, firstSystem),
      {
        role: "system",
        content: `${text}\n\n${hint}`.trim(),
      },
      ...messages.slice(firstSystem + 1),
    ];
  }
  return [{ role: "system", content: hint }, ...messages];
}

async function executeToolCall(
  call: CloudToolCall,
  webSearchResult: WebSearchResult | null,
  onStatus?: (status: string | null) => void,
): Promise<{ content: string; webSearchResult: WebSearchResult | null }> {
  const name = call.function.name;
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
  } catch {
    return {
      content: `Invalid JSON arguments for ${name}`,
      webSearchResult,
    };
  }

  if (name === "web_search") {
    const query = typeof args.query === "string" ? args.query.trim() : "";
    if (!query) {
      return { content: "web_search requires a query", webSearchResult };
    }
    const depth = normalizeWebToolDepth(args.depth);
    const site =
      typeof args.site === "string" && args.site.trim()
        ? args.site.trim()
        : undefined;
    const timeRange =
      args.time_range === "day" ||
      args.time_range === "week" ||
      args.time_range === "month" ||
      args.time_range === "year"
        ? args.time_range
        : undefined;

    try {
      const result = await runWebSearchWithDepth({
        query,
        depth,
        site,
        timeRange,
        onStatus,
      });
      const merged =
        result.results.length > 0 || result.formatted_context?.trim()
          ? mergeWebSearchResults(webSearchResult, result)
          : webSearchResult;
      const toolBody =
        result.formatted_context?.trim() ||
        (result.results.length === 0
          ? `No web results found for query: ${query}`
          : result.results
              .map((h, i) => `${i + 1}. ${h.title}\n${h.snippet}\n${h.url}`)
              .join("\n\n"));
      return { content: toolBody, webSearchResult: merged };
    } catch (e) {
      onStatus?.(null);
      return {
        content: `web_search failed: ${e instanceof Error ? e.message : e}`,
        webSearchResult,
      };
    }
  }

  if (name === "web_extract") {
    const urls = Array.isArray(args.urls)
      ? args.urls.filter((u): u is string => typeof u === "string")
      : [];
    if (!urls.length) {
      return { content: "web_extract requires urls", webSearchResult };
    }
    onStatus?.(`Reading ${urls.length} page(s)…`);
    try {
      const body = await extractWebPages(urls, {
        query: typeof args.query === "string" ? args.query : undefined,
        depth: args.depth === "advanced" ? "advanced" : "basic",
      });
      onStatus?.(null);
      return { content: body, webSearchResult };
    } catch (e) {
      onStatus?.(null);
      return {
        content: `web_extract failed: ${e instanceof Error ? e.message : e}`,
        webSearchResult,
      };
    }
  }

  return { content: `Unknown tool: ${name}`, webSearchResult };
}

export interface WebToolLoopOptions {
  mode: CloudQualityMode;
  messages: CloudChatMessage[];
  sessionId?: string;
  signal?: AbortSignal;
  guestLimits?: GuestLimits | null;
  /** When false, do not instruct or encourage HTML/CSV artifacts (guest try). Default true. */
  allowArtifacts?: boolean;
  onChunk: (chunk: string) => void;
  onThinking: (thinking: string) => void;
  onToolStatus?: (status: string | null) => void;
}

export interface WebToolLoopResult {
  content: string;
  thinking: string;
  webSearchResult: WebSearchResult | null;
  creditsRemaining?: number;
  trialCreditsRemaining?: number;
  guestLimits?: GuestLimits;
  model?: string;
}

export async function runWebToolLoop(
  opts: WebToolLoopOptions,
): Promise<WebToolLoopResult> {
  const tools = buildWebChatTools();
  const allowArtifacts = opts.allowArtifacts !== false;
  let messages = injectToolHint(opts.messages, allowArtifacts);
  let webSearchResult: WebSearchResult | null = null;
  let thinking = "";
  let lastCredits: number | undefined;
  let lastTrial: number | undefined;
  let lastGuestLimits: GuestLimits | undefined;
  let lastModel: string | undefined;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const decision = await streamCloudRound(
      {
        mode: opts.mode,
        messages,
        tools,
        tool_choice: "auto",
        privacy: {
          containsFileContext: false,
          userConfirmedCloudContext: false,
          contextSource: "web_try",
        },
        client: { platform: "web", sessionId: opts.sessionId },
      },
      {
        signal: opts.signal,
        onChunk: () => {
          /* suppress intermediate tool-decision tokens */
        },
        onThinking: (t) => {
          thinking += t;
          opts.onThinking(t);
        },
        onFinish: () => {},
        onError: () => {},
      },
      opts.guestLimits,
    );

    if (typeof decision.creditsRemaining === "number") {
      lastCredits = decision.creditsRemaining;
    }
    if (typeof decision.trialCreditsRemaining === "number") {
      lastTrial = decision.trialCreditsRemaining;
    }
    if (decision.guestLimits) lastGuestLimits = decision.guestLimits;
    if (decision.model) lastModel = decision.model;

    const toolCalls = decision.tool_calls ?? [];
    if (!toolCalls.length) {
      if (decision.content.trim()) {
        opts.onChunk(decision.content);
      }
      return {
        content: decision.content,
        thinking,
        webSearchResult,
        creditsRemaining: lastCredits,
        trialCreditsRemaining: lastTrial,
        guestLimits: lastGuestLimits,
        model: lastModel,
      };
    }

    messages = [
      ...messages,
      {
        role: "assistant",
        content: decision.content || null,
        tool_calls: toolCalls,
      },
    ];

    const results = await Promise.all(
      toolCalls.map((call) =>
        executeToolCall(call, null, opts.onToolStatus),
      ),
    );

    for (const executed of results) {
      if (executed.webSearchResult) {
        webSearchResult = executed.webSearchResult;
      }
    }

    messages = [
      ...messages,
      ...toolCalls.map((call, i) => ({
        role: "tool" as const,
        tool_call_id: call.id,
        name: call.function.name,
        content: results[i]!.content,
      })),
    ];

    if (round + 1 < MAX_TOOL_ROUNDS) {
      messages = [
        ...messages,
        {
          role: "user",
          content:
            "Continue. If you still need web facts, call web_search with a NEW query. " +
            "Otherwise answer in prose with inline [n] citations only.",
        },
      ];
    }
  }

  // Final prose turn without tools
  let content = "";
  await new Promise<void>((resolve, reject) => {
    streamCloudRound(
      {
        mode: opts.mode,
        messages,
        privacy: {
          containsFileContext: false,
          userConfirmedCloudContext: false,
          contextSource: "web_try",
        },
        client: { platform: "web", sessionId: opts.sessionId },
      },
      {
        signal: opts.signal,
        onChunk: (chunk) => {
          content += chunk;
          opts.onChunk(chunk);
        },
        onThinking: (t) => {
          thinking += t;
          opts.onThinking(t);
        },
        onFinish: (meta) => {
          if (typeof meta?.creditsRemaining === "number") {
            lastCredits = meta.creditsRemaining;
          }
          if (typeof meta?.trialCreditsRemaining === "number") {
            lastTrial = meta.trialCreditsRemaining;
          }
          if (meta?.model) lastModel = meta.model;
          if (meta?.guestLimits) lastGuestLimits = meta.guestLimits;
          resolve();
        },
        onError: reject,
      },
      opts.guestLimits,
    ).catch(reject);
  });

  return {
    content,
    thinking,
    webSearchResult,
    creditsRemaining: lastCredits,
    trialCreditsRemaining: lastTrial,
    guestLimits: lastGuestLimits,
    model: lastModel,
  };
}
