// Business domain service.
// Backed by Postgres via Prisma. Every exported function keeps the return
// shape the fixture-era version had — only the data source changed, so
// nothing downstream (API routes, the business detail page) needed to know
// how a business was fetched, only that fetching is now async.

import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Prisma } from "@prisma/client";

import { boundsOf, estimateTravelMinutes, haversineKm, UB_CENTER } from "@/lib/geo";
import { getOpenStatus, isOpen24Hours } from "@/lib/hours";
import type {
  BookingSlot,
  BusinessDetail,
  BusinessListItem,
  BusinessSearchParams,
  BusinessSearchResult,
  ReviewSort,
  ReviewView,
  SearchSuggestion,
} from "@/lib/types";
import { prisma } from "@/lib/prisma";
import type { BusinessRow } from "@/server/data/business-fixtures";
import { AMENITIES, CATEGORIES, DISTRICTS, getAmenity, getCategory } from "@/server/data/taxonomy";

// ── data source (Prisma → BusinessRow) ──────────────────────────────────────

const businessInclude = {
  category: true,
  amenities: { include: { amenity: true } },
  hours: true,
  holidays: true,
  media: { orderBy: { order: "asc" } },
  faqs: { orderBy: { order: "asc" } },
  staff: true,
  services: { where: { isActive: true }, include: { category: true } },
  reviews: {
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, image: true } }, media: true },
  },
} satisfies Prisma.BusinessInclude;

type BusinessWithRelations = Prisma.BusinessGetPayload<{ include: typeof businessInclude }>;

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Maps a Prisma row (with all relations included) into the pure BusinessRow shape every existing mapper/search function already operates on. */
function fromPrisma(b: BusinessWithRelations): BusinessRow {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    tagline: b.tagline ?? "",
    categorySlug: b.category.slug,
    description: b.description ?? "",
    phone: b.phone ?? "",
    email: b.email ?? undefined,
    website: b.website ?? undefined,
    facebook: b.facebook ?? undefined,
    instagram: b.instagram ?? undefined,
    tiktok: b.tiktok ?? undefined,
    address: b.address ?? "",
    district: b.district ?? "",
    city: b.city,
    latitude: b.latitude ?? 0,
    longitude: b.longitude ?? 0,
    coverUrl: b.coverUrl ?? "",
    logoUrl: b.logoUrl ?? undefined,
    priceLevel: b.priceLevel ?? 1,
    tags: b.tags,
    amenities: b.amenities.map((a) => a.amenity.slug),
    isVerified: b.isVerified,
    ratingAvg: b.ratingAvg,
    ratingCount: b.ratingCount,
    hours: b.hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      opensAt: h.opensAt,
      closesAt: h.closesAt,
      is24h: h.is24h,
    })),
    holidays: b.holidays.map((h) => ({
      date: toIsoDate(h.date),
      name: h.name,
      opensAt: h.opensAt ?? undefined,
      closesAt: h.closesAt ?? undefined,
    })),
    media: b.media.map((m) => ({
      type: m.type,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl ?? undefined,
      alt: m.alt ?? undefined,
    })),
    services: b.services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description ?? undefined,
      priceMnt: s.priceMnt ?? undefined,
      priceMaxMnt: s.priceMaxMnt ?? undefined,
      durationMin: s.durationMin ?? undefined,
      categoryName: s.category?.name,
      isBookable: s.isBookable,
    })),
    staff: b.staff.map((s) => ({
      id: s.id,
      name: s.name,
      title: s.title ?? undefined,
      specialty: s.specialty ?? undefined,
      photoUrl: s.photoUrl ?? undefined,
      bio: s.bio ?? undefined,
    })),
    faqs: b.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    reviews: b.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title ?? undefined,
      body: r.body ?? "",
      authorName: r.user.name ?? "PetNet user",
      authorImage: r.user.image ?? undefined,
      isVerified: r.isVerified,
      helpfulCount: r.helpfulCount,
      createdAt: r.createdAt.toISOString(),
      reply: r.reply ?? undefined,
      repliedAt: r.repliedAt?.toISOString(),
      photos: r.media.map((m) => m.url),
    })),
  };
}

/** All active businesses, fully hydrated. `unstable_cache` avoids hitting
 * Postgres more than once per 60s across requests; wrapping that in react's
 * `cache()` additionally dedupes the several call sites within a single
 * request (search, autocomplete, nearby, reviews, slugs) down to one
 * Postgres-cache read + one `fromPrisma` remap instead of one per call. */
const fetchAllBusinessRows = cache(
  unstable_cache(
    async (): Promise<BusinessRow[]> => {
      const rows = await prisma.business.findMany({
        where: { status: "ACTIVE" },
        include: businessInclude,
      });
      return rows.map(fromPrisma);
    },
    ["business-rows"],
    { revalidate: 60, tags: ["businesses"] },
  ),
);

// The business detail page calls this indirectly 4x in one request
// (getBusinessDetail, getReviews, getNearbyBusinesses x2 for the origin +
// candidates) — react's cache() dedupes those into a single
// fetchAllBusinessRows() call + a single fromPrisma remap per request,
// instead of redoing both on every call. unstable_cache above already
// avoids re-hitting Postgres across requests; this avoids redoing the
// in-memory work within one request.
const getBusinessRow = cache(async (slug: string): Promise<BusinessRow | undefined> => {
  return (await fetchAllBusinessRows()).find((b) => b.slug === slug);
});

// ── mapping (BusinessRow → view models) ─────────────────────────────────────

function toListItem(
  row: BusinessRow,
  near?: { lat: number; lng: number },
): BusinessListItem {
  const category = getCategory(row.categorySlug);
  const item: BusinessListItem = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    category: {
      slug: row.categorySlug,
      name: category?.name ?? row.categorySlug,
      icon: category?.icon ?? "paw-print",
      tone: category?.tone ?? "brand",
    },
    district: row.district,
    address: row.address,
    phone: row.phone,
    latitude: row.latitude,
    longitude: row.longitude,
    coverUrl: row.coverUrl,
    logoUrl: row.logoUrl,
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    priceLevel: row.priceLevel,
    isVerified: row.isVerified,
    amenities: row.amenities,
    tags: row.tags,
    openStatus: getOpenStatus(row.hours),
  };
  if (near) {
    const km = haversineKm(near, { lat: row.latitude, lng: row.longitude });
    item.distanceKm = Math.round(km * 10) / 10;
    item.travelMinutes = estimateTravelMinutes(km);
  }
  return item;
}

function toDetail(row: BusinessRow, near?: { lat: number; lng: number }): BusinessDetail {
  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of row.reviews) {
    const key = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[key] += 1;
  }
  // Fixture reviews are a sample; scale the histogram to ratingCount so the
  // distribution bars stay meaningful.
  const sampleTotal = row.reviews.length;
  if (sampleTotal > 0 && row.ratingCount > sampleTotal) {
    const factor = row.ratingCount / sampleTotal;
    (Object.keys(breakdown) as unknown as (1 | 2 | 3 | 4 | 5)[]).forEach((k) => {
      breakdown[k] = Math.round(breakdown[k] * factor);
    });
  }

  return {
    ...toListItem(row, near),
    description: row.description,
    city: row.city,
    phone: row.phone,
    email: row.email,
    website: row.website,
    facebook: row.facebook,
    instagram: row.instagram,
    tiktok: row.tiktok,
    hours: row.hours,
    holidays: row.holidays,
    media: row.media,
    services: row.services,
    staff: row.staff,
    faqs: row.faqs,
    amenityDetails: row.amenities
      .map((slug) => getAmenity(slug))
      .filter((a): a is NonNullable<typeof a> => Boolean(a)),
    ratingBreakdown: breakdown,
  };
}

// ── search ───────────────────────────────────────────────────────────────────

// Bilingual synonym expansion: user vocabulary (mn + en) → tokens that
// actually occur in the dataset. Feeds both search and autocomplete.
const SYNONYMS: Record<string, string> = {
  vet: "veterinary clinic",
  vets: "veterinary clinic",
  doctor: "veterinary clinic",
  эмнэлэг: "veterinary clinic",
  эмч: "veterinary clinic",
  малын: "veterinary clinic pharmacy",
  яаралтай: "emergency",
  вакцин: "vaccination",
  тарилга: "vaccination",
  үсчин: "grooming",
  үс: "grooming",
  засалт: "grooming",
  groomer: "grooming",
  буудал: "hotel boarding",
  байрлуулах: "hotel boarding",
  сургалт: "training trainer school",
  сургагч: "trainer",
  сургууль: "school",
  дэлгүүр: "shop",
  store: "shop",
  хоол: "food shop",
  эмийн: "pharmacy",
  усан: "swimming pool",
  swim: "swimming pool",
  бассейн: "swimming pool",
  кафе: "cafe coffee",
  парк: "park",
  такси: "taxi transport",
  зурагчин: "photographer photography",
  зураг: "photographer photography",
  үрчлэлт: "adoption shelter",
  үрчлэх: "adoption shelter",
  хоргодох: "shelter",
  үржүүлэгч: "breeder",
  банхар: "bankhar",
  нохой: "dog",
  муур: "cat",
  гөлөг: "puppy",
  puppy: "puppy vaccination foundations",
};

function expandTerm(term: string): string[] {
  const expanded = [term];
  const synonym = SYNONYMS[term];
  if (synonym) expanded.push(...synonym.split(" "));
  return expanded;
}

/** Damerau-ish edit distance capped at 2 — enough for typo tolerance. */
function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    let rowMin = dp[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
      rowMin = Math.min(rowMin, dp[j]);
    }
    if (rowMin > max) return max + 1;
  }
  return dp[b.length];
}

/** Exact substring hit, or a fuzzy token hit for terms of 4+ chars. */
function fuzzyIncludes(text: string, term: string): "exact" | "fuzzy" | false {
  if (text.includes(term)) return "exact";
  if (term.length < 4) return false;
  const max = term.length >= 8 ? 2 : 1;
  for (const token of text.split(/[^\p{L}\p{N}]+/u)) {
    if (token.length >= 3 && editDistance(term, token, max) <= max) return "fuzzy";
  }
  return false;
}

function matchesQuery(row: BusinessRow, q: string): number {
  const query = q.toLowerCase().trim();
  if (!query) return 1;
  const terms = query.split(/\s+/);
  const category = getCategory(row.categorySlug);
  const haystacks = [
    { text: row.name.toLowerCase(), weight: 5 },
    { text: (category?.name ?? "").toLowerCase(), weight: 4 },
    { text: (category?.nameMn ?? "").toLowerCase(), weight: 4 },
    { text: row.tags.join(" ").toLowerCase(), weight: 3 },
    { text: row.services.map((s) => s.name).join(" ").toLowerCase(), weight: 3 },
    { text: row.district.toLowerCase(), weight: 2 },
    { text: row.tagline.toLowerCase(), weight: 2 },
    { text: row.description.toLowerCase(), weight: 1 },
  ];

  let score = 0;
  for (const term of terms) {
    let termScore = 0;
    for (const candidate of expandTerm(term)) {
      for (const { text, weight } of haystacks) {
        const hit = fuzzyIncludes(text, candidate);
        if (hit === "exact") termScore = Math.max(termScore, weight);
        else if (hit === "fuzzy") termScore = Math.max(termScore, Math.max(1, weight - 1));
      }
    }
    if (termScore === 0) return 0; // every term must match somewhere
    score += termScore;
  }
  return score;
}

export async function searchBusinesses(
  params: BusinessSearchParams,
): Promise<BusinessSearchResult> {
  const {
    q,
    category,
    district,
    openNow,
    open24h,
    minRating,
    amenities = [],
    priceLevels = [],
    verifiedOnly,
    near,
    sort = "relevance",
    limit = 30,
    offset = 0,
  } = params;

  const allRows = await fetchAllBusinessRows();
  const scored: { row: BusinessRow; score: number }[] = [];

  for (const row of allRows) {
    const score = q ? matchesQuery(row, q) : 1;
    if (score === 0) continue;
    if (category && row.categorySlug !== category) continue;
    if (district && row.district !== district) continue;
    if (minRating && row.ratingAvg < minRating) continue;
    if (verifiedOnly && !row.isVerified) continue;
    if (priceLevels.length > 0 && !priceLevels.includes(row.priceLevel)) continue;
    if (amenities.length > 0 && !amenities.every((a) => row.amenities.includes(a))) continue;
    if (open24h && !isOpen24Hours(row.hours)) continue;
    if (openNow && !getOpenStatus(row.hours).isOpen) continue;
    if (near?.radiusKm) {
      const km = haversineKm(near, { lat: row.latitude, lng: row.longitude });
      if (km > near.radiusKm) continue;
    }
    scored.push({ row, score });
  }

  // Facets are computed over the filtered set *before* pagination.
  const categoryCounts = new Map<string, number>();
  const districtCounts = new Map<string, number>();
  for (const { row } of scored) {
    categoryCounts.set(row.categorySlug, (categoryCounts.get(row.categorySlug) ?? 0) + 1);
    districtCounts.set(row.district, (districtCounts.get(row.district) ?? 0) + 1);
  }

  const items = scored.map(({ row, score }) => ({
    item: toListItem(row, near),
    score,
  }));

  items.sort((a, b) => {
    switch (sort) {
      case "rating":
        return b.item.ratingAvg - a.item.ratingAvg || b.item.ratingCount - a.item.ratingCount;
      case "reviews":
        return b.item.ratingCount - a.item.ratingCount;
      case "name":
        return a.item.name.localeCompare(b.item.name);
      case "distance":
        return (a.item.distanceKm ?? Infinity) - (b.item.distanceKm ?? Infinity);
      case "relevance":
      default:
        return (
          b.score - a.score ||
          (a.item.distanceKm ?? Infinity) - (b.item.distanceKm ?? Infinity) ||
          b.item.ratingAvg - a.item.ratingAvg
        );
    }
  });

  return {
    items: items.slice(offset, offset + limit).map((x) => x.item),
    total: items.length,
    facets: {
      categories: CATEGORIES.filter((c) => categoryCounts.has(c.slug)).map((c) => ({
        slug: c.slug,
        name: c.name,
        count: categoryCounts.get(c.slug) ?? 0,
      })),
      districts: [...districtCounts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

// ── autocomplete ─────────────────────────────────────────────────────────────

export async function autocomplete(q: string, limit = 8): Promise<SearchSuggestion[]> {
  const query = q.toLowerCase().trim();
  if (query.length < 2) return [];
  const candidates = expandTerm(query);

  const matches = (text: string) =>
    candidates.some((c) => fuzzyIncludes(text.toLowerCase(), c) !== false);

  const allRows = await fetchAllBusinessRows();
  const suggestions: SearchSuggestion[] = [];

  for (const c of CATEGORIES) {
    if (matches(c.name) || matches(c.nameMn) || c.slug.includes(query)) {
      suggestions.push({ type: "category", label: c.name, sublabel: c.description, value: c.slug });
    }
  }
  for (const row of allRows) {
    if (matches(row.name)) {
      suggestions.push({
        type: "business",
        label: row.name,
        sublabel: `${getCategory(row.categorySlug)?.name ?? ""} · ${row.district}`,
        value: row.slug,
      });
    }
  }
  for (const d of DISTRICTS) {
    if (matches(d)) {
      suggestions.push({ type: "district", label: d, sublabel: "District", value: d });
    }
  }
  const seenTags = new Set<string>();
  for (const row of allRows) {
    for (const tag of row.tags) {
      if (matches(tag) && !seenTags.has(tag)) {
        seenTags.add(tag);
        suggestions.push({ type: "tag", label: tag, sublabel: "Search tag", value: tag });
      }
    }
  }

  const typeOrder: Record<SearchSuggestion["type"], number> = {
    business: 0,
    category: 1,
    district: 2,
    tag: 3,
  };
  return suggestions
    .sort((a, b) => typeOrder[a.type] - typeOrder[b.type])
    .slice(0, limit);
}

// ── detail / nearby / reviews ────────────────────────────────────────────────

export async function getBusinessDetail(
  slug: string,
  near?: { lat: number; lng: number },
): Promise<BusinessDetail | null> {
  const row = await getBusinessRow(slug);
  return row ? toDetail(row, near) : null;
}

export async function getNearbyBusinesses(slug: string, limit = 4): Promise<BusinessListItem[]> {
  const origin = await getBusinessRow(slug);
  if (!origin) return [];
  const from = { lat: origin.latitude, lng: origin.longitude };
  const allRows = await fetchAllBusinessRows();
  return allRows
    .filter((b) => b.slug !== slug)
    .map((row) => toListItem(row, from))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    .slice(0, limit);
}

export async function getReviews(slug: string, sort: ReviewSort = "newest"): Promise<ReviewView[]> {
  const row = await getBusinessRow(slug);
  if (!row) return [];
  const reviews = [...row.reviews];
  switch (sort) {
    case "highest":
      return reviews.sort((a, b) => b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt));
    case "lowest":
      return reviews.sort((a, b) => a.rating - b.rating || +new Date(b.createdAt) - +new Date(a.createdAt));
    case "helpful":
      return reviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
    case "newest":
    default:
      return reviews.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
}

export async function getMapBounds() {
  const allRows = await fetchAllBusinessRows();
  return boundsOf(allRows.map((b) => ({ lat: b.latitude, lng: b.longitude })));
}

export async function getAllBusinessSlugs(): Promise<string[]> {
  return (await fetchAllBusinessRows()).map((b) => b.slug);
}

export { UB_CENTER, CATEGORIES, AMENITIES, DISTRICTS };

// ── booking slots ────────────────────────────────────────────────────────────

const UB_TZ = "Asia/Ulaanbaatar";

function toUbTime(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UB_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Generate bookable time slots for a service on a given date from the
 * business's working hours, minus any slot that already collides with a
 * real, non-cancelled appointment.
 */
export async function getAvailableSlots(
  slug: string,
  serviceId: string,
  dateISO: string, // "2026-07-10"
): Promise<BookingSlot[]> {
  const row = await getBusinessRow(slug);
  if (!row) return [];
  const service = row.services.find((s) => s.id === serviceId);
  if (!service || !service.isBookable) return [];

  const date = new Date(`${dateISO}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return [];
  const dayOfWeek = new Date(`${dateISO}T12:00:00+08:00`).getUTCDay();

  // holiday override
  const holiday = row.holidays.find((h) => h.date === dateISO);
  let opensAt: string | null;
  let closesAt: string | null;
  if (holiday) {
    opensAt = holiday.opensAt ?? null;
    closesAt = holiday.closesAt ?? null;
  } else {
    const day = row.hours.find((h) => h.dayOfWeek === dayOfWeek);
    if (!day) return [];
    opensAt = day.is24h ? "09:00" : day.opensAt; // 24h businesses book 09–21
    closesAt = day.is24h ? "21:00" : day.closesAt;
  }
  if (!opensAt || !closesAt) return [];

  const duration = service.durationMin ?? 30;
  const [oh, om] = opensAt.split(":").map(Number);
  const [ch, cm] = closesAt.split(":").map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;

  // Real appointments already on the books for this business/service/day.
  const dayStart = new Date(`${dateISO}T00:00:00+08:00`);
  const dayEnd = new Date(`${dateISO}T23:59:59+08:00`);
  const existing = await prisma.appointment.findMany({
    where: {
      businessId: row.id,
      serviceId,
      status: { not: "CANCELLED" },
      startsAt: { gte: dayStart, lte: dayEnd },
    },
    select: { startsAt: true },
  });
  const takenTimes = new Set(existing.map((a) => toUbTime(a.startsAt)));

  const slots: BookingSlot[] = [];
  for (let t = openMin; t + duration <= closeMin; t += Math.max(30, Math.ceil(duration / 30) * 30)) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    const time = `${hh}:${mm}`;
    slots.push({ time, available: !takenTimes.has(time) });
  }
  return slots;
}
