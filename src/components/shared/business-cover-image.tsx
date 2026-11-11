import Image from "next/image";

import { CategoryIcon, toneClasses } from "@/components/shared/category-icon";
import { cn } from "@/lib/utils";

/**
 * A business's cover photo, or — when it hasn't set one yet, which
 * `coverUrl ?? ""` in business-service.ts makes a plain empty string, not
 * null — a toned placeholder using its category icon instead of handing
 * next/image an empty src (which renders a broken image box and logs a
 * dev warning). Used everywhere a business cover is shown outside the
 * business detail page's own gallery (business-card, map preview,
 * booking row, homepage popular shops).
 */
export function BusinessCoverImage({
  coverUrl,
  name,
  category,
  sizes,
  className,
  iconClassName,
}: {
  coverUrl: string;
  name: string;
  category: { icon: string; tone: string };
  sizes: string;
  className?: string;
  iconClassName?: string;
}) {
  if (!coverUrl) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          toneClasses(category.tone),
          className,
        )}
      >
        <CategoryIcon icon={category.icon} className={cn("size-8 opacity-70", iconClassName)} />
      </div>
    );
  }
  return (
    <Image src={coverUrl} alt={name} fill sizes={sizes} className={cn("object-cover", className)} />
  );
}
