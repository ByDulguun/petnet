"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Loader2, Save, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
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

function hardNavigate(href: string) {
  window.location.href = href;
}

export interface BreedFormInitial {
  id: string;
  name: string;
  nameMn: string;
  species: "DOG" | "CAT" | "OTHER";
  summary: string;
  history: string;
  temperament: string; // comma-joined for the input
  exerciseNeeds: string;
  groomingNeeds: string;
  trainability: string;
  friendliness: string;
  sheddingLevel: string;
  nutrition: string;
  healthOverview: string;
  commonDiseases: string;
  lifeExpectancy: string;
  weightRange: string;
  heightRange: string;
  pros: string;
  cons: string;
  coverImage: string | null;
}

const RATING_FIELDS = [
  ["exerciseNeeds", "exerciseNeeds"],
  ["groomingNeeds", "groomingNeeds"],
  ["trainability", "trainability"],
  ["friendliness", "friendliness"],
  ["sheddingLevel", "sheddingLevel"],
] as const;

export function BreedForm({ initial }: { initial?: BreedFormInitial }) {
  const t = useTranslations("adminBreeds");
  const isEdit = Boolean(initial);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [nameMn, setNameMn] = useState(initial?.nameMn ?? "");
  const [species, setSpecies] = useState<"DOG" | "CAT" | "OTHER">(initial?.species ?? "DOG");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [history, setHistory] = useState(initial?.history ?? "");
  const [temperament, setTemperament] = useState(initial?.temperament ?? "");
  const [ratings, setRatings] = useState<Record<string, string>>({
    exerciseNeeds: initial?.exerciseNeeds ?? "",
    groomingNeeds: initial?.groomingNeeds ?? "",
    trainability: initial?.trainability ?? "",
    friendliness: initial?.friendliness ?? "",
    sheddingLevel: initial?.sheddingLevel ?? "",
  });
  const [nutrition, setNutrition] = useState(initial?.nutrition ?? "");
  const [healthOverview, setHealthOverview] = useState(initial?.healthOverview ?? "");
  const [commonDiseases, setCommonDiseases] = useState(initial?.commonDiseases ?? "");
  const [lifeExpectancy, setLifeExpectancy] = useState(initial?.lifeExpectancy ?? "");
  const [weightRange, setWeightRange] = useState(initial?.weightRange ?? "");
  const [heightRange, setHeightRange] = useState(initial?.heightRange ?? "");
  const [pros, setPros] = useState(initial?.pros ?? "");
  const [cons, setCons] = useState(initial?.cons ?? "");
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
      form.set("name", name);
      form.set("nameMn", nameMn);
      form.set("species", species);
      form.set("summary", summary);
      form.set("history", history);
      form.set("temperament", temperament);
      for (const [key, field] of RATING_FIELDS) form.set(key, ratings[field]);
      form.set("nutrition", nutrition);
      form.set("healthOverview", healthOverview);
      form.set("commonDiseases", commonDiseases);
      form.set("lifeExpectancy", lifeExpectancy);
      form.set("weightRange", weightRange);
      form.set("heightRange", heightRange);
      form.set("pros", pros);
      form.set("cons", cons);
      if (coverFile) form.set("cover", coverFile);

      const res = await fetch(isEdit ? `/api/admin/breeds/${initial!.id}` : "/api/admin/breeds", {
        method: isEdit ? "PATCH" : "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.issues) setErrors(Object.fromEntries(Object.entries(data.issues).map(([k, v]) => [k, (v as string[])[0]])));
        throw new Error(data.error ?? t("genericError"));
      }
      return data.breed as { id: string; slug: string };
    },
    onSuccess: () => {
      toast.success(isEdit ? t("updateSuccess") : t("createSuccess"));
      hardNavigate("/admin/breeds");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/breeds/${initial!.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      hardNavigate("/admin/breeds");
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
              <Button type="button" variant="outline" size="sm" className="rounded-full font-semibold" onClick={() => fileInputRef.current?.click()}>
                <Camera className="size-4" />
                {t("uploadPhotoButton")}
              </Button>
            </div>
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("nameLabel")} error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label={t("nameMnLabel")}>
            <Input value={nameMn} onChange={(e) => setNameMn(e.target.value)} />
          </FormField>
        </div>

        <FormField label={t("speciesLabel")}>
          <Select value={species} onValueChange={(v) => setSpecies(v as typeof species)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DOG">{t("speciesDog")}</SelectItem>
              <SelectItem value="CAT">{t("speciesCat")}</SelectItem>
              <SelectItem value="OTHER">{t("speciesOther")}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={t("summaryLabel")} error={errors.summary}>
          <Textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </FormField>

        <FormField label={t("historyLabel")}>
          <Textarea rows={3} value={history} onChange={(e) => setHistory(e.target.value)} />
        </FormField>

        <FormField label={t("temperamentLabel")} hint={t("csvHint")}>
          <Input value={temperament} onChange={(e) => setTemperament(e.target.value)} placeholder={t("temperamentPlaceholder")} />
        </FormField>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {RATING_FIELDS.map(([key, field]) => (
            <FormField key={key} label={t(`rating_${key}` as const)}>
              <Select
                value={ratings[field] || "none"}
                onValueChange={(v) => setRatings((prev) => ({ ...prev, [field]: v === "none" ? "" : v }))}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("notRated")}</SelectItem>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / 5
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ))}
        </div>

        <FormField label={t("nutritionLabel")}>
          <Textarea rows={3} value={nutrition} onChange={(e) => setNutrition(e.target.value)} />
        </FormField>

        <FormField label={t("healthOverviewLabel")}>
          <Textarea rows={3} value={healthOverview} onChange={(e) => setHealthOverview(e.target.value)} />
        </FormField>

        <FormField label={t("commonDiseasesLabel")} hint={t("csvHint")}>
          <Input value={commonDiseases} onChange={(e) => setCommonDiseases(e.target.value)} />
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField label={t("lifeExpectancyLabel")}>
            <Input value={lifeExpectancy} onChange={(e) => setLifeExpectancy(e.target.value)} placeholder={t("lifeExpectancyPlaceholder")} />
          </FormField>
          <FormField label={t("weightRangeLabel")}>
            <Input value={weightRange} onChange={(e) => setWeightRange(e.target.value)} placeholder={t("weightRangePlaceholder")} />
          </FormField>
          <FormField label={t("heightRangeLabel")}>
            <Input value={heightRange} onChange={(e) => setHeightRange(e.target.value)} placeholder={t("heightRangePlaceholder")} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("prosLabel")} hint={t("csvHint")}>
            <Textarea rows={2} value={pros} onChange={(e) => setPros(e.target.value)} />
          </FormField>
          <FormField label={t("consLabel")} hint={t("csvHint")}>
            <Textarea rows={2} value={cons} onChange={(e) => setCons(e.target.value)} />
          </FormField>
        </div>

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
