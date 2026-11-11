import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { NotificationsList } from "@/features/notifications/components/notifications-list";
import { requireUser } from "@/lib/session";
import { getNotificationsForUser } from "@/server/services/notification-service";

// Every visitor's notifications are different — never prerender or cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notificationsPage" });
  return { title: t("title") };
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser("/notifications");
  const t = await getTranslations("notificationsPage");
  const notifications = await getNotificationsForUser(user.id);

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <h1 className="mb-8 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
      <NotificationsList
        initial={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          href: n.href,
          readAt: n.readAt ? n.readAt.toISOString() : null,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
