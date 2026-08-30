"use client";

import { Loader2, Send, Square } from "lucide-react";
import { useRef, useEffect } from "react";

export default function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  disabled,
  isStreaming,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isStreaming && value.trim()) onSend();
    }
  };

  return (
    <div
      className="rounded-2xl border p-2 shadow-lg"
      style={{
        borderColor: "var(--border-primary)",
        background: "var(--bg-card)",
      }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder={placeholder ?? "Ask NELA Cloud anything…"}
        className="max-h-40 min-h-[44px] w-full resize-none bg-transparent px-3 py-2 text-sm outline-none"
        style={{ color: "var(--text-primary)" }}
      />
      <div className="flex justify-end px-1 pb-1">
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          >
            <Square className="h-4 w-4" />
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </button>
        )}
      </div>
    </div>
  );
}
