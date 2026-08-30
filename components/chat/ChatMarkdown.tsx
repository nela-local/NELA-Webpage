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

export default function ChatMarkdown({ content }: { content: string }) {
  if (!content.trim()) return null;

  return (
    <div className="chat-markdown prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
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
              <div className="chat-code-block group relative my-3">
                <div className="absolute right-2 top-2 z-10 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  <CopyButton
                    text={codeContent.replace(/\n$/, "")}
                    label="Copy code"
                  />
                </div>
                <pre {...props}>{children}</pre>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
