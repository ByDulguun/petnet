"use client";

import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Heart, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/shared/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  adoptionApplicationSchema,
  type AdoptionApplicationInput,
} from "@/lib/validations/adoption";

// The full Prisma enum — WITHDRAWN never actually reaches this component
// (withdrawing deletes the application row rather than marking it), but the
// type has to account for it since it's part of the fetched row's type.
type ApplicationStatus = "SUBMITTED" | "REVIEWING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  SUBMITTED: "bg-secondary text-muted-foreground",
  REVIEWING: "bg-warning-soft text-warning",
  APPROVED: "bg-success-soft text-success",
  REJECTED: "bg-danger-soft text-danger",
  WITHDRAWN: "bg-secondary text-muted-foreground",
};

export function AdoptionApplySection({
  listingId,
  listingStatus,
  petName,
  isLoggedIn,
  existingApplication,
}: {
  listingId: string;
  listingStatus: "AVAILABLE" | "PENDING" | "ADOPTED";
  petName: string;
  isLoggedIn: boolean;
  existingApplication: { id: string; status: ApplicationStatus } | null;
}) {
  const t = useTranslations("adoption");

  const form = useForm<AdoptionApplicationInput>({
    resolver: zodResolver(adoptionApplicationSchema),
    defaultValues: { message: "", homeType: "", hasOtherPets: false },
  });

  const applyMutation = useMutation({
    mutationFn: async (values: AdoptionApplicationInput) => {
      const res = await fetch(`/api/adoption/${listingId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("applySuccess"));
      window.location.reload();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/adoption/${listingId}/apply`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("withdrawSuccess"));
      window.location.reload();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">{t("loginToApply")}</p>
        <Button className="mt-3 w-full rounded-full font-semibold" asChild>
          <Link href={`/login?next=/adoption/${listingId}`}>{t("loginButton")}</Link>
        </Button>
      </div>
    );
  }

  if (existingApplication) {
    const canWithdraw =
      existingApplication.status === "SUBMITTED" || existingApplication.status === "REVIEWING";
    return (
      <div className="rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">{t("yourApplication")}</p>
        <Badge className={cn("mt-2 rounded-full font-semibold", STATUS_STYLE[existingApplication.status])}>
          {existingApplication.status === "APPROVED" && <CheckCircle2 className="size-3.5" />}
          {existingApplication.status === "REJECTED" && <XCircle className="size-3.5" />}
          {t(`applicationStatus${existingApplication.status}` as const)}
        </Badge>
        {canWithdraw && (
          <Button
            variant="outline"
            disabled={withdrawMutation.isPending}
            onClick={() => withdrawMutation.mutate()}
            className="mt-3 w-full rounded-full font-semibold text-danger hover:bg-danger-soft"
          >
            {withdrawMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("withdrawButton")}
          </Button>
        )}
      </div>
    );
  }

  if (listingStatus === "ADOPTED") {
    return (
      <div className="rounded-2xl border bg-card p-4 text-center text-sm text-muted-foreground">
        {t("alreadyAdopted")}
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => applyMutation.mutate(values))}
      className="space-y-3 rounded-2xl border bg-card p-4"
      noValidate
    >
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <Heart className="size-4 text-danger" aria-hidden="true" />
        {t("applyHeading", { name: petName })}
      </p>

      <FormField label={t("messageLabel")} error={form.formState.errors.message?.message}>
        <Textarea rows={3} placeholder={t("messagePlaceholder")} {...form.register("message")} />
      </FormField>

      <FormField label={t("homeTypeLabel")}>
        <Select
          value={form.watch("homeType") || "none"}
          onValueChange={(v) => form.setValue("homeType", v === "none" ? "" : (v as "apartment" | "house" | "yard"))}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("homeTypeNone")}</SelectItem>
            <SelectItem value="apartment">{t("homeTypeApartment")}</SelectItem>
            <SelectItem value="house">{t("homeTypeHouse")}</SelectItem>
            <SelectItem value="yard">{t("homeTypeYard")}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.watch("hasOtherPets")}
          onCheckedChange={(v) => form.setValue("hasOtherPets", v === true)}
        />
        {t("hasOtherPetsLabel")}
      </label>

      <Button
        type="submit"
        disabled={applyMutation.isPending}
        className="w-full rounded-full font-semibold"
      >
        {applyMutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {t("applyButton")}
      </Button>
    </form>
  );
}
