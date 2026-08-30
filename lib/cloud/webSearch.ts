import { cloudApiFetch } from "./guestSession";
import { mergeWebSearchResults } from "./mergeWebSearch";
import type { WebSearchResult } from "./types";

type SearchProfile = "simple" | "news" | "research";

type ApiSearchResponse = {
  query: string;
  answer: string | null;
  images?: string[];
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    favicon?: string | null;
    score?: number | null;
  }>;
};

type ApiExtractResponse = {
  results: Array<{ url: string; content: string }>;
  failed: string[];
};

function formatContext(
  query: string,
  results: ApiSearchResponse["results"],
  answer?: string | null,
): string {
  const lines: string[] = [`Web search results for: ${query}`, ""];
  if (answer?.trim()) {
    lines.push(`Summary: ${answer.trim()}`, "");
  }
  results.forEach((hit, i) => {
    lines.push(`[${i + 1}] ${hit.title}`, hit.snippet, hit.url, "");
  });
  lines.push("--- End of web search ---");
  return lines.join("\n");
}

function toWebSearchResult(
  query: string,
  data: ApiSearchResponse,
): WebSearchResult {
  const results = (data.results ?? []).map((r) => ({
    title: r.title,
    snippet: r.snippet,
    url: r.url,
    favicon: r.favicon ?? null,
    score: r.score ?? null,
  }));
  return {
    query: data.query || query,
    queries: [data.query || query],
    results,
    formatted_context: formatContext(query, results, data.answer),
    answer: data.answer,
    images: data.images,
  };
}

export async function searchWeb(
  query: string,
  opts?: {
    profile?: SearchProfile;
    site?: string;
    timeRange?: "day" | "week" | "month" | "year";
    maxResults?: number;
  },
): Promise<WebSearchResult> {
  const data = await cloudApiFetch<ApiSearchResponse>("/v1/search", {
    method: "POST",
    body: JSON.stringify({
      query,
      profile: opts?.profile ?? "simple",
      site: opts?.site,
      timeRange: opts?.timeRange,
      maxResults: opts?.maxResults,
    }),
  });
  return toWebSearchResult(query, data);
}

export async function extractWebPages(
  urls: string[],
  opts?: { query?: string; depth?: "basic" | "advanced" },
): Promise<string> {
  const data = await cloudApiFetch<ApiExtractResponse>("/v1/extract", {
    method: "POST",
    body: JSON.stringify({
      urls: urls.slice(0, 5),
      query: opts?.query,
      depth: opts?.depth ?? "basic",
    }),
  });

  const parts: string[] = ["Extracted web pages:", ""];
  for (const page of data.results ?? []) {
    parts.push(`URL: ${page.url}`, page.content.slice(0, 12_000), "");
  }
  if (data.failed?.length) {
    parts.push(`Failed URLs: ${data.failed.join(", ")}`);
  }
  parts.push("--- End of extracted pages ---");
  return parts.join("\n");
}

export type WebToolDepth = "snippet" | "full" | "standard" | "deep";

export function normalizeWebToolDepth(raw: unknown): WebToolDepth {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === "snippet" || s === "snippets" || s === "quick") return "snippet";
  if (s === "deep") return "deep";
  if (s === "standard" || s === "thorough") return "standard";
  if (s === "full") return "full";
  return "snippet";
}

export async function runWebSearchWithDepth(opts: {
  query: string;
  depth: WebToolDepth;
  site?: string;
  timeRange?: "day" | "week" | "month" | "year";
  onStatus?: (status: string | null) => void;
}): Promise<WebSearchResult> {
  const { query, depth } = opts;

  if (depth === "snippet") {
    opts.onStatus?.(`Searching “${query}”`);
    const result = await searchWeb(query, {
      profile: "simple",
      site: opts.site,
      timeRange: opts.timeRange,
    });
    opts.onStatus?.(null);
    return result;
  }

  if (depth === "full") {
    opts.onStatus?.(`Searching (full) “${query}”`);
    const result = await searchWeb(query, {
      profile: "research",
      site: opts.site,
      timeRange: opts.timeRange,
      maxResults: 8,
    });
    opts.onStatus?.(null);
    return result;
  }

  opts.onStatus?.(
    depth === "deep" ? `Researching (deep) “${query}”` : `Researching “${query}”`,
  );
  const primary = await searchWeb(query, {
    profile: "research",
    site: opts.site,
    timeRange: opts.timeRange,
    maxResults: depth === "deep" ? 10 : 6,
  });

  const facet = query.split(/\s+/).slice(0, 4).join(" ");
  let merged = primary;
  if (facet && facet !== query) {
    try {
      const secondary = await searchWeb(facet, {
        profile: "simple",
        site: opts.site,
        timeRange: opts.timeRange,
      });
      merged = mergeWebSearchResults(primary, secondary);
    } catch {
      // keep primary only
    }
  }
  opts.onStatus?.(null);
  return merged;
}
