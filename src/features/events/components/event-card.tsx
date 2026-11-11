import { format } from "date-fns";
import { CalendarDays, MapPin, Users } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { EVENT_TYPE_ICON } from "@/features/events/event-type-icon";
import { formatMnt } from "@/lib/utils";

export interface EventCardData {
  id: string;
  slug: string;
  title: string;
  type: string;
  startsAt: string;
  venue: string | null;
  address: string | null;
  priceMnt: number | null;
  capacity: number | null;
  coverImage: string | null;
  _count: { attendees: number };
}

export async function EventCard({ event }: { event: EventCardData }) {
  const t = await getTranslations("events");
  const Icon = EVENT_TYPE_ICON[event.type] ?? CalendarDays;
  const full = event.capacity != null && event._count.attendees >= event.capacity;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 20rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Icon className="size-10 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
        <Badge className="absolute top-3 left-3 rounded-full border-0 bg-black/55 font-semibold text-white backdrop-blur-sm">
          <Icon className="size-3.5" aria-hidden="true" />
          {t(`type_${event.type}` as const)}
        </Badge>
        {full && (
          <Badge className="absolute top-3 right-3 rounded-full border-0 bg-danger font-bold text-white">
            {t("full")}
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate font-bold">{event.title}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          {format(new Date(event.startsAt), "EEE, MMM d · HH:mm")}
        </p>
        {(event.venue || event.address) && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{event.venue || event.address}</span>
          </p>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          {t("attendeeCount", { count: event._count.attendees })}
          {event.priceMnt != null && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-foreground">
                {event.priceMnt === 0 ? t("free") : formatMnt(event.priceMnt)}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
