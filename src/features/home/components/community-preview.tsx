import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Heart, MessageCircle } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { Link } from "@/i18n/navigation";
import type { PostSummary } from "@/lib/types";

export async function CommunityPreview({ posts }: { posts: PostSummary[] }) {
  const t = await getTranslations("home.community");

  return (
    <section className="bg-card py-16 lg:py-20" aria-labelledby="community">
      <div className="container-page">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
          href="/community"
          hrefLabel={t("cta")}
        />

        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {posts.map((post) => (
            <StaggerItem key={post.id}>
              <Link
                href={`/community/post/${post.id}`}
                className="group relative block aspect-square overflow-hidden rounded-2xl"
              >
                <Image
                  src={post.imageUrl}
                  alt={t("postAlt", { pet: post.petName, author: post.authorName })}
                  fill
                  sizes="(min-width: 1024px) 12rem, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/0 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="truncate text-sm font-bold text-white">{post.petName}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs font-medium text-white/90">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3.5 fill-current" aria-hidden="true" />
                      {post.likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="size-3.5" aria-hidden="true" />
                      {post.commentCount}
                    </span>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
