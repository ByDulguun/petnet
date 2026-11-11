import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EventForm } from "@/features/events/components/event-form";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/session";
import { getOwnedBusiness } from "@/server/services/business-claim-service";

// Protected, form-only page — never prerender or cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  return { title: t("newEventTitle") };
}

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser("/events/new");
  const t = await getTranslations("events");
  const business = await getOwnedBusiness(user.id);

  return (
    <div className="container-page max-w-lg py-10 lg:py-14">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToList")}
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("newEventTitle")}
      </h1>
      <EventForm ownedBusinessName={business?.name} />
    </div>
  );
}
