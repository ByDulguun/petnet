import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BusinessImageUpload } from "@/features/business/components/business-image-upload";
import { BusinessProfileForm } from "@/features/business/components/business-profile-form";
import { prisma } from "@/lib/prisma";
import { requireBusinessOwner } from "@/lib/session";
import { DISTRICTS } from "@/server/data/taxonomy";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessProfile" });
  return { title: t("title") };
}

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusinessOwner("/business/dashboard/profile");
  const t = await getTranslations("businessProfile");
  const categories = await prisma.businessCategory.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="container-page max-w-lg py-10 lg:py-14">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mb-8 space-y-5 rounded-3xl border bg-card p-5">
        <div>
          <p className="mb-2 text-sm font-bold">{t("logoLabel")}</p>
          <BusinessImageUpload
            endpoint="/api/business/logo"
            responseKey="logoUrl"
            initialUrl={business.logoUrl}
            shape="square"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-bold">{t("coverLabel")}</p>
          <BusinessImageUpload
            endpoint="/api/business/cover"
            responseKey="coverUrl"
            initialUrl={business.coverUrl}
            shape="wide"
          />
        </div>
      </div>

      <BusinessProfileForm
        categories={categories}
        districts={DISTRICTS}
        initial={{
          name: business.name,
          categoryId: business.categoryId,
          phone: business.phone ?? "",
          description: business.description ?? "",
          address: business.address ?? "",
          district: business.district ?? "",
          website: business.website ?? "",
          facebook: business.facebook ?? "",
          instagram: business.instagram ?? "",
          tiktok: business.tiktok ?? "",
        }}
      />
    </div>
  );
}
