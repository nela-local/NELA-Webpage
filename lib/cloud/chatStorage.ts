import type { ChatThread } from "./types";

const STORAGE_KEY = "nela_web_chat_threads";
const ACTIVE_KEY = "nela_web_chat_active_id";
export const MAX_THREADS = 20;

export function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatThread[];
    return sortThreads(Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

export function sortThreads(threads: ChatThread[]): ChatThread[] {
  return threads
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveThreads(threads: ChatThread[]): ChatThread[] {
  const trimmed = sortThreads(threads).slice(0, MAX_THREADS);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
  return trimmed;
}

export function loadActiveThreadId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveThreadId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function createThread(title = "New chat"): ChatThread {
  const now = new Date().toISOString();
  return {
    id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    updatedAt: now,
    turns: [],
  };
}

export function upsertThread(
  threads: ChatThread[],
  thread: ChatThread,
): ChatThread[] {
  const next = threads.filter((t) => t.id !== thread.id);
  next.unshift({ ...thread, updatedAt: new Date().toISOString() });
  return saveThreads(next);
}

export function deleteThread(threads: ChatThread[], id: string): ChatThread[] {
  return saveThreads(threads.filter((t) => t.id !== id));
}

export function threadPreview(thread: ChatThread): string {
  for (let i = thread.turns.length - 1; i >= 0; i--) {
    const turn = thread.turns[i]!;
    const text = turn.content.trim();
    if (text) {
      const oneLine = text.replace(/\s+/g, " ");
      return oneLine.length > 72 ? `${oneLine.slice(0, 72)}…` : oneLine;
    }
  }
  return "No messages yet";
}

export function formatThreadTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function findEmptyThread(threads: ChatThread[]): ChatThread | undefined {
  return threads.find((t) => t.turns.length === 0);
}
