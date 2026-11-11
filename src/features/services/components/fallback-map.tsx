"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Info, RotateCw } from "lucide-react";

import { boundsOf, projectToUnit, UB_CENTER } from "@/lib/geo";

import { MarkerPin } from "./marker-pin";
import type { MapCanvasProps } from "./map-canvas";

interface FallbackMapProps extends MapCanvasProps {
  /** Overrides the bottom notice text — used by MapErrorBoundary to explain
   * a runtime failure instead of the default "no key configured" message. */
  notice?: string;
  /** When set, shows a retry button next to the notice (the live map crashed
   * at runtime and might just need another attempt, e.g. a transient script
   * load failure) instead of the plain "no key configured" state, which has
   * nothing to retry. */
  onRetry?: () => void;
}

/**
 * Offline map used when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured,
 * or as the graceful fallback when the live Google Maps SDK fails at
 * runtime (see MapErrorBoundary). Real projection, real selection model —
 * only the base tiles are stylized. The moment a working key is available,
 * GoogleMapCanvas takes over with zero changes to the explorer.
 */
export default function FallbackMap({
  items,
  selectedId,
  highlightedId,
  onSelect,
  userLocation,
  notice,
  onRetry,
}: FallbackMapProps) {
  const t = useTranslations("explorer");
  const tCategories = useTranslations("categories");
  const bounds = useMemo(() => {
    const points = items.map((i) => ({ lat: i.latitude, lng: i.longitude }));
    if (userLocation) points.push(userLocation);
    if (points.length === 0) points.push(UB_CENTER);
    return boundsOf(points, 0.14);
  }, [items, userLocation]);

  const selected = items.find((i) => i.id === selectedId);

  return (
    <div
      className="relative size-full overflow-hidden bg-[#eef2ec] dark:bg-[#101828]"
      role="application"
      aria-label={t("mapAria")}
    >
      {/* stylized terrain */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.55] dark:opacity-[0.25]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(100,116,139,0.35) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      {/* Tuul river sweep */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full text-brand-blue/20 dark:text-brand-blue/15"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M-5 78 C 20 70, 38 84, 55 79 S 85 68, 105 74"
          stroke="currentColor"
          strokeWidth="3.2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M-5 30 C 18 26, 30 34, 48 30 S 82 22, 105 28"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>

      {/* markers */}
      {items.map((item, index) => {
        const { x, y } = projectToUnit(
          { lat: item.latitude, lng: item.longitude },
          bounds,
        );
        const isSelected = item.id === selectedId;
        return (
          <motion.button
            key={item.id}
            type="button"
            initial={{ opacity: 0, scale: 0.4, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: Math.min(index * 0.03, 0.5),
              type: "spring",
              stiffness: 320,
              damping: 22,
            }}
            onClick={() => onSelect(isSelected ? null : item.id)}
            aria-label={t("markerAria", {
              name: item.name,
              category: tCategories.has(item.category.slug)
                ? tCategories(item.category.slug)
                : item.category.name,
            })}
            aria-pressed={isSelected}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              zIndex: isSelected ? 20 : item.id === highlightedId ? 15 : 1,
            }}
          >
            <MarkerPin
              icon={item.category.icon}
              tone={item.category.tone}
              selected={isSelected}
              highlighted={item.id === highlightedId}
            />
          </motion.button>
        );
      })}

      {/* selected label */}
      {selected && (
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute -translate-x-1/2 rounded-full border bg-card px-3 py-1.5 text-xs font-bold shadow-lifted"
          style={(() => {
            const { x, y } = projectToUnit(
              { lat: selected.latitude, lng: selected.longitude },
              bounds,
            );
            return { left: `${x * 100}%`, top: `calc(${y * 100}% + 30px)`, zIndex: 21 };
          })()}
        >
          {selected.name}
        </motion.div>
      )}

      {/* user location */}
      {userLocation && (
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={(() => {
            const { x, y } = projectToUnit(userLocation, bounds);
            return { left: `${x * 100}%`, top: `${y * 100}%`, zIndex: 22 };
          })()}
          aria-label={t("yourLocation")}
        >
          <span className="relative flex size-4">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-blue opacity-60" />
            <span className="relative inline-flex size-4 rounded-full border-2 border-white bg-brand-blue" />
          </span>
        </span>
      )}

      {/* demo / degraded-mode notice */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-card/90 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-soft backdrop-blur-sm">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        {notice ?? t("mapDemoNotice")}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-1 inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 font-semibold text-foreground hover:bg-secondary"
          >
            <RotateCw className="size-3" aria-hidden="true" />
            {t("mapRetry")}
          </button>
        )}
      </div>
    </div>
  );
}
