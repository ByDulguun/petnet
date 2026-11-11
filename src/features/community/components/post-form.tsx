"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Loader2, Send, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MAX_POST_IMAGES } from "@/server/services/community-service";

export interface PostFormPet {
  id: string;
  name: string;
}

function hardNavigate(href: string) {
  window.location.href = href;
}

export function PostForm({ pets }: { pets: PostFormPet[] }) {
  const t = useTranslations("community");
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState("");
  const [petId, setPetId] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    const tooBig = picked.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      toast.error(t("photoTooLarge"));
      return;
    }
    setFiles((prev) => {
      const next = [...prev, ...picked].slice(0, MAX_POST_IMAGES);
      if (prev.length + picked.length > MAX_POST_IMAGES) {
        toast.error(t("photoLimitReached", { max: MAX_POST_IMAGES }));
      }
      return next;
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const postMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.set("body", body);
      form.set("petId", petId);
      files.forEach((f) => form.append("photos", f));

      const res = await fetch("/api/community/posts", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
      return data.post as { id: string };
    },
    onSuccess: (post) => {
      toast.success(t("postSuccess"));
      hardNavigate(`/${locale}/community/${post.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const canSubmit = body.trim().length > 0 || files.length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) postMutation.mutate();
      }}
      className="space-y-4 rounded-3xl border bg-card p-4 sm:p-5"
    >
      <Textarea
        rows={4}
        placeholder={t("bodyPlaceholder")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={src} className="group relative size-20 shrink-0 overflow-hidden rounded-2xl">
              <Image src={src} alt="" fill sizes="5rem" className="object-cover" />
              <button
                type="button"
                aria-label={t("removePhoto")}
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={onFilesSelected}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full font-semibold"
            disabled={files.length >= MAX_POST_IMAGES}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="size-4" />
            {t("addPhoto")}
          </Button>

          {pets.length > 0 && (
            <Select value={petId || "none"} onValueChange={(v) => setPetId(v === "none" ? "" : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder={t("tagPetLabel")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("tagPetNone")}</SelectItem>
                {pets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          type="submit"
          disabled={!canSubmit || postMutation.isPending}
          className="rounded-full font-semibold"
        >
          {postMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {t("postButton")}
        </Button>
      </div>
    </form>
  );
}
