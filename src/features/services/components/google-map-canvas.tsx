"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  useMap,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer, type Marker } from "@googlemaps/markerclusterer";
import {
  Car,
  Expand,
  Layers,
  LocateFixed,
  Search,
  Shrink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { UB_CENTER } from "@/lib/geo";

import { MarkerPin } from "./marker-pin";
import type { MapCanvasProps } from "./map-canvas";

export default function GoogleMapCanvas({
  apiKey,
  items,
  selectedId,
  highlightedId,
  onSelect,
  userLocation,
  onSearchArea,
}: MapCanvasProps & { apiKey: string }) {
  const [mapTypeId, setMapTypeId] = useState<"roadmap" | "hybrid" | "terrain">("roadmap");

  return (
    <APIProvider apiKey={apiKey}>
      <GoogleMap
        mapId="petnet-explorer"
        defaultCenter={UB_CENTER}
        defaultZoom={12}
        mapTypeId={mapTypeId}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        className="size-full"
      >
        <ClusteredMarkers
          items={items}
          selectedId={selectedId}
          highlightedId={highlightedId}
          onSelect={onSelect}
        />
        {userLocation && (
          <AdvancedMarker position={userLocation} zIndex={30}>
            <span className="relative flex size-4">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-blue opacity-60" />
              <span className="relative inline-flex size-4 rounded-full border-2 border-white bg-brand-blue" />
            </span>
          </AdvancedMarker>
        )}
        <MapControls
          mapTypeId={mapTypeId}
          onMapTypeChange={setMapTypeId}
          userLocation={userLocation}
          onSearchArea={onSearchArea}
        />
      </GoogleMap>
    </APIProvider>
  );
}

/** Custom control bar: map type, traffic, my-location, fullscreen, search-this-area. */
function MapControls({
  mapTypeId,
  onMapTypeChange,
  userLocation,
  onSearchArea,
}: {
  mapTypeId: "roadmap" | "hybrid" | "terrain";
  onMapTypeChange: (t: "roadmap" | "hybrid" | "terrain") => void;
  userLocation: { lat: number; lng: number } | null;
  onSearchArea?: (bounds: { lat: number; lng: number; radiusKm: number }) => void;
}) {
  const t = useTranslations("explorer");
  const map = useMap();
  const trafficRef = useRef<google.maps.TrafficLayer | null>(null);
  const [traffic, setTraffic] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [moved, setMoved] = useState(false);

  // traffic layer toggle
  useEffect(() => {
    if (!map) return;
    if (traffic) {
      trafficRef.current ??= new google.maps.TrafficLayer();
      trafficRef.current.setMap(map);
    } else {
      trafficRef.current?.setMap(null);
    }
  }, [map, traffic]);

  // show "search this area" after the user pans/zooms away
  useEffect(() => {
    if (!map || !onSearchArea) return;
    const listener = map.addListener("dragend", () => setMoved(true));
    const zoomListener = map.addListener("zoom_changed", () => setMoved(true));
    return () => {
      listener.remove();
      zoomListener.remove();
    };
  }, [map, onSearchArea]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const searchThisArea = useCallback(() => {
    if (!map || !onSearchArea) return;
    const center = map.getCenter();
    const bounds = map.getBounds();
    if (!center || !bounds) return;
    const ne = bounds.getNorthEast();
    // approximate visible radius: center → NE corner distance, capped
    const radiusKm = Math.min(
      50,
      google.maps.geometry?.spherical
        ? google.maps.geometry.spherical.computeDistanceBetween(center, ne) / 1000
        : 8,
    );
    onSearchArea({ lat: center.lat(), lng: center.lng(), radiusKm });
    setMoved(false);
  }, [map, onSearchArea]);

  function toggleFullscreen() {
    const container = map?.getDiv().closest(".relative") ?? map?.getDiv();
    if (!document.fullscreenElement) container?.requestFullscreen?.();
    else document.exitFullscreen();
  }

  return (
    <>
      {/* search this area */}
      {moved && onSearchArea && (
        <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2">
          <Button
            size="sm"
            onClick={searchThisArea}
            className="rounded-full bg-card font-semibold text-foreground shadow-lifted hover:bg-secondary"
          >
            <Search className="size-3.5" />
            {t("searchThisArea")}
          </Button>
        </div>
      )}

      {/* control stack */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onMapTypeChange(mapTypeId === "roadmap" ? "hybrid" : "roadmap")}
          aria-pressed={mapTypeId !== "roadmap"}
          className="h-8 justify-start rounded-full border bg-card/95 px-3 text-xs font-semibold shadow-soft backdrop-blur-sm"
        >
          <Layers className="size-3.5" />
          {mapTypeId === "roadmap" ? t("mapSatellite") : t("mapMap")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setTraffic((v) => !v)}
          aria-pressed={traffic}
          className={`h-8 justify-start rounded-full border px-3 text-xs font-semibold shadow-soft backdrop-blur-sm ${
            traffic ? "bg-brand-soft text-brand" : "bg-card/95"
          }`}
        >
          <Car className="size-3.5" />
          {t("mapTraffic")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (map && userLocation) {
              map.panTo(userLocation);
              map.setZoom(14);
            }
          }}
          disabled={!userLocation}
          className="h-8 justify-start rounded-full border bg-card/95 px-3 text-xs font-semibold shadow-soft backdrop-blur-sm"
        >
          <LocateFixed className="size-3.5" />
          {t("mapMyLocation")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={toggleFullscreen}
          aria-pressed={fullscreen}
          className="h-8 justify-start rounded-full border bg-card/95 px-3 text-xs font-semibold shadow-soft backdrop-blur-sm"
        >
          {fullscreen ? <Shrink className="size-3.5" /> : <Expand className="size-3.5" />}
          {fullscreen ? t("mapExitFullscreen") : t("mapFullscreen")}
        </Button>
      </div>
    </>
  );
}

function ClusteredMarkers({
  items,
  selectedId,
  highlightedId,
  onSelect,
}: Pick<MapCanvasProps, "items" | "selectedId" | "highlightedId" | "onSelect">) {
  const map = useMap();
  const [markers, setMarkers] = useState<Record<string, Marker>>({});
  const clusterer = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map || clusterer.current) return;
    clusterer.current = new MarkerClusterer({
      map,
      renderer: {
        render: ({ count, position }) => {
          const el = document.createElement("div");
          el.className =
            "flex size-11 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-lg ring-4 ring-brand/25";
          el.textContent = String(count);
          return new google.maps.marker.AdvancedMarkerElement({
            position,
            content: el,
            zIndex: 20,
          });
        },
      },
    });
  }, [map]);

  useEffect(() => {
    clusterer.current?.clearMarkers();
    clusterer.current?.addMarkers(Object.values(markers));
  }, [markers]);

  // pan to selection
  useEffect(() => {
    if (!map || !selectedId) return;
    const item = items.find((i) => i.id === selectedId);
    if (item) map.panTo({ lat: item.latitude, lng: item.longitude });
  }, [map, selectedId, items]);

  const setMarkerRef = useCallback((marker: Marker | null, id: string) => {
    setMarkers((prev) => {
      if ((marker && prev[id]) || (!marker && !prev[id])) return prev;
      const next = { ...prev };
      if (marker) next[id] = marker;
      else delete next[id];
      return next;
    });
  }, []);

  return (
    <>
      {items.map((item) => (
        <AdvancedMarker
          key={item.id}
          position={{ lat: item.latitude, lng: item.longitude }}
          ref={(marker) => setMarkerRef(marker, item.id)}
          zIndex={item.id === selectedId ? 25 : undefined}
          onClick={() => onSelect(item.id)}
          title={item.name}
        >
          <MarkerPin
            icon={item.category.icon}
            tone={item.category.tone}
            selected={item.id === selectedId}
            highlighted={item.id === highlightedId}
          />
        </AdvancedMarker>
      ))}
    </>
  );
}
