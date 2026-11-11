import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/shared/section-heading";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { Link } from "@/i18n/navigation";
import type { EventSummary } from "@/lib/types";

export async function UpcomingEvents({ events }: { events: EventSummary[] }) {
  const t = await getTranslations("home.events");
  const locale = await getLocale();
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
  const dayFormatter = new Intl.DateTimeFormat(locale, { day: "numeric" });

  return (
    <section className="container-page py-16 lg:py-20" aria-labelledby="events">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        href="/events"
        hrefLabel={t("cta")}
      />

      <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {events.map((event) => {
          const date = new Date(event.startsAt);
          return (
            <StaggerItem key={event.id}>
              <Link
                href={`/events/${event.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={event.coverImage}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 26rem, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* date chip */}
                  <div className="absolute top-3 left-3 flex flex-col items-center rounded-xl bg-white/95 px-3 py-1.5 text-center shadow-soft backdrop-blur-sm">
                    <span className="text-[11px] font-bold tracking-wide text-danger uppercase">
                      {monthFormatter.format(date)}
                    </span>
                    <span className="text-lg leading-none font-extrabold text-slate-900">
                      {dayFormatter.format(date)}
                    </span>
                  </div>
                  {event.isFree && (
                    <Badge className="absolute top-3 right-3 rounded-full border-0 bg-success font-semibold text-white">
                      {t("free")}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <Badge variant="secondary" className="w-fit rounded-full font-medium">
                    {t(`types.${event.type}`)}
                  </Badge>
                  <h3 className="mt-3 text-lg leading-snug font-bold text-balance transition-colors group-hover:text-brand">
                    {event.title}
                  </h3>
                  <div className="mt-auto flex items-center gap-4 pt-4 text-[13px] text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MapPin className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{event.venue}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      <Users className="size-4" aria-hidden="true" />
                      {t("going", { count: event.attendeeCount })}
                    </span>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
