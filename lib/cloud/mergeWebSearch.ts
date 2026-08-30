import type { SearchHit, WebSearchResult } from "./types";

export function mergeWebSearchResults(
  a: WebSearchResult | null,
  b: WebSearchResult,
): WebSearchResult {
  if (!a) {
    return {
      ...b,
      queries: b.queries?.length ? b.queries : b.query ? [b.query] : [],
    };
  }

  const seen = new Set(a.results.map((r) => r.url));
  const mergedHits: SearchHit[] = [...a.results];
  for (const hit of b.results) {
    if (!seen.has(hit.url)) {
      seen.add(hit.url);
      mergedHits.push(hit);
    }
  }

  const contexts = [a.formatted_context, b.formatted_context].filter((c) =>
    c?.trim(),
  );

  return {
    query: a.query === b.query ? a.query : `${a.query}; ${b.query}`,
    queries: Array.from(
      new Set(
        [...(a.queries ?? [a.query]), ...(b.queries ?? [b.query])].filter(
          (q) => Boolean(q?.trim()),
        ),
      ),
    ),
    results: mergedHits,
    formatted_context: contexts.join("\n\n"),
    answer: a.answer ?? b.answer,
    images: Array.from(new Set([...(a.images ?? []), ...(b.images ?? [])])).slice(
      0,
      12,
    ),
  };
}
