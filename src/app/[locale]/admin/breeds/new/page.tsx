import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BreedForm } from "@/features/breeds/components/breed-form";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminBreeds" });
  return { title: t("newTitle") };
}

export default async function NewBreedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin("/admin/breeds/new");
  const t = await getTranslations("adminBreeds");

  return (
    <div className="container-page max-w-lg py-10 lg:py-14">
      <Link
        href="/admin/breeds"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToList")}
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("newTitle")}</h1>
      <BreedForm />
    </div>
  );
}
