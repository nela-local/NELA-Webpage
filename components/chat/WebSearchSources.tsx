"use client";

import { ExternalLink } from "lucide-react";
import type { WebSearchResult } from "@/lib/cloud/types";

export default function WebSearchSources({
  result,
}: {
  result: WebSearchResult | null | undefined;
}) {
  if (!result?.results?.length) return null;

  return (
    <div
      className="mt-3 rounded-lg border p-3 text-sm"
      style={{
        borderColor: "var(--border-primary)",
        background: "var(--bg-card)",
      }}
    >
      <p
        className="mb-2 text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--text-tertiary)" }}
      >
        Web sources
      </p>
      <ul className="space-y-2">
        {result.results.slice(0, 8).map((hit, i) => (
          <li key={`${hit.url}-${i}`} className="flex gap-2">
            <span
              className="shrink-0 font-mono text-xs"
              style={{ color: "var(--accent)" }}
            >
              [{i + 1}]
            </span>
            <div className="min-w-0">
              <a
                href={hit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="truncate">{hit.title || hit.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
              </a>
              {hit.snippet ? (
                <p
                  className="mt-0.5 line-clamp-2 text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {hit.snippet}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
