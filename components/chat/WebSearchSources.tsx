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
      className="mt-3 w-full min-w-0 max-w-full overflow-hidden rounded-lg border p-3 text-sm"
      style={{
        borderColor: "var(--border-primary)",
        background: "var(--bg-secondary)",
      }}
    >
      <p
        className="mb-2 text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--text-tertiary)" }}
      >
        Web sources
      </p>
      <ul className="space-y-2.5">
        {result.results.slice(0, 8).map((hit, i) => {
          let host = "";
          try {
            host = new URL(hit.url).hostname.replace(/^www\./, "");
          } catch {
            host = "";
          }
          return (
            <li key={`${hit.url}-${i}`} className="flex min-w-0 gap-2">
              <span
                className="shrink-0 font-mono text-xs leading-5"
                style={{ color: "var(--accent)" }}
              >
                [{i + 1}]
              </span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <a
                  href={hit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link flex min-w-0 items-start gap-1.5 font-medium hover:underline"
                  style={{ color: "var(--text-primary)" }}
                  title={hit.url}
                >
                  <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere] line-clamp-2">
                    {hit.title?.trim() || host || "Source"}
                  </span>
                  <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-60" />
                </a>
                {host ? (
                  <p
                    className="mt-0.5 truncate text-[11px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {host}
                  </p>
                ) : null}
                {hit.snippet ? (
                  <p
                    className="mt-0.5 line-clamp-2 break-words text-xs [overflow-wrap:anywhere]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {hit.snippet}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
