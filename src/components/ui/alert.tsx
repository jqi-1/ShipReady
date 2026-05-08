import type { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  tone?: "info" | "warn" | "danger";
}

const tones = {
  info: "border-teal-200 bg-teal-50 text-signal",
  warn: "border-amber-200 bg-amber-50 text-caution",
  danger: "border-red-200 bg-red-50 text-danger"
};

export function Alert({ children, tone = "info" }: AlertProps) {
  return (
    <div className={`rounded-md border px-4 py-3 text-sm font-medium ${tones[tone]}`}>
      {children}
    </div>
  );
}
