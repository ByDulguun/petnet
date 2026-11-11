// Business dataset — fixture rows mirroring the Prisma Business model with
// its relations, used by the service layer until DATABASE_URL is provisioned.
// The service layer (business-service.ts) is the only consumer; swapping to
// Prisma changes that file alone.

import type { WorkingHour } from "@/lib/hours";
import type {
  FaqView,
  HolidayView,
  MediaView,
  ReviewView,
  ServiceView,
  StaffView,
} from "@/lib/types";

export interface BusinessRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  categorySlug: string;
  description: string;
  phone: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  address: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;
  coverUrl: string;
  logoUrl?: string;
  priceLevel: number;
  tags: string[];
  amenities: string[];
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  hours: WorkingHour[];
  holidays: HolidayView[];
  media: MediaView[];
  services: ServiceView[];
  staff: StaffView[];
  faqs: FaqView[];
  reviews: ReviewView[];
}

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const img = (id: string, alt: string): MediaView => ({
  type: "IMAGE",
  url: u(id),
  alt,
});

/** Mon–Fri open/close, optional weekend hours. */
function weekHours(
  open: string,
  close: string,
  weekend?: { open: string; close: string; sundayClosed?: boolean },
): WorkingHour[] {
  const rows: WorkingHour[] = [];
  for (let d = 1; d <= 5; d++)
    rows.push({ dayOfWeek: d, opensAt: open, closesAt: close, is24h: false });
  if (weekend) {
    rows.push({ dayOfWeek: 6, opensAt: weekend.open, closesAt: weekend.close, is24h: false });
    if (!weekend.sundayClosed)
      rows.push({ dayOfWeek: 0, opensAt: weekend.open, closesAt: weekend.close, is24h: false });
  }
  return rows;
}

function allDay(): WorkingHour[] {
  return Array.from({ length: 7 }, (_, d) => ({
    dayOfWeek: d,
    opensAt: null,
    closesAt: null,
    is24h: true,
  }));
}

function daily(open: string, close: string): WorkingHour[] {
  return Array.from({ length: 7 }, (_, d) => ({
    dayOfWeek: d,
    opensAt: open,
    closesAt: close,
    is24h: false,
  }));
}

const NAADAM_HOLIDAYS: HolidayView[] = [
  { date: "2026-07-11", name: "Naadam Festival" },
  { date: "2026-07-12", name: "Naadam Festival" },
  { date: "2026-07-13", name: "Naadam Festival", opensAt: "10:00", closesAt: "16:00" },
];

let reviewSeq = 0;
function review(
  rating: number,
  authorName: string,
  body: string,
  opts: Partial<ReviewView> = {},
): ReviewView {
  reviewSeq += 1;
  return {
    id: `rev_${reviewSeq}`,
    rating,
    body,
    authorName,
    isVerified: opts.isVerified ?? false,
    helpfulCount: opts.helpfulCount ?? 0,
    createdAt: opts.createdAt ?? "2026-05-14T10:00:00.000Z",
    photos: opts.photos ?? [],
    ...opts,
  };
}

export const BUSINESSES: BusinessRow[] = [
  // ── Flagship: veterinary clinic ────────────────────────────────────────────
  {
    id: "biz_enerelt",
    slug: "enerelt-vet-clinic",
    name: "Enerelt Veterinary Clinic",
    tagline: "Full-service veterinary care since 2012",
    categorySlug: "veterinary-clinic",
    description:
      "Enerelt is one of Ulaanbaatar's most trusted veterinary clinics, offering preventive care, vaccinations, soft-tissue surgery, dentistry, ultrasound and in-house lab diagnostics. Our team of six licensed veterinarians treats over 900 patients a month, and our vaccination records sync directly with PetNet health profiles.",
    phone: "+976 7011 2233",
    email: "info@enerelt.mn",
    website: "https://enerelt.mn",
    facebook: "https://facebook.com/enereltvet",
    instagram: "https://instagram.com/enereltvet",
    address: "Peace Avenue 17, 13th khoroolol",
    district: "Bayanzürkh",
    city: "Ulaanbaatar",
    latitude: 47.9212,
    longitude: 106.9581,
    coverUrl: u("photo-1628009368231-7bb7cfcb0def"),
    priceLevel: 2,
    tags: ["vaccination", "surgery", "dental", "ultrasound", "puppy vaccination", "microchip"],
    amenities: ["parking", "wheelchair", "accepts-card", "accepts-qpay", "online-booking", "walk-ins"],
    isVerified: true,
    ratingAvg: 4.9,
    ratingCount: 382,
    hours: weekHours("09:00", "20:00", { open: "10:00", close: "18:00" }),
    holidays: NAADAM_HOLIDAYS,
    media: [
      img("photo-1628009368231-7bb7cfcb0def", "Veterinarian examining a dog"),
      img("photo-1612349317150-e413f6a5b16d", "Doctor at Enerelt clinic"),
      img("photo-1576201836106-db1758fd1c97", "Puppy after a checkup"),
      img("photo-1583511655857-d19b40a7a54e", "Recovered patient"),
      img("photo-1518717758536-85ae29035b6d", "Happy patient portrait"),
    ],
    services: [
      { id: "svc_en_1", name: "General checkup", description: "Full physical examination with health report", priceMnt: 45000, durationMin: 30, categoryName: "Consultation", isBookable: true },
      { id: "svc_en_2", name: "Core vaccination (DHPP)", description: "Includes booster scheduling and PetNet record sync", priceMnt: 65000, durationMin: 20, categoryName: "Vaccination", isBookable: true },
      { id: "svc_en_3", name: "Rabies vaccination", priceMnt: 35000, durationMin: 15, categoryName: "Vaccination", isBookable: true },
      { id: "svc_en_4", name: "Dental cleaning", description: "Ultrasonic scaling under sedation", priceMnt: 180000, priceMaxMnt: 250000, durationMin: 90, categoryName: "Dental", isBookable: true },
      { id: "svc_en_5", name: "Abdominal ultrasound", priceMnt: 80000, durationMin: 40, categoryName: "Diagnostics", isBookable: true },
      { id: "svc_en_6", name: "Spay / neuter surgery", priceMnt: 220000, priceMaxMnt: 380000, durationMin: 120, categoryName: "Surgery", isBookable: false },
    ],
    staff: [
      { id: "stf_en_1", name: "Dr. Batbayar Dorj", title: "Chief Veterinarian", specialty: "Soft-tissue surgery", photoUrl: u("photo-1612349317150-e413f6a5b16d", 400), bio: "18 years of small-animal practice; trained in Seoul and Berlin." },
      { id: "stf_en_2", name: "Dr. Oyunchimeg Bat", title: "Veterinarian", specialty: "Dermatology & internal medicine" },
      { id: "stf_en_3", name: "Dr. Temuujin Erdene", title: "Veterinarian", specialty: "Dentistry" },
    ],
    faqs: [
      { question: "Do I need an appointment?", answer: "Walk-ins are welcome for checkups and vaccinations before 18:00. Surgery, dental and ultrasound require a booked slot — you can book directly on this page." },
      { question: "Do you treat cats and exotic pets?", answer: "Yes — dogs, cats, rabbits and rodents. For birds and reptiles we'll refer you to a specialist partner clinic." },
      { question: "Will vaccinations appear in my PetNet profile?", answer: "Yes. Every vaccine we administer is recorded against your pet's PetNet profile with the batch number and the next due date, and you'll get automatic reminders." },
    ],
    reviews: [
      review(5, "Anu", "Dr. Batbayar performed my corgi's spay surgery — everything from pre-op bloodwork to the follow-up call the next morning was flawless. The clinic is spotless.", { isVerified: true, helpfulCount: 41, createdAt: "2026-06-21T09:00:00.000Z", photos: [u("photo-1612536057832-2ff7ead58194", 600)] }),
      review(5, "Tuguldur", "Brought our puppy for the full vaccination course. They synced everything to PetNet automatically and the reminder for the booster arrived exactly on time.", { isVerified: true, helpfulCount: 28, createdAt: "2026-06-02T09:00:00.000Z" }),
      review(5, "Sarnai", "Emergency visit on a Sunday — they took us within 20 minutes. Honest pricing, no upselling.", { helpfulCount: 19, createdAt: "2026-05-11T09:00:00.000Z" }),
      review(4, "Bold", "Great vets, though the waiting room gets crowded on Saturday mornings. Book ahead.", { isVerified: true, helpfulCount: 9, createdAt: "2026-04-18T09:00:00.000Z", reply: "Thank you Bold! Saturday 10–12 is our busiest window — weekday evenings are much quieter. — Enerelt team", repliedAt: "2026-04-19T09:00:00.000Z" }),
      review(5, "Nomin", "The only clinic in UB where the vet sat on the floor to keep my nervous rescue dog calm. Forever grateful.", { helpfulCount: 33, createdAt: "2026-03-30T09:00:00.000Z" }),
    ],
  },

  // ── 24h emergency vet ──────────────────────────────────────────────────────
  {
    id: "biz_emergency",
    slug: "ub-emergency-vet",
    name: "UB Emergency Vet 24/7",
    tagline: "The city's only round-the-clock animal hospital",
    categorySlug: "emergency-vet",
    description:
      "Open every hour of every day, including holidays. Trauma care, poisoning response, emergency surgery, oxygen therapy and intensive-care hospitalization with overnight monitoring. Call ahead if you can — we prepare the moment you hang up.",
    phone: "+976 9911 0911",
    email: "er@ubvet24.mn",
    facebook: "https://facebook.com/ubvet24",
    address: "Chinggis Avenue 45",
    district: "Khan-Uul",
    city: "Ulaanbaatar",
    latitude: 47.9014,
    longitude: 106.9302,
    coverUrl: u("photo-1612349317150-e413f6a5b16d"),
    priceLevel: 3,
    tags: ["emergency", "trauma", "poisoning", "icu", "surgery"],
    amenities: ["emergency", "parking", "accepts-card", "accepts-qpay", "walk-ins"],
    isVerified: true,
    ratingAvg: 4.8,
    ratingCount: 167,
    hours: allDay(),
    holidays: [],
    media: [
      img("photo-1612349317150-e413f6a5b16d", "Emergency veterinarian on duty"),
      img("photo-1628009368231-7bb7cfcb0def", "Treatment room"),
    ],
    services: [
      { id: "svc_em_1", name: "Emergency consultation", description: "Triage and stabilization, any hour", priceMnt: 90000, durationMin: 30, categoryName: "Emergency", isBookable: false },
      { id: "svc_em_2", name: "Emergency surgery", priceMnt: 400000, priceMaxMnt: 1200000, categoryName: "Surgery", isBookable: false },
      { id: "svc_em_3", name: "ICU hospitalization (per night)", priceMnt: 150000, categoryName: "Hospitalization", isBookable: false },
    ],
    staff: [
      { id: "stf_em_1", name: "Dr. Khulan Gantulga", title: "Head of Emergency Medicine", specialty: "Trauma & critical care" },
    ],
    faqs: [
      { question: "Are you really open at 3 AM?", answer: "Yes — a veterinarian and a nurse are physically on site 24/7, including Tsagaan Sar and Naadam." },
      { question: "What should I do while driving in?", answer: "Call +976 9911 0911. We'll give first-aid instructions and prepare the treatment room before you arrive." },
    ],
    reviews: [
      review(5, "Enkhjin", "My dog ate rat poison at 2 AM. They answered on the first ring, told me exactly what to do, and had the antidote ready when we arrived. They saved his life.", { isVerified: true, helpfulCount: 74, createdAt: "2026-06-15T09:00:00.000Z" }),
      review(4, "Naran", "Expensive, but you're paying for a surgeon at 4 in the morning. Worth every tögrög.", { helpfulCount: 22, createdAt: "2026-05-03T09:00:00.000Z" }),
    ],
  },

  // ── Flagship: pet shop ─────────────────────────────────────────────────────
  {
    id: "biz_zoocenter",
    slug: "zoo-center-pet-shop",
    name: "Zoo Center Pet Shop",
    tagline: "Mongolia's largest pet supply store",
    categorySlug: "pet-shop",
    description:
      "Three floors of everything your pet needs: premium and prescription food brands (Royal Canin, Hill's, Acana), toys, beds, crates, leashes and a dedicated puppy corner. City-wide delivery within 3 hours, free over 100,000₮.",
    phone: "+976 7700 4455",
    email: "hello@zoocenter.mn",
    website: "https://zoocenter.mn",
    facebook: "https://facebook.com/zoocentermn",
    instagram: "https://instagram.com/zoocentermn",
    tiktok: "https://tiktok.com/@zoocentermn",
    address: "Seoul Street 21",
    district: "Sükhbaatar",
    city: "Ulaanbaatar",
    latitude: 47.9165,
    longitude: 106.9057,
    coverUrl: u("photo-1601758228041-f3b2795255f1"),
    priceLevel: 2,
    tags: ["royal canin", "hills", "acana", "puppy food", "toys", "delivery"],
    amenities: ["delivery", "parking", "accepts-card", "accepts-qpay", "pet-friendly", "wheelchair"],
    isVerified: true,
    ratingAvg: 4.8,
    ratingCount: 214,
    hours: daily("10:00", "21:00"),
    holidays: NAADAM_HOLIDAYS,
    media: [
      img("photo-1601758228041-f3b2795255f1", "Dog with a delivery box"),
      img("photo-1587300003388-59208cc962cb", "Puppy corner"),
      img("photo-1591160690555-5debfba289f0", "Store regular"),
      img("photo-1543466835-00a7907e9de1", "Happy customer"),
    ],
    services: [
      { id: "svc_zc_1", name: "3-hour city delivery", description: "Free over 100,000₮, otherwise 8,000₮", priceMnt: 8000, categoryName: "Delivery", isBookable: false },
      { id: "svc_zc_2", name: "Nutrition consultation", description: "Free 20-minute session with our feeding specialist", priceMnt: 0, durationMin: 20, categoryName: "Consultation", isBookable: true },
      { id: "svc_zc_3", name: "Gift wrapping", priceMnt: 5000, categoryName: "Extras", isBookable: false },
    ],
    staff: [],
    faqs: [
      { question: "Do you deliver outside Ulaanbaatar?", answer: "We ship to all 21 aimags via post (2–5 days). Within UB, our own couriers deliver in under 3 hours." },
      { question: "Can I return opened food if my dog refuses it?", answer: "Yes — our taste guarantee covers premium brands. Bring the bag within 14 days and we'll swap it for another formula." },
    ],
    reviews: [
      review(5, "Oyunaa", "Ordered Royal Canin at 11 AM, it was at my door by 1:30 PM. The courier even carried the 15 kg bag up to the 4th floor.", { isVerified: true, helpfulCount: 31, createdAt: "2026-06-25T09:00:00.000Z" }),
      review(5, "Bat-Erdene", "The puppy corner staff genuinely know their stuff — they talked me out of a more expensive food because my dog didn't need it.", { helpfulCount: 17, createdAt: "2026-05-20T09:00:00.000Z" }),
      review(4, "Zaya", "Great selection, slightly cramped parking on weekends.", { helpfulCount: 6, createdAt: "2026-04-12T09:00:00.000Z" }),
    ],
  },

  // ── Pet pharmacy ───────────────────────────────────────────────────────────
  {
    id: "biz_monvet",
    slug: "monvet-pharmacy",
    name: "MonVet Pharmacy",
    tagline: "Licensed veterinary pharmacy & lab",
    categorySlug: "pet-pharmacy",
    description:
      "Prescription and over-the-counter veterinary medication, antiparasitics, supplements and prescription diets. Our pharmacists verify every prescription with your vet before dispensing.",
    phone: "+976 7012 8899",
    address: "Baga Toiruu 34",
    district: "Chingeltei",
    city: "Ulaanbaatar",
    latitude: 47.9251,
    longitude: 106.9134,
    coverUrl: u("photo-1576201836106-db1758fd1c97"),
    priceLevel: 2,
    tags: ["medication", "antiparasitics", "supplements", "prescription diet"],
    amenities: ["accepts-card", "accepts-qpay", "delivery", "wheelchair"],
    isVerified: true,
    ratingAvg: 4.7,
    ratingCount: 89,
    hours: weekHours("09:00", "19:00", { open: "10:00", close: "16:00", sundayClosed: true }),
    holidays: [],
    media: [img("photo-1576201836106-db1758fd1c97", "Pharmacy consultation")],
    services: [
      { id: "svc_mv_1", name: "Prescription verification", description: "We confirm dosage with your veterinarian", priceMnt: 0, categoryName: "Pharmacy", isBookable: false },
      { id: "svc_mv_2", name: "Same-day medication delivery", priceMnt: 6000, categoryName: "Delivery", isBookable: false },
    ],
    staff: [],
    faqs: [],
    reviews: [
      review(5, "Solongo", "Only pharmacy that had my dog's heart medication in stock. They now text me before each refill is due.", { isVerified: true, helpfulCount: 12, createdAt: "2026-06-08T09:00:00.000Z" }),
    ],
  },

  // ── Flagship: grooming ─────────────────────────────────────────────────────
  {
    id: "biz_fluffy",
    slug: "fluffy-grooming-studio",
    name: "Fluffy Grooming Studio",
    tagline: "Breed-standard cuts by certified groomers",
    categorySlug: "grooming-salon",
    description:
      "Certified groomers trained in Korea, specializing in breed-standard and Asian-fusion styles. Gentle handling for anxious dogs, cat grooming on quiet mornings, and a live camera link so you can watch your pet's session from your phone.",
    phone: "+976 8811 3344",
    instagram: "https://instagram.com/fluffy.ub",
    tiktok: "https://tiktok.com/@fluffy.ub",
    address: "Zaisan Street 8, Stadium Orchim",
    district: "Khan-Uul",
    city: "Ulaanbaatar",
    latitude: 47.8891,
    longitude: 106.9125,
    coverUrl: u("photo-1516734212186-a967f81ad0d7"),
    priceLevel: 3,
    tags: ["poodle cut", "golden retriever grooming", "cat grooming", "de-shedding", "nail trim"],
    amenities: ["appointment-required", "accepts-card", "accepts-qpay", "parking", "online-booking"],
    isVerified: true,
    ratingAvg: 4.7,
    ratingCount: 156,
    hours: weekHours("10:00", "19:00", { open: "10:00", close: "19:00" }),
    holidays: NAADAM_HOLIDAYS,
    media: [
      img("photo-1516734212186-a967f81ad0d7", "Grooming session in progress"),
      img("photo-1537151625747-768eb6cf92b2", "Fresh corgi trim"),
      img("photo-1583511655857-d19b40a7a54e", "Post-groom glamour shot"),
      img("photo-1558788353-f76d92427f16", "Golden retriever after de-shedding"),
    ],
    services: [
      { id: "svc_fl_1", name: "Full groom — small breed", description: "Bath, blow-dry, haircut, nails, ears", priceMnt: 80000, durationMin: 90, categoryName: "Grooming", isBookable: true },
      { id: "svc_fl_2", name: "Full groom — large breed", description: "Bath, blow-dry, haircut, nails, ears", priceMnt: 120000, priceMaxMnt: 160000, durationMin: 150, categoryName: "Grooming", isBookable: true },
      { id: "svc_fl_3", name: "De-shedding treatment", description: "Double-coat blowout — huskies and shepherds love it", priceMnt: 90000, durationMin: 90, categoryName: "Grooming", isBookable: true },
      { id: "svc_fl_4", name: "Bath & brush", priceMnt: 45000, durationMin: 60, categoryName: "Grooming", isBookable: true },
      { id: "svc_fl_5", name: "Nail trim & paw care", priceMnt: 15000, durationMin: 15, categoryName: "Care", isBookable: true },
    ],
    staff: [
      { id: "stf_fl_1", name: "Khaliun T.", title: "Master Groomer", specialty: "Poodle & bichon styling", bio: "KKC-certified, 3× Mongolian grooming championship finalist." },
      { id: "stf_fl_2", name: "Misheel B.", title: "Groomer", specialty: "Anxious & senior dogs" },
    ],
    faqs: [
      { question: "My dog hates grooming. Can you handle that?", answer: "Anxious dogs are our specialty — we book them into quiet solo slots with Misheel, use no cage dryers, and take breaks whenever the dog needs one." },
      { question: "Do you groom cats?", answer: "Yes, weekday mornings only (the salon is dog-free until 12:00)." },
    ],
    reviews: [
      review(5, "Khulan", "Watched the whole session on the live camera. My bichon came out looking like a cloud. Booking online took 30 seconds.", { isVerified: true, helpfulCount: 26, createdAt: "2026-06-18T09:00:00.000Z", photos: [u("photo-1537151625747-768eb6cf92b2", 600)] }),
      review(5, "Munkh", "The de-shedding treatment halved the fur situation in my apartment. Husky owners: go.", { isVerified: true, helpfulCount: 21, createdAt: "2026-05-27T09:00:00.000Z" }),
      review(3, "Temuulen", "Beautiful work but they run late — my 2 PM slot started at 2:40.", { helpfulCount: 8, createdAt: "2026-05-02T09:00:00.000Z", reply: "You're right, and we're sorry. We've added 15-minute buffers between large-breed sessions so this doesn't happen again. — Khaliun", repliedAt: "2026-05-03T09:00:00.000Z" }),
    ],
  },

  // ── Pet hotel ──────────────────────────────────────────────────────────────
  {
    id: "biz_nokhoi",
    slug: "nokhoi-pet-hotel",
    name: "Nokhoi Pet Hotel",
    tagline: "Boarding that feels like a holiday",
    categorySlug: "pet-hotel",
    description:
      "Climate-controlled private suites, three walks a day, group play for social dogs and a nightly photo report to your phone. Vet on call and a 10-minute drive from the airport — perfect for trips.",
    phone: "+976 9909 7788",
    facebook: "https://facebook.com/nokhoihotel",
    instagram: "https://instagram.com/nokhoihotel",
    address: "Airport Road 12 km",
    district: "Songino Khairkhan",
    city: "Ulaanbaatar",
    latitude: 47.9108,
    longitude: 106.8021,
    coverUrl: u("photo-1548199973-03cce0bbc87b"),
    priceLevel: 2,
    tags: ["boarding", "overnight", "daycare", "airport"],
    amenities: ["parking", "accepts-card", "accepts-qpay", "online-booking"],
    isVerified: false,
    ratingAvg: 4.6,
    ratingCount: 98,
    hours: daily("08:00", "20:00"),
    holidays: [],
    media: [
      img("photo-1548199973-03cce0bbc87b", "Morning group walk"),
      img("photo-1587300003388-59208cc962cb", "Play-yard friends"),
      img("photo-1561037404-61cd46aa615b", "Guest relaxing in a suite"),
    ],
    services: [
      { id: "svc_nk_1", name: "Standard suite (per night)", description: "Private 4 m² suite, 3 walks, photo report", priceMnt: 55000, categoryName: "Boarding", isBookable: true },
      { id: "svc_nk_2", name: "Deluxe suite (per night)", description: "8 m² suite with webcam access and orthopedic bed", priceMnt: 85000, categoryName: "Boarding", isBookable: true },
      { id: "svc_nk_3", name: "Airport pickup / drop-off", priceMnt: 25000, categoryName: "Transport", isBookable: false },
    ],
    staff: [],
    faqs: [
      { question: "What vaccinations are required?", answer: "Rabies, DHPP and kennel cough (Bordetella), all at least 14 days before check-in. We verify via your pet's PetNet profile." },
    ],
    reviews: [
      review(5, "Naran", "Two-week stay while we were abroad. The nightly photos were the highlight of our trip — our dog clearly forgot we existed.", { isVerified: true, helpfulCount: 18, createdAt: "2026-06-10T09:00:00.000Z" }),
      review(4, "Anu", "Great care, book the deluxe if your dog is big — standard suites suit medium dogs best.", { helpfulCount: 7, createdAt: "2026-04-22T09:00:00.000Z" }),
    ],
  },

  // ── Daycare ────────────────────────────────────────────────────────────────
  {
    id: "biz_happypaws",
    slug: "happy-paws-daycare",
    name: "Happy Paws Daycare",
    tagline: "Drop off a bored dog, pick up a happy one",
    categorySlug: "daycare",
    description:
      "Structured daycare with temperament-matched play groups, nap rooms, enrichment games and live webcams. Monthly passes with free pickup in Bayangol and Songino Khairkhan.",
    phone: "+976 8080 5511",
    instagram: "https://instagram.com/happypaws.ub",
    address: "Ard Ayush Avenue 26",
    district: "Bayangol",
    city: "Ulaanbaatar",
    latitude: 47.9153,
    longitude: 106.8712,
    coverUrl: u("photo-1587300003388-59208cc962cb"),
    priceLevel: 2,
    tags: ["daycare", "socialization", "webcam", "puppy playgroup"],
    amenities: ["parking", "accepts-qpay", "online-booking", "wifi"],
    isVerified: true,
    ratingAvg: 4.8,
    ratingCount: 73,
    hours: weekHours("07:30", "19:30", { open: "09:00", close: "17:00", sundayClosed: true }),
    holidays: [],
    media: [
      img("photo-1587300003388-59208cc962cb", "Play group in session"),
      img("photo-1543466835-00a7907e9de1", "Zoomies hour"),
    ],
    services: [
      { id: "svc_hp_1", name: "Full day (07:30–19:30)", priceMnt: 40000, categoryName: "Daycare", isBookable: true },
      { id: "svc_hp_2", name: "Half day", priceMnt: 25000, categoryName: "Daycare", isBookable: true },
      { id: "svc_hp_3", name: "Monthly pass (20 days)", description: "Includes free district pickup", priceMnt: 640000, categoryName: "Daycare", isBookable: false },
    ],
    staff: [],
    faqs: [
      { question: "How do you match play groups?", answer: "Every new dog does a 30-minute assessment. We group by size, energy and play style — never more than 8 dogs per handler." },
    ],
    reviews: [
      review(5, "Zaya", "My border collie needs a job. Happy Paws gives him one. He sleeps like a rock every daycare night.", { isVerified: true, helpfulCount: 15, createdAt: "2026-06-20T09:00:00.000Z" }),
    ],
  },

  // ── Dog trainer ────────────────────────────────────────────────────────────
  {
    id: "biz_alpha",
    slug: "alpha-dog-training",
    name: "Alpha Dog Training",
    tagline: "Positive-reinforcement training that sticks",
    categorySlug: "dog-trainer",
    description:
      "Private lessons and behavior consultations using force-free, reward-based methods. Puppy foundations, recall bootcamps, leash-reactivity programs and home visits across the city.",
    phone: "+976 9515 6677",
    facebook: "https://facebook.com/alphadogmn",
    address: "13th khoroolol, Tokyo Street 5",
    district: "Bayanzürkh",
    city: "Ulaanbaatar",
    latitude: 47.9187,
    longitude: 106.9698,
    coverUrl: u("photo-1543466835-00a7907e9de1"),
    priceLevel: 3,
    tags: ["puppy training", "recall", "leash reactivity", "home visit", "german shepherd"],
    amenities: ["home-visit", "appointment-required", "accepts-qpay", "online-booking"],
    isVerified: true,
    ratingAvg: 4.9,
    ratingCount: 61,
    hours: weekHours("11:00", "20:00", { open: "10:00", close: "18:00" }),
    holidays: [],
    media: [
      img("photo-1543466835-00a7907e9de1", "Recall practice"),
      img("photo-1589941013453-ec89f33b5e95", "Focus work with a shepherd"),
    ],
    services: [
      { id: "svc_al_1", name: "Private lesson (60 min)", priceMnt: 90000, durationMin: 60, categoryName: "Training", isBookable: true },
      { id: "svc_al_2", name: "Puppy foundations — 6 lessons", description: "Socialization, name response, crate, potty schedule", priceMnt: 480000, categoryName: "Training", isBookable: false },
      { id: "svc_al_3", name: "Behavior consultation (home visit)", priceMnt: 130000, durationMin: 90, categoryName: "Behavior", isBookable: true },
    ],
    staff: [
      { id: "stf_al_1", name: "Ganzorig S.", title: "Head Trainer", specialty: "Reactivity & working breeds", bio: "CPDT-KA certified; former military K9 handler turned force-free convert." },
    ],
    faqs: [
      { question: "Do you use e-collars or prong collars?", answer: "No. We train exclusively with positive reinforcement — it's slower some weeks and better every year." },
    ],
    reviews: [
      review(5, "Bat-Erdene", "Our shepherd lunged at every dog on the street. Twelve weeks with Ganzorig and we walk past the dog park calmly. Life-changing.", { isVerified: true, helpfulCount: 37, createdAt: "2026-06-05T09:00:00.000Z" }),
      review(5, "Nomin", "Worth every tögrög. He trains the humans as much as the dog, which is exactly right.", { helpfulCount: 14, createdAt: "2026-05-15T09:00:00.000Z" }),
    ],
  },

  // ── Dog school ─────────────────────────────────────────────────────────────
  {
    id: "biz_canine_academy",
    slug: "ub-canine-academy",
    name: "UB Canine Academy",
    tagline: "Group classes from puppy to competition",
    categorySlug: "dog-school",
    description:
      "Structured group programs on a 2,000 m² fenced training field: puppy kindergarten, canine good citizen, agility foundations and scent work. Small classes, two instructors each.",
    phone: "+976 9191 2244",
    address: "Zaisan valley, Khan-Uul 11th khoroo",
    district: "Khan-Uul",
    city: "Ulaanbaatar",
    latitude: 47.8812,
    longitude: 106.9022,
    coverUrl: u("photo-1589941013453-ec89f33b5e95"),
    priceLevel: 2,
    tags: ["group classes", "agility", "puppy kindergarten", "scent work"],
    amenities: ["parking", "accepts-qpay", "appointment-required"],
    isVerified: false,
    ratingAvg: 4.7,
    ratingCount: 44,
    hours: weekHours("16:00", "21:00", { open: "10:00", close: "18:00" }),
    holidays: [],
    media: [img("photo-1589941013453-ec89f33b5e95", "Agility class on the field")],
    services: [
      { id: "svc_ca_1", name: "Puppy kindergarten — 8 weeks", priceMnt: 320000, categoryName: "Classes", isBookable: false },
      { id: "svc_ca_2", name: "Agility foundations — 8 weeks", priceMnt: 360000, categoryName: "Classes", isBookable: false },
      { id: "svc_ca_3", name: "Trial class", priceMnt: 30000, durationMin: 60, categoryName: "Classes", isBookable: true },
    ],
    staff: [],
    faqs: [],
    reviews: [
      review(5, "Solongo", "The agility course turned my hyper aussie into an athlete with a purpose. Fantastic instructors.", { helpfulCount: 11, createdAt: "2026-05-30T09:00:00.000Z" }),
    ],
  },

  // ── Dog walker ─────────────────────────────────────────────────────────────
  {
    id: "biz_steppewalkers",
    slug: "steppe-walkers",
    name: "Steppe Walkers",
    tagline: "GPS-tracked walks, rain or −30°C",
    categorySlug: "dog-walker",
    description:
      "Professional dog-walking crew covering central Ulaanbaatar. Every walk is GPS-tracked and photo-reported in the app. Solo or paired walks, gear for Mongolian winters included.",
    phone: "+976 8899 1122",
    instagram: "https://instagram.com/steppewalkers",
    address: "Sükhbaatar district (service area)",
    district: "Sükhbaatar",
    city: "Ulaanbaatar",
    latitude: 47.9224,
    longitude: 106.9203,
    coverUrl: u("photo-1601758003122-53c40e686a19"),
    priceLevel: 1,
    tags: ["dog walking", "gps tracked", "winter walks"],
    amenities: ["home-visit", "accepts-qpay", "online-booking"],
    isVerified: true,
    ratingAvg: 4.8,
    ratingCount: 52,
    hours: daily("07:00", "21:00"),
    holidays: [],
    media: [img("photo-1601758003122-53c40e686a19", "Walker with a client's dog")],
    services: [
      { id: "svc_sw_1", name: "Solo walk (45 min)", priceMnt: 25000, durationMin: 45, categoryName: "Walking", isBookable: true },
      { id: "svc_sw_2", name: "Paired walk (45 min)", priceMnt: 18000, durationMin: 45, categoryName: "Walking", isBookable: true },
      { id: "svc_sw_3", name: "Weekly pack (5 walks)", priceMnt: 100000, categoryName: "Walking", isBookable: false },
    ],
    staff: [],
    faqs: [],
    reviews: [
      review(5, "Munkh", "The GPS map and photos after every walk are brilliant. My husky gets his 5 km even when I'm stuck at work.", { isVerified: true, helpfulCount: 9, createdAt: "2026-06-12T09:00:00.000Z" }),
    ],
  },

  // ── Pet taxi ───────────────────────────────────────────────────────────────
  {
    id: "biz_pettaxi",
    slug: "pet-taxi-ub",
    name: "Pet Taxi UB",
    tagline: "Crash-tested crates, calm drivers",
    categorySlug: "pet-taxi",
    description:
      "Dedicated pet transport with secured crates in every size, non-slip flooring and drivers trained in animal handling. Vet-visit waiting service available.",
    phone: "+976 9494 3300",
    address: "City-wide service",
    district: "Bayangol",
    city: "Ulaanbaatar",
    latitude: 47.9091,
    longitude: 106.8804,
    coverUrl: u("photo-1561037404-61cd46aa615b"),
    priceLevel: 1,
    tags: ["transport", "vet visits", "airport"],
    amenities: ["accepts-qpay", "accepts-card"],
    isVerified: false,
    ratingAvg: 4.5,
    ratingCount: 38,
    hours: daily("07:00", "23:00"),
    holidays: [],
    media: [img("photo-1561037404-61cd46aa615b", "Passenger ready for pickup")],
    services: [
      { id: "svc_pt_1", name: "City ride (up to 10 km)", priceMnt: 20000, categoryName: "Transport", isBookable: false },
      { id: "svc_pt_2", name: "Vet-visit round trip with waiting", priceMnt: 45000, categoryName: "Transport", isBookable: false },
    ],
    staff: [],
    faqs: [],
    reviews: [
      review(4, "Oyunaa", "Driver arrived with a clean crate exactly my cat's size. Slightly late but communicated well.", { helpfulCount: 4, createdAt: "2026-05-25T09:00:00.000Z" }),
    ],
  },

  // ── Breeder ────────────────────────────────────────────────────────────────
  {
    id: "biz_khatan",
    slug: "khatan-bankhar-breeders",
    name: "Khatan Bankhar Kennel",
    tagline: "Preserving the Mongolian Bankhar line",
    categorySlug: "breeder",
    description:
      "Ethical, health-tested breeding of the native Mongolian Bankhar. Puppies are raised with early socialization protocols, hip-scored parents, and lifetime breeder support. Waitlist typically 6–10 months.",
    phone: "+976 9838 4455",
    facebook: "https://facebook.com/khatanbankhar",
    address: "Songino Khairkhan 32nd khoroo",
    district: "Songino Khairkhan",
    city: "Ulaanbaatar",
    latitude: 47.9302,
    longitude: 106.8213,
    coverUrl: u("photo-1589941013453-ec89f33b5e95"),
    priceLevel: 4,
    tags: ["bankhar", "mongolian bankhar", "livestock guardian", "health tested"],
    amenities: ["appointment-required", "parking"],
    isVerified: true,
    ratingAvg: 5.0,
    ratingCount: 17,
    hours: weekHours("10:00", "17:00", { open: "10:00", close: "17:00" }),
    holidays: [],
    media: [img("photo-1589941013453-ec89f33b5e95", "Bankhar guardian at the kennel")],
    services: [
      { id: "svc_kh_1", name: "Kennel visit & consultation", description: "Meet the parents, discuss the waitlist", priceMnt: 0, durationMin: 60, categoryName: "Consultation", isBookable: true },
    ],
    staff: [],
    faqs: [
      { question: "How does the waitlist work?", answer: "After a kennel visit, approved families join the list with a refundable deposit. We match puppies to homes at 7 weeks based on temperament, not pick order." },
    ],
    reviews: [
      review(5, "Tuguldur", "A breeder who interviews YOU — as it should be. Our bankhar is healthy, stable and exactly as described.", { isVerified: true, helpfulCount: 13, createdAt: "2026-04-28T09:00:00.000Z" }),
    ],
  },

  // ── Shelter ────────────────────────────────────────────────────────────────
  {
    id: "biz_luckypaws",
    slug: "lucky-paws-shelter",
    name: "Lucky Paws Shelter",
    tagline: "300 rescues rehomed every year",
    categorySlug: "shelter",
    description:
      "Volunteer-run rescue shelter housing 80–120 dogs and cats. All adoptees are vaccinated, dewormed, microchipped and sterilized. Visit on weekends, or walk a shelter dog through our Sunday walking program.",
    phone: "+976 8585 9090",
    facebook: "https://facebook.com/luckypawsmn",
    instagram: "https://instagram.com/luckypawsmn",
    address: "Bayanzürkh 26th khoroo, Uliastai road",
    district: "Bayanzürkh",
    city: "Ulaanbaatar",
    latitude: 47.9345,
    longitude: 107.0012,
    coverUrl: u("photo-1552053831-71594a27632d"),
    priceLevel: 1,
    tags: ["adoption", "rescue", "volunteer", "donations"],
    amenities: ["parking", "walk-ins"],
    isVerified: true,
    ratingAvg: 4.9,
    ratingCount: 128,
    hours: weekHours("13:00", "17:00", { open: "11:00", close: "18:00" }),
    holidays: [],
    media: [
      img("photo-1552053831-71594a27632d", "Aslan, waiting for a home"),
      img("photo-1633722715463-d30f4f325e24", "Nara at the shelter yard"),
      img("photo-1612536057832-2ff7ead58194", "Suvd the corgi mix"),
    ],
    services: [
      { id: "svc_lp_1", name: "Adoption application", description: "Home check + meet-and-greet included", priceMnt: 0, categoryName: "Adoption", isBookable: false },
      { id: "svc_lp_2", name: "Sunday dog walking (volunteer)", priceMnt: 0, durationMin: 90, categoryName: "Volunteer", isBookable: true },
    ],
    staff: [],
    faqs: [
      { question: "What does adoption cost?", answer: "Adoption is free; a donation covering sterilization (~80,000₮) is warmly appreciated but never required." },
    ],
    reviews: [
      review(5, "Sarnai", "Adopted our Aslan here. The team knew every dog's personality by heart and matched us perfectly.", { isVerified: true, helpfulCount: 45, createdAt: "2026-06-01T09:00:00.000Z" }),
      review(5, "Enkhjin", "The Sunday walking program is the best thing I do all week.", { helpfulCount: 20, createdAt: "2026-05-18T09:00:00.000Z" }),
    ],
  },

  // ── Dog park ───────────────────────────────────────────────────────────────
  {
    id: "biz_buyantpark",
    slug: "buyant-dog-park",
    name: "Buyant Dog Park",
    tagline: "3 hectares of fenced off-leash freedom",
    categorySlug: "dog-park",
    description:
      "The city's largest fenced off-leash park: separate small-dog and large-dog zones, agility equipment, water stations and winter lighting until 22:00. Free entry.",
    phone: "+976 7575 0044",
    address: "Buyant-Ukhaa, near the river",
    district: "Khan-Uul",
    city: "Ulaanbaatar",
    latitude: 47.8873,
    longitude: 106.8551,
    coverUrl: u("photo-1558929996-da64ba858215"),
    priceLevel: 1,
    tags: ["off-leash", "agility", "free", "fenced"],
    amenities: ["parking", "wheelchair", "pet-friendly"],
    isVerified: false,
    ratingAvg: 4.6,
    ratingCount: 201,
    hours: daily("06:00", "22:00"),
    holidays: [],
    media: [
      img("photo-1558929996-da64ba858215", "Play session at the park"),
      img("photo-1548199973-03cce0bbc87b", "Regulars on the main lawn"),
    ],
    services: [],
    staff: [],
    faqs: [
      { question: "Is entry really free?", answer: "Yes. The park is maintained by the district with support from PetNet business partners." },
    ],
    reviews: [
      review(5, "Bold", "Separate small-dog zone means my chihuahua isn't a football. Best park in the city.", { helpfulCount: 16, createdAt: "2026-06-22T09:00:00.000Z" }),
      review(4, "Khulan", "Gets muddy near the river gate after rain — bring towels.", { helpfulCount: 7, createdAt: "2026-05-09T09:00:00.000Z" }),
    ],
  },

  // ── Pet-friendly cafe ──────────────────────────────────────────────────────
  {
    id: "biz_cafewoof",
    slug: "cafe-woof",
    name: "Café Woof",
    tagline: "Specialty coffee, dogs on the couch",
    categorySlug: "pet-friendly-cafe",
    description:
      "Specialty coffee and brunch where dogs are guests, not exceptions: water bowls at every table, a 'puppuccino' on the house menu and a small indoor play corner. Weekend breed meetups hosted monthly.",
    phone: "+976 7711 6600",
    instagram: "https://instagram.com/cafewoof.ub",
    address: "Seoul Street 8",
    district: "Sükhbaatar",
    city: "Ulaanbaatar",
    latitude: 47.9142,
    longitude: 106.9101,
    coverUrl: u("photo-1450778869180-41d0601e046e"),
    priceLevel: 2,
    tags: ["coffee", "brunch", "puppuccino", "meetups"],
    amenities: ["pet-friendly", "wifi", "accepts-card", "accepts-qpay", "wheelchair"],
    isVerified: true,
    ratingAvg: 4.7,
    ratingCount: 143,
    hours: daily("08:00", "22:00"),
    holidays: [],
    media: [
      img("photo-1450778869180-41d0601e046e", "Regular guests at the window table"),
      img("photo-1517849845537-4d257902454a", "The house pug, quality control"),
    ],
    services: [
      { id: "svc_cw_1", name: "Breed meetup hosting", description: "Free venue for community breed meetups (weekends)", priceMnt: 0, categoryName: "Events", isBookable: false },
    ],
    staff: [],
    faqs: [
      { question: "Are big dogs welcome inside?", answer: "All friendly dogs are welcome inside regardless of size — we only ask for leashes during the busy 12:00–14:00 window." },
    ],
    reviews: [
      review(5, "Nomin", "My retriever gets greeted by name. The flat white is genuinely excellent too — this isn't just a gimmick cafe.", { helpfulCount: 23, createdAt: "2026-06-19T09:00:00.000Z" }),
    ],
  },

  // ── Pet-friendly hotel ─────────────────────────────────────────────────────
  {
    id: "biz_bluesky_petfriendly",
    slug: "steppe-view-hotel",
    name: "Steppe View Hotel",
    tagline: "4-star stays, pets stay free",
    categorySlug: "pet-friendly-hotel",
    description:
      "Downtown 4-star hotel with dedicated pet-friendly floors: washable floors, welcome treat baskets, in-room crates on request and a grass relief area in the courtyard. No pet fee up to two pets per room.",
    phone: "+976 7010 8800",
    website: "https://steppeview.mn",
    address: "Sükhbaatar Square 2",
    district: "Sükhbaatar",
    city: "Ulaanbaatar",
    latitude: 47.9199,
    longitude: 106.9174,
    coverUrl: u("photo-1601758003122-53c40e686a19"),
    priceLevel: 4,
    tags: ["hotel", "travel", "no pet fee"],
    amenities: ["pet-friendly", "parking", "wifi", "accepts-card", "wheelchair"],
    isVerified: true,
    ratingAvg: 4.5,
    ratingCount: 67,
    hours: allDay(),
    holidays: [],
    media: [img("photo-1601758003122-53c40e686a19", "Guests checking in with their dog")],
    services: [
      { id: "svc_sv_1", name: "Pet-friendly double room (per night)", priceMnt: 380000, categoryName: "Rooms", isBookable: false },
      { id: "svc_sv_2", name: "In-room pet sitting (per hour)", priceMnt: 30000, durationMin: 60, categoryName: "Extras", isBookable: false },
    ],
    staff: [],
    faqs: [],
    reviews: [
      review(4, "Zaya", "Rare find in UB — an actually pet-welcoming hotel, not just pet-tolerating. Courtyard relief area is small but clean.", { helpfulCount: 10, createdAt: "2026-05-21T09:00:00.000Z" }),
    ],
  },

  // ── Pet swimming pool ──────────────────────────────────────────────────────
  {
    id: "biz_aquapaws",
    slug: "aqua-paws-pool",
    name: "Aqua Paws Pool",
    tagline: "Heated pool sessions & hydrotherapy",
    categorySlug: "pet-swimming-pool",
    description:
      "Indoor heated pool for recreational swims, puppy water introduction and vet-referred hydrotherapy for joint recovery. Certified canine hydrotherapist on staff; life vests in all sizes.",
    phone: "+976 8686 2211",
    instagram: "https://instagram.com/aquapaws.ub",
    address: "Bayangol, Amarsanaa Street 14",
    district: "Bayangol",
    city: "Ulaanbaatar",
    latitude: 47.9118,
    longitude: 106.8659,
    coverUrl: u("photo-1558788353-f76d92427f16"),
    priceLevel: 3,
    tags: ["swimming", "hydrotherapy", "rehabilitation", "puppy swim"],
    amenities: ["appointment-required", "parking", "accepts-card", "accepts-qpay", "online-booking"],
    isVerified: false,
    ratingAvg: 4.8,
    ratingCount: 29,
    hours: weekHours("11:00", "20:00", { open: "10:00", close: "18:00" }),
    holidays: [],
    media: [img("photo-1558788353-f76d92427f16", "First swim lesson")],
    services: [
      { id: "svc_ap_1", name: "Recreational swim (30 min)", priceMnt: 50000, durationMin: 30, categoryName: "Swimming", isBookable: true },
      { id: "svc_ap_2", name: "Hydrotherapy session", description: "Vet referral required", priceMnt: 90000, durationMin: 45, categoryName: "Therapy", isBookable: true },
      { id: "svc_ap_3", name: "Puppy water introduction", priceMnt: 40000, durationMin: 30, categoryName: "Swimming", isBookable: true },
    ],
    staff: [
      { id: "stf_ap_1", name: "Delgermaa N.", title: "Canine Hydrotherapist", specialty: "Post-surgery rehabilitation" },
    ],
    faqs: [],
    reviews: [
      review(5, "Bat-Erdene", "Our senior lab's arthritis visibly improved after eight hydrotherapy sessions. Delgermaa is wonderful.", { isVerified: true, helpfulCount: 12, createdAt: "2026-06-07T09:00:00.000Z" }),
    ],
  },

  // ── Pet photographer ───────────────────────────────────────────────────────
  {
    id: "biz_goldenhour",
    slug: "golden-hour-pet-photography",
    name: "Golden Hour Pet Photography",
    tagline: "Studio & steppe photo sessions",
    categorySlug: "pet-photographer",
    description:
      "Award-winning pet photography: studio portraits, golden-hour steppe sessions outside the city, and same-week edited galleries. Patience included for the wiggliest subjects.",
    phone: "+976 9900 7712",
    instagram: "https://instagram.com/goldenhour.pets",
    tiktok: "https://tiktok.com/@goldenhour.pets",
    address: "Chingeltei, Juulchin Street 30",
    district: "Chingeltei",
    city: "Ulaanbaatar",
    latitude: 47.9268,
    longitude: 106.9088,
    coverUrl: u("photo-1583511655857-d19b40a7a54e"),
    priceLevel: 3,
    tags: ["photography", "portraits", "studio", "outdoor"],
    amenities: ["appointment-required", "accepts-card", "accepts-qpay", "online-booking"],
    isVerified: true,
    ratingAvg: 4.9,
    ratingCount: 34,
    hours: weekHours("12:00", "19:00", { open: "09:00", close: "19:00" }),
    holidays: [],
    media: [
      img("photo-1583511655857-d19b40a7a54e", "Studio portrait session"),
      img("photo-1517849845537-4d257902454a", "Character study"),
      img("photo-1591160690555-5debfba289f0", "Puppy's first shoot"),
    ],
    services: [
      { id: "svc_gh_1", name: "Studio session (1 hour)", description: "15 edited photos, props included", priceMnt: 250000, durationMin: 60, categoryName: "Photography", isBookable: true },
      { id: "svc_gh_2", name: "Steppe golden-hour session", description: "On location outside the city, 25 edited photos", priceMnt: 450000, durationMin: 120, categoryName: "Photography", isBookable: true },
    ],
    staff: [],
    faqs: [],
    reviews: [
      review(5, "Anu", "The steppe session photos look like movie posters. She waited 40 minutes for my dog to stop rolling in the grass.", { isVerified: true, helpfulCount: 18, createdAt: "2026-06-14T09:00:00.000Z" }),
    ],
  },
];

export function getBusinessRow(slug: string): BusinessRow | undefined {
  return BUSINESSES.find((b) => b.slug === slug);
}
