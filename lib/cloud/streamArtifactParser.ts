/**
 * Incremental parser for Claude-style <nela-artifact> streaming.
 * Splits model output into chat prose vs artifact body as tokens arrive.
 */

export type NelaArtifactMime = "text/html" | "text/csv";

export type StreamArtifactMeta = {
  type: NelaArtifactMime;
  title: string;
  /** Download stem from filename="…" on the first tag (optional). */
  filename?: string;
};

export type StreamArtifactEmit = {
  /** Prose that should appear in the chat bubble (outside tags). */
  chatDelta: string;
  /** Body content for the side panel (inside tags), empty when in chat phase. */
  artifactDelta: string;
  /** Set when an opening tag is first seen (or inferred via fallback). */
  meta?: StreamArtifactMeta;
  /** True once a closing tag is seen (or finalize() closed an open artifact). */
  closed?: boolean;
};

const OPEN_RE = /<nela-artifact\b([^>]*)>/i;
const CLOSE_RE = /<\/nela-artifact\s*>/i;
const OPEN_HOLD = 80;
const CLOSE_HOLD = 20;
const NELA_PREFIX = "<nela-artifact";
/** Prose before an untagged HTML document may still be chat. */
const MAX_PROSE_BEFORE_HTML = 500;
/** Don't treat a tiny "<h" crumb as a finished HTML document yet. */
const MIN_HTML_FALLBACK_CHARS = 16;

function parseAttrs(attrText: string): StreamArtifactMeta {
  const typeMatch =
    attrText.match(/\btype\s*=\s*["']([^"']+)["']/i) ||
    attrText.match(/\btype\s*=\s*([^\s>]+)/i);
  const titleMatch =
    attrText.match(/\btitle\s*=\s*["']([^"']+)["']/i) ||
    attrText.match(/\btitle\s*=\s*([^\s>]+)/i);
  const filenameMatch =
    attrText.match(/\bfilename\s*=\s*["']([^"']+)["']/i) ||
    attrText.match(/\bfilename\s*=\s*([^\s>]+)/i);
  const rawType = (typeMatch?.[1] ?? "text/html").trim().toLowerCase();
  const type: NelaArtifactMime =
    rawType === "text/csv" || rawType === "csv" ? "text/csv" : "text/html";
  const title = (titleMatch?.[1] ?? "").trim() || "Artifact";
  const filename = (filenameMatch?.[1] ?? "").trim() || undefined;
  return filename ? { type, title, filename } : { type, title };
}

/**
 * Index where a freeform HTML *document* begins, or -1.
 * Only strong document markers — do not treat random <h1>/<div> as a full page,
 * or normal chat gets swallowed into an HTML artifact.
 */
export function findHtmlDocumentStart(s: string): number {
  const patterns: RegExp[] = [
    /```(?:html|HTML)\b/,
    /<!DOCTYPE\s+html/i,
    /<html[\s>]/i,
    /<head[\s>]/i,
    /<body[\s>]/i,
  ];
  let best = -1;
  for (const re of patterns) {
    const m = re.exec(s);
    if (m && m.index !== undefined && (best < 0 || m.index < best)) {
      best = m.index;
    }
  }
  return best;
}

/** True when trimmed text is clearly HTML (for chat-leak guards). */
export function looksLikeHtmlContent(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (findHtmlDocumentStart(t) === 0) return true;
  if (/^<[a-zA-Z!/?]/.test(t) && (t.includes(">") || t.length <= 12)) return true;
  return /<(?:html|head|body|div|section|h[1-6]|style|nela-artifact)\b/i.test(t);
}

function looksLikeCsvFence(s: string): { body: string; title: string } | null {
  const fence = s.match(/```(?:csv|CSV)\s*\n([\s\S]*?)(?:```|$)/);
  if (!fence?.[1]) return null;
  const body = fence[1].trim();
  if (!body.includes(",") || body.split(/\n/).length < 2) return null;
  return { body, title: "Spreadsheet" };
}

/** Match a bare / markdown-wrapped protocol line (no angle brackets). */
const BARE_OPEN_LINE_RE =
  /(?:^|\n)[ \t]*(?:\*\*|__|`)*[ \t]*nela-artifact\b([^\n]*?)(?:\*\*|__|`)*[ \t]*(?=\n|$)/i;

function recoverFromBareProtocolLine(
  combined: string
): { prose: string; body: string; meta: StreamArtifactMeta } | null {
  const bare = BARE_OPEN_LINE_RE.exec(combined);
  if (!bare || bare.index === undefined) return null;
  const meta = parseAttrs(bare[1] ?? "");
  const lineStart =
    bare[0].startsWith("\n") ? bare.index + 1 : bare.index;
  const prose = combined.slice(0, lineStart).trim();
  let body = combined.slice(bare.index + bare[0].length);
  const close = CLOSE_RE.exec(body);
  if (close && close.index !== undefined) {
    body = body.slice(0, close.index);
  }
  body = body
    .replace(/<\/?nela-artifact\b[^>]*>/gi, "")
    .replace(BARE_OPEN_LINE_RE, "")
    .trim();
  // Only promote to artifact when the body looks like CSV (not a markdown essay).
  const firstLine = body.split(/\n/).find((l) => l.trim()) ?? "";
  if (!firstLine.includes(",") || body.split(/\n/).length < 2) return null;
  if (!body) return null;
  return { prose, body, meta };
}

/** Recover artifact body even when the stream never entered in-tag mode cleanly. */
function recoverNelaArtifactBlock(
  combined: string
): { prose: string; body: string; meta: StreamArtifactMeta } | null {
  const open = OPEN_RE.exec(combined);
  if (!open || open.index === undefined) {
    // Incomplete open tag without '>' — still peel content after it if present.
    const partialIdx = combined.search(/<nela-artifact\b/i);
    if (partialIdx >= 0) {
      const afterPartial = combined.slice(partialIdx);
      const gt = afterPartial.indexOf(">");
      if (gt >= 0) {
        const fake = `<nela-artifact${afterPartial.slice("<nela-artifact".length, gt + 1)}`;
        const fakeOpen = OPEN_RE.exec(fake);
        if (fakeOpen) {
          const meta = parseAttrs(fakeOpen[1] ?? "");
          const prose = combined.slice(0, partialIdx).trim();
          let body = combined.slice(partialIdx + gt + 1);
          const close = CLOSE_RE.exec(body);
          if (close && close.index !== undefined) {
            body = body.slice(0, close.index);
          }
          body = body
            .replace(/<nela-artifact\b[^>]*>/gi, "")
            .replace(/<\/nela-artifact\s*>/gi, "")
            .trim();
          if (body) return { prose, body, meta };
        }
      }
    }
    return recoverFromBareProtocolLine(combined);
  }

  const meta = parseAttrs(open[1] ?? "");
  const prose = combined.slice(0, open.index).trim();
  let body = combined.slice(open.index + open[0].length);
  const close = CLOSE_RE.exec(body);
  if (close && close.index !== undefined) {
    body = body.slice(0, close.index);
  }
  body = body
    .replace(/<nela-artifact\b[^>]*>/gi, "")
    .replace(/<\/nela-artifact\s*>/gi, "")
    .trim();
  if (!body) return null;
  return { prose, body, meta };
}

const BARE_NELA = "nela-artifact";

function holdbackLength(buffer: string): number {
  const lower = buffer.toLowerCase();
  for (let n = Math.min(NELA_PREFIX.length, buffer.length); n >= 1; n--) {
    if (lower.endsWith(NELA_PREFIX.slice(0, n))) {
      return Math.max(OPEN_HOLD, n);
    }
  }
  // Hold back while a bare protocol token may still be forming (no '<').
  for (let n = Math.min(BARE_NELA.length, buffer.length); n >= 4; n--) {
    if (lower.endsWith(BARE_NELA.slice(0, n))) {
      return Math.max(OPEN_HOLD, n);
    }
  }
  const lt = buffer.lastIndexOf("<");
  if (lt >= 0) {
    const tail = buffer.slice(lt);
    if (!tail.includes(">") && tail.length <= OPEN_HOLD) {
      return buffer.length - lt;
    }
  }
  return Math.min(buffer.length, OPEN_HOLD);
}

/**
 * Stateful incremental parser. Feed chunks with push(); call finalize() on stream end.
 */
export class StreamArtifactParser {
  private buffer = "";
  private inArtifact = false;
  private meta: StreamArtifactMeta | null = null;
  private closed = false;
  private chatEmittedBeforeOpen = "";
  /** Prose streamed after </nela-artifact> (follow-up explanation). */
  private chatAfterClose = "";
  private fallbackMode: "html" | "csv" | null = null;
  private fallbackArmed = false;
  /** Prose already returned via chatDelta (avoid double-emitting on fallback). */
  private chatReturnedLen = 0;
  /**
   * After the first CSV sheet closes, keep scanning for more
   * <nela-artifact type="text/csv"> blocks (multi-sheet workbooks).
   */
  private awaitingMoreCsv = false;
  /** True while a reconstructed (2nd+) CSV sheet tag is still open. */
  private openCsvSheetTagged = false;
  /** Workbook download name from the first tag's filename attr. */
  private workbookFilename: string | undefined;

  get isActive(): boolean {
    return this.inArtifact || this.fallbackMode !== null;
  }

  get currentMeta(): StreamArtifactMeta | null {
    return this.meta;
  }

  get isClosed(): boolean {
    return this.closed;
  }

  /** All chat prose (intro + follow-up). */
  get chatSoFar(): string {
    return this.chatEmittedBeforeOpen + this.chatAfterClose;
  }

  get chatBeforeArtifact(): string {
    return this.chatEmittedBeforeOpen;
  }

  get chatAfterArtifact(): string {
    return this.chatAfterClose;
  }

  push(chunk: string): StreamArtifactEmit {
    if (chunk) this.buffer += chunk;
    else if (!this.buffer) return { chatDelta: "", artifactDelta: "" };

    if (this.closed) {
      const chatDelta = this.buffer;
      this.buffer = "";
      this.chatAfterClose += chatDelta;
      this.chatReturnedLen += chatDelta.length;
      return { chatDelta, artifactDelta: "" };
    }

    if (this.fallbackMode) {
      const artifactDelta = this.buffer;
      this.buffer = "";
      return {
        chatDelta: "",
        artifactDelta,
        meta: this.meta ?? undefined,
      };
    }

    // Between CSV sheets: absorb the next tagged sheet(s) into the artifact body
    // instead of dumping them into chat follow-up.
    if (!this.inArtifact && this.awaitingMoreCsv) {
      const more = this.consumePendingCsvSheets();
      return {
        chatDelta: more.chatDelta,
        artifactDelta: more.artifactDelta,
        meta: this.meta ?? undefined,
        closed: more.closed,
      };
    }

    if (!this.inArtifact) {
      const openMatch = OPEN_RE.exec(this.buffer);
      if (openMatch && openMatch.index !== undefined) {
        const before = this.buffer.slice(0, openMatch.index);
        this.meta = parseAttrs(openMatch[1] ?? "");
        if (this.meta.filename) this.workbookFilename = this.meta.filename;
        else if (this.workbookFilename) {
          this.meta = { ...this.meta, filename: this.workbookFilename };
        }
        this.inArtifact = true;
        this.buffer = this.buffer.slice(openMatch.index + openMatch[0].length);
        this.chatEmittedBeforeOpen += before;
        const chatDelta = before;
        this.chatReturnedLen += chatDelta.length;

        let wrapPrefix = "";
        if (this.meta.type === "text/csv") {
          const safeTitle = this.meta.title.replace(/"/g, "");
          const safeFile = (this.workbookFilename || "").replace(/"/g, "");
          this.openCsvSheetTagged = true;
          wrapPrefix = safeFile
            ? `<nela-artifact type="text/csv" title="${safeTitle}" filename="${safeFile}">\n`
            : `<nela-artifact type="text/csv" title="${safeTitle}">\n`;
        }

        const after = this.consumeArtifactBody();
        return {
          chatDelta: chatDelta + (after.chatDelta || ""),
          artifactDelta: wrapPrefix + after.artifactDelta,
          meta: this.meta,
          closed: after.closed,
        };
      }

      const fallback = this.tryArmFallback(false);
      if (fallback) return fallback;

      const hold = holdbackLength(this.buffer);
      const safeLen = this.buffer.length - hold;
      if (safeLen <= 0) {
        return { chatDelta: "", artifactDelta: "" };
      }

      const candidate = this.buffer.slice(0, safeLen);
      // Never leak markup crumbs into chat — keep buffering instead.
      if (looksLikeHtmlContent(candidate) || /<\/?[a-zA-Z!]/.test(candidate)) {
        return { chatDelta: "", artifactDelta: "" };
      }

      this.buffer = this.buffer.slice(safeLen);
      this.chatEmittedBeforeOpen += candidate;
      this.chatReturnedLen += candidate.length;
      return { chatDelta: candidate, artifactDelta: "" };
    }

    return this.consumeArtifactBody();
  }

  finalize(): StreamArtifactEmit {
    if (this.closed) {
      const chatDelta = this.buffer;
      this.buffer = "";
      this.chatAfterClose += chatDelta;
      return { chatDelta, artifactDelta: "", closed: true };
    }

    if (!this.inArtifact && this.awaitingMoreCsv) {
      const more = this.consumePendingCsvSheets();
      // Anything still buffered is follow-up prose.
      if (this.buffer) {
        more.chatDelta += this.buffer;
        this.chatAfterClose += this.buffer;
        this.buffer = "";
      }
      this.awaitingMoreCsv = false;
      this.closed = true;
      return {
        chatDelta: more.chatDelta,
        artifactDelta: more.artifactDelta,
        meta: this.meta ?? undefined,
        closed: true,
      };
    }

    if (!this.inArtifact && !this.fallbackMode) {
      const combined = this.chatEmittedBeforeOpen + this.buffer;
      const recovered = recoverNelaArtifactBlock(combined);
      if (recovered) {
        this.meta = recovered.meta;
        this.fallbackMode = recovered.meta.type === "text/csv" ? "csv" : "html";
        this.fallbackArmed = true;
        this.inArtifact = true;
        this.closed = true;
        this.chatEmittedBeforeOpen = recovered.prose;
        this.buffer = "";
        this.chatReturnedLen = Math.max(this.chatReturnedLen, recovered.prose.length);
        return {
          chatDelta: "",
          artifactDelta: recovered.body,
          meta: recovered.meta,
          closed: true,
        };
      }

      const fallback = this.tryArmFallback(true);
      if (fallback) {
        this.closed = true;
        return { ...fallback, closed: true };
      }

      // Aborted mid-tag crumbs ("<h", "<he") — keep out of chat.
      const trimmed = combined.trim();
      if (
        trimmed &&
        /^<\/?[a-zA-Z!]/.test(trimmed) &&
        !/<nela-artifact\b/i.test(trimmed)
      ) {
        this.fallbackMode = "html";
        this.fallbackArmed = true;
        this.inArtifact = true;
        this.closed = true;
        this.meta = { type: "text/html", title: "Artifact" };
        const body = this.chatEmittedBeforeOpen + this.buffer;
        this.chatEmittedBeforeOpen = "";
        this.buffer = "";
        return {
          chatDelta: "",
          artifactDelta: body,
          meta: this.meta,
          closed: true,
        };
      }
      const chatDelta = this.buffer;
      this.buffer = "";
      this.chatEmittedBeforeOpen += chatDelta;
      return { chatDelta, artifactDelta: "", closed: false };
    }

    let artifactDelta = this.buffer;
    this.buffer = "";
    this.closed = true;
    artifactDelta = artifactDelta
      .replace(/<nela-artifact\b[^>]*>/gi, "")
      .replace(/<\/nela-artifact\s*>/gi, "");
    return {
      chatDelta: "",
      artifactDelta,
      meta: this.meta ?? undefined,
      closed: true,
    };
  }

  private consumeArtifactBody(): StreamArtifactEmit {
    const closeMatch = CLOSE_RE.exec(this.buffer);
    if (closeMatch && closeMatch.index !== undefined) {
      let artifactDelta = this.buffer.slice(0, closeMatch.index);
      this.buffer = this.buffer.slice(closeMatch.index + closeMatch[0].length);
      this.inArtifact = false;
      artifactDelta = artifactDelta
        .replace(/<nela-artifact\b[^>]*>/gi, "")
        .replace(/<\/nela-artifact\s*>/gi, "");

      // Multi-sheet CSV: keep scanning for more tagged sheets; do not treat the
      // first </nela-artifact> as end-of-workbook.
      if (this.meta?.type === "text/csv") {
        if (this.openCsvSheetTagged) {
          artifactDelta += "\n</nela-artifact>";
          this.openCsvSheetTagged = false;
        }
        this.awaitingMoreCsv = true;
        const more = this.consumePendingCsvSheets();
        return {
          chatDelta: more.chatDelta,
          artifactDelta: artifactDelta + more.artifactDelta,
          meta: this.meta ?? undefined,
          closed: more.closed,
        };
      }

      this.closed = true;
      const trailing = this.buffer;
      this.buffer = "";
      this.chatAfterClose += trailing;
      return {
        chatDelta: trailing,
        artifactDelta,
        meta: this.meta ?? undefined,
        closed: true,
      };
    }

    const hold = Math.min(this.buffer.length, CLOSE_HOLD);
    const safeLen = this.buffer.length - hold;
    if (safeLen <= 0) {
      return { chatDelta: "", artifactDelta: "", meta: this.meta ?? undefined };
    }
    const artifactDelta = this.buffer.slice(0, safeLen);
    this.buffer = this.buffer.slice(safeLen);
    return {
      chatDelta: "",
      artifactDelta,
      meta: this.meta ?? undefined,
    };
  }

  /**
   * After a CSV sheet closes, pull any further CSV <nela-artifact> blocks into
   * the artifact stream (with tags preserved so extractCsvSheetArtifacts works).
   */
  private consumePendingCsvSheets(): {
    chatDelta: string;
    artifactDelta: string;
    closed: boolean;
  } {
    let chatDelta = "";
    let artifactDelta = "";

    while (true) {
      if (!this.buffer) {
        return { chatDelta, artifactDelta, closed: false };
      }

      const openMatch = OPEN_RE.exec(this.buffer);
      if (!openMatch || openMatch.index === undefined) {
        const hold = holdbackLength(this.buffer);
        if (hold > 0) {
          return { chatDelta, artifactDelta, closed: false };
        }
        // Keep buffering — the model may still emit another CSV sheet.
        // Remaining prose is flushed on finalize().
        return { chatDelta, artifactDelta, closed: false };
      }

      const before = this.buffer.slice(0, openMatch.index);
      if (before.trim()) {
        chatDelta += before;
        this.chatAfterClose += before;
      }

      const nextMeta = parseAttrs(openMatch[1] ?? "");
      if (nextMeta.filename && !this.workbookFilename) {
        this.workbookFilename = nextMeta.filename;
      }
      this.buffer = this.buffer.slice(openMatch.index + openMatch[0].length);

      if (nextMeta.type !== "text/csv") {
        // Different mime after a CSV workbook — rest belongs in chat.
        const rest = openMatch[0] + this.buffer;
        chatDelta += rest;
        this.chatAfterClose += rest;
        this.buffer = "";
        this.awaitingMoreCsv = false;
        this.closed = true;
        return { chatDelta, artifactDelta, closed: true };
      }

      this.meta = this.workbookFilename
        ? { ...nextMeta, filename: this.workbookFilename }
        : nextMeta;
      this.inArtifact = true;
      const safeTitle = nextMeta.title.replace(/"/g, "");
      this.openCsvSheetTagged = true;
      artifactDelta += `\n\n<nela-artifact type="text/csv" title="${safeTitle}">\n`;

      const closeMatch = CLOSE_RE.exec(this.buffer);
      if (!closeMatch || closeMatch.index === undefined) {
        const hold = Math.min(this.buffer.length, CLOSE_HOLD);
        const safeLen = this.buffer.length - hold;
        if (safeLen > 0) {
          artifactDelta += this.buffer.slice(0, safeLen);
          this.buffer = this.buffer.slice(safeLen);
        }
        return { chatDelta, artifactDelta, closed: false };
      }

      let body = this.buffer.slice(0, closeMatch.index);
      this.buffer = this.buffer.slice(closeMatch.index + closeMatch[0].length);
      this.inArtifact = false;
      this.openCsvSheetTagged = false;
      body = body
        .replace(/<nela-artifact\b[^>]*>/gi, "")
        .replace(/<\/nela-artifact\s*>/gi, "");
      artifactDelta += `${body}\n</nela-artifact>`;
      // Loop for more complete sheets already buffered.
    }
  }

  private tryArmFallback(force: boolean): StreamArtifactEmit | null {
    if (this.fallbackArmed && this.fallbackMode) return null;

    const combined = this.chatEmittedBeforeOpen + this.buffer;
    const csv = looksLikeCsvFence(combined);
    if (csv) {
      this.fallbackMode = "csv";
      this.fallbackArmed = true;
      this.meta = { type: "text/csv", title: csv.title };
      this.chatEmittedBeforeOpen = "";
      this.buffer = "";
      this.inArtifact = true;
      return {
        chatDelta: "",
        artifactDelta: csv.body,
        meta: this.meta,
      };
    }

    const htmlAt = findHtmlDocumentStart(combined);
    if (htmlAt < 0 || htmlAt >= MAX_PROSE_BEFORE_HTML) return null;

    const prose = combined.slice(0, htmlAt).trim();
    const body = combined.slice(htmlAt);
    if (!force && body.trim().length < MIN_HTML_FALLBACK_CHARS) {
      return null;
    }
    if (!body.trim()) return null;

    this.fallbackMode = "html";
    this.fallbackArmed = true;
    this.meta = { type: "text/html", title: "Artifact" };
    this.chatEmittedBeforeOpen = prose;
    this.buffer = "";
    this.inArtifact = true;

    // Only emit prose that hasn't already been shown in the chat bubble.
    const already = this.chatReturnedLen;
    let chatDelta = "";
    if (prose && already < prose.length) {
      chatDelta = prose.slice(already);
      this.chatReturnedLen = prose.length;
    } else if (!prose) {
      // HTML started at 0 — retract anything we already leaked as "chat".
      chatDelta = "";
      this.chatReturnedLen = 0;
    }

    return {
      chatDelta: looksLikeHtmlContent(chatDelta) ? "" : chatDelta,
      artifactDelta: body,
      meta: this.meta,
    };
  }
}

/** Strip incomplete trailing open tag fragments from chat display text. */
export function stripPartialArtifactTags(text: string): string {
  return scrubChatArtifactProtocol(text);
}

/**
 * Remove artifact protocol leaks from chat prose.
 * Models sometimes write broken variants like:
 *   **nela-artifact type="text/csv" title="..."**
 * without angle brackets — those must never appear in the bubble.
 */
export function scrubChatArtifactProtocol(text: string): string {
  if (!text) return "";
  let s = text;

  // Complete tagged blocks (body belongs in the side panel, not chat).
  s = s.replace(/<nela-artifact\b[^>]*>[\s\S]*?<\/nela-artifact\s*>/gi, "");

  // Open tag through end of string (stream still open).
  s = s.replace(/<nela-artifact\b[^>]*>[\s\S]*$/i, "");

  // Closing / partial tags.
  s = s.replace(/<\/nela-artifact\s*>/gi, "");
  s = s.replace(/<\/?nela-artifact\b[^>]*$/i, "");

  // Bare / markdown-wrapped protocol lines (no angle brackets).
  s = s.replace(
    /^[ \t]*(?:\*\*|__|`)*[ \t]*nela-artifact\b[^\n]*$/gim,
    ""
  );
  s = s.replace(
    /(?:\*\*|__|`)+[ \t]*nela-artifact\b[^\n*]*(?:\*\*|__|`)+/gi,
    ""
  );
  s = s.replace(/\bnela-artifact\b[^\n]*type\s*=\s*["']?text\/(?:csv|html)/gi, "");

  // Don't leave raw HTML document starts in chat.
  s = s.replace(/<(?:!DOCTYPE\s+html|html|head|body)\b[\s\S]*$/i, "");
  s = s.replace(/<\/?[a-zA-Z!][^>]*$/i, "");

  // Collapse leftover blank lines from removals.
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}
