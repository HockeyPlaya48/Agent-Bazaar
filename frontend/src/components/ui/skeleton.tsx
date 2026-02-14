interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`rounded-xl bg-zinc-800/50 animate-pulse ${className}`}
    />
  );
}
