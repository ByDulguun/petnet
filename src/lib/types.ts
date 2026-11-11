// Shared view-model types.
// These mirror the Prisma models' public shape; server queries map DB rows
// into these so UI components stay decoupled from the ORM.

import type { OpenStatus, WorkingHour } from "./hours";

// ─────────────────────────────────────────────────────────────────────────────
// Services ecosystem (Module 1)
// ─────────────────────────────────────────────────────────────────────────────

/** Data-driven business category (row in BusinessCategory). */
export interface CategoryRef {
  slug: string;
  name: string;
  /** lucide icon name, resolved via the category-icon registry */
  icon: string;
  /** design-system tone key: brand | blue | success | warning | danger */
  tone: string;
}

export interface AmenityRef {
  slug: string;
  name: string;
  icon: string;
}

export interface BusinessListItem {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  category: CategoryRef;
  district: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  coverUrl: string;
  logoUrl?: string;
  ratingAvg: number;
  ratingCount: number;
  priceLevel?: number; // 1–4
  isVerified: boolean;
  amenities: string[]; // amenity slugs (for chips + filtering)
  tags: string[];
  openStatus: OpenStatus;
  /** present when the request included a reference location */
  distanceKm?: number;
  travelMinutes?: number;
}

export interface MediaView {
  type: "IMAGE" | "VIDEO";
  url: string;
  thumbnailUrl?: string;
  alt?: string;
}

export interface ServiceView {
  id: string;
  name: string;
  description?: string;
  priceMnt?: number;
  priceMaxMnt?: number;
  durationMin?: number;
  categoryName?: string;
  isBookable: boolean;
}

export interface StaffView {
  id: string;
  name: string;
  title?: string;
  specialty?: string;
  photoUrl?: string;
  bio?: string;
}

export interface FaqView {
  question: string;
  answer: string;
}

export interface ReviewView {
  id: string;
  rating: number;
  title?: string;
  body: string;
  authorName: string;
  authorImage?: string;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string; // ISO
  reply?: string;
  repliedAt?: string;
  photos: string[];
}

export interface HolidayView {
  date: string; // ISO date
  name: string;
  opensAt?: string;
  closesAt?: string;
}

export interface BusinessDetail extends BusinessListItem {
  description: string;
  city: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  hours: WorkingHour[];
  holidays: HolidayView[];
  media: MediaView[];
  services: ServiceView[];
  staff: StaffView[];
  faqs: FaqView[];
  amenityDetails: AmenityRef[];
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export type BusinessSort =
  | "relevance"
  | "rating"
  | "reviews"
  | "distance"
  | "name";

export type ReviewSort = "newest" | "highest" | "lowest" | "helpful";

export interface BusinessSearchParams {
  q?: string;
  category?: string; // category slug
  district?: string;
  openNow?: boolean;
  open24h?: boolean;
  minRating?: number;
  amenities?: string[]; // amenity slugs, AND semantics
  priceLevels?: number[];
  verifiedOnly?: boolean;
  near?: { lat: number; lng: number; radiusKm?: number };
  sort?: BusinessSort;
  limit?: number;
  offset?: number;
}

export interface BusinessSearchResult {
  items: BusinessListItem[];
  total: number;
  facets: {
    categories: { slug: string; name: string; count: number }[];
    districts: { name: string; count: number }[];
  };
}

export type SuggestionType = "business" | "category" | "district" | "tag";

export interface SearchSuggestion {
  type: SuggestionType;
  label: string;
  sublabel?: string;
  /** value to apply: slug for business/category, raw text for district/tag */
  value: string;
}

export interface BookingSlot {
  time: string; // "14:30"
  available: boolean;
}

export interface BookingConfirmation {
  id: string;
  businessName: string;
  serviceName: string;
  date: string; // ISO date
  time: string;
  durationMin: number;
  priceMnt?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Home page summaries (Module 0)
// ─────────────────────────────────────────────────────────────────────────────

export interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  categoryIcon: string;
  categoryTone: string;
  district: string;
  coverUrl: string;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  hasDelivery: boolean;
  hasEmergency: boolean;
  openNow: boolean;
}

export interface FeaturedPet {
  id: string;
  name: string;
  breedName: string;
  ageLabel: string;
  gender: "MALE" | "FEMALE";
  imageUrl: string;
  shelterName: string;
  goodWith: string[];
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  categoryName: string;
  readMinutes: number;
  publishedAt: string; // ISO
}

export interface PostSummary {
  id: string;
  imageUrl: string;
  petName: string;
  authorName: string;
  likeCount: number;
  commentCount: number;
}

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  type: "MEETUP" | "DOG_SHOW" | "TRAINING_CAMP" | "VACCINATION_DAY" | "ADOPTION_DAY";
  coverImage: string;
  startsAt: string; // ISO
  venue: string;
  attendeeCount: number;
  isFree: boolean;
}

export const EVENT_TYPE_LABEL: Record<EventSummary["type"], string> = {
  MEETUP: "Meetup",
  DOG_SHOW: "Dog Show",
  TRAINING_CAMP: "Training Camp",
  VACCINATION_DAY: "Vaccination Day",
  ADOPTION_DAY: "Adoption Day",
};
