"use client";

import { MessageSquarePlus, Trash2, X } from "lucide-react";
import { formatThreadTime, threadPreview } from "@/lib/cloud/chatStorage";
import type { ChatThread } from "@/lib/cloud/types";

export default function ChatSidebar({
  threads,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
  className = "",
}: {
  threads: ChatThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <aside
      className={`flex h-full min-h-0 w-64 shrink-0 flex-col border-r ${className}`}
      style={{
        borderColor: "var(--border-primary)",
        background: "var(--bg-secondary)",
      }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b px-3 py-3"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <p className="text-sm font-semibold">Chats</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onNew}
            className="rounded-md p-1.5 transition-colors hover:opacity-80"
            style={{ background: "var(--bg-card)" }}
            title="New chat"
            aria-label="New chat"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 transition-colors hover:opacity-80 lg:hidden"
              style={{ background: "var(--bg-card)" }}
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {threads.length === 0 ? (
          <p
            className="px-2 py-4 text-center text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            No saved chats yet
          </p>
        ) : (
          <ul className="space-y-1">
            {threads.map((thread) => {
              const active = thread.id === activeId;
              return (
                <li key={thread.id}>
                  <div
                    className="group relative flex items-stretch rounded-lg transition-colors"
                    style={{
                      background: active ? "var(--bg-card)" : "transparent",
                      border: active
                        ? "1px solid var(--border-primary)"
                        : "1px solid transparent",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(thread.id)}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                    >
                      <p
                        className="truncate text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {thread.title || "New chat"}
                      </p>
                      <p
                        className="mt-0.5 truncate text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {threadPreview(thread)}
                      </p>
                      <p
                        className="mt-1 text-[10px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {formatThreadTime(thread.updatedAt)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(thread.id);
                      }}
                      className="shrink-0 self-center rounded-md p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                      style={{ color: "var(--text-tertiary)" }}
                      title="Delete chat"
                      aria-label={`Delete ${thread.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
