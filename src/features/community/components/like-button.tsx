"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

export function LikeButton({
  targetType,
  targetId,
  initialLiked,
  initialCount,
}: {
  targetType: "post" | "comment";
  targetId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const t = useTranslations("community");
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  const basePath = targetType === "post" ? `/api/community/posts/${targetId}/like` : `/api/community/comments/${targetId}/like`;

  const mutation = useMutation({
    mutationFn: async (nextLiked: boolean) => {
      const res = await fetch(basePath, { method: nextLiked ? "POST" : "DELETE" });
      if (res.status === 401) throw new Error("auth");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onError: (err: Error, nextLiked) => {
      // Roll back the optimistic update.
      setLiked(!nextLiked);
      setCount((c) => (nextLiked ? c - 1 : c + 1));
      if (err.message === "auth") {
        router.push("/login");
        return;
      }
      toast.error(err.message);
    },
  });

  function toggle() {
    const next = !liked;
    setLiked(next);
    setCount((c) => (next ? c + 1 : c - 1));
    mutation.mutate(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      className={cn(
        "flex items-center gap-1.5 text-sm font-semibold transition-colors",
        liked ? "text-danger" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Heart className={cn("size-4.5", liked && "fill-danger")} aria-hidden="true" />
      {count}
    </button>
  );
}
