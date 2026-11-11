"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function LostFoundStatusAction({
  reportId,
  status,
}: {
  reportId: string;
  status: "OPEN" | "REUNITED" | "CLOSED";
}) {
  const t = useTranslations("lostFound");

  const mutation = useMutation({
    mutationFn: async (nextStatus: "OPEN" | "REUNITED") => {
      const res = await fetch(`/api/lost-found/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: (_data, nextStatus) => {
      toast.success(t(nextStatus === "REUNITED" ? "reunitedSuccess" : "reopenedSuccess"));
      window.location.reload(); // guaranteed-fresh reload, same pattern as business appointment actions
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (status === "OPEN") {
    return (
      <Button
        variant="outline"
        className="rounded-full font-semibold text-success hover:bg-success-soft"
        onClick={() => mutation.mutate("REUNITED")}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        {t("markReunited")}
      </Button>
    );
  }

  if (status === "REUNITED") {
    return (
      <Button
        variant="outline"
        className="rounded-full font-semibold"
        onClick={() => mutation.mutate("OPEN")}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RotateCcw className="size-4" />
        )}
        {t("reopenReport")}
      </Button>
    );
  }

  return null;
}
