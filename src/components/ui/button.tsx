import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

const variants = {
  primary: "bg-ink text-white hover:bg-black",
  secondary: "border border-line bg-white text-ink hover:bg-fog",
  ghost: "text-steel hover:bg-fog"
};

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${variants[variant]} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
