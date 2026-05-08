import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "danger";
}

const tones = {
  neutral: "bg-fog text-steel",
  good: "bg-teal-50 text-signal",
  warn: "bg-amber-50 text-caution",
  danger: "bg-red-50 text-danger"
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
