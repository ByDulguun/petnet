"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Home, Loader2, PawPrint, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

type ApplicationStatus = "SUBMITTED" | "REVIEWING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

export interface AdoptionApplicationData {
  id: string;
  status: ApplicationStatus;
  message: string;
  homeType: string | null;
  hasOtherPets: boolean;
  applicant: { name: string | null; email: string; phone: string | null };
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  SUBMITTED: "bg-secondary text-muted-foreground",
  REVIEWING: "bg-warning-soft text-warning",
  APPROVED: "bg-success-soft text-success",
  REJECTED: "bg-danger-soft text-danger",
  WITHDRAWN: "bg-secondary text-muted-foreground",
};

export function AdoptionApplicationsList({
  listingId,
  initial,
}: {
  listingId: string;
  initial: AdoptionApplicationData[];
}) {
  const t = useTranslations("businessAdoption");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "REVIEWING" | "APPROVED" | "REJECTED" }) => {
      setPendingId(id);
      const res = await fetch(`/api/business/adoption/${listingId}/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("applicationUpdateSuccess"));
      window.location.reload();
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingId(null);
    },
  });

  if (initial.length === 0) {
    return <EmptyState icon={PawPrint} title={t("noApplicationsTitle")} description={t("noApplicationsDesc")} />;
  }

  return (
    <div className="space-y-3">
      {initial.map((app) => {
        const isPending = mutation.isPending && pendingId === app.id;
        const canAct = app.status === "SUBMITTED" || app.status === "REVIEWING";
        return (
          <div key={app.id} className="rounded-3xl border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{app.applicant.name ?? app.applicant.email}</p>
                <p className="text-sm text-muted-foreground">{app.applicant.email}</p>
                {app.applicant.phone && (
                  <p className="text-sm text-muted-foreground">{app.applicant.phone}</p>
                )}
              </div>
              <Badge className={cn("shrink-0 rounded-full font-semibold", STATUS_STYLE[app.status])}>
                {t(`applicationStatus${app.status}` as const)}
              </Badge>
            </div>

            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{app.message}</p>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {app.homeType && (
                <span className="inline-flex items-center gap-1">
                  <Home className="size-3.5" aria-hidden="true" />
                  {t(`homeType${app.homeType[0].toUpperCase()}${app.homeType.slice(1)}` as const)}
                </span>
              )}
              <span>{app.hasOtherPets ? t("hasOtherPetsYes") : t("hasOtherPetsNo")}</span>
            </div>

            {canAct && (
              <div className="mt-4 flex flex-wrap gap-2">
                {app.status === "SUBMITTED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    className="rounded-full font-semibold"
                    onClick={() => mutation.mutate({ id: app.id, status: "REVIEWING" })}
                  >
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    {t("moveToReviewing")}
                  </Button>
                )}
                <Button
                  size="sm"
                  className="rounded-full bg-success font-semibold text-white hover:bg-success/90"
                  disabled={isPending}
                  onClick={() => mutation.mutate({ id: app.id, status: "APPROVED" })}
                >
                  <Check className="size-4" />
                  {t("approveButton")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  className="rounded-full font-semibold text-danger hover:bg-danger-soft"
                  onClick={() => mutation.mutate({ id: app.id, status: "REJECTED" })}
                >
                  <X className="size-4" />
                  {t("rejectButton")}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
