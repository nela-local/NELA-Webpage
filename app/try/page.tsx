import type { Metadata } from "next";
import TryChatClient from "./TryChatClient";

export const metadata: Metadata = {
  title: "Try NELA Cloud",
  description:
    "Try NELA Cloud in your browser — chat, web search, and HTML artifacts without installing the desktop app.",
};

export default function TryPage() {
  return <TryChatClient />;
}
