import type { MetadataRoute } from "next";

import { SITE } from "@/lib/constants";
import { getAllBusinessSlugs } from "@/server/services/business-service";
import { CATEGORIES } from "@/server/data/taxonomy";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const slugs = await getAllBusinessSlugs();

  return [
    {
      url: SITE.url,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE.url}/map`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    ...CATEGORIES.map((c) => ({
      url: `${SITE.url}/map?category=${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...slugs.map((slug) => ({
      url: `${SITE.url}/business/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
