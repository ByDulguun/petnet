"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  Copy,
  Heart,
  Navigation,
  Phone,
  Share2,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CategoryIcon, toneClasses } from "@/components/shared/category-icon";
import { BusinessCoverImage } from "@/components/shared/business-cover-image";
import { OpenStatusText } from "@/components/shared/open-status";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { googleMapsDirectionsUrl } from "@/lib/geo";
import type { BusinessListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

import { useFavorites } from "../hooks";

/**
 * Info window shown over the map when a marker is selected — photo,
 * rating, open status and quick actions (Google Maps-style).
 */
export function MapPreviewCard({
  business,
  phone,
  onClose,
}: {
  business: BusinessListItem;
  phone?: string;
  onClose: () => void;
}) {
  const t = useTranslations("explorer");
  const tCategories = useTranslations("categories");
  const tDistricts = useTranslations("districts");
  const locale = useLocale();
  const { isFavorite, toggle } = useFavorites();
  const [copied, setCopied] = useState(false);

  const saved = isFavorite(business.slug);
  const categoryName = tCategories.has(business.category.slug)
    ? tCategories(business.category.slug)
    : business.category.name;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(
        `${business.name}, ${business.address}, ${business.district}`,
      );
      setCopied(true);
      toast.success(t("previewCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  async function share() {
    const url = `${window.location.origin}/${locale}/business/${business.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${business.name} · PetNet`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(t("previewCopied"));
    } catch {
      // user dismissed the share sheet
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto w-[21rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border bg-card shadow-lifted"
      role="dialog"
      aria-label={business.name}
    >
      <div className="relative aspect-[16/8] overflow-hidden">
        <BusinessCoverImage
          coverUrl={business.coverUrl}
          name={business.name}
          category={business.category}
          sizes="21rem"
        />
        <span
          className={cn(
            "absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm",
            toneClasses(business.category.tone),
          )}
        >
          <CategoryIcon icon={business.category.icon} className="size-3" />
          {categoryName}
        </span>
        <Button
          variant="secondary"
          size="icon"
          aria-label={t("previewClose")}
          onClick={onClose}
          className="absolute top-2 right-2 size-7 rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="p-4">
        <Link
          href={`/business/${business.slug}`}
          className="flex items-center gap-1.5 font-bold hover:text-brand"
        >
          <span className="truncate">{business.name}</span>
          {business.isVerified && (
            <BadgeCheck className="size-4 shrink-0 text-brand-blue" aria-hidden="true" />
          )}
        </Link>
        <div className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
          <span className="font-semibold text-foreground">{business.ratingAvg.toFixed(1)}</span>
          <span>({business.ratingCount})</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">
            {tDistricts.has(business.district)
              ? tDistricts(business.district)
              : business.district}
          </span>
        </div>
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            business.openStatus.isOpen ? "text-success" : "text-muted-foreground",
          )}
        >
          <OpenStatusText status={business.openStatus} />
        </p>

        <div className="mt-3 flex items-center gap-1.5">
          <Button size="sm" className="h-8 flex-1 rounded-full text-xs font-semibold" asChild>
            <Link href={`/business/${business.slug}`}>{t("previewViewProfile")}</Link>
          </Button>
          {phone && (
            <Button
              size="icon"
              variant="outline"
              className="size-8 rounded-full"
              aria-label={t("previewCall")}
              asChild
            >
              <a href={`tel:${phone.replace(/\s/g, "")}`}>
                <Phone className="size-3.5" />
              </a>
            </Button>
          )}
          <Button
            size="icon"
            variant="outline"
            className="size-8 rounded-full"
            aria-label={t("previewDirections")}
            asChild
          >
            <a
              href={googleMapsDirectionsUrl({
                lat: business.latitude,
                lng: business.longitude,
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="size-3.5" />
            </a>
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-8 rounded-full"
            aria-label={t("previewCopyAddress")}
            onClick={copyAddress}
          >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-8 rounded-full"
            aria-label={t("previewShare")}
            onClick={share}
          >
            <Share2 className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className={cn("size-8 rounded-full", saved && "border-danger/40 text-danger")}
            aria-label={t("previewSave")}
            aria-pressed={saved}
            onClick={() => toggle(business.slug)}
          >
            <Heart className={cn("size-3.5", saved && "fill-danger")} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
