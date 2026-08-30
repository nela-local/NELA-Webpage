"use client";

import { Loader2 } from "lucide-react";
import ChatMarkdown from "./ChatMarkdown";
import CopyButton from "./CopyButton";
import WebSearchSources from "./WebSearchSources";
import type { ChatTurn } from "@/lib/cloud/types";

export default function ChatMessage({
  turn,
  toolStatus,
  onViewArtifact,
}: {
  turn: ChatTurn;
  toolStatus?: string | null;
  onViewArtifact?: () => void;
}) {
  const isUser = turn.role === "user";
  const canCopy = Boolean(turn.content.trim()) && !turn.isStreaming;

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex min-w-0 max-w-[92%] flex-col gap-1.5 sm:max-w-[85%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {canCopy ? (
          <CopyButton
            text={turn.content}
            label={isUser ? "Copy prompt" : "Copy response"}
            variant={isUser ? "onAccent" : "default"}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
          />
        ) : null}

        <div
          className={`w-full min-w-0 max-w-full overflow-hidden rounded-2xl px-4 py-3 ${
            isUser ? "rounded-br-md" : "rounded-bl-md"
          }`}
          style={{
            background: isUser ? "var(--accent)" : "var(--bg-card)",
            color: isUser ? "var(--bg-primary)" : "var(--text-primary)",
            border: isUser ? undefined : "1px solid var(--border-primary)",
          }}
        >
          {isUser ? (
            <p className="break-words whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">
              {turn.content}
            </p>
          ) : (
            <>
              {turn.isStreaming && !turn.content && !turn.error ? (
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {toolStatus ?? "Thinking…"}
                </div>
              ) : turn.content ? (
                <ChatMarkdown content={turn.content} />
              ) : turn.error ? (
                <p className="text-sm text-red-400">{turn.error}</p>
              ) : (
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No reply was generated. Please try again.
                </p>
              )}
              {turn.error && turn.content ? (
                <p className="mt-2 text-sm text-red-400">{turn.error}</p>
              ) : null}
              <WebSearchSources result={turn.webSearch} />
              {turn.artifactHtml ? (
                <button
                  type="button"
                  onClick={onViewArtifact}
                  className="mt-3 rounded-lg border px-3 py-2 text-xs font-medium"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  View {turn.artifactTitle ?? "artifact"}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
