"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, Clock, LocateFixed, SlidersHorizontal, Star, X } from "lucide-react";

import { CategoryIcon } from "@/components/shared/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { AmenityRef } from "@/lib/types";
import { cn } from "@/lib/utils";

import { countActiveFilters, type ExplorerFilters, type GeoStatus } from "../hooks";

interface CategoryOption {
  slug: string;
  name: string;
  icon: string;
}

function Chip({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
        active
          ? "border-brand/40 bg-brand-soft text-brand"
          : "bg-card text-muted-foreground hover:border-brand/25 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function FilterBar({
  filters,
  onChange,
  categories,
  districts,
  amenities,
  geoStatus,
  onRequestLocation,
  hasLocation,
}: {
  filters: ExplorerFilters;
  onChange: (next: Partial<ExplorerFilters>) => void;
  categories: CategoryOption[];
  districts: string[];
  amenities: AmenityRef[];
  geoStatus: GeoStatus;
  onRequestLocation: () => void;
  hasLocation: boolean;
}) {
  const t = useTranslations("explorer");
  const tCategories = useTranslations("categories");
  const tDistricts = useTranslations("districts");
  const tAmenities = useTranslations("amenities");

  const activeCount = countActiveFilters(filters);
  const selectedCategory = categories.find((c) => c.slug === filters.category);

  const categoryLabel = (slug: string, fallback: string) =>
    tCategories.has(slug) ? tCategories(slug) : fallback;
  const districtLabel = (name: string) =>
    tDistricts.has(name) ? tDistricts(name) : name;

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="toolbar"
      aria-label={t("filters")}
    >
      {/* All filters sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-9 shrink-0 rounded-full text-[13px] font-semibold">
            <SlidersHorizontal className="size-4" />
            {t("filters")}
            {activeCount > 0 && (
              <Badge className="ml-0.5 size-5 justify-center rounded-full bg-brand p-0 text-[11px] text-white">
                {activeCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[22rem] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("allFilters")}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 px-4 pb-4">
            <section aria-labelledby="filter-hours">
              <h3 id="filter-hours" className="mb-3 text-sm font-bold">
                {t("hours")}
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3 text-sm">
                  {t("openNow")}
                  <Switch
                    checked={filters.openNow}
                    onCheckedChange={(v) => onChange({ openNow: v })}
                    aria-label={t("openNow")}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm">
                  {t("open24h")}
                  <Switch
                    checked={filters.open24h}
                    onCheckedChange={(v) => onChange({ open24h: v })}
                    aria-label={t("open24h")}
                  />
                </label>
              </div>
            </section>

            <section aria-labelledby="filter-rating">
              <h3 id="filter-rating" className="mb-3 text-sm font-bold">
                {t("minRating")}
              </h3>
              <div className="flex gap-2">
                {[4, 4.5, 4.8].map((r) => (
                  <Chip
                    key={r}
                    active={filters.minRating === r}
                    onClick={() =>
                      onChange({ minRating: filters.minRating === r ? undefined : r })
                    }
                  >
                    <Star className="size-3.5 fill-current" aria-hidden="true" />
                    {r}+
                  </Chip>
                ))}
              </div>
            </section>

            <section aria-labelledby="filter-price">
              <h3 id="filter-price" className="mb-3 text-sm font-bold">
                {t("priceLevel")}
              </h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((level) => (
                  <Chip
                    key={level}
                    active={filters.priceLevels.includes(level)}
                    ariaLabel={t("priceAria", { level })}
                    onClick={() =>
                      onChange({
                        priceLevels: filters.priceLevels.includes(level)
                          ? filters.priceLevels.filter((p) => p !== level)
                          : [...filters.priceLevels, level],
                      })
                    }
                  >
                    {"₮".repeat(level)}
                  </Chip>
                ))}
              </div>
            </section>

            <section aria-labelledby="filter-amenities">
              <h3 id="filter-amenities" className="mb-3 text-sm font-bold">
                {t("amenitiesTitle")}
              </h3>
              <div className="space-y-2.5">
                {amenities.map((a) => (
                  <div key={a.slug} className="flex items-center gap-3">
                    <Checkbox
                      id={`amenity-${a.slug}`}
                      checked={filters.amenities.includes(a.slug)}
                      onCheckedChange={(checked) =>
                        onChange({
                          amenities: checked
                            ? [...filters.amenities, a.slug]
                            : filters.amenities.filter((s) => s !== a.slug),
                        })
                      }
                    />
                    <Label
                      htmlFor={`amenity-${a.slug}`}
                      className="flex items-center gap-2 text-sm font-normal"
                    >
                      <CategoryIcon icon={a.icon} className="size-4 text-muted-foreground" />
                      {tAmenities.has(a.slug) ? tAmenities(a.slug) : a.name}
                    </Label>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="filter-trust">
              <h3 id="filter-trust" className="mb-3 text-sm font-bold">
                {t("trust")}
              </h3>
              <label className="flex items-center justify-between gap-3 text-sm">
                {t("verifiedOnly")}
                <Switch
                  checked={filters.verifiedOnly}
                  onCheckedChange={(v) => onChange({ verifiedOnly: v })}
                  aria-label={t("verifiedOnly")}
                />
              </label>
            </section>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              className="w-full rounded-full font-semibold"
              onClick={() =>
                onChange({
                  openNow: false,
                  open24h: false,
                  minRating: undefined,
                  amenities: [],
                  priceLevels: [],
                  verifiedOnly: false,
                })
              }
            >
              {t("clearAll")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Category dropdown chip */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
              selectedCategory
                ? "border-brand/40 bg-brand-soft text-brand"
                : "bg-card text-muted-foreground hover:border-brand/25 hover:text-foreground",
            )}
          >
            {selectedCategory ? (
              <>
                <CategoryIcon icon={selectedCategory.icon} className="size-4" />
                {categoryLabel(selectedCategory.slug, selectedCategory.name)}
                <X
                  className="size-3.5"
                  aria-hidden="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ category: undefined });
                  }}
                />
              </>
            ) : (
              <>
                {t("category")}
                <ChevronDown className="size-3.5" aria-hidden="true" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 w-64 overflow-y-auto">
          {categories.map((c) => (
            <DropdownMenuItem
              key={c.slug}
              onSelect={() =>
                onChange({ category: filters.category === c.slug ? undefined : c.slug })
              }
              className={cn(filters.category === c.slug && "bg-brand-soft text-brand")}
            >
              <CategoryIcon icon={c.icon} className="size-4" />
              {categoryLabel(c.slug, c.name)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* District dropdown chip */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
              filters.district
                ? "border-brand/40 bg-brand-soft text-brand"
                : "bg-card text-muted-foreground hover:border-brand/25 hover:text-foreground",
            )}
          >
            {filters.district ? districtLabel(filters.district) : t("district")}
            {filters.district ? (
              <X
                className="size-3.5"
                aria-hidden="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ district: undefined });
                }}
              />
            ) : (
              <ChevronDown className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {districts.map((d) => (
            <DropdownMenuItem
              key={d}
              onSelect={() => onChange({ district: filters.district === d ? undefined : d })}
              className={cn(filters.district === d && "bg-brand-soft text-brand")}
            >
              {districtLabel(d)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Chip active={filters.openNow} onClick={() => onChange({ openNow: !filters.openNow })}>
        <Clock className="size-3.5" aria-hidden="true" />
        {t("openNow")}
      </Chip>

      <Chip
        active={filters.minRating === 4.5}
        onClick={() => onChange({ minRating: filters.minRating === 4.5 ? undefined : 4.5 })}
      >
        <Star className="size-3.5 fill-current" aria-hidden="true" />
        4.5+
      </Chip>

      <Chip active={hasLocation} onClick={onRequestLocation} ariaLabel={t("nearMeAria")}>
        <LocateFixed
          className={cn("size-3.5", geoStatus === "locating" && "animate-pulse")}
          aria-hidden="true"
        />
        {geoStatus === "locating"
          ? t("locating")
          : hasLocation
            ? t("nearMeActive")
            : t("nearMe")}
      </Chip>
    </div>
  );
}
