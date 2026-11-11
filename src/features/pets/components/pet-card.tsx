import { CalendarDays, PawPrint } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export interface PetCardData {
  id: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  avatarUrl?: string | null;
  birthday?: Date | null;
  breed?: { name: string } | null;
}

const SPECIES_KEY = {
  DOG: "speciesDog",
  CAT: "speciesCat",
  OTHER: "speciesOther",
} as const;

export async function PetCard({ pet }: { pet: PetCardData }) {
  const t = await getTranslations("pets");
  const subtitle = pet.breed?.name ?? t(SPECIES_KEY[pet.species]);

  return (
    <Link
      href={`/pets/${pet.id}`}
      className="flex items-center gap-4 rounded-3xl border bg-card p-4 transition-colors hover:border-brand/30 hover:bg-brand-soft/30"
    >
      <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft">
        {pet.avatarUrl ? (
          <Image src={pet.avatarUrl} alt={pet.name} fill sizes="4rem" className="object-cover" />
        ) : (
          <PawPrint className="size-7 text-brand" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate font-bold">{pet.name}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {pet.birthday && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {t("bornOn", { date: pet.birthday.toLocaleDateString() })}
          </p>
        )}
      </div>
    </Link>
  );
}
