import type { Metadata } from "next";
import { format } from "date-fns";
import { CalendarClock, CalendarDays, Clock3, Heart, ListChecks, Settings2, Store } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireBusinessOwner } from "@/lib/session";
import { getBusinessAppointments } from "@/server/services/business-portal-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessDashboard" });
  return { title: t("title") };
}

export default async function BusinessDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusinessOwner("/business/dashboard");
  const t = await getTranslations("businessDashboard");
  const appointments = await getBusinessAppointments(business.id);

  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const active = appointments.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED");
  const today = active.filter((a) => a.startsAt >= now && a.startsAt <= todayEnd);
  const upcoming = active.filter((a) => a.startsAt > todayEnd);
  const pending = active.filter((a) => a.status === "PENDING");

  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{business.name}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button className="rounded-full font-semibold" asChild>
          <Link href="/business/appointments">
            <ListChecks className="size-4" />
            {t("viewAllAppointments")}
          </Link>
        </Button>
        <Button variant="outline" className="rounded-full font-semibold" asChild>
          <Link href="/business/services">
            <Settings2 className="size-4" />
            {t("manageServices")}
          </Link>
        </Button>
        <Button variant="outline" className="rounded-full font-semibold" asChild>
          <Link href="/business/availability">
            <Clock3 className="size-4" />
            {t("manageAvailability")}
          </Link>
        </Button>
        <Button variant="outline" className="rounded-full font-semibold" asChild>
          <Link href="/business/dashboard/profile">
            <Store className="size-4" />
            {t("manageProfile")}
          </Link>
        </Button>
        <Button variant="outline" className="rounded-full font-semibold" asChild>
          <Link href="/business/dashboard/adoption">
            <Heart className="size-4" />
            {t("manageAdoption")}
          </Link>
        </Button>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">{t("todayTitle")}</h2>
        {today.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            {t("emptyToday")}
          </p>
        ) : (
          <div className="space-y-2">
            {today.map((a) => (
              <DashboardRow key={a.id} appointment={a} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">{t("pendingTitle")}</h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            {t("emptyPending")}
          </p>
        ) : (
          <div className="space-y-2">
            {pending.slice(0, 5).map((a) => (
              <DashboardRow key={a.id} appointment={a} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">{t("upcomingTitle")}</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarClock} title={t("emptyUpcoming")} />
        ) : (
          <div className="space-y-2">
            {upcoming.slice(0, 8).map((a) => (
              <DashboardRow key={a.id} appointment={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-warning-soft text-warning",
  CONFIRMED: "bg-success-soft text-success",
};

function DashboardRow({
  appointment,
}: {
  appointment: {
    id: string;
    status: string;
    startsAt: Date;
    user: { name: string | null };
    pet: { name: string } | null;
    service: { name: string } | null;
  };
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">
          {appointment.service?.name ?? "—"}
          {appointment.pet && <span className="font-normal text-muted-foreground"> · {appointment.pet.name}</span>}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {format(appointment.startsAt, "EEE, MMM d · HH:mm")} · {appointment.user.name ?? "—"}
        </p>
      </div>
      <Badge className={STATUS_STYLE[appointment.status] ?? "bg-secondary text-muted-foreground"}>
        {appointment.status}
      </Badge>
    </div>
  );
}
