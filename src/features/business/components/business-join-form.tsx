"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, Search, Store } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/features/services/hooks";
import { useRouter } from "@/i18n/navigation";
import { businessClaimSchema, type BusinessClaimInput } from "@/lib/validations/business";
import { cn } from "@/lib/utils";

interface CategoryOption {
  id: string;
  name: string;
}

interface BusinessSearchHit {
  id: string;
  name: string;
  district: string;
}

export function BusinessJoinForm({
  categories,
  districts,
}: {
  categories: CategoryOption[];
  districts: readonly string[];
}) {
  const t = useTranslations("businessJoin");
  const router = useRouter();
  const [mode, setMode] = useState<"new" | "claim">("new");
  const [selected, setSelected] = useState<BusinessSearchHit | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const form = useForm<BusinessClaimInput>({
    resolver: zodResolver(businessClaimSchema),
    defaultValues: {
      categoryId: categories[0]?.id ?? "",
      name: "",
      phone: "",
      address: "",
      district: "",
      description: "",
    },
  });

  const { data: hits, isFetching: searching } = useQuery<BusinessSearchHit[]>({
    queryKey: ["business-search", debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/businesses?q=${encodeURIComponent(debouncedSearch)}&limit=6`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.items.map((b: { id: string; name: string; district: string }) => ({
        id: b.id,
        name: b.name,
        district: b.district,
      }));
    },
    enabled: mode === "claim" && debouncedSearch.trim().length >= 2 && !selected,
  });

  const submitMutation = useMutation({
    mutationFn: async (values: BusinessClaimInput) => {
      const res = await fetch("/api/business/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          businessId: mode === "claim" ? selected?.id : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("submitSuccess"));
      router.push("/business/join");
      router.refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "new" | "claim")}>
        <TabsList>
          <TabsTrigger value="new">{t("modeNew")}</TabsTrigger>
          <TabsTrigger value="claim">{t("modeClaim")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "claim" && (
        <div>
          <FormField label={t("searchLabel")}>
            {selected ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand-soft/40 p-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Store className="size-4 text-brand" aria-hidden="true" />
                  {t("selectedBusiness")}: {selected.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelected(null);
                    setSearch("");
                  }}
                >
                  {t("changeSelection")}
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
          </FormField>
          {!selected && search.trim().length >= 2 && (
            <div className="mt-2 space-y-1.5">
              {searching && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> …
                </p>
              )}
              {hits?.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => {
                    setSelected(hit);
                    form.setValue("name", hit.name);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-3 text-left text-sm transition-colors hover:border-brand/40 hover:bg-brand-soft/40"
                >
                  <span className="font-semibold">{hit.name}</span>
                  <span className="text-xs text-muted-foreground">{hit.district}</span>
                </button>
              ))}
              {hits && hits.length === 0 && !searching && (
                <p className="text-xs text-muted-foreground">{t("searchHint")}</p>
              )}
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={form.handleSubmit((values) => submitMutation.mutate(values))}
        className="space-y-4"
        noValidate
      >
        <FormField label={t("nameLabel")} error={form.formState.errors.name?.message}>
          <Input
            placeholder={t("namePlaceholder")}
            disabled={mode === "claim" && Boolean(selected)}
            {...form.register("name")}
          />
        </FormField>

        <FormField label={t("categoryLabel")} error={form.formState.errors.categoryId?.message}>
          <Select
            value={form.watch("categoryId")}
            onValueChange={(v) => form.setValue("categoryId", v)}
          >
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
          <Input type="tel" placeholder={t("phonePlaceholder")} {...form.register("phone")} />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={t("addressLabel")}>
            <Input placeholder={t("addressPlaceholder")} {...form.register("address")} />
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

        <FormField label={t("descriptionLabel")}>
          <Textarea placeholder={t("descriptionPlaceholder")} rows={4} {...form.register("description")} />
        </FormField>

        <Button
          type="submit"
          disabled={submitMutation.isPending || (mode === "claim" && !selected)}
          className={cn("w-full rounded-full font-semibold")}
        >
          {submitMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          {t("submitButton")}
        </Button>
      </form>
    </div>
  );
}
