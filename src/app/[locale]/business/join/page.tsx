import type { Metadata } from "next";
import { AlertCircle, Clock3 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PetNetMark } from "@/components/brand/logo";
import { BusinessJoinForm } from "@/features/business/components/business-join-form";
import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getMyLatestClaim, getOwnedBusiness } from "@/server/services/business-claim-service";
import { DISTRICTS } from "@/server/data/taxonomy";

// Depends on the signed-in user's own claim/ownership state — never
// prerender or cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessJoin" });
  return { title: t("title") };
}

export default async function BusinessJoinPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser("/business/join");
  const t = await getTranslations("businessJoin");

  const owned = await getOwnedBusiness(user.id);
  if (owned) redirect({ href: "/business/dashboard", locale });

  const latestClaim = await getMyLatestClaim(user.id);

  if (latestClaim?.status === "PENDING") {
    return (
      <div className="container-page flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-warning-soft">
          <Clock3 className="size-7 text-warning" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight">{t("pendingTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("pendingDesc", { name: latestClaim.name })}
        </p>
      </div>
    );
  }

  const categories = await prisma.businessCategory.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="container-page max-w-lg py-10 lg:py-14">
      <div className="text-center">
        <PetNetMark className="mx-auto size-12" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {latestClaim?.status === "REJECTED" && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">{t("rejectedTitle")}</p>
            <p className="mt-0.5">{t("rejectedDesc", { name: latestClaim.name })}</p>
            {latestClaim.reviewNote && (
              <p className="mt-0.5">{t("rejectedNote", { note: latestClaim.reviewNote })}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 rounded-3xl border bg-card p-6 shadow-soft">
        <BusinessJoinForm categories={categories} districts={DISTRICTS} />
      </div>
    </div>
  );
}
