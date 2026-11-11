import type { Metadata } from "next";
import { format } from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  Clock3,
  ListChecks,
  MapPin,
  Pencil,
  Ticket,
  Users,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EVENT_TYPE_ICON } from "@/features/events/event-type-icon";
import { RsvpButton } from "@/features/events/components/rsvp-button";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { formatMnt } from "@/lib/utils";
import { getEventById } from "@/server/services/event-service";

// Attendee count/RSVP state changes any time — never prerender or cache.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const event = await getEventById(id);
  if (!event) {
    const t = await getTranslations({ locale, namespace: "events" });
    return { title: t("title") };
  }
  return { title: event.title };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("events");

  const [event, session] = await Promise.all([getEventById(id), auth()]);
  if (!event) notFound();

  const isHost = session?.user?.id === event.hostId;
  const Icon = EVENT_TYPE_ICON[event.type] ?? CalendarDays;
  const isFull = event.capacity != null && event._count.attendees >= event.capacity;

  return (
    <div className="container-page max-w-3xl py-8 lg:py-12">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToList")}
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl bg-secondary">
        {event.coverImage ? (
          <div className="relative aspect-[16/9]">
            <Image src={event.coverImage} alt="" fill priority sizes="(min-width: 1024px) 48rem, 100vw" className="object-cover" />
          </div>
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center">
            <Icon className="size-14 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
      </div>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Badge className="rounded-full border-0 bg-brand-soft font-semibold text-brand">
            <Icon className="size-3.5" aria-hidden="true" />
            {t(`type_${event.type}` as const)}
          </Badge>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
            {event.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("hostedBy", { name: event.business?.name ?? event.host.name ?? t("someone") })}
          </p>
        </div>

        {isHost && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-full font-semibold" asChild>
              <Link href={`/events/${event.id}/attendees`}>
                <ListChecks className="size-4" />
                {t("viewAttendees", { count: event._count.attendees })}
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full font-semibold" asChild>
              <Link href={`/events/${event.id}/edit`}>
                <Pencil className="size-4" />
                {t("editButton")}
              </Link>
            </Button>
          </div>
        )}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="text-lg font-bold">{t("aboutHeading")}</h2>
            <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">
              {event.description}
            </p>
          </section>

          <section className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>{format(event.startsAt, "EEEE, MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>
                {format(event.startsAt, "HH:mm")}
                {event.endsAt && ` – ${format(event.endsAt, "HH:mm")}`}
              </span>
            </div>
            {(event.venue || event.address) && (
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
                <span>{[event.venue, event.address].filter(Boolean).join(", ")}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>
                {event.capacity != null
                  ? t("attendeeCountOfCapacity", { count: event._count.attendees, capacity: event.capacity })
                  : t("attendeeCount", { count: event._count.attendees })}
              </span>
            </div>
          </section>
        </div>

        <aside className="space-y-3">
          {event.priceMnt != null && (
            <div className="rounded-2xl border bg-card p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Ticket className="size-3.5" aria-hidden="true" />
                {t("priceLabel")}
              </p>
              <p className="mt-1 text-xl font-extrabold">
                {event.priceMnt === 0 ? t("free") : formatMnt(event.priceMnt)}
              </p>
            </div>
          )}

          {!isHost && (
            <RsvpButton
              eventId={event.id}
              initialAttending={event.isAttending}
              isFull={isFull}
              isLoggedIn={Boolean(session?.user)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
