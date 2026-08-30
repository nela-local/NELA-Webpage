"use client";

import { Download, FileText, X } from "lucide-react";
import { useMemo } from "react";

export default function ArtifactPanel({
  title,
  html,
  mimeType,
  onClose,
  allowDownload = true,
}: {
  title: string;
  html: string;
  mimeType?: "text/html" | "text/csv";
  allowDownload?: boolean;
  onClose: () => void;
}) {
  const downloadName = useMemo(() => {
    const base = (title || "artifact")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "artifact";
    return mimeType === "text/csv" ? `${base}.csv` : `${base}.html`;
  }, [title, mimeType]);

  const handleDownload = () => {
    const type = mimeType === "text/csv" ? "text/csv" : "text/html";
    const blob = new Blob([html], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      className="flex h-full min-h-0 flex-col border-l"
      style={{
        borderColor: "var(--border-primary)",
        background: "var(--bg-secondary)",
      }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b px-4 py-3"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
          <span className="truncate font-medium">{title || "Artifact"}</span>
        </div>
        <div className="flex items-center gap-1">
          {allowDownload ? (
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-md p-2 transition-colors hover:opacity-80"
              style={{ background: "var(--bg-card)" }}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 transition-colors hover:opacity-80"
            style={{ background: "var(--bg-card)" }}
            title="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-3">
        {mimeType === "text/csv" ? (
          <pre
            className="h-full overflow-auto rounded-lg p-3 font-mono text-xs"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
            }}
          >
            {html}
          </pre>
        ) : (
          <iframe
            title={title || "Artifact preview"}
            sandbox="allow-scripts allow-same-origin"
            srcDoc={html}
            className="h-full w-full rounded-lg border"
            style={{ borderColor: "var(--border-primary)", background: "#fff" }}
          />
        )}
      </div>
    </aside>
  );
}
