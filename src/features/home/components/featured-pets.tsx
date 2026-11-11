import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/shared/section-heading";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { Link } from "@/i18n/navigation";
import type { FeaturedPet } from "@/lib/types";

const GOOD_WITH_KEY: Record<string, string> = {
  Kids: "goodWithKids",
  Cats: "goodWithCats",
  Dogs: "goodWithDogs",
};

export async function FeaturedPets({ pets }: { pets: FeaturedPet[] }) {
  const t = await getTranslations("home.adoption");

  return (
    <section className="bg-card py-16 lg:py-20" aria-labelledby="adoption">
      <div className="container-page">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
          href="/adoption"
          hrefLabel={t("cta")}
        />

        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {pets.map((pet) => (
            <StaggerItem key={pet.id}>
              <Link
                href={`/adoption/${pet.id}`}
                className="group block overflow-hidden rounded-3xl border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
              >
                <div className="relative aspect-[4/4.4] overflow-hidden">
                  <Image
                    src={pet.imageUrl}
                    alt={t("petAlt", { name: pet.name, breed: pet.breedName })}
                    fill
                    sizes="(min-width: 1024px) 20rem, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/85 text-danger backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                    <Heart className="size-4.5" aria-hidden="true" />
                  </div>
                  <div className="absolute bottom-3 left-4">
                    <p className="text-lg font-extrabold text-white">{pet.name}</p>
                    <p className="text-[13px] font-medium text-white/85">
                      {pet.breedName} · {pet.ageLabel} ·{" "}
                      {pet.gender === "MALE" ? "♂" : "♀"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <p className="truncate text-[13px] text-muted-foreground">
                    {pet.shelterName}
                  </p>
                  <div className="flex shrink-0 gap-1">
                    {pet.goodWith.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="rounded-full text-[11px] font-medium"
                      >
                        {GOOD_WITH_KEY[tag] ? t(GOOD_WITH_KEY[tag]) : tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
