"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function RsvpButton({
  eventId,
  initialAttending,
  isFull,
  isLoggedIn,
}: {
  eventId: string;
  initialAttending: boolean;
  isFull: boolean;
  isLoggedIn: boolean;
}) {
  const t = useTranslations("events");
  const [attending, setAttending] = useState(initialAttending);

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await fetch(`/api/events/${eventId}/rsvp`, { method: next ? "POST" : "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: (_data, next) => {
      setAttending(next);
      toast.success(next ? t("rsvpSuccess") : t("cancelRsvpSuccess"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!isLoggedIn) {
    return (
      <Button className="w-full rounded-full font-semibold" asChild>
        <Link href={`/login?next=/events/${eventId}`}>{t("loginToRsvp")}</Link>
      </Button>
    );
  }

  if (!attending && isFull) {
    return (
      <Button disabled className="w-full rounded-full font-semibold">
        {t("full")}
      </Button>
    );
  }

  return (
    <Button
      variant={attending ? "outline" : "default"}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(!attending)}
      className={cn("w-full rounded-full font-semibold", attending && "border-success/40 text-success")}
    >
      {mutation.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : attending ? (
        <Check className="size-4" />
      ) : null}
      {attending ? t("attendingButton") : t("rsvpButton")}
    </Button>
  );
}
