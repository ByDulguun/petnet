import type { Metadata } from "next";
import { ChevronLeft, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/session";
import { getAttendeesForEvent, getEventForOwner } from "@/server/services/event-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  return { title: t("attendeesTitle") };
}

export default async function EventAttendeesPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(`/events/${id}/attendees`);
  const t = await getTranslations("events");

  const event = await getEventForOwner(id, user.id);
  if (!event) notFound();
  const attendees = await getAttendeesForEvent(id, user.id);
  if (!attendees) notFound();

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToEvent")}
      </Link>
      <h1 className="mt-4 mb-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("attendeesTitle")}
      </h1>
      <p className="mb-6 text-muted-foreground">{event.title}</p>

      {attendees.length === 0 ? (
        <EmptyState icon={Users} title={t("noAttendeesTitle")} description={t("noAttendeesDesc")} />
      ) : (
        <div className="space-y-2">
          {attendees.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-2xl border bg-card p-4">
              <div className="min-w-0">
                <p className="font-bold">{a.user.name ?? a.user.email}</p>
                <p className="text-sm text-muted-foreground">{a.user.email}</p>
              </div>
              {a.user.phone && <p className="text-sm text-muted-foreground">{a.user.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
