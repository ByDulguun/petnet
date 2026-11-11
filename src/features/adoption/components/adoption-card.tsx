import { Heart, MapPin, PawPrint } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { cn, formatMnt } from "@/lib/utils";

export interface AdoptionCardData {
  id: string;
  status: "AVAILABLE" | "PENDING" | "ADOPTED";
  feeMnt: number | null;
  pet: {
    name: string;
    species: "DOG" | "CAT" | "OTHER";
    gender: "MALE" | "FEMALE" | "UNKNOWN";
    avatarUrl: string | null;
    breed: { name: string } | null;
  };
  business: { name: string; district: string | null };
}

const SPECIES_KEY = { DOG: "speciesDog", CAT: "speciesCat", OTHER: "speciesOther" } as const;

export async function AdoptionCard({ listing }: { listing: AdoptionCardData }) {
  const t = await getTranslations("adoption");
  const tDistricts = await getTranslations("districts");
  const districtName =
    listing.business.district && tDistricts.has(listing.business.district)
      ? tDistricts(listing.business.district)
      : listing.business.district;

  return (
    <Link
      href={`/adoption/${listing.id}`}
      className="group block overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {listing.pet.avatarUrl ? (
          <Image
            src={listing.pet.avatarUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 20rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <PawPrint className="size-10 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
        {listing.status === "PENDING" && (
          <Badge className="absolute top-3 left-3 rounded-full border-0 bg-warning font-bold text-white">
            {t("statusPending")}
          </Badge>
        )}
        {listing.feeMnt != null && (
          <Badge
            variant="secondary"
            className="absolute top-3 right-3 rounded-full border-0 bg-black/55 font-semibold text-white backdrop-blur-sm"
          >
            {listing.feeMnt === 0 ? t("feeFree") : formatMnt(listing.feeMnt)}
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className={cn("flex items-center gap-1.5 truncate font-bold")}>
          {listing.pet.name}
          <Heart className="size-3.5 shrink-0 text-danger/60" aria-hidden="true" />
        </h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {listing.pet.breed?.name ?? t(SPECIES_KEY[listing.pet.species])}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {districtName ? `${listing.business.name} · ${districtName}` : listing.business.name}
          </span>
        </div>
      </div>
    </Link>
  );
}
