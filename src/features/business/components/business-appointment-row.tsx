"use client";

import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, CheckCircle2, Loader2, PawPrint, User, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatMnt } from "@/lib/utils";

export interface BusinessAppointmentData {
  id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  startsAt: string; // ISO
  note: string | null;
  user: { name: string | null; email: string };
  pet: { name: string } | null;
  service: { name: string; priceMnt: number | null } | null;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-warning-soft text-warning",
  CONFIRMED: "bg-success-soft text-success",
  COMPLETED: "bg-secondary text-muted-foreground",
  CANCELLED: "bg-danger-soft text-danger",
  NO_SHOW: "bg-danger-soft text-danger",
};

const STATUS_KEY: Record<string, string> = {
  PENDING: "statusPending",
  CONFIRMED: "statusConfirmed",
  COMPLETED: "statusCompleted",
  CANCELLED: "statusCancelled",
  NO_SHOW: "statusCancelled",
};

export function BusinessAppointmentRow({ appointment }: { appointment: BusinessAppointmentData }) {
  const t = useTranslations("businessAppointments");
  const startsAt = new Date(appointment.startsAt);

  const actionMutation = useMutation({
    mutationFn: async (action: "confirm" | "cancel" | "complete") => {
      const res = await fetch(`/api/business/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("actionSuccess"));
      window.location.reload(); // guaranteed-fresh reload, same pattern as My Bookings cancel
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pending = appointment.status === "PENDING";
  const confirmed = appointment.status === "CONFIRMED";

  return (
    <div className="rounded-3xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">{appointment.service?.name ?? "—"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {format(startsAt, "EEE, MMM d · HH:mm")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="size-3.5" aria-hidden="true" />
              {t("customerLabel")}: {appointment.user.name ?? appointment.user.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PawPrint className="size-3.5" aria-hidden="true" />
              {appointment.pet?.name ?? t("noPet")}
            </span>
            {appointment.service?.priceMnt != null && (
              <span className="font-semibold text-foreground">{formatMnt(appointment.service.priceMnt)}</span>
            )}
          </div>
          {appointment.note && (
            <p className="mt-2 rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
              {appointment.note}
            </p>
          )}
        </div>
        <Badge className={cn("shrink-0 rounded-full font-semibold", STATUS_STYLE[appointment.status])}>
          {t(STATUS_KEY[appointment.status])}
        </Badge>
      </div>

      {(pending || confirmed) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {pending && (
            <Button
              size="sm"
              onClick={() => actionMutation.mutate("confirm")}
              disabled={actionMutation.isPending}
              className="rounded-full font-semibold"
            >
              {actionMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {t("confirmButton")}
            </Button>
          )}
          {confirmed && (
            <Button
              size="sm"
              onClick={() => actionMutation.mutate("complete")}
              disabled={actionMutation.isPending}
              className="rounded-full font-semibold"
            >
              {actionMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {t("completeButton")}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => actionMutation.mutate("cancel")}
            disabled={actionMutation.isPending}
            className="rounded-full font-semibold text-danger hover:bg-danger-soft"
          >
            <XCircle className="size-4" />
            {t("cancelButton")}
          </Button>
        </div>
      )}
    </div>
  );
}
