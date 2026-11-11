// Community domain service. Posts/comments are publicly readable — the
// feed is a public timeline, not a private space — but every write
// (create/delete/like/follow) is scoped to a userId taken from the
// session server-side, same ownership pattern as every other module.

import type { Image } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/services/notification-service";

export const MAX_POST_IMAGES = 4;
const FEED_PAGE_SIZE = 20;

const authorSelect = { id: true, name: true, image: true } as const;

const postInclude = (viewerId?: string) => ({
  author: { select: authorSelect },
  pet: { select: { id: true, name: true } },
  images: { orderBy: { order: "asc" as const } },
  _count: { select: { comments: true, likes: true } },
  likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
});

function shapePost<T extends { likes?: { id: string }[] | false }>(post: T) {
  const { likes, ...rest } = post;
  return { ...rest, likedByViewer: Array.isArray(likes) && likes.length > 0 };
}

// ── feed ─────────────────────────────────────────────────────────────────────

export interface FeedFilters {
  viewerId?: string;
  followingOnly?: boolean;
  cursor?: string;
}

export async function getFeedPosts({ viewerId, followingOnly, cursor }: FeedFilters) {
  const authorId =
    followingOnly && viewerId
      ? { in: [...(await getFollowingIds(viewerId)), viewerId] }
      : undefined;

  const posts = await prisma.post.findMany({
    where: { authorId },
    include: postInclude(viewerId),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = posts.length > FEED_PAGE_SIZE;
  const page = posts.slice(0, FEED_PAGE_SIZE).map(shapePost);
  return { posts: page, nextCursor: hasMore ? page[page.length - 1]?.id : null };
}

export async function getPostById(id: string, viewerId?: string) {
  const post = await prisma.post.findUnique({ where: { id }, include: postInclude(viewerId) });
  return post ? shapePost(post) : null;
}

export interface PostWriteInput {
  body?: string | null;
  petId?: string | null;
}

export async function createPost(authorId: string, input: PostWriteInput) {
  return prisma.post.create({
    data: { authorId, body: input.body || null, petId: input.petId || null },
  });
}

export async function deletePost(id: string, authorId: string): Promise<boolean> {
  const existing = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing || existing.authorId !== authorId) return false;
  // Images, comments and likes all cascade away with the post — see the
  // onDelete: Cascade relations in schema.prisma.
  await prisma.post.delete({ where: { id } });
  return true;
}

export type AddPostImageResult =
  | { ok: true; image: Image }
  | { ok: false; reason: "not_found" | "limit_reached" };

export async function addPostImage(
  postId: string,
  authorId: string,
  url: string,
  publicId?: string,
): Promise<AddPostImageResult> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, _count: { select: { images: true } } },
  });
  if (!post || post.authorId !== authorId) return { ok: false, reason: "not_found" };
  if (post._count.images >= MAX_POST_IMAGES) return { ok: false, reason: "limit_reached" };

  const image = await prisma.image.create({
    data: { url, publicId, postId, order: post._count.images },
  });
  return { ok: true, image };
}

// ── comments ─────────────────────────────────────────────────────────────────

export async function getComments(postId: string, viewerId?: string) {
  const rows = await prisma.comment.findMany({
    where: { postId },
    include: {
      author: { select: authorSelect },
      _count: { select: { likes: true } },
      likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
    },
    orderBy: { createdAt: "asc" },
  });

  const shaped = rows.map(shapePost);
  const byParent = new Map<string, typeof shaped>();
  for (const c of shaped) {
    const key = c.parentId ?? "root";
    byParent.set(key, [...(byParent.get(key) ?? []), c]);
  }
  const topLevel = byParent.get("root") ?? [];
  // Replies are flattened one level deep in the UI, but every comment still
  // carries a `replies` array (empty for a reply itself) so the shape is
  // uniform for the client's recursive CommentData type.
  return topLevel.map((c) => ({
    ...c,
    replies: (byParent.get(c.id) ?? []).map((r) => ({ ...r, replies: [] })),
  }));
}

export async function createComment(
  postId: string,
  authorId: string,
  input: { body: string; parentId?: string | null },
) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) return null;

  const comment = await prisma.comment.create({
    data: { postId, authorId, body: input.body, parentId: input.parentId || null },
  });

  if (post.authorId !== authorId) {
    await createNotification(post.authorId, {
      type: "COMMENT",
      title: "New comment on your post",
      body: input.body.slice(0, 140),
      href: `/community/${postId}`,
    });
  }

  return comment;
}

export async function deleteComment(id: string, authorId: string): Promise<boolean> {
  const existing = await prisma.comment.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing || existing.authorId !== authorId) return false;
  await prisma.comment.delete({ where: { id } });
  return true;
}

// ── likes ────────────────────────────────────────────────────────────────────

export async function likePost(userId: string, postId: string): Promise<boolean> {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) return false;

  const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) return true;

  await prisma.like.create({ data: { userId, postId } });
  if (post.authorId !== userId) {
    await createNotification(post.authorId, {
      type: "LIKE",
      title: "Someone liked your post",
      href: `/community/${postId}`,
    });
  }
  return true;
}

export async function unlikePost(userId: string, postId: string): Promise<void> {
  await prisma.like.deleteMany({ where: { userId, postId } });
}

export async function likeComment(userId: string, commentId: string): Promise<boolean> {
  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true } });
  if (!comment) return false;

  const existing = await prisma.like.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });
  if (existing) return true;

  await prisma.like.create({ data: { userId, commentId } });
  return true;
}

export async function unlikeComment(userId: string, commentId: string): Promise<void> {
  await prisma.like.deleteMany({ where: { userId, commentId } });
}

// ── follow ───────────────────────────────────────────────────────────────────

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;
  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) return false;

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (existing) return true;

  await prisma.follow.create({ data: { followerId, followingId } });
  await createNotification(followingId, {
    type: "FOLLOW",
    title: "You have a new follower",
    href: "/community",
  });
  return true;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return Boolean(existing);
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const rows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
  return rows.map((r) => r.followingId);
}
