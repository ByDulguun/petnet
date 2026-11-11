"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  BusinessServiceForm,
  type BusinessServiceData,
} from "@/features/business/components/business-service-form";
import { cn, formatMnt } from "@/lib/utils";

export function BusinessServicesList({ initial }: { initial: BusinessServiceData[] }) {
  const t = useTranslations("businessServices");
  const [dialogFor, setDialogFor] = useState<BusinessServiceData | "new" | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  const toggleMutation = useMutation({
    mutationFn: async (service: BusinessServiceData) => {
      setPendingToggleId(service.id);
      const res = await fetch(`/api/business/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: service.name,
          description: service.description ?? "",
          priceMnt: service.priceMnt ?? undefined,
          durationMin: service.durationMin ?? undefined,
          isActive: !service.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("saveSuccess"));
      window.location.reload();
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingToggleId(null);
    },
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button className="rounded-full font-semibold" onClick={() => setDialogFor("new")}>
          <Plus className="size-4" />
          {t("addService")}
        </Button>
      </div>

      {initial.length === 0 && (
        <EmptyState icon={Wrench} title={t("emptyTitle")} description={t("emptyDesc")} />
      )}

      <div className="space-y-3">
        {initial.map((s) => (
          <div key={s.id} className="rounded-3xl border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={cn("font-bold", !s.isActive && "text-muted-foreground")}>{s.name}</p>
                {s.description && <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.priceMnt != null ? formatMnt(s.priceMnt) : "—"}
                  {s.durationMin ? ` · ${s.durationMin} min` : ""}
                </p>
              </div>
              <Badge
                className={cn(
                  "shrink-0 rounded-full font-semibold",
                  s.isActive ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground",
                )}
              >
                {s.isActive ? t("statusActive") : t("statusDisabled")}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full font-semibold"
                onClick={() => setDialogFor(s)}
              >
                {t("editService")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={toggleMutation.isPending && pendingToggleId === s.id}
                className="rounded-full font-semibold"
                onClick={() => toggleMutation.mutate(s)}
              >
                {toggleMutation.isPending && pendingToggleId === s.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {s.isActive ? t("disableButton") : t("enableButton")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogFor !== null} onOpenChange={(v) => !v && setDialogFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogFor === "new" ? t("addService") : t("editService")}</DialogTitle>
          </DialogHeader>
          <BusinessServiceForm
            initial={dialogFor && dialogFor !== "new" ? dialogFor : undefined}
            onDone={() => window.location.reload()}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
