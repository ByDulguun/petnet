"use client";

import { CategoryIcon, toneClasses } from "@/components/shared/category-icon";
import { cn } from "@/lib/utils";

/** Map pin: category icon in a soft pill; brand-filled when selected. */
export function MarkerPin({
  icon,
  tone,
  selected,
  highlighted,
}: {
  icon: string;
  tone: string;
  selected?: boolean;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex size-9 items-center justify-center rounded-full border-2 border-white shadow-lifted transition-transform duration-200 dark:border-slate-900",
        selected
          ? "z-10 scale-125 bg-brand text-white"
          : highlighted
            ? "scale-110 bg-card text-brand ring-2 ring-brand/40"
            : cn("bg-card", toneClasses(tone).split(" ")[1]),
      )}
    >
      <CategoryIcon icon={icon} className="size-4.5" />
    </div>
  );
}
