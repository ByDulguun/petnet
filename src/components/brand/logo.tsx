import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * PetNet mark — minimal flat puppy: orange head, floppy ears, blue nose.
 * Self-colored so it reads identically in light and dark mode.
 */
export function PetNetMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-8", className)}
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="5"
        y="15"
        width="13"
        height="27"
        rx="6.5"
        fill="#E05F00"
        transform="rotate(14 11.5 28.5)"
      />
      <rect
        x="46"
        y="15"
        width="13"
        height="27"
        rx="6.5"
        fill="#E05F00"
        transform="rotate(-14 52.5 28.5)"
      />
      <circle cx="32" cy="34" r="20" fill="#FF7A00" />
      <circle cx="25" cy="31" r="2.7" fill="#0F172A" />
      <circle cx="39" cy="31" r="2.7" fill="#0F172A" />
      <path
        d="M26.5 43.5 Q32 48.5 37.5 43.5"
        stroke="#0F172A"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="38.6" rx="4.2" ry="3.4" fill="#2563EB" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 transition-opacity hover:opacity-80",
        className,
      )}
      aria-label="PetNet — home"
    >
      <PetNetMark className={markClassName} />
      <span className="text-xl font-extrabold tracking-tight">
        Pet<span className="text-brand">Net</span>
      </span>
    </Link>
  );
}
