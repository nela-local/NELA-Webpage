"use client";

import React, { isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyButton from "./CopyButton";

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }
  if (isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return "";
}

function hostnameLabel(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "") || "Link";
  } catch {
    return "Link";
  }
}

/**
 * Convert bare http(s) URLs into markdown [hostname](url) links so the UI
 * never shows a long verbose URL as link text. Skips URLs already inside
 * markdown link destinations `](url)`.
 */
export function shortenBareUrlsInMarkdown(md: string): string {
  return md.replace(
    /https?:\/\/[^\s<>"'`)\]]+/gi,
    (url: string, offset: number, source: string) => {
      const before = source.slice(Math.max(0, offset - 2), offset);
      // Already a markdown link destination: ](https://...)
      if (before === "](") return url;
      try {
        return `[${hostnameLabel(url)}](${url})`;
      } catch {
        return url;
      }
    },
  );
}

function linkDisplayChildren(
  href: string | undefined,
  children: React.ReactNode,
): React.ReactNode {
  if (!href) return children;
  const text = extractText(children).trim();
  const looksLikeUrl =
    !text ||
    text === href ||
    /^https?:\/\//i.test(text) ||
    text.startsWith("www.");
  if (looksLikeUrl) {
    return hostnameLabel(href);
  }
  return children;
}

export default function ChatMarkdown({ content }: { content: string }) {
  if (!content.trim()) return null;

  const prepared = shortenBareUrlsInMarkdown(content);

  return (
    <div className="chat-markdown prose prose-sm max-w-none overflow-hidden dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            return (
              <a
                {...props}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={href}
                className="break-words [overflow-wrap:anywhere]"
              >
                {linkDisplayChildren(href, children)}
              </a>
            );
          },
          p({ children, ...props }) {
            return (
              <p {...props} className="break-words [overflow-wrap:anywhere]">
                {children}
              </p>
            );
          },
          li({ children, ...props }) {
            return (
              <li {...props} className="break-words [overflow-wrap:anywhere]">
                {children}
              </li>
            );
          },
          pre({ children, ...props }) {
            let codeContent = "";
            const firstChild = Array.isArray(children) ? children[0] : children;
            if (isValidElement(firstChild)) {
              const childProps = firstChild.props as {
                children?: React.ReactNode;
              };
              codeContent = extractText(childProps.children);
            } else {
              codeContent = extractText(children);
            }

            return (
              <div className="chat-code-block group relative my-3 max-w-full overflow-hidden">
                <div className="mb-2 flex justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <CopyButton
                    text={codeContent.replace(/\n$/, "")}
                    label="Copy code"
                  />
                </div>
                <pre {...props} className="max-w-full overflow-x-auto">
                  {children}
                </pre>
              </div>
            );
          },
        }}
      >
        {prepared}
      </ReactMarkdown>
    </div>
  );
}
