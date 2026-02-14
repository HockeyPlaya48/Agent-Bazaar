import { type ReactNode } from "react";

const variants = {
  default: "bg-zinc-800 text-zinc-400",
  atlas: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  deal: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  success: "bg-green-500/10 text-green-400",
  category: "bg-zinc-800/50 text-zinc-300 border border-zinc-700",
};

interface BadgeProps {
  variant?: keyof typeof variants;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
