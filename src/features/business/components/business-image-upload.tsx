"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BusinessImageUpload({
  endpoint,
  responseKey,
  initialUrl,
  shape = "square",
}: {
  endpoint: "/api/business/logo" | "/api/business/cover";
  responseKey: "logoUrl" | "coverUrl";
  initialUrl: string | null;
  shape?: "square" | "wide";
}) {
  const t = useTranslations("businessProfile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
      return data[responseKey] as string;
    },
    onSuccess: (newUrl) => {
      setUrl(newUrl);
      toast.success(t("imageUploadSuccess"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("imageTooLarge"));
      return;
    }
    uploadMutation.mutate(file);
  }

  return (
    <div className="flex items-center gap-4">
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary",
          shape === "square" ? "size-20" : "h-20 w-36",
        )}
      >
        {url ? (
          <Image src={url} alt="" fill sizes="10rem" className="object-cover" />
        ) : (
          <ImageIcon className="size-7 text-muted-foreground" aria-hidden="true" />
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
          {t("uploadButton")}
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">{t("imageUploadHint")}</p>
      </div>
    </div>
  );
}
