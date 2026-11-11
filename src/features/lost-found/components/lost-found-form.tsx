"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Camera, Loader2, PawPrint, Save, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DISTRICTS } from "@/server/data/taxonomy";
import { MAX_LOST_FOUND_IMAGES } from "@/server/services/lost-found-service";
import { lostFoundInputSchema, type LostFoundInput } from "@/lib/validations/lost-found";
import { cn } from "@/lib/utils";

/** Full browser navigation, not a client-side router transition — same
 * reasoning as pet-form.tsx's goToPetsFresh: router.push() + refresh()
 * races the App Router's client cache and can leave the destination
 * showing stale data until a manual reload. Create/delete aren't hot
 * paths here either. */
function hardNavigate(href: string) {
  window.location.href = href;
}

export interface LostFoundFormInitial {
  id: string;
  type: "LOST" | "FOUND";
  petName?: string | null;
  species: "DOG" | "CAT" | "OTHER";
  breedName?: string | null;
  color?: string | null;
  description: string;
  lastSeenAt: string; // YYYY-MM-DD
  address?: string | null;
  district?: string | null;
  rewardMnt?: number | null;
  phone: string;
  images: { id: string; url: string }[];
}

export function LostFoundForm({ initial }: { initial?: LostFoundFormInitial }) {
  const t = useTranslations("lostFound");
  const locale = useLocale();
  const isEdit = Boolean(initial);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [images, setImages] = useState(initial?.images ?? []);

  const form = useForm<LostFoundInput>({
    resolver: zodResolver(lostFoundInputSchema),
    defaultValues: {
      type: initial?.type ?? "LOST",
      petName: initial?.petName ?? "",
      species: initial?.species ?? "DOG",
      breedName: initial?.breedName ?? "",
      color: initial?.color ?? "",
      description: initial?.description ?? "",
      lastSeenAt: initial?.lastSeenAt ?? "",
      address: initial?.address ?? "",
      district: initial?.district ?? "",
      rewardMnt: initial?.rewardMnt ?? undefined,
      phone: initial?.phone ?? "",
    },
  });

  const type = form.watch("type");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/lost-found/${initial!.id}/photos`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
      return data.image as { id: string; url: string };
    },
    onSuccess: (image) => {
      setImages((prev) => [...prev, image]);
      toast.success(t("photoUploadSuccess"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const res = await fetch(`/api/lost-found/${initial!.id}/photos/${imageId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
      return imageId;
    },
    onSuccess: (imageId) => setImages((prev) => prev.filter((img) => img.id !== imageId)),
    onError: (err: Error) => toast.error(err.message),
  });

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("photoTooLarge"));
      return;
    }
    uploadMutation.mutate(file);
  }

  const saveMutation = useMutation({
    mutationFn: async (values: LostFoundInput) => {
      const res = await fetch(isEdit ? `/api/lost-found/${initial!.id}` : "/api/lost-found", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
      return data.report as { id: string };
    },
    onSuccess: (report) => {
      if (isEdit) {
        toast.success(t("updateSuccess"));
        return;
      }
      // Photos can only attach once a report exists — send a brand-new
      // report straight to its own edit page so the reporter can add them
      // right away instead of losing the moment and never coming back.
      toast.success(t("createSuccess"));
      hardNavigate(`/${locale}/lost-found/${report.id}/edit`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/lost-found/${initial!.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      hardNavigate(`/${locale}/lost-found`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
        className="space-y-4"
        noValidate
      >
        <FormField label={t("typeLabel")}>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("typeLabel")}>
            {(["LOST", "FOUND"] as const).map((v) => {
              const selected = type === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => form.setValue("type", v, { shouldDirty: true })}
                  className={cn(
                    "rounded-2xl border-2 px-4 py-3 text-center text-sm font-bold transition-colors",
                    selected
                      ? v === "LOST"
                        ? "border-danger bg-danger-soft text-danger"
                        : "border-success bg-success-soft text-success"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/20",
                  )}
                >
                  {t(v === "LOST" ? "typeLost" : "typeFound")}
                </button>
              );
            })}
          </div>
        </FormField>

        {isEdit && (
          <FormField label={t("photoLabel")}>
            <div className="flex flex-wrap gap-2">
              {images.map((img) => (
                <div key={img.id} className="group relative size-20 shrink-0 overflow-hidden rounded-2xl">
                  <Image src={img.url} alt="" fill sizes="5rem" className="object-cover" />
                  <button
                    type="button"
                    aria-label={t("removePhoto")}
                    onClick={() => deleteImageMutation.mutate(img.id)}
                    disabled={deleteImageMutation.isPending}
                    className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {images.length < MAX_LOST_FOUND_IMAGES && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onFileSelected}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Camera className="size-5" />
                    )}
                    <span className="text-[11px] font-semibold">{t("addPhoto")}</span>
                  </button>
                </>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("photoUploadHint", { max: MAX_LOST_FOUND_IMAGES })}
            </p>
          </FormField>
        )}

        <FormField label={t("petNameLabel")}>
          <Input placeholder={t("petNamePlaceholder")} {...form.register("petName")} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("speciesLabel")}>
            <Select
              value={form.watch("species")}
              onValueChange={(v) => form.setValue("species", v as LostFoundInput["species"])}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DOG">{t("speciesDog")}</SelectItem>
                <SelectItem value="CAT">{t("speciesCat")}</SelectItem>
                <SelectItem value="OTHER">{t("speciesOther")}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t("breedLabel")}>
            <Input placeholder={t("breedPlaceholder")} {...form.register("breedName")} />
          </FormField>
        </div>

        <FormField label={t("colorLabel")}>
          <Input placeholder={t("colorPlaceholder")} {...form.register("color")} />
        </FormField>

        <FormField
          label={t("descriptionLabel")}
          error={form.formState.errors.description?.message}
        >
          <Textarea
            rows={4}
            placeholder={t("descriptionPlaceholder")}
            {...form.register("description")}
          />
        </FormField>

        <FormField
          label={t("lastSeenAtLabel")}
          error={form.formState.errors.lastSeenAt?.message}
        >
          <Input
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            {...form.register("lastSeenAt")}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("addressLabel")}>
            <Input placeholder={t("addressPlaceholder")} {...form.register("address")} />
          </FormField>

          <FormField label={t("districtLabel")}>
            <Select
              value={form.watch("district") || "none"}
              onValueChange={(v) => form.setValue("district", v === "none" ? "" : v)}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("districtNone")}</SelectItem>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        {type === "LOST" && (
          <FormField label={t("rewardLabel")}>
            <Input
              type="number"
              min={0}
              placeholder={t("rewardPlaceholder")}
              {...form.register("rewardMnt", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </FormField>
        )}

        <FormField label={t("phoneLabel")} error={form.formState.errors.phone?.message}>
          <Input type="tel" placeholder={t("phonePlaceholder")} {...form.register("phone")} />
        </FormField>

        <Button
          type="submit"
          disabled={saveMutation.isPending}
          className="w-full rounded-full font-semibold"
        >
          {saveMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {t("saveButton")}
        </Button>
      </form>

      {isEdit && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full rounded-full font-semibold text-danger hover:bg-danger-soft">
              <Trash2 className="size-4" />
              {t("deleteButton")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
              <DialogDescription>{t("deleteConfirmDesc")}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)} className="rounded-full">
                {t("cancelButton")}
              </Button>
              <Button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="rounded-full bg-danger font-semibold text-white hover:bg-danger/90"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PawPrint className="size-4" />
                )}
                {t("deleteConfirmAction")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
