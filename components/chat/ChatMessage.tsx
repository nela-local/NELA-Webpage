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

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`group relative max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[85%] ${
          isUser ? "rounded-br-md" : "rounded-bl-md"
        }`}
        style={{
          background: isUser ? "var(--accent)" : "var(--bg-card)",
          color: isUser ? "var(--bg-primary)" : "var(--text-primary)",
          border: isUser ? undefined : "1px solid var(--border-primary)",
        }}
      >
        <div
          className={`absolute top-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 ${isUser ? "left-2" : "right-2"}`}
        >
          <CopyButton
            text={turn.content}
            label={isUser ? "Copy prompt" : "Copy response"}
            variant={isUser ? "onAccent" : "default"}
          />
        </div>

        {isUser ? (
          <p className="whitespace-pre-wrap pr-6 text-sm">{turn.content}</p>
        ) : (
          <>
            {turn.isStreaming && !turn.content ? (
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {toolStatus ?? "Thinking…"}
              </div>
            ) : (
              <div className="pr-8">
                <ChatMarkdown content={turn.content} />
              </div>
            )}
            {turn.error ? (
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
  );
}
