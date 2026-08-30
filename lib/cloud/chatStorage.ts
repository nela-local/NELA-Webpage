import type { ChatThread } from "./types";

const STORAGE_KEY = "nela_web_chat_threads";
const MAX_THREADS = 20;

export function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveThreads(threads: ChatThread[]): void {
  const trimmed = threads
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_THREADS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
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

export function upsertThread(threads: ChatThread[], thread: ChatThread): ChatThread[] {
  const next = threads.filter((t) => t.id !== thread.id);
  next.unshift({ ...thread, updatedAt: new Date().toISOString() });
  saveThreads(next);
  return next;
}

export function deleteThread(threads: ChatThread[], id: string): ChatThread[] {
  const next = threads.filter((t) => t.id !== id);
  saveThreads(next);
  return next;
}
