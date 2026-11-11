"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bell, CalendarCheck2, CheckCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsList({ initial }: { initial: NotificationData[] }) {
  const t = useTranslations("notificationsPage");
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState(initial);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    },
    onSuccess: (_data, id) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", { method: "POST" });
    },
    onSuccess: () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (notifications.length === 0) {
    return <EmptyState icon={Bell} title={t("emptyTitle")} description={t("emptyDesc")} />;
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="rounded-full text-muted-foreground"
          >
            <CheckCheck className="size-4" />
            {t("markAllRead")}
          </Button>
        </div>
      )}
      {notifications.map((n) => {
        const unread = !n.readAt;
        const content = (
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
              unread ? "border-brand/30 bg-brand-soft/40" : "bg-card",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                unread ? "bg-brand-soft" : "bg-secondary",
              )}
            >
              <CalendarCheck2
                className={cn("size-4.5", unread ? "text-brand" : "text-muted-foreground")}
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{n.title}</p>
                {unread && (
                  <span className="inline-flex size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                )}
              </div>
              {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {format(new Date(n.createdAt), "MMM d, yyyy · HH:mm")}
              </p>
            </div>
          </div>
        );

        const onActivate = () => {
          if (unread) markReadMutation.mutate(n.id);
        };

        return n.href ? (
          <Link key={n.id} href={n.href} onClick={onActivate} className="block w-full text-left">
            {content}
          </Link>
        ) : (
          <button key={n.id} type="button" onClick={onActivate} className="block w-full text-left">
            {content}
          </button>
        );
      })}
    </div>
  );
}
