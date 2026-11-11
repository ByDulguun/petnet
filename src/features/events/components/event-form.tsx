"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Loader2, Save, Trash2 } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { EVENT_TYPES } from "@/lib/validations/events";

function hardNavigate(href: string) {
  window.location.href = href;
}

export interface EventFormInitial {
  id: string;
  title: string;
  description: string;
  type: (typeof EVENT_TYPES)[number];
  startsAt: string; // datetime-local value
  endsAt: string;
  venue: string;
  address: string;
  capacity: string;
  priceMnt: string;
  asBusiness: boolean;
  coverImage: string | null;
}

export function EventForm({
  ownedBusinessName,
  initial,
}: {
  ownedBusinessName?: string | null;
  initial?: EventFormInitial;
}) {
  const t = useTranslations("events");
  const locale = useLocale();
  const isEdit = Boolean(initial);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<(typeof EVENT_TYPES)[number]>(initial?.type ?? "MEETUP");
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? "");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity ?? "");
  const [priceMnt, setPriceMnt] = useState(initial?.priceMnt ?? "");
  const [asBusiness, setAsBusiness] = useState(initial?.asBusiness ?? false);
  const [coverPreview, setCoverPreview] = useState(initial?.coverImage ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("photoTooLarge"));
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.set("title", title);
      form.set("description", description);
      form.set("type", type);
      form.set("startsAt", startsAt);
      form.set("endsAt", endsAt);
      form.set("venue", venue);
      form.set("address", address);
      form.set("capacity", capacity);
      form.set("priceMnt", priceMnt);
      form.set("asBusiness", String(asBusiness));
      if (coverFile) form.set("cover", coverFile);

      const res = await fetch(isEdit ? `/api/events/${initial!.id}` : "/api/events", {
        method: isEdit ? "PATCH" : "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.issues) setErrors(Object.fromEntries(Object.entries(data.issues).map(([k, v]) => [k, (v as string[])[0]])));
        throw new Error(data.error ?? t("genericError"));
      }
      return data.event as { id: string };
    },
    onSuccess: (event) => {
      toast.success(isEdit ? t("updateSuccess") : t("createSuccess"));
      hardNavigate(`/${locale}/events/${event.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${initial!.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      hardNavigate(`/${locale}/events`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setErrors({});
          saveMutation.mutate();
        }}
        className="space-y-4"
      >
        <FormField label={t("coverLabel")}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
              {coverPreview ? (
                <Image src={coverPreview} alt="" fill sizes="8rem" className="object-cover" />
              ) : (
                <Camera className="size-6 text-muted-foreground" aria-hidden="true" />
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
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="size-4" />
                {t("uploadPhotoButton")}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">{t("photoUploadHint")}</p>
            </div>
          </div>
        </FormField>

        <FormField label={t("titleLabel")} error={errors.title}>
          <Input placeholder={t("titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>

        <FormField label={t("typeLabel")}>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((v) => (
                <SelectItem key={v} value={v}>
                  {t(`type_${v}` as const)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={t("descriptionLabel")} error={errors.description}>
          <Textarea rows={4} placeholder={t("descriptionPlaceholder")} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("startsAtLabel")} error={errors.startsAt}>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </FormField>
          <FormField label={t("endsAtLabel")} error={errors.endsAt}>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("venueLabel")}>
            <Input placeholder={t("venuePlaceholder")} value={venue} onChange={(e) => setVenue(e.target.value)} />
          </FormField>
          <FormField label={t("addressLabel")}>
            <Input placeholder={t("addressPlaceholder")} value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("capacityLabel")}>
            <Input type="number" min={1} placeholder={t("capacityPlaceholder")} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </FormField>
          <FormField label={t("priceLabel")}>
            <Input type="number" min={0} step={1000} placeholder={t("pricePlaceholder")} value={priceMnt} onChange={(e) => setPriceMnt(e.target.value)} />
          </FormField>
        </div>

        {ownedBusinessName && (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={asBusiness} onCheckedChange={(v) => setAsBusiness(v === true)} />
            {t("asBusinessLabel", { name: ownedBusinessName })}
          </label>
        )}

        <Button type="submit" disabled={saveMutation.isPending} className="w-full rounded-full font-semibold">
          {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
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
                {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {t("deleteConfirmAction")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
