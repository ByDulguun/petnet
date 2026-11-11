"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { businessServiceSchema, type BusinessServiceInput } from "@/lib/validations/business";

export interface BusinessServiceData {
  id: string;
  name: string;
  description: string | null;
  priceMnt: number | null;
  durationMin: number | null;
  isActive: boolean;
}

export function BusinessServiceForm({
  initial,
  onDone,
}: {
  initial?: BusinessServiceData;
  onDone: () => void;
}) {
  const t = useTranslations("businessServices");
  const isEdit = Boolean(initial);

  const form = useForm<BusinessServiceInput>({
    resolver: zodResolver(businessServiceSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      priceMnt: initial?.priceMnt ?? undefined,
      durationMin: initial?.durationMin ?? undefined,
      isActive: initial?.isActive ?? true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: BusinessServiceInput) => {
      const res = await fetch(isEdit ? `/api/business/services/${initial!.id}` : "/api/business/services", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("saveSuccess"));
      onDone();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
      className="space-y-4"
      noValidate
    >
      <FormField label={t("nameLabel")} error={form.formState.errors.name?.message}>
        <Input placeholder={t("namePlaceholder")} {...form.register("name")} />
      </FormField>
      <FormField label={t("descriptionLabel")} error={form.formState.errors.description?.message}>
        <Textarea rows={2} {...form.register("description")} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t("priceLabel")} error={form.formState.errors.priceMnt?.message}>
          <Input
            type="number"
            min={0}
            step={1000}
            {...form.register("priceMnt", {
              setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)),
            })}
          />
        </FormField>
        <FormField label={t("durationLabel")} error={form.formState.errors.durationMin?.message}>
          <Input
            type="number"
            min={5}
            step={5}
            {...form.register("durationMin", {
              setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)),
            })}
          />
        </FormField>
      </div>
      <div className="flex items-center justify-between rounded-2xl border p-3">
        <span className="text-sm font-semibold">{t("activeLabel")}</span>
        <Switch
          checked={form.watch("isActive")}
          onCheckedChange={(v) => form.setValue("isActive", v)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={saveMutation.isPending}
          className="flex-1 rounded-full font-semibold"
        >
          {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t("saveButton")}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} className="rounded-full">
          {t("cancelButton")}
        </Button>
      </div>
    </form>
  );
}
