"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { BadgeCheck, Heart, MapPin, Star } from "lucide-react";

import { CategoryIcon, toneClasses } from "@/components/shared/category-icon";
import { BusinessCoverImage } from "@/components/shared/business-cover-image";
import { OpenStatusText } from "@/components/shared/open-status";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDistance } from "@/lib/geo";
import type { BusinessListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BusinessCard({
  business,
  isFavorite,
  onToggleFavorite,
  onHover,
  isHighlighted,
  layout = "row",
}: {
  business: BusinessListItem;
  isFavorite?: boolean;
  onToggleFavorite?: (slug: string) => void;
  onHover?: (id: string | null) => void;
  isHighlighted?: boolean;
  /** "row" for the explorer list, "tile" for grids (nearby, favorites) */
  layout?: "row" | "tile";
}) {
  const t = useTranslations("explorer");
  const tCategories = useTranslations("categories");
  const tDistricts = useTranslations("districts");

  const open = business.openStatus;
  const categoryName = tCategories.has(business.category.slug)
    ? tCategories(business.category.slug)
    : business.category.name;
  const districtName = tDistricts.has(business.district)
    ? tDistricts(business.district)
    : business.district;

  const favoriteButton = onToggleFavorite && (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        isFavorite
          ? `${t("previewSaved")}: ${business.name}`
          : `${t("previewSave")}: ${business.name}`
      }
      aria-pressed={isFavorite}
      className="size-8 shrink-0 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite(business.slug);
      }}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          isFavorite ? "fill-danger text-danger" : "text-muted-foreground",
        )}
      />
    </Button>
  );

  if (layout === "tile") {
    return (
      <Link
        href={`/business/${business.slug}`}
        className="group block overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <BusinessCoverImage
            coverUrl={business.coverUrl}
            name={business.name}
            category={business.category}
            sizes="(min-width: 1024px) 20rem, (min-width: 640px) 50vw, 100vw"
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <span
            className={cn(
              "absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
              toneClasses(business.category.tone),
            )}
          >
            <CategoryIcon icon={business.category.icon} className="size-3.5" />
            {categoryName}
          </span>
          {favoriteButton && (
            <span className="absolute top-2.5 right-2.5">{favoriteButton}</span>
          )}
          {business.logoUrl && (
            <div className="absolute right-2.5 bottom-2.5 size-7 overflow-hidden rounded-full border-2 border-card bg-card shadow-sm">
              <Image src={business.logoUrl} alt="" fill sizes="1.75rem" className="object-cover" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="flex items-center gap-1.5 font-bold">
            <span className="truncate">{business.name}</span>
            {business.isVerified && (
              <BadgeCheck className="size-4.5 shrink-0 text-brand-blue" aria-label="✓" />
            )}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
            <span className="font-semibold text-foreground">
              {business.ratingAvg.toFixed(1)}
            </span>
            <span>({business.ratingCount})</span>
            <span aria-hidden="true">·</span>
            <MapPin className="size-3.5" aria-hidden="true" />
            <span className="truncate">{districtName}</span>
          </div>
          <p
            className={cn(
              "mt-2 text-xs font-medium",
              open.isOpen ? "text-success" : "text-muted-foreground",
            )}
          >
            <OpenStatusText status={open} />
            {business.distanceKm !== undefined && (
              <span className="text-muted-foreground">
                {" "}
                · {t("distanceAway", { distance: formatDistance(business.distanceKm) })}
              </span>
            )}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/business/${business.slug}`}
      onMouseEnter={() => onHover?.(business.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(business.id)}
      onBlur={() => onHover?.(null)}
      className={cn(
        "group flex gap-3.5 rounded-2xl border bg-card p-3 transition-all duration-200 hover:border-brand/30 hover:shadow-soft",
        isHighlighted && "border-brand/40 shadow-soft ring-2 ring-brand/20",
      )}
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl sm:size-28">
        <BusinessCoverImage
          coverUrl={business.coverUrl}
          name={business.name}
          category={business.category}
          sizes="7rem"
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {business.logoUrl && (
          <div className="absolute right-1 bottom-1 size-5 overflow-hidden rounded-full border-2 border-card bg-card shadow-sm">
            <Image src={business.logoUrl} alt="" fill sizes="1.25rem" className="object-cover" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex min-w-0 items-center gap-1.5 text-[15px] leading-tight font-bold">
            <span className="truncate">{business.name}</span>
            {business.isVerified && (
              <BadgeCheck className="size-4 shrink-0 text-brand-blue" aria-label="✓" />
            )}
          </h3>
          {favoriteButton}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-muted-foreground">
          <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
          <span className="font-semibold text-foreground">{business.ratingAvg.toFixed(1)}</span>
          <span>({business.ratingCount})</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{categoryName}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{districtName}</span>
        </div>

        <p
          className={cn(
            "mt-1 text-xs font-medium",
            open.isOpen ? "text-success" : "text-muted-foreground",
          )}
        >
          <OpenStatusText status={open} />
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          {business.priceLevel ? (
            <span className="text-xs font-medium text-muted-foreground">
              {"₮".repeat(business.priceLevel)}
              <span className="opacity-40">{"₮".repeat(4 - business.priceLevel)}</span>
            </span>
          ) : (
            <span />
          )}
          {business.distanceKm !== undefined && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue">
              <MapPin className="size-3.5" aria-hidden="true" />
              {formatDistance(business.distanceKm)}
              {business.travelMinutes !== undefined &&
                ` · ${t("travelTime", { minutes: business.travelMinutes })}`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
