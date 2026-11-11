import type { Metadata } from "next";
import { PawPrint, Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { PetCard } from "@/features/pets/components/pet-card";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/session";
import { getPetsForUser } from "@/server/services/pet-service";

// Every visitor's pet list is different — never prerender or cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pets" });
  return { title: t("title") };
}

export default async function PetsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser("/pets");
  const t = await getTranslations("pets");
  const pets = await getPetsForUser(user.id);

  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
        {pets.length > 0 && (
          <Button className="rounded-full font-semibold" asChild>
            <Link href="/pets/new">
              <Plus className="size-4" />
              {t("addPet")}
            </Link>
          </Button>
        )}
      </div>

      {pets.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          action={
            <Button className="rounded-full font-semibold" asChild>
              <Link href="/pets/new">
                <Plus className="size-4" />
                {t("emptyCta")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
}
