import type { Metadata } from "next";
import { CalendarDays, Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/features/events/components/event-card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getEvents } from "@/server/services/event-service";

// Attendee counts and the upcoming/past split change constantly — never
// prerender or cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  return { title: t("title") };
}

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tab } = await searchParams;
  const t = await getTranslations("events");

  const past = tab === "past";
  const events = await getEvents({ past });
  const serialized = events.map((e) => ({ ...e, startsAt: e.startsAt.toISOString() }));

  const pillClass = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
      active ? "border-brand bg-brand text-white" : "border-border bg-card hover:bg-secondary",
    );

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button className="rounded-full font-semibold" asChild>
          <Link href="/events/new">
            <Plus className="size-4" />
            {t("newEventButton")}
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <Link href="/events" className={pillClass(!past)}>
          {t("tabUpcoming")}
        </Link>
        <Link href="/events?tab=past" className={pillClass(past)}>
          {t("tabPast")}
        </Link>
      </div>

      {serialized.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={past ? t("emptyPastTitle") : t("emptyTitle")}
          description={past ? undefined : t("emptyDesc")}
          action={
            !past ? (
              <Button className="rounded-full font-semibold" asChild>
                <Link href="/events/new">
                  <Plus className="size-4" />
                  {t("newEventButton")}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serialized.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
