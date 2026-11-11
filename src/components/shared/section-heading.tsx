import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  href,
  hrefLabel = "View all",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10",
        className,
      )}
    >
      <div className="max-w-xl">
        {eyebrow && (
          <p className="mb-2 text-sm font-semibold tracking-wide text-brand uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand/80"
        >
          {hrefLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
