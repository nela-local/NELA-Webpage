"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Cloud,
  Download,
  Loader2,
  MessageSquarePlus,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessage from "@/components/chat/ChatMessage";
import ArtifactPanel from "@/components/chat/ArtifactPanel";
import { friendlyErrorFromUnknown } from "@/lib/friendlyError";
import {
  createThread,
  loadThreads,
  upsertThread,
} from "@/lib/cloud/chatStorage";
import {
  canUseMode,
  fetchEntitlement,
  modeAccessHint,
  quotaLabel,
} from "@/lib/cloud/entitlement";
import {
  ensureGuestSession,
  fetchGuestLimits,
  guestCanSend,
  guestQuotaLabel,
} from "@/lib/cloud/guestSession";
import {
  scrubChatArtifactProtocol,
  StreamArtifactParser,
} from "@/lib/cloud/streamArtifactParser";
import { runWebToolLoop } from "@/lib/cloud/toolLoop";
import type {
  ChatThread,
  ChatTurn,
  CloudChatMessage,
  CloudQualityMode,
  EntitlementResponse,
  GuestLimits,
} from "@/lib/cloud/types";

const MODES: CloudQualityMode[] = ["fast", "smart", "deep", "auto"];

function turnId(): string {
  return `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function threadTitleFromText(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 48)}…` : t || "New chat";
}

function toApiMessages(turns: ChatTurn[]): CloudChatMessage[] {
  return turns
    .filter((t) => t.role === "user" || (t.role === "assistant" && t.content))
    .map((t) => ({
      role: t.role,
      content: t.content,
    }));
}

export default function TryChatClient() {
  const { isAuthenticated, isReady, user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<CloudQualityMode>("fast");
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(
    null,
  );
  const [guestLimits, setGuestLimits] = useState<GuestLimits | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [liveArtifact, setLiveArtifact] = useState<{
    title: string;
    html: string;
    type: "text/html" | "text/csv";
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(`web_${Date.now()}`);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) ?? null,
    [threads, activeId],
  );

  const isGuest = isReady && !isAuthenticated;
  const sendAllowed = isAuthenticated
    ? canUseMode(entitlement, mode)
    : guestCanSend(guestLimits);

  useEffect(() => {
    const stored = loadThreads();
    setThreads(stored);
    if (stored[0]) setActiveId(stored[0].id);
    else {
      const t = createThread();
      setThreads([t]);
      setActiveId(t.id);
    }
  }, []);

  useEffect(() => {
    if (!isReady || isAuthenticated) {
      setGuestLimits(null);
      setGuestError(null);
      return;
    }

    setGuestLoading(true);
    ensureGuestSession()
      .then(({ limits }) => {
        setGuestLimits(limits);
        setGuestError(null);
      })
      .catch((err) => {
        setGuestError(
          err instanceof Error ? err.message : "Could not start guest session",
        );
      })
      .finally(() => setGuestLoading(false));
  }, [isAuthenticated, isReady]);

  useEffect(() => {
    if (!isAuthenticated) {
      setEntitlement(null);
      return;
    }
    fetchEntitlement()
      .then(setEntitlement)
      .catch(() => setEntitlement(null));
  }, [isAuthenticated, user?.updatedAt]);

  useEffect(() => {
    if (isGuest) setMode("fast");
  }, [isGuest]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeThread?.turns, toolStatus, isStreaming]);

  const updateThread = useCallback((thread: ChatThread) => {
    setThreads((prev) => upsertThread(prev, thread));
  }, []);

  const patchAssistantTurn = useCallback(
    (threadId: string, turnIdToPatch: string, patch: Partial<ChatTurn>) => {
      setThreads((prev) => {
        const thread = prev.find((t) => t.id === threadId);
        if (!thread) return prev;
        const turns = thread.turns.map((t) =>
          t.id === turnIdToPatch ? { ...t, ...patch } : t,
        );
        return upsertThread(prev, { ...thread, turns });
      });
    },
    [],
  );

  const handleNewChat = () => {
    const t = createThread();
    setThreads((prev) => upsertThread(prev, t));
    setActiveId(t.id);
    setLiveArtifact(null);
    setArtifactOpen(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming || !activeThread) return;

    if (!isAuthenticated && !guestCanSend(guestLimits)) return;

    if (isAuthenticated && !sendAllowed) return;

    setInput("");
    setIsStreaming(true);
    setToolStatus(null);
    setLiveArtifact(null);
    setArtifactOpen(false);

    const userTurn: ChatTurn = { id: turnId(), role: "user", content: text };
    const assistantTurn: ChatTurn = {
      id: turnId(),
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    const titled =
      activeThread.turns.length === 0
        ? { ...activeThread, title: threadTitleFromText(text) }
        : activeThread;

    const workingThread: ChatThread = {
      ...titled,
      turns: [...titled.turns, userTurn, assistantTurn],
    };
    updateThread(workingThread);

    const parser = isGuest ? null : new StreamArtifactParser();
    let artifactHtml = "";
    let artifactTitle = "Artifact";
    let artifactType: "text/html" | "text/csv" = "text/html";
    let assistantContent = "";

    const applyParserEmit = (emit: ReturnType<StreamArtifactParser["push"]>) => {
      if (emit.meta) {
        artifactTitle = emit.meta.title;
        artifactType = emit.meta.type;
        setArtifactOpen(true);
      }
      if (emit.artifactDelta) {
        artifactHtml += emit.artifactDelta;
        setLiveArtifact({
          title: artifactTitle,
          html: artifactHtml,
          type: artifactType,
        });
        setArtifactOpen(true);
      }
      const chat = scrubChatArtifactProtocol(emit.chatDelta);
      if (chat) {
        assistantContent += chat;
        patchAssistantTurn(workingThread.id, assistantTurn.id, {
          content: assistantContent,
        });
      }
    };

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiMessages = toApiMessages(
        workingThread.turns.filter((t) => t.id !== assistantTurn.id),
      );

      const result = await runWebToolLoop({
        mode: isGuest ? "fast" : mode,
        messages: apiMessages,
        sessionId: sessionIdRef.current,
        signal: controller.signal,
        guestLimits: isGuest ? guestLimits : undefined,
        allowArtifacts: !isGuest,
        onToolStatus: setToolStatus,
        onThinking: () => {},
        onChunk: (chunk) => {
          if (!parser) {
            const chat = scrubChatArtifactProtocol(chunk);
            if (chat) {
              assistantContent += chat;
              patchAssistantTurn(workingThread.id, assistantTurn.id, {
                content: assistantContent,
              });
            }
            return;
          }
          applyParserEmit(parser.push(chunk));
        },
      });

      if (parser) {
        applyParserEmit(parser.finalize());

        if (!artifactHtml && result.content) {
          const recovered = parser.finalize();
          if (recovered.artifactDelta) {
            artifactHtml = recovered.artifactDelta;
          }
        }
      }

      const finalContent =
        scrubChatArtifactProtocol(assistantContent || result.content) ||
        scrubChatArtifactProtocol(result.content);

      patchAssistantTurn(workingThread.id, assistantTurn.id, {
        content: finalContent,
        webSearch: result.webSearchResult,
        artifactHtml: isGuest ? undefined : artifactHtml || undefined,
        artifactTitle: !isGuest && artifactHtml ? artifactTitle : undefined,
        artifactType: !isGuest && artifactHtml ? artifactType : undefined,
        isStreaming: false,
      });

      if (!isGuest && artifactHtml) {
        setLiveArtifact({
          title: artifactTitle,
          html: artifactHtml,
          type: artifactType,
        });
        setArtifactOpen(true);
      }

      if (isAuthenticated) {
        fetchEntitlement().then(setEntitlement).catch(() => {});
      } else if (result.guestLimits) {
        setGuestLimits(result.guestLimits);
      } else if (isGuest) {
        fetchGuestLimits().then(setGuestLimits).catch(() => {});
      }
    } catch (err) {
      if (
        (err instanceof DOMException && err.name === "AbortError") ||
        (err instanceof Error && err.name === "AbortError")
      ) {
        patchAssistantTurn(workingThread.id, assistantTurn.id, {
          isStreaming: false,
        });
      } else {
        patchAssistantTurn(workingThread.id, assistantTurn.id, {
          error: friendlyErrorFromUnknown(err),
          isStreaming: false,
        });
      }
    } finally {
      setIsStreaming(false);
      setToolStatus(null);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const openArtifactForTurn = (turn: ChatTurn) => {
    if (!turn.artifactHtml) return;
    setLiveArtifact({
      title: turn.artifactTitle ?? "Artifact",
      html: turn.artifactHtml,
      type: turn.artifactType ?? "text/html",
    });
    setArtifactOpen(true);
  };

  if (!isReady || (isGuest && guestLoading)) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "calc(100dvh - var(--nela-nav-offset))" }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  const chatReady = isAuthenticated || guestLimits !== null;

  return (
    <div
      className="flex flex-col"
      style={{
        paddingTop: "var(--nela-nav-offset)",
        height: "100dvh",
      }}
    >
      <header
        className="sticky z-40 shrink-0 border-b px-4 py-3 backdrop-blur-md sm:px-6"
        style={{
          top: "var(--nela-nav-offset)",
          borderColor: "var(--border-primary)",
          background: "var(--bg-primary)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5" style={{ color: "var(--accent)" }} />
            <div>
              <h1 className="font-space text-lg font-semibold">NELA Cloud</h1>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {isGuest
                  ? "Try chat and web search in your browser"
                  : "Try chat, web search, and HTML artifacts in your browser"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAuthenticated && entitlement ? (
              <span
                className="rounded-full px-3 py-1 font-mono text-xs"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                }}
              >
                {quotaLabel(entitlement)}
              </span>
            ) : isGuest && guestLimits ? (
              <span
                className="rounded-full px-3 py-1 font-mono text-xs"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                }}
              >
                {guestQuotaLabel(guestLimits)}
              </span>
            ) : null}

            <div
              className="flex rounded-full border p-0.5"
              style={{ borderColor: "var(--border-primary)" }}
              role="group"
              aria-label="Intelligence mode"
            >
              {MODES.map((m) => {
                const allowed = isAuthenticated
                  ? canUseMode(entitlement, m)
                  : m === "fast";
                const hint = isAuthenticated
                  ? modeAccessHint(entitlement, m)
                  : m === "fast"
                    ? "Guest try — Fast mode only"
                    : "Sign in for Smart, Deep, and Auto";
                const selected = mode === m;
                const disabled = isGuest && m !== "fast";
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMode(m)}
                    title={hint}
                    className="rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      background: selected ? "var(--accent)" : "transparent",
                      color: selected
                        ? "var(--bg-primary)"
                        : allowed
                          ? "var(--text-secondary)"
                          : "var(--text-tertiary)",
                      opacity: disabled ? 0.4 : allowed ? 1 : 0.65,
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleNewChat}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              New
            </button>

            <Link
              href="/download"
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <Download className="h-3.5 w-3.5" />
              Desktop
            </Link>

            {isGuest ? (
              <Link
                href="/login?next=/try"
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {!chatReady ? (
        <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <Sparkles className="h-10 w-10" style={{ color: "var(--accent)" }} />
          <h2 className="text-xl font-semibold">Could not start guest try</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            {guestError ??
              "We couldn't create an anonymous try session. Refresh or sign in to continue."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border px-6 py-3 font-medium"
              style={{ borderColor: "var(--border-primary)" }}
            >
              Retry
            </button>
            <Link
              href="/login?next=/try"
              className="rounded-full px-6 py-3 font-medium"
              style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
            >
              Sign in
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6"
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-6">
                {activeThread?.turns.length === 0 ? (
                  <div
                    className="rounded-2xl border p-8 text-center"
                    style={{
                      borderColor: "var(--border-primary)",
                      background: "var(--bg-card)",
                    }}
                  >
                    <p className="mb-2 font-medium">What can you try here?</p>
                    <ul
                      className="space-y-1 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {isGuest ? (
                        <>
                          <li>
                            Guest try: {guestLimits?.chat.limit ?? 10} Fast messages
                            and {guestLimits?.search.limit ?? 10} web searches per 24h
                          </li>
                          <li>Ask for live facts — NELA can search the web for you</li>
                          <li>
                            Sign in for HTML artifacts, Smart/Deep modes, and higher
                            limits
                          </li>
                        </>
                      ) : (
                        <>
                          <li>Ask a question — Fast mode uses your free Cloud quota</li>
                          <li>Request live facts — NELA can search the web for you</li>
                          <li>
                            Ask for a short HTML report or slide deck — preview appears
                            on the right
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                ) : null}

                {activeThread?.turns.map((turn) => (
                  <ChatMessage
                    key={turn.id}
                    turn={turn}
                    toolStatus={
                      turn.isStreaming ? toolStatus : undefined
                    }
                    onViewArtifact={
                      !isGuest && turn.artifactHtml
                        ? () => openArtifactForTurn(turn)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>

            <div
              className="shrink-0 border-t px-4 py-4 sm:px-6"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <div className="mx-auto max-w-3xl">
                {!sendAllowed ? (
                  <p
                    className="mb-2 text-center text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {isGuest
                      ? "Guest try limit reached — sign in for more messages and modes"
                      : modeAccessHint(entitlement, mode)}
                  </p>
                ) : isGuest ? (
                  <p
                    className="mb-2 text-center text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Guest try — Fast mode only.{" "}
                    <Link href="/login?next=/try" className="underline">
                      Sign in
                    </Link>{" "}
                    for artifacts, Smart/Deep, and higher limits.
                  </p>
                ) : entitlement && !canUseMode(entitlement, mode) ? (
                  <p
                    className="mb-2 text-center text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {modeAccessHint(entitlement, mode)}
                  </p>
                ) : null}
                <ChatComposer
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  onStop={handleStop}
                  isStreaming={isStreaming}
                  disabled={!sendAllowed}
                  placeholder={
                    sendAllowed
                      ? isGuest
                        ? "Try NELA Cloud as a guest… (Shift+Enter for newline)"
                        : "Message NELA Cloud… (Shift+Enter for newline)"
                      : isGuest
                        ? "Guest limit reached — sign in to continue"
                        : modeAccessHint(entitlement, mode) ??
                          "Upgrade or wait for quota reset"
                  }
                />
                <p
                  className="mt-2 text-center text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Hover a message to copy. Code blocks have their own copy button.
                </p>
              </div>
            </div>
          </div>

          {!isGuest && artifactOpen && liveArtifact ? (
            <div className="hidden w-[min(48vw,520px)] shrink-0 lg:flex">
              <ArtifactPanel
                title={liveArtifact.title}
                html={liveArtifact.html}
                mimeType={liveArtifact.type}
                onClose={() => setArtifactOpen(false)}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
