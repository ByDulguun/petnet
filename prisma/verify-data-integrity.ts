// Read-only data integrity report. Never deletes or modifies anything —
// every check below only SELECTs and prints. If it finds something,
// inspect it manually (or write a one-off fix) before touching production
// data; this script's job is to surface problems, not resolve them.
//
// Run with: npx tsx prisma/verify-data-integrity.ts   (or: npm run db:verify)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let totalIssues = 0;

function report(title: string, count: number, sample: unknown[] = []) {
  if (count === 0) {
    console.log(`✓ ${title}: none found`);
    return;
  }
  totalIssues += count;
  console.log(`✗ ${title}: ${count} found`);
  if (sample.length) {
    console.log(JSON.stringify(sample, null, 2).split("\n").map((l) => `    ${l}`).join("\n"));
  }
}

async function main() {
  console.log("PetNet data integrity check —", new Date().toISOString());
  console.log("=".repeat(70));

  // ── Referential integrity ───────────────────────────────────────────────
  // Every FK in schema.prisma is a real Postgres foreign key (no
  // relationMode override), so these should always read zero — Postgres
  // itself refuses to create an orphaned row. They're here as a cheap
  // confirmation that the schema's own guarantee actually holds (e.g.
  // after a raw SQL migration, a restored backup, or manual DB surgery),
  // not because the app can produce these under normal operation.

  // Prisma's fluent API can't express "this required relation is missing"
  // (it assumes the FK always resolves), so these use a raw LEFT JOIN —
  // the only way to actually detect a dangling FK if one ever existed
  // despite Postgres's constraint (e.g. a restored backup, manual SQL).
  async function countOrphans(sql: string): Promise<number> {
    const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(sql);
    return Number(rows[0]?.count ?? 0);
  }
  const [
    petsOrphaned,
    businessesInvalidOwner,
    businessesInvalidCategory,
    appointmentsInvalidBusiness,
    appointmentsInvalidUser,
    appointmentsInvalidPet,
    notificationsOrphaned,
  ] = await Promise.all([
    countOrphans(`SELECT count(*) FROM "Pet" p LEFT JOIN "User" u ON u.id = p."ownerId" WHERE u.id IS NULL`),
    countOrphans(`SELECT count(*) FROM "Business" b LEFT JOIN "User" u ON u.id = b."ownerId" WHERE u.id IS NULL`),
    countOrphans(`SELECT count(*) FROM "Business" b LEFT JOIN "BusinessCategory" c ON c.id = b."categoryId" WHERE c.id IS NULL`),
    countOrphans(`SELECT count(*) FROM "Appointment" a LEFT JOIN "Business" b ON b.id = a."businessId" WHERE b.id IS NULL`),
    countOrphans(`SELECT count(*) FROM "Appointment" a LEFT JOIN "User" u ON u.id = a."userId" WHERE u.id IS NULL`),
    countOrphans(`SELECT count(*) FROM "Appointment" a LEFT JOIN "Pet" p ON p.id = a."petId" WHERE a."petId" IS NOT NULL AND p.id IS NULL`),
    countOrphans(`SELECT count(*) FROM "Notification" n LEFT JOIN "User" u ON u.id = n."userId" WHERE u.id IS NULL`),
  ]);
  report("Pets without a valid owner", petsOrphaned);
  report("Businesses without a valid owner", businessesInvalidOwner);
  report("Businesses without a valid category", businessesInvalidCategory);
  report("Appointments referencing a missing business", appointmentsInvalidBusiness);
  report("Appointments referencing a missing user", appointmentsInvalidUser);
  report("Appointments with a dangling petId", appointmentsInvalidPet);
  report("Notifications referencing a missing user", notificationsOrphaned);

  // ── Application-level invariants (NOT enforced by any DB constraint) ────

  // A review must correspond to a COMPLETED appointment by the same user
  // at the same business — this is enforced in application code
  // (review-service.ts) at write time, not by the schema, so it's worth
  // checking directly. Excludes prisma/seed-businesses.ts's synthetic
  // reviewer accounts (no passwordHash, @seed.petnet.local email) — those
  // are canned demo content created directly via Review.create(), by
  // design without a backing appointment, not something the live app can
  // produce for a real user.
  const reviews = await prisma.review.findMany({
    where: { user: { passwordHash: { not: null } } },
    select: { id: true, userId: true, businessId: true, createdAt: true },
  });
  const completedPairs = new Set(
    (
      await prisma.appointment.findMany({
        where: { status: "COMPLETED" },
        select: { userId: true, businessId: true },
      })
    ).map((a) => `${a.userId}:${a.businessId}`),
  );
  const reviewsWithoutCompletedVisit = reviews.filter(
    (r) => !completedPairs.has(`${r.userId}:${r.businessId}`),
  );
  report(
    "Reviews with no matching COMPLETED appointment",
    reviewsWithoutCompletedVisit.length,
    reviewsWithoutCompletedVisit.slice(0, 5),
  );

  // Duplicate reviews are blocked by @@unique([userId, businessId]) — this
  // should be structurally impossible; confirmed here for completeness.
  const duplicateReviews = await prisma.review.groupBy({
    by: ["userId", "businessId"],
    _count: true,
    having: { userId: { _count: { gt: 1 } } },
  });
  report("Duplicate reviews (same user + business)", duplicateReviews.length, duplicateReviews);

  // Self-reviews: a business owner reviewing their own business. Blocked
  // going forward by createBooking/createReview (see booking-service.ts,
  // review-service.ts) — checking for any that predate that fix. Prisma
  // can't compare two columns directly in a `where`, so filter in JS.
  const allReviewsWithOwner = await prisma.review.findMany({
    select: { id: true, userId: true, businessId: true, business: { select: { ownerId: true } } },
  });
  const selfReviews = allReviewsWithOwner.filter((r) => r.userId === r.business.ownerId);
  report("Reviews written by the business's own owner", selfReviews.length, selfReviews);

  // Business claims stuck referencing a business that's no longer a valid
  // target (e.g. approved-elsewhere while this claim was still pending).
  const staleClaims = await prisma.businessClaim.findMany({
    where: {
      status: "PENDING",
      businessId: { not: null },
      business: { status: "ACTIVE" },
    },
    select: { id: true, businessId: true, userId: true, createdAt: true },
  });
  report("Pending claims targeting an already-ACTIVE business", staleClaims.length, staleClaims);

  // Coordinates outside valid Earth bounds, or the (0,0) "null island"
  // placeholder that usually means a geocode silently defaulted instead of
  // failing loudly.
  const businessesWithCoords = await prisma.business.findMany({
    where: { OR: [{ latitude: { not: null } }, { longitude: { not: null } }] },
    select: { id: true, slug: true, latitude: true, longitude: true },
  });
  const invalidCoords = businessesWithCoords.filter((b) => {
    const { latitude: lat, longitude: lng } = b;
    if (lat == null || lng == null) return true; // one set without the other
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return true;
    if (lat === 0 && lng === 0) return true; // null island
    return false;
  });
  report("Businesses with invalid/suspicious coordinates", invalidCoords.length, invalidCoords);

  // Image URL sanity: flag anything that isn't one of the two hosts
  // next.config.ts actually allows (images.unsplash.com for seed/demo
  // fixtures, res.cloudinary.com for real uploads) — an image from
  // anywhere else would fail next/image's remotePatterns check and never
  // render. Empty string is worse than null (trips next/image's
  // empty-src warning). Can't verify the URL actually resolves without a
  // live HTTP call, which this script deliberately doesn't make.
  const isPlausibleImageUrl = (url: string) =>
    url.startsWith("https://res.cloudinary.com/") || url.startsWith("https://images.unsplash.com/");
  const [petsBadAvatar, businessesBadLogo, businessesBadCover] = await Promise.all([
    prisma.pet.findMany({
      where: { avatarUrl: { not: null } },
      select: { id: true, avatarUrl: true },
    }),
    prisma.business.findMany({
      where: { logoUrl: { not: null } },
      select: { id: true, slug: true, logoUrl: true },
    }),
    prisma.business.findMany({
      where: { coverUrl: { not: null } },
      select: { id: true, slug: true, coverUrl: true },
    }),
  ]);
  const badAvatars = petsBadAvatar.filter(
    (p) => p.avatarUrl === "" || (p.avatarUrl && !isPlausibleImageUrl(p.avatarUrl) && !p.avatarUrl.startsWith("/")),
  );
  const badLogos = businessesBadLogo.filter((b) => b.logoUrl === "" || (b.logoUrl && !isPlausibleImageUrl(b.logoUrl)));
  const badCovers = businessesBadCover.filter(
    (b) => b.coverUrl === "" || (b.coverUrl && !isPlausibleImageUrl(b.coverUrl)),
  );
  report("Pets with an empty/malformed avatarUrl", badAvatars.length, badAvatars.slice(0, 5));
  report("Businesses with an empty/malformed logoUrl", badLogos.length, badLogos.slice(0, 5));
  report("Businesses with an empty/malformed coverUrl", badCovers.length, badCovers.slice(0, 5));

  console.log("=".repeat(70));
  if (totalIssues === 0) {
    console.log("All checks passed — no inconsistencies found.");
  } else {
    console.log(`${totalIssues} total issue(s) found across the checks above. Nothing was modified.`);
  }
}

main()
  .catch((err) => {
    console.error("Verification script failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
