"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

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

export function DeletePostButton({ postId }: { postId: string }) {
  const t = useTranslations("community");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("deletePostSuccess"));
      window.location.href = `/${locale}/community`;
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full font-semibold text-danger hover:bg-danger-soft"
        >
          <Trash2 className="size-4" />
          {t("deletePostButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("deletePostConfirmTitle")}</DialogTitle>
          <DialogDescription>{t("deletePostConfirmDesc")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
            {t("cancelButton")}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-full bg-danger font-semibold text-white hover:bg-danger/90"
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {t("deletePostConfirmAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
