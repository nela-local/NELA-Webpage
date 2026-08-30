export type CloudQualityMode = "fast" | "smart" | "deep" | "auto";

export interface CloudToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface CloudToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

export type CloudToolChoice =
  | "none"
  | "auto"
  | "required"
  | { type: "function"; function: { name: string } };

export type CloudChatContent =
  | string
  | null
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export interface CloudChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: CloudChatContent;
  tool_calls?: CloudToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface CloudChatRequest {
  mode: CloudQualityMode;
  messages: CloudChatMessage[];
  stream: boolean;
  privacy: {
    containsFileContext: boolean;
    userConfirmedCloudContext: boolean;
    contextSource?: string;
  };
  tools?: CloudToolDefinition[];
  tool_choice?: CloudToolChoice;
  client?: { platform?: "web" | "desktop"; sessionId?: string };
}

export interface SearchHit {
  title: string;
  snippet: string;
  url: string;
  favicon?: string | null;
  score?: number | null;
}

export interface WebSearchResult {
  query: string;
  queries?: string[];
  results: SearchHit[];
  formatted_context: string;
  answer?: string | null;
  images?: string[];
}

export type StreamFinishMeta = {
  tool_calls?: CloudToolCall[];
  model?: string;
  creditsRemaining?: number;
  trialCreditsRemaining?: number;
  trialExpiresAt?: string | null;
  guestLimits?: GuestLimits;
  finishReason?: string;
};

export type GuestLimits = {
  chat: { limit: number; used: number; remaining: number };
  search: { limit: number; used: number; remaining: number };
  expiresAt: string;
};

export interface EntitlementResponse {
  cloudEnabled: boolean;
  plan: string;
  status: string;
  paidCloud: boolean;
  credits: {
    balance: number;
    trialCredits: number;
    trialExpiresAt: string | null;
  };
  fastFree: {
    limit: number;
    used: number;
    remaining: number;
    windowHours: number;
    resetsAt: string | null;
  };
  limits: {
    requestsPerMinute: number;
  };
}

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  webSearch?: WebSearchResult | null;
  artifactHtml?: string;
  artifactTitle?: string;
  artifactType?: "text/html" | "text/csv";
  error?: string;
  isStreaming?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: string;
  turns: ChatTurn[];
}
