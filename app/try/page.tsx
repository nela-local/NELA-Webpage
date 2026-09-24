import type { Metadata } from "next";
import TryChatClient from "./TryChatClient";

export const metadata: Metadata = {
  title: "Try NELA Cloud",
  description:
    "Try NELA Cloud in your browser — the same Cloud behind NELA’s private AI next to Tally. Chat, web search, and HTML artifacts; connect Tally in the desktop app.",
};

export default function TryPage() {
  return <TryChatClient />;
}
