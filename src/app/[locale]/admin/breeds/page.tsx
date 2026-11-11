import type { Metadata } from "next";
import { PawPrint, Plus } from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";
import { getAllBreedsForAdmin } from "@/server/services/breed-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminBreeds" });
  return { title: t("title") };
}

export default async function AdminBreedsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin("/admin/breeds");
  const t = await getTranslations("adminBreeds");
  const breeds = await getAllBreedsForAdmin();

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <AdminNav active="breeds" />
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
        <Button className="rounded-full font-semibold" asChild>
          <Link href="/admin/breeds/new">
            <Plus className="size-4" />
            {t("addBreed")}
          </Link>
        </Button>
      </div>

      {breeds.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          action={
            <Button className="rounded-full font-semibold" asChild>
              <Link href="/admin/breeds/new">
                <Plus className="size-4" />
                {t("addBreed")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {breeds.map((breed) => (
            <div key={breed.id} className="flex items-center gap-4 rounded-2xl border bg-card p-3.5">
              <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                {breed.coverImage ? (
                  <Image src={breed.coverImage} alt="" fill sizes="3rem" className="object-cover" />
                ) : (
                  <PawPrint className="size-5 text-muted-foreground" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{breed.name}</p>
                <p className="text-xs text-muted-foreground">{breed.species}</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full font-semibold" asChild>
                <Link href={`/admin/breeds/${breed.id}/edit`}>{t("editButton")}</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
