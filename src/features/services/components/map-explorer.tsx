"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { AlertTriangle, ListFilter, SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AmenityRef, BusinessListItem, BusinessSort } from "@/lib/types";
import { useMediaQuery } from "@/lib/use-media-query";

import {
  DEFAULT_FILTERS,
  useBusinessSearch,
  useFavorites,
  useGeolocation,
  type ExplorerFilters,
} from "../hooks";
import { BusinessCard } from "./business-card";
import { FilterBar } from "./filter-bar";
import { MapCanvas } from "./map-canvas";
import { MapPreviewCard } from "./map-preview-card";
import { SearchBar } from "./search-bar";

interface CategoryOption {
  slug: string;
  name: string;
  icon: string;
}

interface MapExplorerProps {
  initialFilters: Partial<ExplorerFilters>;
  categories: CategoryOption[];
  districts: string[];
  amenities: AmenityRef[];
}

const SORT_OPTIONS: { value: BusinessSort; labelKey: string }[] = [
  { value: "relevance", labelKey: "sortRelevance" },
  { value: "rating", labelKey: "sortRating" },
  { value: "reviews", labelKey: "sortReviews" },
  { value: "distance", labelKey: "sortDistance" },
  { value: "name", labelKey: "sortName" },
];

function filtersToQueryString(filters: ExplorerFilters): string {
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.category) p.set("category", filters.category);
  if (filters.district) p.set("district", filters.district);
  if (filters.openNow) p.set("openNow", "1");
  if (filters.open24h) p.set("open24h", "1");
  if (filters.minRating) p.set("rating", String(filters.minRating));
  if (filters.amenities.length) p.set("amenities", filters.amenities.join(","));
  if (filters.priceLevels.length) p.set("price", filters.priceLevels.join(","));
  if (filters.verifiedOnly) p.set("verified", "1");
  if (filters.sort !== "relevance") p.set("sort", filters.sort);
  return p.toString();
}

export function MapExplorer({
  initialFilters,
  categories,
  districts,
  amenities,
}: MapExplorerProps) {
  const t = useTranslations("explorer");
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<ExplorerFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [snap, setSnap] = useState<number | string | null>(0.45);
  // viewport-scoped search from the "Search this area" map control
  const [area, setArea] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null);
  // Matches the `lg:` Tailwind breakpoint used below. Gates which of the
  // desktop/mobile layouts actually MOUNTS (not just which is visible) —
  // each renders its own MapCanvas + panel, and without this both used to
  // mount simultaneously, doubling the Google Maps instance, marker
  // clustering, and list virtualization work on every load.
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const { status: geoStatus, coords, request: requestLocation } = useGeolocation();
  const favorites = useFavorites();

  const near = area ?? coords;
  const { data, isPending, isError, refetch } = useBusinessSearch(filters, near);
  const items = useMemo(() => data?.items ?? [], [data]);

  // keep the URL shareable without triggering navigation-loops
  useEffect(() => {
    const qs = filtersToQueryString(filters);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [filters, pathname, router]);

  // when location arrives, surface nearest-first
  useEffect(() => {
    if (coords) setFilters((f) => ({ ...f, sort: "distance" }));
  }, [coords]);

  const updateFilters = useCallback((next: Partial<ExplorerFilters>) => {
    setSelectedId(null);
    setArea(null); // filter changes reset viewport-scoped search
    setFilters((f) => ({ ...f, ...next }));
  }, []);

  const handleSearchArea = useCallback(
    (nextArea: { lat: number; lng: number; radiusKm: number }) => {
      setSelectedId(null);
      setArea(nextArea);
    },
    [],
  );

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) setSnap(0.18); // collapse the mobile sheet so map + preview show
  }, []);

  const panel = (
    <ExplorerPanel
      filters={filters}
      onChange={updateFilters}
      categories={categories}
      districts={districts}
      amenities={amenities}
      geoStatus={geoStatus}
      onRequestLocation={requestLocation}
      hasLocation={Boolean(coords)}
      items={items}
      total={data?.total ?? 0}
      isPending={isPending}
      isError={isError}
      onRetry={() => refetch()}
      selectedId={selectedId}
      highlightedId={highlightedId}
      onHover={setHighlightedId}
      favorites={favorites}
    />
  );

  const selectedBusiness = selectedId
    ? items.find((i) => i.id === selectedId)
    : undefined;

  const preview = (
    <AnimatePresence>
      {selectedBusiness && (
        <div
          key={selectedBusiness.id}
          className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 max-lg:top-3 max-lg:bottom-auto"
        >
          <MapPreviewCard
            business={selectedBusiness}
            phone={selectedBusiness.phone}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative h-[calc(100dvh-4rem-1px)]">
      {isDesktop ? (
        /* Desktop: split view */
        <div className="grid h-full lg:grid-cols-[27rem_1fr]">
          <div className="flex h-full flex-col overflow-hidden border-r">{panel}</div>
          <div className="relative h-full">
            <MapCanvas
              items={items}
              selectedId={selectedId}
              highlightedId={highlightedId}
              onSelect={handleSelect}
              userLocation={coords}
              onSearchArea={handleSearchArea}
            />
            {preview}
          </div>
        </div>
      ) : (
        /* Mobile: full-screen map + draggable bottom sheet */
        <div className="relative h-full">
          <MapCanvas
            items={items}
            selectedId={selectedId}
            highlightedId={highlightedId}
            onSelect={handleSelect}
            userLocation={coords}
            onSearchArea={handleSearchArea}
          />
          {preview}
          <Drawer.Root
            open
            modal={false}
            dismissible={false}
            snapPoints={[0.18, 0.45, 0.92]}
            activeSnapPoint={snap}
            setActiveSnapPoint={setSnap}
          >
            <Drawer.Portal>
              <Drawer.Content
                aria-describedby={undefined}
                className="fixed inset-x-0 bottom-0 z-40 flex h-[92dvh] flex-col rounded-t-3xl border-t bg-background shadow-lifted outline-none"
              >
                <Drawer.Title className="sr-only">{t("drawerTitle")}</Drawer.Title>
                <div
                  className="mx-auto mt-3 mb-1 h-1.5 w-11 shrink-0 rounded-full bg-muted-foreground/25"
                  aria-hidden="true"
                />
                <div className="flex min-h-0 flex-1 flex-col">{panel}</div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ExplorerPanel({
  filters,
  onChange,
  categories,
  districts,
  amenities,
  geoStatus,
  onRequestLocation,
  hasLocation,
  items,
  total,
  isPending,
  isError,
  onRetry,
  selectedId,
  highlightedId,
  onHover,
  favorites,
}: {
  filters: ExplorerFilters;
  onChange: (next: Partial<ExplorerFilters>) => void;
  categories: CategoryOption[];
  districts: string[];
  amenities: AmenityRef[];
  geoStatus: ReturnType<typeof useGeolocation>["status"];
  onRequestLocation: () => void;
  hasLocation: boolean;
  items: BusinessListItem[];
  total: number;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedId: string | null;
  highlightedId: string | null;
  onHover: (id: string | null) => void;
  favorites: ReturnType<typeof useFavorites>;
}) {
  const t = useTranslations("explorer");
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 138,
    overscan: 6,
    getItemKey: (index) => items[index]?.id ?? index,
  });

  // keep the selected card in view when a marker is tapped
  useEffect(() => {
    if (!selectedId) return;
    const index = items.findIndex((i) => i.id === selectedId);
    if (index >= 0) virtualizer.scrollToIndex(index, { align: "auto", behavior: "smooth" });
  }, [selectedId, items, virtualizer]);

  return (
    <>
      <div className="space-y-3 px-4 pt-3 pb-3 sm:px-5">
        <SearchBar
          value={filters.q}
          onSearch={(q) => onChange({ q })}
          onPickCategory={(category) => onChange({ category, q: "" })}
          onPickDistrict={(district) => onChange({ district, q: "" })}
        />
        <FilterBar
          filters={filters}
          onChange={onChange}
          categories={categories}
          districts={districts}
          amenities={amenities}
          geoStatus={geoStatus}
          onRequestLocation={onRequestLocation}
          hasLocation={hasLocation}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] text-muted-foreground" aria-live="polite">
            {isPending ? t("searching") : t("resultsCount", { count: total })}
          </p>
          <Select
            value={filters.sort}
            onValueChange={(v) => onChange({ sort: v as BusinessSort })}
          >
            <SelectTrigger
              size="sm"
              className="h-8 w-auto gap-1.5 rounded-full border-0 bg-secondary text-[13px] font-medium"
              aria-label={t("sortAria")}
            >
              <ListFilter className="size-3.5" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-5"
        tabIndex={0}
        aria-label={t("resultsAria")}
      >
        {isError ? (
          <EmptyState
            icon={AlertTriangle}
            title={t("errorTitle")}
            description={t("errorDesc")}
            action={
              <Button onClick={onRetry} className="rounded-full font-semibold">
                {t("tryAgain")}
              </Button>
            }
          />
        ) : isPending ? (
          <div className="space-y-3" aria-busy="true" aria-label={t("loadingResults")}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3.5 rounded-2xl border bg-card p-3">
                <Skeleton className="size-24 shrink-0 rounded-xl sm:size-28" />
                <div className="flex-1 space-y-2.5 py-1">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3.5 w-1/2 rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
            action={
              <Button
                variant="outline"
                className="rounded-full font-semibold"
                onClick={() =>
                  onChange({
                    q: "",
                    category: undefined,
                    district: undefined,
                    openNow: false,
                    open24h: false,
                    minRating: undefined,
                    amenities: [],
                    priceLevels: [],
                    verifiedOnly: false,
                  })
                }
              >
                {t("clearEverything")}
              </Button>
            }
          />
        ) : (
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const business = items[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="absolute inset-x-0 top-0 pb-3"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <BusinessCard
                    business={business}
                    isFavorite={favorites.isFavorite(business.slug)}
                    onToggleFavorite={favorites.toggle}
                    onHover={onHover}
                    isHighlighted={
                      business.id === highlightedId || business.id === selectedId
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
