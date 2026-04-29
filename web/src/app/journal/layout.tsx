import type { ReactNode } from "react";

export default function JournalLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <div className="journal-shell">{children}</div>;
}
