"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BadgeCheck,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  Star,
  ThumbsUp,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { RatingStars } from "@/components/shared/rating-stars";
import { ReportDialog } from "@/features/reports/components/report-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/shared/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewSort, ReviewView } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReviewsSection({
  businessSlug,
  ratingAvg,
  ratingCount,
  ratingBreakdown,
  initialReviews,
}: {
  businessSlug: string;
  ratingAvg: number;
  ratingCount: number;
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  initialReviews: ReviewView[];
}) {
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  const { data: reviews = initialReviews, isFetching } = useQuery<ReviewView[]>({
    queryKey: ["reviews", businessSlug, sort],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${businessSlug}/reviews?sort=${sort}`);
      if (!res.ok) throw new Error("Failed to load reviews");
      const data = (await res.json()) as { reviews: ReviewView[] };
      return data.reviews;
    },
    initialData: sort === "newest" ? initialReviews : undefined,
    staleTime: 60_000,
  });

  const totalBreakdown = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 id="reviews-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Reviews
        </h2>
        <WriteReviewButton businessSlug={businessSlug} />
      </div>

      {/* summary */}
      <div className="grid gap-6 rounded-3xl border bg-card p-6 sm:grid-cols-[auto_1fr] sm:gap-10">
        <div className="text-center sm:text-left">
          <p className="text-5xl font-extrabold tracking-tight">{ratingAvg.toFixed(1)}</p>
          <RatingStars rating={ratingAvg} className="mt-2" size="size-4.5" />
          <p className="mt-1.5 text-sm text-muted-foreground">
            {ratingCount} verified review{ratingCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="space-y-1.5" aria-label="Rating distribution">
          {([5, 4, 3, 2, 1] as const).map((stars) => {
            const count = ratingBreakdown[stars] ?? 0;
            const pct = Math.round((count / totalBreakdown) * 100);
            return (
              <div key={stars} className="flex items-center gap-3 text-sm">
                <span className="w-3 shrink-0 text-right font-semibold">{stars}</span>
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
                  role="img"
                  aria-label={`${stars} stars: ${pct}% of reviews`}
                >
                  <div
                    className="h-full rounded-full bg-warning transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-xs text-muted-foreground">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* sort */}
      <div className="mt-6 mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isFetching ? "Loading…" : `Showing ${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
        </p>
        <Select value={sort} onValueChange={(v) => setSort(v as ReviewSort)}>
          <SelectTrigger size="sm" className="w-36 rounded-full text-[13px]" aria-label="Sort reviews">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="highest">Highest rated</SelectItem>
            <SelectItem value="lowest">Lowest rated</SelectItem>
            <SelectItem value="helpful">Most helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* list */}
      {isFetching && reviews.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => {
            const voted = helpfulVotes[review.id];
            return (
              <li key={review.id} className="rounded-3xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-brand-soft font-bold text-brand">
                        {review.authorName.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-bold">
                        {review.authorName}
                        {review.isVerified && (
                          <Badge
                            variant="secondary"
                            className="gap-1 rounded-full text-[10px] font-semibold text-success"
                          >
                            <BadgeCheck className="size-3" aria-hidden="true" />
                            Verified visit
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <RatingStars rating={review.rating} />
                </div>

                <p className="mt-3 text-sm leading-relaxed">{review.body}</p>

                {review.photos.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {review.photos.map((photo) => (
                      <div key={photo} className="relative size-20 overflow-hidden rounded-xl">
                        <Image src={photo} alt="Review photo" fill sizes="5rem" className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {review.reply && (
                  <div className="mt-4 rounded-2xl bg-secondary p-4">
                    <p className="text-xs font-bold">Response from the business</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {review.reply}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setHelpfulVotes((prev) => ({ ...prev, [review.id]: !voted }))
                    }
                    aria-pressed={voted}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      voted
                        ? "border-brand/40 bg-brand-soft text-brand"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <ThumbsUp className={cn("size-3.5", voted && "fill-current")} aria-hidden="true" />
                    Helpful ({review.helpfulCount + (voted ? 1 : 0)})
                  </button>
                  <ReportDialog targetType="review" targetId={review.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const reviewFormSchema = z.object({
  rating: z.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(20, "Reviews need at least 20 characters").max(2000),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

type Eligibility =
  | { eligible: true }
  | { eligible: false; reason: "no_completed_appointment" | "already_reviewed" };

function WriteReviewButton({ businessSlug }: { businessSlug: string }) {
  const { status: sessionStatus } = useSession();
  const signedIn = sessionStatus === "authenticated";
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const { data: eligibility, isFetching: loadingEligibility } = useQuery<Eligibility>({
    queryKey: ["review-eligibility", businessSlug],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${businessSlug}/reviews/eligibility`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to check eligibility");
      return data as Eligibility;
    },
    enabled: signedIn && open,
    staleTime: 30_000,
  });

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 0, title: "", body: "" },
  });
  const rating = form.watch("rating");

  const submitMutation = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      const res = await fetch(`/api/businesses/${businessSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit review");
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["reviews", businessSlug] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function reset() {
    setSubmitted(false);
    form.reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full font-semibold">
          <MessageSquarePlus className="size-4" />
          Write a review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {!signedIn ? (
          <>
            <DialogHeader>
              <DialogTitle>Sign in to review</DialogTitle>
              <DialogDescription>
                Reviews on PetNet are tied to real visits, which keeps them
                trustworthy. Sign in to share your experience.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Button className="w-full rounded-full font-semibold" asChild>
                <Link href={`/login?next=/business/${businessSlug}`}>Log in</Link>
              </Button>
              <Button variant="outline" className="w-full rounded-full font-semibold" asChild>
                <Link href="/register">Create account</Link>
              </Button>
            </div>
          </>
        ) : submitted ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden="true" />
            <DialogHeader className="mt-4">
              <DialogTitle className="text-center text-xl">Review published</DialogTitle>
              <DialogDescription className="text-center">
                Thanks for sharing your experience — it&apos;s marked as a verified visit.
              </DialogDescription>
            </DialogHeader>
            <Button className="mt-6 w-full rounded-full font-semibold" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : loadingEligibility ? (
          <div className="py-10 text-center">
            <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
          </div>
        ) : eligibility && !eligibility.eligible ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {eligibility.reason === "already_reviewed"
                  ? "You've already reviewed this business"
                  : "Reviews require a completed visit"}
              </DialogTitle>
              <DialogDescription>
                {eligibility.reason === "already_reviewed"
                  ? "You can only leave one review per business."
                  : "Once a business marks one of your bookings as completed, you'll be able to leave a verified review here."}
              </DialogDescription>
            </DialogHeader>
            {eligibility.reason === "no_completed_appointment" && (
              <Button variant="outline" className="w-full rounded-full font-semibold" asChild>
                <Link href="/bookings">View my bookings</Link>
              </Button>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Write a review</DialogTitle>
              <DialogDescription>
                Your review will be marked as a verified visit.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit((values) => submitMutation.mutate(values))}
              className="space-y-4"
              noValidate
            >
              <FormField label="Rating" error={form.formState.errors.rating?.message}>
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} star${n === 1 ? "" : "s"}`}
                      onClick={() => form.setValue("rating", n, { shouldValidate: true })}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          "size-7 transition-colors",
                          n <= rating ? "fill-warning text-warning" : "fill-muted text-muted",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Title (optional)">
                <input
                  className="h-10 w-full rounded-xl border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                  placeholder="Sum it up in a few words"
                  {...form.register("title")}
                />
              </FormField>
              <FormField label="Your review" error={form.formState.errors.body?.message}>
                <Textarea
                  rows={4}
                  placeholder="What was your experience like?"
                  {...form.register("body")}
                />
              </FormField>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full rounded-full font-semibold"
              >
                {submitMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Publish review
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
