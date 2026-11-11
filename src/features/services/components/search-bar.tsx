"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Clock3,
  Flame,
  Loader2,
  MapPin,
  Mic,
  Search,
  Tag,
  X,
} from "lucide-react";

import { CategoryIcon } from "@/components/shared/category-icon";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { SearchSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

import { useAutocomplete, useRecentSearches, useVoiceSearch } from "../hooks";

/** Curated "popular right now" shortcuts shown before the user types. */
const POPULAR: { type: "category" | "tag"; value: string }[] = [
  { type: "category", value: "veterinary-clinic" },
  { type: "category", value: "grooming-salon" },
  { type: "tag", value: "vaccination" },
  { type: "category", value: "dog-park" },
  { type: "tag", value: "puppy training" },
];

export function SearchBar({
  value,
  onSearch,
  onPickCategory,
  onPickDistrict,
  autoFocus,
}: {
  value: string;
  onSearch: (q: string) => void;
  onPickCategory: (slug: string) => void;
  onPickDistrict: (district: string) => void;
  autoFocus?: boolean;
}) {
  const t = useTranslations("explorer");
  const tCategories = useTranslations("categories");
  const tDistricts = useTranslations("districts");
  const locale = useLocale();
  const router = useRouter();

  const [input, setInput] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { recent, remember, clear } = useRecentSearches();
  const { data: suggestions = [], isFetching } = useAutocomplete(open ? input : "");
  const voice = useVoiceSearch(locale, (transcript) => {
    setInput(transcript);
    remember(transcript);
    onSearch(transcript);
  });

  const showIdlePanel = open && input.trim().length < 2;

  useEffect(() => setInput(value), [value]);
  useEffect(() => setActiveIndex(-1), [suggestions.length, input]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function suggestionLabel(s: SearchSuggestion): string {
    if (s.type === "category" && tCategories.has(s.value)) return tCategories(s.value);
    if (s.type === "district" && tDistricts.has(s.value)) return tDistricts(s.value);
    return s.label;
  }

  function apply(suggestion: SearchSuggestion) {
    setOpen(false);
    switch (suggestion.type) {
      case "business":
        router.push(`/business/${suggestion.value}`);
        break;
      case "category":
        setInput("");
        onPickCategory(suggestion.value);
        break;
      case "district":
        setInput("");
        onPickDistrict(suggestion.value);
        break;
      case "tag":
        setInput(suggestion.value);
        remember(suggestion.value);
        onSearch(suggestion.value);
        break;
    }
  }

  function submit() {
    setOpen(false);
    const q = input.trim();
    remember(q);
    onSearch(q);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) apply(suggestions[activeIndex]);
      else submit();
      return;
    }
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  }

  const listboxId = "explorer-search-suggestions";

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-full border bg-card p-1.5 pl-4 shadow-soft transition-shadow focus-within:shadow-lifted">
        {isFetching ? (
          <Loader2 className="size-4.5 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
        ) : (
          <Search className="size-4.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          aria-label={t("searchAria")}
          autoFocus={autoFocus}
          value={input}
          placeholder={voice.listening ? t("voiceListening") : t("searchPlaceholder")}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-9 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:hidden"
        />
        {voice.supported && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("voiceSearch")}
            aria-pressed={voice.listening}
            className={cn(
              "size-8 shrink-0 rounded-full",
              voice.listening && "bg-danger-soft text-danger",
            )}
            onClick={voice.start}
          >
            <Mic className={cn("size-4", voice.listening && "animate-pulse")} />
          </Button>
        )}
        {input && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("clearSearch")}
            className="size-8 shrink-0 rounded-full"
            onClick={() => {
              setInput("");
              onSearch("");
              inputRef.current?.focus();
            }}
          >
            <X className="size-4" />
          </Button>
        )}
        <Button size="sm" className="h-9 shrink-0 rounded-full px-4 font-semibold" onClick={submit}>
          {t("searchButton")}
        </Button>
      </div>

      {/* idle panel: recent + popular */}
      {showIdlePanel && (recent.length > 0 || POPULAR.length > 0) && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border bg-popover py-3 shadow-lifted">
          {recent.length > 0 && (
            <div className="px-4 pb-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {t("recentSearches")}
                </p>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  {t("clearRecent")}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setInput(q);
                      onSearch(q);
                      setOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-brand/30 hover:text-foreground"
                  >
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className={cn("px-4", recent.length > 0 && "border-t pt-3")}>
            <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {t("popularSearches")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR.map((item) => (
                <button
                  key={`${item.type}-${item.value}`}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (item.type === "category") onPickCategory(item.value);
                    else {
                      setInput(item.value);
                      onSearch(item.value);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-brand/30 hover:bg-brand-soft hover:text-brand"
                >
                  <Flame className="size-3.5 text-warning" aria-hidden="true" />
                  {item.type === "category" ? tCategories(item.value) : item.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {open && !showIdlePanel && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t("suggestions")}
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border bg-popover py-1.5 shadow-lifted"
        >
          {suggestions.map((s, index) => (
            <li key={`${s.type}-${s.value}`} role="presentation">
              <button
                type="button"
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => apply(s)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                  index === activeIndex ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  {s.type === "business" && <Search className="size-4" aria-hidden="true" />}
                  {s.type === "category" && <CategoryIcon icon="paw-print" className="size-4" />}
                  {s.type === "district" && <MapPin className="size-4" aria-hidden="true" />}
                  {s.type === "tag" && <Tag className="size-4" aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{suggestionLabel(s)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {s.type === "district"
                      ? t("suggestionDistrict")
                      : s.type === "tag"
                        ? t("suggestionTag")
                        : s.sublabel}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
