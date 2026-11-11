"use client";

import { useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Camera, Check, Loader2, PawPrint, Save, Trash2 } from "lucide-react";
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
import { PET_PHOTO_PRESETS } from "@/features/pets/pet-photo-presets";
import { petInputSchema, type PetInput } from "@/lib/validations/pets";
import { cn } from "@/lib/utils";

/** Full browser navigation to /pets, not a client-side router transition.
 * router.push() + router.refresh() races against the App Router's client
 * Router Cache and intermittently leaves /pets showing a stale snapshot
 * from before the mutation until the user manually reloads. A pet
 * create/edit/delete isn't a hot path — trading the SPA transition for a
 * real page load guarantees the list is always correct on the first paint. */
function goToPetsFresh(locale: string) {
  window.location.href = `/${locale}/pets`;
}

export interface BreedOption {
  id: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
}

export interface PetFormInitial {
  id: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  breedId?: string | null;
  birthday?: string; // YYYY-MM-DD
  avatarUrl?: string | null;
}

export function PetForm({
  breeds,
  initial,
}: {
  breeds: BreedOption[];
  initial?: PetFormInitial;
}) {
  const t = useTranslations("pets");
  const locale = useLocale();
  const isEdit = Boolean(initial);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const form = useForm<PetInput>({
    resolver: zodResolver(petInputSchema),
    defaultValues: {
      name: initial?.name ?? "",
      species: initial?.species ?? "DOG",
      gender: initial?.gender ?? "UNKNOWN",
      breedId: initial?.breedId ?? "",
      birthday: initial?.birthday ?? "",
      avatarUrl: initial?.avatarUrl ?? "",
    },
  });

  const species = form.watch("species");
  const avatarUrl = form.watch("avatarUrl");
  const visibleBreeds = useMemo(
    () => breeds.filter((b) => b.species === species),
    [breeds, species],
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/pets/${initial!.id}/photo`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
      return data.avatarUrl as string;
    },
    onSuccess: (url) => {
      form.setValue("avatarUrl", url, { shouldDirty: true });
      toast.success(t("photoUploadSuccess"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    // Light client-side pre-check for instant feedback only — the server
    // re-validates size and real file content independently either way.
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("photoTooLarge"));
      return;
    }
    uploadMutation.mutate(file);
  }

  const saveMutation = useMutation({
    mutationFn: async (values: PetInput) => {
      const res = await fetch(isEdit ? `/api/pets/${initial!.id}` : "/api/pets", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
      return data.pet as { id: string; name: string };
    },
    onSuccess: (pet) => {
      toast.success(t(isEdit ? "updateSuccess" : "createSuccess", { name: pet.name }));
      goToPetsFresh(locale);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/pets/${initial!.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("deleteSuccess", { name: initial!.name }));
      goToPetsFresh(locale);
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
        <FormField label={t("photoLabel")}>
          {isEdit && (
            <div className="mb-3 flex items-center gap-3">
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
          )}
          <p className="mb-1.5 text-xs text-muted-foreground">
            {isEdit ? t("photoOrPreset") : t("photoPresetOnlyHint")}
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("photoLabel")}>
            {PET_PHOTO_PRESETS.map((preset) => {
              const selected = avatarUrl === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={preset.alt}
                  onClick={() =>
                    form.setValue("avatarUrl", selected ? "" : preset.url, {
                      shouldDirty: true,
                    })
                  }
                  className={cn(
                    "relative size-14 shrink-0 overflow-hidden rounded-2xl border-2 transition-colors",
                    selected ? "border-brand" : "border-transparent hover:border-border",
                  )}
                >
                  <Image src={preset.url} alt={preset.alt} fill sizes="3.5rem" className="object-cover" />
                  {selected && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Check className="size-5 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label={t("nameLabel")} error={form.formState.errors.name?.message}>
          <Input placeholder={t("namePlaceholder")} {...form.register("name")} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("speciesLabel")}>
            <Select
              value={form.watch("species")}
              onValueChange={(v) => {
                form.setValue("species", v as PetInput["species"]);
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
              onValueChange={(v) => form.setValue("gender", v as PetInput["gender"])}
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

        <FormField label={t("birthdayLabel")} error={form.formState.errors.birthday?.message}>
          <Input type="date" max={new Date().toISOString().slice(0, 10)} {...form.register("birthday")} />
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
              <DialogTitle>{t("deleteConfirmTitle", { name: initial!.name })}</DialogTitle>
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
