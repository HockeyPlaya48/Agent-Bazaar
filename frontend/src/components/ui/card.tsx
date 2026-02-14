import { type ReactNode } from "react";

const variants = {
  default: "rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6",
  highlighted:
    "rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent p-6",
  interactive:
    "rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-900/80 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] group",
};

interface CardProps {
  variant?: keyof typeof variants;
  children: ReactNode;
  className?: string;
}

export function Card({ variant = "default", children, className = "" }: CardProps) {
  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
