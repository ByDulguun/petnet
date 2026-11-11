import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { BusinessAppointmentRow } from "@/features/business/components/business-appointment-row";
import { requireBusinessOwner } from "@/lib/session";
import { getBusinessAppointments } from "@/server/services/business-portal-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessAppointments" });
  return { title: t("title") };
}

export default async function BusinessAppointmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusinessOwner("/business/appointments");
  const t = await getTranslations("businessAppointments");
  const appointments = await getBusinessAppointments(business.id);

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <h1 className="mb-8 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>

      {appointments.length === 0 ? (
        <EmptyState icon={ListChecks} title={t("emptyTitle")} description={t("emptyDesc")} />
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <BusinessAppointmentRow
              key={a.id}
              appointment={{
                id: a.id,
                status: a.status,
                startsAt: a.startsAt.toISOString(),
                note: a.note,
                user: a.user,
                pet: a.pet,
                service: a.service,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
