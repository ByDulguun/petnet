"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Clock3, Loader2, MapPin, PawPrint } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { cn, formatMnt } from "@/lib/utils";

export interface BookingRowData {
  id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  startsAt: string; // ISO
  business: { name: string; slug: string; coverUrl: string | null };
  service: { name: string; priceMnt: number | null } | null;
  pet: { name: string; avatarUrl: string | null } | null;
}

const STATUS_STYLE: Record<BookingRowData["status"], string> = {
  PENDING: "bg-warning-soft text-warning",
  CONFIRMED: "bg-success-soft text-success",
  COMPLETED: "bg-secondary text-muted-foreground",
  CANCELLED: "bg-danger-soft text-danger",
  NO_SHOW: "bg-danger-soft text-danger",
};

const STATUS_KEY: Record<BookingRowData["status"], string> = {
  PENDING: "statusPending",
  CONFIRMED: "statusConfirmed",
  COMPLETED: "statusCompleted",
  CANCELLED: "statusCancelled",
  NO_SHOW: "statusCancelled",
};

export function BookingRow({
  booking,
  cancellable,
}: {
  booking: BookingRowData;
  cancellable: boolean;
}) {
  const t = useTranslations("bookings");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const startsAt = new Date(booking.startsAt);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookings/${booking.id}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("cancelSuccess"));
      // Hard reload, not a client transition: guarantees the tabs reflect
      // the real DB state immediately (see the Phase 3 pet-list staleness
      // fix — the App Router's client cache can otherwise show a stale
      // "still upcoming" row after this exact kind of mutation).
      window.location.reload();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-4 rounded-3xl border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
      <Link href={`/business/${booking.business.slug}`} className="flex min-w-0 flex-1 items-center gap-4">
        <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
          {booking.business.coverUrl ? (
            <Image
              src={booking.business.coverUrl}
              alt={booking.business.name}
              fill
              sizes="4rem"
              className="object-cover"
            />
          ) : (
            <MapPin className="size-6 text-muted-foreground" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold">{booking.business.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {booking.service?.name ?? "—"}
            {booking.service?.priceMnt != null && (
              <span className="ml-1">· {formatMnt(booking.service.priceMnt)}</span>
            )}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {format(startsAt, "EEE, MMM d")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {format(startsAt, "HH:mm")}
            </span>
            {booking.pet && (
              <span className="inline-flex items-center gap-1">
                <PawPrint className="size-3.5" aria-hidden="true" />
                {t("withPet", { pet: booking.pet.name })}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
        <Badge className={cn("rounded-full font-semibold", STATUS_STYLE[booking.status])}>
          {t(STATUS_KEY[booking.status])}
        </Badge>
        {cancellable && (
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full font-semibold text-danger hover:bg-danger-soft">
                {t("cancelButton")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>{t("cancelConfirmTitle")}</DialogTitle>
                <DialogDescription>
                  {t("cancelConfirmDesc", { business: booking.business.name })}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setConfirmOpen(false)} className="rounded-full">
                  {t("keepButton")}
                </Button>
                <Button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="rounded-full bg-danger font-semibold text-white hover:bg-danger/90"
                >
                  {cancelMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  {t("cancelConfirmAction")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
