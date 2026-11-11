import type { Metadata } from "next";
import { CalendarClock, MapPin } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingRow } from "@/features/bookings/components/booking-row";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/session";
import { getBookingsForUser } from "@/server/services/booking-service";

// Every visitor's booking list is different — never prerender or cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bookings" });
  return { title: t("title") };
}

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser("/bookings");
  const t = await getTranslations("bookings");
  const { upcoming, past, cancelled } = await getBookingsForUser(user.id);

  const totalCount = upcoming.length + past.length + cancelled.length;

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <h1 className="mb-8 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>

      {totalCount === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          action={
            <Button className="rounded-full font-semibold" asChild>
              <Link href="/map">
                <MapPin className="size-4" />
                {t("emptyCta")}
              </Link>
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              {t("tabUpcoming")} ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              {t("tabPast")} ({past.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              {t("tabCancelled")} ({cancelled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title={t("emptyTitle")}
                description={t("emptyDesc")}
                action={
                  <Button className="rounded-full font-semibold" asChild>
                    <Link href="/map">
                      <MapPin className="size-4" />
                      {t("emptyCta")}
                    </Link>
                  </Button>
                }
              />
            ) : (
              upcoming.map((b) => (
                <BookingRow
                  key={b.id}
                  cancellable
                  booking={{
                    id: b.id,
                    status: b.status,
                    startsAt: b.startsAt.toISOString(),
                    business: b.business,
                    service: b.service,
                    pet: b.pet,
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-3">
            {past.length === 0 ? (
              <EmptyState icon={CalendarClock} title={t("emptyPastTitle")} />
            ) : (
              past.map((b) => (
                <BookingRow
                  key={b.id}
                  cancellable={false}
                  booking={{
                    id: b.id,
                    status: b.status,
                    startsAt: b.startsAt.toISOString(),
                    business: b.business,
                    service: b.service,
                    pet: b.pet,
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4 space-y-3">
            {cancelled.length === 0 ? (
              <EmptyState icon={CalendarClock} title={t("emptyCancelledTitle")} />
            ) : (
              cancelled.map((b) => (
                <BookingRow
                  key={b.id}
                  cancellable={false}
                  booking={{
                    id: b.id,
                    status: b.status,
                    startsAt: b.startsAt.toISOString(),
                    business: b.business,
                    service: b.service,
                    pet: b.pet,
                  }}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
