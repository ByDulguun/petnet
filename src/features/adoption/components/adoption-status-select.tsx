"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ListingStatus = "AVAILABLE" | "PENDING" | "ADOPTED";

export function AdoptionStatusSelect({
  listingId,
  status,
}: {
  listingId: string;
  status: ListingStatus;
}) {
  const t = useTranslations("businessAdoption");

  const mutation = useMutation({
    mutationFn: async (next: ListingStatus) => {
      const res = await fetch(`/api/business/adoption/${listingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("statusUpdateSuccess"));
      window.location.reload();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Select
      value={status}
      disabled={mutation.isPending}
      onValueChange={(v) => mutation.mutate(v as ListingStatus)}
    >
      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="AVAILABLE">{t("statusAvailable")}</SelectItem>
        <SelectItem value="PENDING">{t("statusPending")}</SelectItem>
        <SelectItem value="ADOPTED">{t("statusAdopted")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
