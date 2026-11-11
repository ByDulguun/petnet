"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LOCALE_LABEL: Record<Locale, string> = {
  mn: "Монгол",
  en: "English",
};

const LOCALE_SHORT: Record<Locale, string> = {
  mn: "МН",
  en: "EN",
};

export function LanguageSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchTo(next: Locale) {
    if (next === locale) return;
    const query = searchParams.toString();
    // next-intl's router swaps the locale prefix and refreshes the cookie
    router.replace(query ? `${pathname}?${query}` : pathname, { locale: next });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("language")}
          className="gap-1.5 rounded-full px-2.5 font-semibold text-muted-foreground"
        >
          <Languages className="size-4.5" aria-hidden="true" />
          <span className="text-[13px]">{LOCALE_SHORT[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() => switchTo(l)}
            className={cn(
              "justify-between font-medium",
              l === locale && "bg-brand-soft text-brand",
            )}
          >
            {LOCALE_LABEL[l]}
            <span className="text-xs text-muted-foreground">{LOCALE_SHORT[l]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
