"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyButton({
  text,
  label = "Copy",
  className = "",
  variant = "default",
}: {
  text: string;
  label?: string;
  className?: string;
  variant?: "default" | "onAccent";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const pillStyle =
    variant === "onAccent"
      ? {
          background: "rgba(6, 6, 26, 0.14)",
          color: "var(--bg-primary)",
          border: "1px solid rgba(6, 6, 26, 0.2)",
        }
      : {
          background: "var(--bg-secondary)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-primary)",
        };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm transition-colors hover:opacity-90 ${className}`}
      style={pillStyle}
      title={copied ? "Copied" : label}
      aria-label={copied ? "Copied" : label}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
