"use client";

import { useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Camera, Loader2, PawPrint, Save, Trash2 } from "lucide-react";
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
import {
  adoptionListingSchema,
  GOOD_WITH_OPTIONS,
  type AdoptionListingInput,
} from "@/lib/validations/adoption";
import { cn } from "@/lib/utils";

function hardNavigate(href: string) {
  window.location.href = href;
}

export interface BreedOption {
  id: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
}

export interface AdoptionListingFormInitial {
  id: string;
  petId: string;
  petName: string;
  species: "DOG" | "CAT" | "OTHER";
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  breedId?: string | null;
  story?: string | null;
  goodWith: string[];
  feeMnt?: number | null;
  avatarUrl?: string | null;
}

export function AdoptionListingForm({
  breeds,
  initial,
}: {
  breeds: BreedOption[];
  initial?: AdoptionListingFormInitial;
}) {
  const t = useTranslations("businessAdoption");
  const locale = useLocale();
  const isEdit = Boolean(initial);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatarUrl ?? "");

  const form = useForm<AdoptionListingInput>({
    resolver: zodResolver(adoptionListingSchema),
    defaultValues: {
      petName: initial?.petName ?? "",
      species: initial?.species ?? "DOG",
      gender: initial?.gender ?? "UNKNOWN",
      breedId: initial?.breedId ?? "",
      story: initial?.story ?? "",
      goodWith: (initial?.goodWith ?? []) as AdoptionListingInput["goodWith"],
      feeMnt: initial?.feeMnt ?? undefined,
    },
  });

  const species = form.watch("species");
  const goodWith = form.watch("goodWith");
  const visibleBreeds = useMemo(() => breeds.filter((b) => b.species === species), [breeds, species]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/pets/${initial!.petId}/photo`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
      return data.avatarUrl as string;
    },
    onSuccess: (url) => {
      setAvatarUrl(url);
      toast.success(t("photoUploadSuccess"));
    },
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
    mutationFn: async (values: AdoptionListingInput) => {
      const res = await fetch(isEdit ? `/api/business/adoption/${initial!.id}` : "/api/business/adoption", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
      return data.listing as { id: string };
    },
    onSuccess: (listing) => {
      if (isEdit) {
        toast.success(t("updateSuccess"));
        return;
      }
      // A photo can only attach once the listing (and its pet row) exist —
      // send a new listing straight to its own edit page, same reasoning
      // as the Lost & Found create flow.
      toast.success(t("createSuccess"));
      hardNavigate(`/${locale}/business/dashboard/adoption/${listing.id}/edit`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/business/adoption/${initial!.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      hardNavigate(`/${locale}/business/dashboard/adoption`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function toggleGoodWith(tag: (typeof GOOD_WITH_OPTIONS)[number]) {
    const next = goodWith.includes(tag) ? goodWith.filter((g) => g !== tag) : [...goodWith, tag];
    form.setValue("goodWith", next, { shouldDirty: true });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
        className="space-y-4"
        noValidate
      >
        {isEdit && (
          <FormField label={t("photoLabel")}>
            <div className="flex items-center gap-3">
              <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill sizes="4rem" className="object-cover" />
                ) : (
                  <PawPrint className="size-6 text-muted-foreground" aria-hidden="true" />
                )}
                {uploadMutation.isPending && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="size-5 animate-spin text-white" />
                  </span>
                )}
              </span>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onFileSelected}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full font-semibold"
                  disabled={uploadMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="size-4" />
                  {t("uploadPhotoButton")}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">{t("photoUploadHint")}</p>
              </div>
            </div>
          </FormField>
        )}

        <FormField label={t("petNameLabel")} error={form.formState.errors.petName?.message}>
          <Input placeholder={t("petNamePlaceholder")} {...form.register("petName")} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("speciesLabel")}>
            <Select
              value={species}
              onValueChange={(v) => {
                form.setValue("species", v as AdoptionListingInput["species"]);
                form.setValue("breedId", "");
              }}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DOG">{t("speciesDog")}</SelectItem>
                <SelectItem value="CAT">{t("speciesCat")}</SelectItem>
                <SelectItem value="OTHER">{t("speciesOther")}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t("genderLabel")}>
            <Select
              value={form.watch("gender")}
              onValueChange={(v) => form.setValue("gender", v as AdoptionListingInput["gender"])}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">{t("genderMale")}</SelectItem>
                <SelectItem value="FEMALE">{t("genderFemale")}</SelectItem>
                <SelectItem value="UNKNOWN">{t("genderUnknown")}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField label={t("breedLabel")}>
          <Select
            value={form.watch("breedId") || "none"}
            onValueChange={(v) => form.setValue("breedId", v === "none" ? "" : v)}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("breedNone")}</SelectItem>
              {visibleBreeds.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={t("storyLabel")}>
          <Textarea rows={4} placeholder={t("storyPlaceholder")} {...form.register("story")} />
        </FormField>

        <FormField label={t("goodWithLabel")}>
          <div className="flex flex-wrap gap-2">
            {GOOD_WITH_OPTIONS.map((tag) => {
              const selected = goodWith.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleGoodWith(tag)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                    selected
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/20",
                  )}
                >
                  {t(`goodWith_${tag}` as const)}
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label={t("feeLabel")}>
          <Input
            type="number"
            min={0}
            step={1000}
            placeholder={t("feePlaceholder")}
            {...form.register("feeMnt", {
              setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)),
            })}
          />
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
                  <Trash2 className="size-4" />
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
