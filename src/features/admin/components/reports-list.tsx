"use client";

import { useMutation } from "@tanstack/react-query";
import { Check, Flag, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ReportData {
  id: string;
  reason: string;
  details: string | null;
  reporter: { name: string | null; email: string } | null;
  business: { name: string; slug: string } | null;
  review: { body: string | null; rating: number; business: { name: string } } | null;
}

export function ReportsList({ initial }: { initial: ReportData[] }) {
  const t = useTranslations("adminReports");

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "resolve" | "dismiss" }) => {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
    },
    onSuccess: () => {
      toast.success(t("actionSuccess"));
      window.location.reload();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (initial.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        {t("emptyTitle")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {initial.map((report) => (
        <div key={report.id} className="rounded-3xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Flag className="size-4 text-danger" aria-hidden="true" />
                <Badge variant="secondary" className="rounded-full">
                  {report.reason}
                </Badge>
              </div>
              <p className="mt-1.5 text-sm font-semibold">
                {report.business
                  ? t("targetBusiness", { name: report.business.name })
                  : report.review
                    ? t("targetReview", { name: report.review.business.name, rating: report.review.rating })
                    : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("reportedBy", { name: report.reporter?.name ?? report.reporter?.email ?? "—" })}
              </p>
              {report.review?.body && (
                <p className="mt-2 rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  &quot;{report.review.body}&quot;
                </p>
              )}
              {report.details && (
                <p className="mt-2 text-sm text-muted-foreground">{report.details}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ id: report.id, action: "resolve" })}
              className="rounded-full font-semibold"
            >
              {reviewMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {t("resolveButton")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ id: report.id, action: "dismiss" })}
              className="rounded-full font-semibold"
            >
              <X className="size-4" />
              {t("dismissButton")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
