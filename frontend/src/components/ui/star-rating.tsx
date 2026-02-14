import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
  showValue?: boolean;
  count?: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, showValue = false, count, size = "sm" }: StarRatingProps) {
  const iconSize = size === "sm" ? 14 : 16;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            size={iconSize}
            className="fill-yellow-400 text-yellow-400"
          />
        ))}
        {hasHalf && (
          <StarHalf
            size={iconSize}
            className="fill-yellow-400 text-yellow-400"
          />
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            size={iconSize}
            className="text-zinc-700"
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs text-zinc-400">{rating.toFixed(1)}</span>
      )}
      {count !== undefined && (
        <span className="text-xs text-zinc-500">({count})</span>
      )}
    </div>
  );
}
