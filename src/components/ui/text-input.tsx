import type { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextInput({ label, className = "", ...props }: TextInputProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      {label}
      <input
        className={`h-11 rounded-md border border-line bg-white px-3 text-base font-normal text-ink outline-none transition placeholder:text-steel focus:border-signal focus:ring-2 focus:ring-teal-100 ${className}`}
        {...props}
      />
    </label>
  );
}
