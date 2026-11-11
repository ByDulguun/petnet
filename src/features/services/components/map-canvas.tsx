"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";
import type { BusinessListItem } from "@/lib/types";

import { MapErrorBoundary } from "./map-error-boundary";

export interface MapCanvasProps {
  items: BusinessListItem[];
  selectedId: string | null;
  highlightedId: string | null;
  onSelect: (id: string | null) => void;
  userLocation: { lat: number; lng: number } | null;
  /** Google Maps only: user panned away and asked to re-search the viewport. */
  onSearchArea?: (area: { lat: number; lng: number; radiusKm: number }) => void;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Lazy-load whichever implementation applies; neither ships in the initial
// bundle of other routes.
const GoogleMapCanvas = dynamic(() => import("./google-map-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

const FallbackMap = dynamic(() => import("./fallback-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

declare global {
  interface Window {
    /** Google's own documented global callback — the Maps JS API calls this
     * directly when the API key is invalid/unauthorized. Catching it here
     * lets us fall back BEFORE any marker ever attempts to mount, instead
     * of discovering the key is bad only once each marker throws (an
     * invalid key still "loads" the base map, so the failure only surfaces
     * once real map objects, like AdvancedMarker, try to attach to it). */
    gm_authFailure?: () => void;
  }
}

export function MapCanvas(props: MapCanvasProps) {
  const t = useTranslations("explorer");
  const [attempt, setAttempt] = useState(0);
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    if (!API_KEY) return;
    window.gm_authFailure = () => setAuthFailed(true);
    return () => {
      delete window.gm_authFailure;
    };
  }, [attempt]);

  if (!API_KEY || authFailed) {
    return (
      <FallbackMap
        {...props}
        notice={authFailed ? t("mapLoadErrorNotice") : undefined}
        onRetry={
          authFailed
            ? () => {
                setAuthFailed(false);
                setAttempt((n) => n + 1);
              }
            : undefined
        }
      />
    );
  }

  return (
    <MapErrorBoundary
      key={attempt}
      fallback={(retry) => (
        <FallbackMap
          {...props}
          notice={t("mapLoadErrorNotice")}
          onRetry={() => {
            setAttempt((n) => n + 1);
            retry();
          }}
        />
      )}
    >
      <GoogleMapCanvas apiKey={API_KEY} {...props} />
    </MapErrorBoundary>
  );
}
