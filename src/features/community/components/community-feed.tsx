"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { PostCard, type PostCardData } from "@/features/community/components/post-card";

export function CommunityFeed({
  initialPosts,
  initialCursor,
  followingOnly,
}: {
  initialPosts: PostCardData[];
  initialCursor: string | null;
  followingOnly: boolean;
}) {
  const t = useTranslations("community");
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);

  const loadMoreMutation = useMutation({
    mutationFn: async () => {
      const qs = new URLSearchParams();
      if (followingOnly) qs.set("filter", "following");
      if (cursor) qs.set("cursor", cursor);
      const res = await fetch(`/api/community/posts?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
      return data as { posts: PostCardData[]; nextCursor: string | null };
    },
    onSuccess: (data) => {
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
    },
  });

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {cursor && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            className="rounded-full font-semibold"
            disabled={loadMoreMutation.isPending}
            onClick={() => loadMoreMutation.mutate()}
          >
            {loadMoreMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("loadMoreButton")}
          </Button>
        </div>
      )}
    </div>
  );
}
