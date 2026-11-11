"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Send, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/shared/relative-time";
import { Textarea } from "@/components/ui/textarea";
import { LikeButton } from "@/features/community/components/like-button";

export interface CommentData {
  id: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  author: { id: string; name: string | null; image: string | null };
  _count: { likes: number };
  likedByViewer: boolean;
  replies: CommentData[];
}

function CommentForm({
  postId,
  parentId,
  viewerId,
  onPosted,
  autoFocus,
}: {
  postId: string;
  parentId?: string;
  viewerId?: string;
  onPosted: (comment: CommentData) => void;
  autoFocus?: boolean;
}) {
  const t = useTranslations("community");
  const router = useRouter();
  const [body, setBody] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, parentId: parentId || undefined }),
      });
      if (res.status === 401) throw new Error("auth");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
      return data.comment;
    },
    onSuccess: (comment) => {
      setBody("");
      onPosted({
        ...comment,
        author: { id: viewerId ?? "", name: t("you"), image: null },
        _count: { likes: 0 },
        likedByViewer: false,
        replies: [],
      });
    },
    onError: (err: Error) => {
      if (err.message === "auth") {
        router.push("/login");
        return;
      }
      toast.error(err.message);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (body.trim()) mutation.mutate();
      }}
      className="flex items-start gap-2"
    >
      <Textarea
        rows={1}
        autoFocus={autoFocus}
        placeholder={t("commentPlaceholder")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-9 resize-none py-2"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!body.trim() || mutation.isPending}
        className="shrink-0 rounded-full"
      >
        {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </form>
  );
}

function CommentRow({
  comment,
  postId,
  viewerId,
  onReplyPosted,
  onDeleted,
}: {
  comment: CommentData;
  postId: string;
  viewerId?: string;
  onReplyPosted: (parentId: string, reply: CommentData) => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("community");
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const isOwn = viewerId && comment.author.id === viewerId;
  const authorName = comment.author.name ?? t("someone");
  const initial = authorName.trim().charAt(0).toUpperCase() || "?";

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/community/comments/${comment.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => onDeleted(comment.id),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex gap-2.5">
      <Avatar size="sm">
        {comment.author.image && <AvatarImage src={comment.author.image} alt="" />}
        <AvatarFallback className="bg-brand-soft text-xs font-bold text-brand">{initial}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-secondary px-3 py-2">
          <p className="text-sm font-bold">{authorName}</p>
          <p className="text-sm leading-relaxed whitespace-pre-line">{comment.body}</p>
        </div>
        <div className="mt-1 flex items-center gap-3 pl-3 text-xs">
          <RelativeTime date={comment.createdAt} className="text-muted-foreground" />
          <LikeButton
            targetType="comment"
            targetId={comment.id}
            initialLiked={comment.likedByViewer}
            initialCount={comment._count.likes}
          />
          {!comment.parentId && (
            <button
              type="button"
              onClick={() => {
                if (!viewerId) {
                  router.push("/login");
                  return;
                }
                setReplying((v) => !v);
              }}
              className="font-semibold text-muted-foreground hover:text-foreground"
            >
              {t("replyButton")}
            </button>
          )}
          {isOwn && (
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="font-semibold text-muted-foreground hover:text-danger"
              aria-label={t("deleteCommentButton")}
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2 pl-3">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              viewerId={viewerId}
              autoFocus
              onPosted={(reply) => {
                onReplyPosted(comment.id, reply);
                setReplying(false);
              }}
            />
          </div>
        )}

        {comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l pl-3">
            {comment.replies.map((reply) => (
              <CommentRow
                key={reply.id}
                comment={reply}
                postId={postId}
                viewerId={viewerId}
                onReplyPosted={onReplyPosted}
                onDeleted={onDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentSection({
  postId,
  viewerId,
  initial,
}: {
  postId: string;
  viewerId?: string;
  initial: CommentData[];
}) {
  const t = useTranslations("community");
  const [comments, setComments] = useState(initial);

  function addTopLevel(comment: CommentData) {
    setComments((prev) => [...prev, comment]);
  }

  function addReply(parentId: string, reply: CommentData) {
    setComments((prev) =>
      prev.map((c) => (c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c)),
    );
  }

  function removeComment(id: string) {
    setComments((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) })),
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">{t("commentsHeading", { count: comments.length })}</h2>

      {viewerId ? (
        <CommentForm postId={postId} viewerId={viewerId} onPosted={addTopLevel} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("loginToComment")}</p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noComments")}</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              postId={postId}
              viewerId={viewerId}
              onReplyPosted={addReply}
              onDeleted={removeComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
