import {
  CalendarDays,
  GraduationCap,
  Heart,
  Hotel,
  MapPin,
  MessageSquare,
  PawPrint,
  Scissors,
  ShoppingBag,
  Stethoscope,
  Trees,
  type LucideIcon,
} from "lucide-react";

export const SITE = {
  name: "PetNet",
  tagline: "Everything your pet needs.",
  url: "https://petnet.mn",
} as const;

// Labels are message keys — resolved with useTranslations()/getTranslations()
// at render time so every locale stays in sync.

export type ServiceCategoryTile = {
  slug: string;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  href: string;
  tone: string;
};

/** The eight curated tiles on the home page. */
export const SERVICE_CATEGORY_TILES: ServiceCategoryTile[] = [
  { slug: "pet-shop", labelKey: "shops", descriptionKey: "shopsDesc", icon: ShoppingBag, href: "/map?category=pet-shop", tone: "bg-brand-soft text-brand" },
  { slug: "veterinary-clinic", labelKey: "vets", descriptionKey: "vetsDesc", icon: Stethoscope, href: "/map?category=veterinary-clinic", tone: "bg-brand-blue-soft text-brand-blue" },
  { slug: "grooming-salon", labelKey: "grooming", descriptionKey: "groomingDesc", icon: Scissors, href: "/map?category=grooming-salon", tone: "bg-danger-soft text-danger" },
  { slug: "dog-trainer", labelKey: "training", descriptionKey: "trainingDesc", icon: GraduationCap, href: "/map?category=dog-trainer", tone: "bg-success-soft text-success" },
  { slug: "pet-hotel", labelKey: "hotels", descriptionKey: "hotelsDesc", icon: Hotel, href: "/map?category=pet-hotel", tone: "bg-warning-soft text-warning" },
  { slug: "dog-park", labelKey: "parks", descriptionKey: "parksDesc", icon: Trees, href: "/map?category=dog-park", tone: "bg-success-soft text-success" },
  { slug: "shelter", labelKey: "shelters", descriptionKey: "sheltersDesc", icon: Heart, href: "/map?category=shelter", tone: "bg-danger-soft text-danger" },
  { slug: "breeder", labelKey: "breeders", descriptionKey: "breedersDesc", icon: PawPrint, href: "/map?category=breeder", tone: "bg-brand-soft text-brand" },
];

export type NavItem = {
  labelKey: string;
  href: string;
  icon?: LucideIcon;
  /** Route doesn't exist yet — render as a disabled "Soon" item, not a Link. */
  comingSoon?: boolean;
};

// Auth routes: live now that Phase 2 (authentication) ships /login and
// /register.
export const AUTH_ROUTES_LIVE = true;

// Learn/Articles, Marketplace, and Training Center are real future modules
// but have no routes or data behind them yet — they're intentionally
// absent from navigation rather than shown as disabled "Coming soon"
// placeholders, so the launch product only advertises what a visitor can
// actually use. Add them back here (with `comingSoon: true` if you want an
// interim disabled state) once each one has a real page behind it. Lost &
// Found, Adoption, Community and Events have shipped and get a top-level
// entry; Breed Encyclopedia has shipped too but is browse-only reference
// content, so it only lives in the footer (see FOOTER_NAV below).
export const MAIN_NAV: NavItem[] = [
  { labelKey: "explore", href: "/map", icon: MapPin },
  { labelKey: "services", href: "/map?category=pet-shop", icon: ShoppingBag },
  { labelKey: "lostFound", href: "/lost-found", icon: PawPrint },
  { labelKey: "adoption", href: "/adoption", icon: Heart },
  { labelKey: "community", href: "/community", icon: MessageSquare },
  { labelKey: "events", href: "/events", icon: CalendarDays },
];

export const FOOTER_NAV: {
  headingKey: string;
  items: { labelKey: string; href: string; comingSoon?: boolean }[];
}[] = [
  {
    headingKey: "discover",
    items: [
      { labelKey: "petMap", href: "/map" },
      { labelKey: "petShops", href: "/map?category=pet-shop" },
      { labelKey: "vetClinics", href: "/map?category=veterinary-clinic" },
      { labelKey: "grooming", href: "/map?category=grooming-salon" },
      { labelKey: "petHotels", href: "/map?category=pet-hotel" },
      { labelKey: "lostFound", href: "/lost-found" },
      { labelKey: "adoption", href: "/adoption" },
      { labelKey: "feed", href: "/community" },
      { labelKey: "events", href: "/events" },
      { labelKey: "breedEncyclopedia", href: "/breeds" },
    ],
  },
  {
    headingKey: "company",
    items: [
      { labelKey: "about", href: "/about" },
      { labelKey: "forBusinesses", href: "/business/join" },
      { labelKey: "contact", href: "/contact" },
      { labelKey: "privacy", href: "/privacy" },
      { labelKey: "terms", href: "/terms" },
    ],
  },
];
