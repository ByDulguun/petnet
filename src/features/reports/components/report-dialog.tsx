"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Flag, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";

type Reason = "SPAM" | "OFFENSIVE" | "FAKE" | "OTHER";

export function ReportDialog({
  targetType,
  targetId,
  trigger,
}: {
  targetType: "business" | "review";
  targetId: string;
  trigger?: React.ReactNode;
}) {
  const t = useTranslations("reportDialog");
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("SPAM");
  const [details, setDetails] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, details: details || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => {
      toast.success(t("submitSuccess"));
      setOpen(false);
      setDetails("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const defaultTrigger = (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-danger"
    >
      <Flag className="size-3.5" aria-hidden="true" />
      {t("reportButton")}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {signedIn ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {targetType === "business" ? t("titleBusiness") : t("titleReview")}
              </DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Select value={reason} onValueChange={(v) => setReason(v as Reason)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPAM">{t("reasonSpam")}</SelectItem>
                  <SelectItem value="OFFENSIVE">{t("reasonOffensive")}</SelectItem>
                  <SelectItem value="FAKE">{t("reasonFake")}</SelectItem>
                  <SelectItem value="OTHER">{t("reasonOther")}</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder={t("detailsPlaceholder")}
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
                {t("cancelButton")}
              </Button>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="rounded-full font-semibold"
              >
                {submitMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {t("submitButton")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("signInTitle")}</DialogTitle>
              <DialogDescription>{t("signInDesc")}</DialogDescription>
            </DialogHeader>
            <Button className="w-full rounded-full font-semibold" asChild>
              <Link href="/login">{t("signInButton")}</Link>
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
