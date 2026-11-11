import type { Metadata } from "next";
import { ChevronLeft, PawPrint } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/shared/relative-time";
import { CommentSection } from "@/features/community/components/comment-section";
import { DeletePostButton } from "@/features/community/components/delete-post-button";
import { FollowButton } from "@/features/community/components/follow-button";
import { LikeButton } from "@/features/community/components/like-button";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import {
  getComments,
  getPostById,
  isFollowing,
} from "@/server/services/community-service";

// Likes/comments/follow state change any time — never prerender or cache.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "community" });
  const post = await getPostById(id);
  if (!post) return { title: t("title") };
  return { title: `${post.author.name ?? t("someone")} — ${t("title")}` };
}

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("community");

  const [post, session] = await Promise.all([getPostById(id), auth()]);
  if (!post) notFound();

  const viewerId = session?.user?.id;
  const isOwner = viewerId === post.author.id;
  const [comments, alreadyFollowing] = await Promise.all([
    getComments(id, viewerId),
    viewerId && !isOwner ? isFollowing(viewerId, post.author.id) : Promise.resolve(false),
  ]);

  const authorName = post.author.name ?? t("someone");
  const initial = authorName.trim().charAt(0).toUpperCase() || "?";

  const serializedComments = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  }));

  return (
    <div className="container-page max-w-2xl py-8 lg:py-12">
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToFeed")}
      </Link>

      <article className="mt-4 rounded-3xl border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {post.author.image && <AvatarImage src={post.author.image} alt="" />}
              <AvatarFallback className="bg-brand-soft font-bold text-brand">{initial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-bold">{authorName}</p>
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

          <div className="flex items-center gap-2">
            {viewerId && !isOwner && (
              <FollowButton userId={post.author.id} initialFollowing={alreadyFollowing} />
            )}
            {isOwner && <DeletePostButton postId={post.id} />}
          </div>
        </div>

        {post.body && (
          <p className="mt-4 leading-relaxed whitespace-pre-line">{post.body}</p>
        )}

        {post.images.length > 0 && (
          <div
            className={
              post.images.length === 1
                ? "mt-4 overflow-hidden rounded-2xl"
                : "mt-4 grid grid-cols-2 gap-1.5 overflow-hidden rounded-2xl"
            }
          >
            {post.images.map((img) => (
              <div key={img.id} className="relative aspect-square">
                <Image src={img.url} alt="" fill sizes="(min-width: 640px) 42rem, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 border-t pt-4">
          <LikeButton
            targetType="post"
            targetId={post.id}
            initialLiked={post.likedByViewer}
            initialCount={post._count.likes}
          />
        </div>
      </article>

      <div className="mt-8">
        <CommentSection postId={post.id} viewerId={viewerId} initial={serializedComments} />
      </div>
    </div>
  );
}
