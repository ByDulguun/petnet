import { cn } from "@/lib/utils";

export function BreedRating({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1" role="img" aria-label={`${label}: ${value} / 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={cn("size-2.5 rounded-full", i < value ? "bg-brand" : "bg-secondary")}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
