"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type {
  BusinessSearchResult,
  SearchSuggestion,
} from "@/lib/types";

// ── search state ─────────────────────────────────────────────────────────────

export interface ExplorerFilters {
  q: string;
  category?: string;
  district?: string;
  openNow: boolean;
  open24h: boolean;
  minRating?: number;
  amenities: string[];
  priceLevels: number[];
  verifiedOnly: boolean;
  sort: "relevance" | "rating" | "reviews" | "distance" | "name";
}

export const DEFAULT_FILTERS: ExplorerFilters = {
  q: "",
  openNow: false,
  open24h: false,
  amenities: [],
  priceLevels: [],
  verifiedOnly: false,
  sort: "relevance",
};

export function countActiveFilters(f: ExplorerFilters): number {
  let n = 0;
  if (f.openNow) n++;
  if (f.open24h) n++;
  if (f.minRating) n++;
  if (f.verifiedOnly) n++;
  n += f.amenities.length + f.priceLevels.length;
  return n;
}

function buildSearchParams(
  filters: ExplorerFilters,
  location: { lat: number; lng: number; radiusKm?: number } | null,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.district) params.set("district", filters.district);
  if (filters.openNow) params.set("openNow", "true");
  if (filters.open24h) params.set("open24h", "true");
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.amenities.length) params.set("amenities", filters.amenities.join(","));
  if (filters.priceLevels.length) params.set("priceLevels", filters.priceLevels.join(","));
  if (filters.verifiedOnly) params.set("verifiedOnly", "true");
  if (filters.sort !== "relevance") params.set("sort", filters.sort);
  if (location) {
    params.set("lat", location.lat.toFixed(5));
    params.set("lng", location.lng.toFixed(5));
    if (location.radiusKm) params.set("radiusKm", location.radiusKm.toFixed(1));
  }
  return params;
}

export function useBusinessSearch(
  filters: ExplorerFilters,
  location: { lat: number; lng: number; radiusKm?: number } | null,
) {
  const params = buildSearchParams(filters, location);
  const queryString = params.toString();

  return useQuery<BusinessSearchResult>({
    queryKey: ["businesses", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/businesses?${queryString}`);
      if (!res.ok) throw new Error("Failed to load businesses");
      return res.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ── autocomplete ─────────────────────────────────────────────────────────────

export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function useAutocomplete(query: string) {
  const debounced = useDebouncedValue(query.trim(), 180);

  return useQuery<SearchSuggestion[]>({
    queryKey: ["autocomplete", debounced],
    queryFn: async () => {
      const res = await fetch(
        `/api/businesses/autocomplete?q=${encodeURIComponent(debounced)}`,
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { suggestions: SearchSuggestion[] };
      return data.suggestions;
    },
    enabled: debounced.length >= 2,
    staleTime: 5 * 60_000,
  });
}

// ── favorites (localStorage until auth ships in Module 2) ───────────────────

const FAVORITES_KEY = "petnet:favorites";

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  // start empty on both server and client render, hydrate in effect
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(readFavorites());
    const onStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY) setFavorites(readFavorites());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // storage full / private mode — favorites stay in-memory
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  return { favorites, toggle, isFavorite };
}

// ── recent searches (localStorage) ──────────────────────────────────────────

const RECENT_KEY = "petnet:recent-searches";
const RECENT_MAX = 6;

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const remember = useCallback((query: string) => {
    const q = query.trim();
    if (q.length < 2) return;
    setRecent((prev) => {
      const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(
        0,
        RECENT_MAX,
      );
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // private mode — keep in memory only
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { recent, remember, clear };
}

// ── voice search (Web Speech API where available) ───────────────────────────

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  abort: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceSearch(locale: string, onResult: (transcript: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
    return () => recognitionRef.current?.abort();
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor || listening) return;
    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.lang = locale === "mn" ? "mn-MN" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    setListening(true);
    recognition.start();
  }, [listening, locale, onResult]);

  return { supported, listening, start };
}

// ── geolocation ──────────────────────────────────────────────────────────────

export type GeoStatus = "idle" | "locating" | "granted" | "denied" | "unavailable";

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }, []);

  return { status, coords, request };
}
