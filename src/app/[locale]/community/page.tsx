import type { Metadata } from "next";
import { MessageSquare, Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { CommunityFeed } from "@/features/community/components/community-feed";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getFeedPosts } from "@/server/services/community-service";

// A public timeline that changes with every post/like/comment — never
// prerender or cache it.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "community" });
  return { title: t("title") };
}

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { filter } = await searchParams;
  const t = await getTranslations("community");
  const session = await auth();

  const followingOnly = filter === "following" && Boolean(session?.user);
  const { posts, nextCursor } = await getFeedPosts({
    viewerId: session?.user?.id,
    followingOnly,
  });

  const serialized = posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));

  const pillClass = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
      active ? "border-brand bg-brand text-white" : "border-border bg-card hover:bg-secondary",
    );

  return (
    <div className="container-page max-w-2xl py-8 lg:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button className="rounded-full font-semibold" asChild>
          <Link href="/community/new">
            <Plus className="size-4" />
            {t("newPostButton")}
          </Link>
        </Button>
      </div>

      {session?.user && (
        <div className="mb-6 flex items-center gap-2">
          <Link href="/community" className={pillClass(!followingOnly)}>
            {t("filterAll")}
          </Link>
          <Link href="/community?filter=following" className={pillClass(followingOnly)}>
            {t("filterFollowing")}
          </Link>
        </div>
      )}

      {serialized.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={followingOnly ? t("emptyFollowingTitle") : t("emptyTitle")}
          description={followingOnly ? t("emptyFollowingDesc") : t("emptyDesc")}
          action={
            <Button className="rounded-full font-semibold" asChild>
              <Link href="/community/new">
                <Plus className="size-4" />
                {t("newPostButton")}
              </Link>
            </Button>
          }
        />
      ) : (
        <CommunityFeed initialPosts={serialized} initialCursor={nextCursor} followingOnly={followingOnly} />
      )}
    </div>
  );
}
