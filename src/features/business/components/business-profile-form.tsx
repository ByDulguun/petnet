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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { businessProfileSchema, type BusinessProfileInput } from "@/lib/validations/business";

interface CategoryOption {
  id: string;
  name: string;
}

export interface BusinessProfileInitial {
  name: string;
  categoryId: string;
  phone: string;
  description: string;
  address: string;
  district: string;
  website: string;
  facebook: string;
  instagram: string;
  tiktok: string;
}

export function BusinessProfileForm({
  categories,
  districts,
  initial,
}: {
  categories: CategoryOption[];
  districts: readonly string[];
  initial: BusinessProfileInitial;
}) {
  const t = useTranslations("businessProfile");

  const form = useForm<BusinessProfileInput>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: initial,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: BusinessProfileInput) => {
      const res = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => toast.success(t("saveSuccess")),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
      className="space-y-4"
      noValidate
    >
      <FormField label={t("nameLabel")} error={form.formState.errors.name?.message}>
        <Input {...form.register("name")} />
      </FormField>

      <FormField label={t("categoryLabel")} error={form.formState.errors.categoryId?.message}>
        <Select value={form.watch("categoryId")} onValueChange={(v) => form.setValue("categoryId", v)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={t("phoneLabel")} error={form.formState.errors.phone?.message}>
        <Input type="tel" {...form.register("phone")} />
      </FormField>

      <FormField label={t("descriptionLabel")}>
        <Textarea rows={4} {...form.register("description")} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label={t("addressLabel")}>
          <Input {...form.register("address")} />
        </FormField>
        <FormField label={t("districtLabel")}>
          <Select value={form.watch("district")} onValueChange={(v) => form.setValue("district", v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField label={t("websiteLabel")}>
        <Input type="url" placeholder="https://" {...form.register("website")} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label={t("facebookLabel")}>
          <Input placeholder="https://facebook.com/…" {...form.register("facebook")} />
        </FormField>
        <FormField label={t("instagramLabel")}>
          <Input placeholder="https://instagram.com/…" {...form.register("instagram")} />
        </FormField>
        <FormField label={t("tiktokLabel")}>
          <Input placeholder="https://tiktok.com/@…" {...form.register("tiktok")} />
        </FormField>
      </div>

      <Button
        type="submit"
        disabled={saveMutation.isPending}
        className="w-full rounded-full font-semibold"
      >
        {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {t("saveButton")}
      </Button>
    </form>
  );
}
