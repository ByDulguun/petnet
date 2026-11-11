import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EventForm } from "@/features/events/components/event-form";
import { Link } from "@/i18n/navigation";
import { dateToUbLocalInput } from "@/lib/hours";
import { requireUser } from "@/lib/session";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { getEventForOwner } from "@/server/services/event-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  return { title: t("editEventTitle") };
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(`/events/${id}/edit`);
  const t = await getTranslations("events");

  const [event, business] = await Promise.all([
    getEventForOwner(id, user.id),
    getOwnedBusiness(user.id),
  ]);
  if (!event) notFound();

  return (
    <div className="container-page max-w-lg py-10 lg:py-14">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToEvent")}
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("editEventTitle")}
      </h1>
      <EventForm
        ownedBusinessName={business?.name}
        initial={{
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          startsAt: dateToUbLocalInput(event.startsAt),
          endsAt: event.endsAt ? dateToUbLocalInput(event.endsAt) : "",
          venue: event.venue ?? "",
          address: event.address ?? "",
          capacity: event.capacity != null ? String(event.capacity) : "",
          priceMnt: event.priceMnt != null ? String(event.priceMnt) : "",
          asBusiness: Boolean(event.business),
          coverImage: event.coverImage,
        }}
      />
    </div>
  );
}
