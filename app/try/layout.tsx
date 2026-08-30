import type { ReactNode } from "react";

export default function TryLayout({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden">{children}</div>;
}
