import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Read-only star row, e.g. next to review counts. */
export function RatingStars({
  rating,
  className,
  size = "size-3.5",
}: {
  rating: number;
  className?: string;
  size?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(
            size,
            i <= Math.round(rating)
              ? "fill-warning text-warning"
              : "fill-muted text-muted",
          )}
        />
      ))}
    </span>
  );
}
