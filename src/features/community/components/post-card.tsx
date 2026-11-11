"use client";

import { MessageCircle, PawPrint } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/shared/relative-time";
import { LikeButton } from "@/features/community/components/like-button";
import { Link } from "@/i18n/navigation";

export interface PostCardData {
  id: string;
  body: string | null;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  pet: { id: string; name: string } | null;
  images: { id: string; url: string }[];
  _count: { comments: number; likes: number };
  likedByViewer: boolean;
}

export function PostCard({ post }: { post: PostCardData }) {
  const t = useTranslations("community");
  const authorName = post.author.name ?? t("someone");
  const initial = authorName.trim().charAt(0).toUpperCase() || "?";

  return (
    <article className="rounded-3xl border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Avatar>
          {post.author.image && <AvatarImage src={post.author.image} alt="" />}
          <AvatarFallback className="bg-brand-soft font-bold text-brand">{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{authorName}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <RelativeTime date={post.createdAt} />
            {post.pet && (
              <>
                <span aria-hidden="true">·</span>
                <PawPrint className="size-3" aria-hidden="true" />
                {post.pet.name}
              </>
            )}
          </p>
        </div>
      </div>

      {post.body && (
        <p className="mt-3 leading-relaxed whitespace-pre-line">
          <Link href={`/community/${post.id}`} className="hover:underline">
            {post.body}
          </Link>
        </p>
      )}

      {post.images.length > 0 && (
        <Link
          href={`/community/${post.id}`}
          className={
            post.images.length === 1
              ? "mt-3 block overflow-hidden rounded-2xl"
              : "mt-3 grid grid-cols-2 gap-1.5 overflow-hidden rounded-2xl"
          }
        >
          {post.images.slice(0, 4).map((img) => (
            <div key={img.id} className="relative aspect-square">
              <Image src={img.url} alt="" fill sizes="(min-width: 640px) 20rem, 50vw" className="object-cover" />
            </div>
          ))}
        </Link>
      )}

      <div className="mt-3 flex items-center gap-4 border-t pt-3">
        <LikeButton
          targetType="post"
          targetId={post.id}
          initialLiked={post.likedByViewer}
          initialCount={post._count.likes}
        />
        <Link
          href={`/community/${post.id}`}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <MessageCircle className="size-4.5" aria-hidden="true" />
          {post._count.comments}
        </Link>
      </div>
    </article>
  );
}
