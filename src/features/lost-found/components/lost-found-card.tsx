import { format } from "date-fns";
import { MapPin, PawPrint } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { cn, formatMnt } from "@/lib/utils";

export interface LostFoundCardData {
  id: string;
  type: "LOST" | "FOUND";
  petName: string | null;
  species: "DOG" | "CAT" | "OTHER";
  breedName: string | null;
  district: string | null;
  lastSeenAt: Date;
  rewardMnt: number | null;
  images: { url: string }[];
}

const SPECIES_KEY = { DOG: "speciesDog", CAT: "speciesCat", OTHER: "speciesOther" } as const;

export async function LostFoundCard({ report }: { report: LostFoundCardData }) {
  const t = await getTranslations("lostFound");
  const tDistricts = await getTranslations("districts");
  const cover = report.images[0]?.url;
  const districtName =
    report.district && tDistricts.has(report.district) ? tDistricts(report.district) : report.district;

  return (
    <Link
      href={`/lost-found/${report.id}`}
      className="group block overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {cover ? (
          <Image
            src={cover}
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
        <Badge
          className={cn(
            "absolute top-3 left-3 rounded-full border-0 font-bold text-white",
            report.type === "LOST" ? "bg-danger" : "bg-success",
          )}
        >
          {t(report.type === "LOST" ? "typeLost" : "typeFound")}
        </Badge>
        {report.rewardMnt ? (
          <Badge
            variant="secondary"
            className="absolute top-3 right-3 rounded-full border-0 bg-black/55 font-semibold text-white backdrop-blur-sm"
          >
            {t("reward", { amount: formatMnt(report.rewardMnt) })}
          </Badge>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="truncate font-bold">{report.petName || t(SPECIES_KEY[report.species])}</h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {report.breedName || t(SPECIES_KEY[report.species])}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{districtName ?? t("locationUnknown")}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{format(report.lastSeenAt, "MMM d")}</span>
        </div>
      </div>
    </Link>
  );
}
