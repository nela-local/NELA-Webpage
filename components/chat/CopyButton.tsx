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

  const base =
    variant === "onAccent"
      ? "text-[var(--bg-primary)]/80 hover:text-[var(--bg-primary)]"
      : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${base} ${className}`}
      title={copied ? "Copied" : label}
      aria-label={copied ? "Copied" : label}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">{copied ? "Copied" : label}</span>
    </button>
  );
}
