"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FollowButton({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const t = useTranslations("community");
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await fetch(`/api/community/users/${userId}/follow`, {
        method: next ? "POST" : "DELETE",
      });
      if (res.status === 401) throw new Error("auth");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: (_data, next) => setFollowing(next),
    onError: (err: Error) => {
      if (err.message === "auth") {
        router.push("/login");
        return;
      }
      toast.error(err.message);
    },
  });

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(!following)}
      className={cn("rounded-full font-semibold", !following && "bg-brand hover:bg-brand/90")}
    >
      {mutation.isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        !following && <UserPlus className="size-3.5" />
      )}
      {following ? t("followingButton") : t("followButton")}
    </Button>
  );
}
