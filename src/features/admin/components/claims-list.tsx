"use client";

import { useMutation } from "@tanstack/react-query";
import { Check, Loader2, Store, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ClaimData {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  district: string | null;
  description: string | null;
  category: { name: string };
  user: { name: string | null; email: string };
  business: { name: string; slug: string } | null;
}

export function ClaimsList({ initial }: { initial: ClaimData[] }) {
  const t = useTranslations("adminClaims");

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      const res = await fetch(`/api/admin/claims/${id}`, {
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
      {initial.map((claim) => (
        <div key={claim.id} className="rounded-3xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Store className="size-4 text-muted-foreground" aria-hidden="true" />
                <p className="font-bold">{claim.name}</p>
                <Badge variant="secondary" className="rounded-full">
                  {claim.business ? t("claimingLabel") : t("newBusinessLabel")}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("submittedBy", { name: claim.user.name ?? claim.user.email })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {claim.category.name}
                {claim.district ? ` · ${claim.district}` : ""}
                {claim.phone ? ` · ${claim.phone}` : ""}
              </p>
              {claim.description && (
                <p className="mt-2 text-sm text-muted-foreground">{claim.description}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ id: claim.id, action: "approve" })}
              className="rounded-full font-semibold"
            >
              {reviewMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {t("approveButton")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ id: claim.id, action: "reject" })}
              className="rounded-full font-semibold text-danger hover:bg-danger-soft"
            >
              <X className="size-4" />
              {t("rejectButton")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
