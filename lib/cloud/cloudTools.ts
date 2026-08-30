import type { CloudToolDefinition } from "./types";

export const WEB_SEARCH_TOOL: CloudToolDefinition = {
  type: "function",
  function: {
    name: "web_search",
    description:
      "Search the live public web (Tavily). Call ONLY when you need current or external facts. " +
      "Pass a short keyword query and depth (snippet|full|standard|deep).",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Concise search query" },
        depth: {
          type: "string",
          enum: ["snippet", "full", "standard", "deep"],
        },
        time_range: {
          type: "string",
          enum: ["day", "week", "month", "year"],
        },
        site: { type: "string" },
      },
      required: ["query", "depth"],
    },
  },
};

export const WEB_EXTRACT_TOOL: CloudToolDefinition = {
  type: "function",
  function: {
    name: "web_extract",
    description:
      "Read full content from specific URLs after web_search when excerpts are not enough.",
    parameters: {
      type: "object",
      properties: {
        urls: { type: "array", items: { type: "string" } },
        query: { type: "string" },
        depth: { type: "string", enum: ["basic", "advanced"] },
      },
      required: ["urls"],
    },
  },
};

export function buildWebChatTools(): CloudToolDefinition[] {
  return [WEB_SEARCH_TOOL, WEB_EXTRACT_TOOL];
}
