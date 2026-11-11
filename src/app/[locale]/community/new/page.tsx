import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PostForm } from "@/features/community/components/post-form";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/session";
import { getPetsForUser } from "@/server/services/pet-service";

// Protected, form-only page — never prerender or cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "community" });
  return { title: t("newPostTitle") };
}

export default async function NewCommunityPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser("/community/new");
  const t = await getTranslations("community");
  const pets = await getPetsForUser(user.id);

  return (
    <div className="container-page max-w-lg py-10 lg:py-14">
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToFeed")}
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("newPostTitle")}
      </h1>
      <PostForm pets={pets.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  );
}
