import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-lg border border-line bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}
