// Seeds the business domain (categories, amenities, businesses + everything
// nested under them) from the fixture dataset that business-service.ts used
// to read directly. Safe to re-run: businesses already in the DB are skipped
// rather than duplicated.
//
// Run with: npm run db:seed-businesses  (requires DATABASE_URL + `prisma migrate dev` already applied)

import { PrismaClient } from "@prisma/client";

import { BUSINESSES } from "../src/server/data/business-fixtures";
import { AMENITIES, CATEGORIES } from "../src/server/data/taxonomy";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seedCategories() {
  for (const c of CATEGORIES) {
    await prisma.businessCategory.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        nameMn: c.nameMn,
        description: c.description,
        icon: c.icon,
        tone: c.tone,
        sortOrder: c.sortOrder,
      },
      create: {
        slug: c.slug,
        name: c.name,
        nameMn: c.nameMn,
        description: c.description,
        icon: c.icon,
        tone: c.tone,
        sortOrder: c.sortOrder,
      },
    });
  }
  console.log(`  ✓ ${CATEGORIES.length} business categories`);
}

async function seedAmenities() {
  for (const [i, a] of AMENITIES.entries()) {
    await prisma.amenity.upsert({
      where: { slug: a.slug },
      update: { name: a.name, icon: a.icon, sortOrder: i },
      create: { slug: a.slug, name: a.name, icon: a.icon, sortOrder: i },
    });
  }
  console.log(`  ✓ ${AMENITIES.length} amenities`);
}

/** Fixture services carry a free-text categoryName; turn each distinct name into a real ServiceCategory. */
async function seedServiceCategories(): Promise<Map<string, string>> {
  const names = new Set<string>();
  for (const b of BUSINESSES) {
    for (const s of b.services) {
      if (s.categoryName) names.add(s.categoryName);
    }
  }

  const idByName = new Map<string, string>();
  let sortOrder = 0;
  for (const name of names) {
    const row = await prisma.serviceCategory.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { slug: slugify(name), name, sortOrder: sortOrder++ },
    });
    idByName.set(name, row.id);
  }
  console.log(`  ✓ ${names.size} service categories`);
  return idByName;
}

async function seedBusinesses(serviceCategoryIdByName: Map<string, string>) {
  let created = 0;
  let skipped = 0;

  for (const b of BUSINESSES) {
    const existing = await prisma.business.findUnique({ where: { slug: b.slug } });
    if (existing) {
      skipped += 1;
      continue;
    }

    const category = await prisma.businessCategory.findUniqueOrThrow({
      where: { slug: b.categorySlug },
    });

    // Every business needs an owner FK; real business onboarding lands in a
    // later phase, so seed a non-loginable placeholder owner per business.
    const owner = await prisma.user.upsert({
      where: { email: `owner+${b.slug}@seed.petnet.local` },
      update: {},
      create: {
        email: `owner+${b.slug}@seed.petnet.local`,
        name: `${b.name} (owner)`,
        role: "BUSINESS_OWNER",
      },
    });

    const business = await prisma.business.create({
      data: {
        slug: b.slug,
        name: b.name,
        tagline: b.tagline,
        description: b.description,
        phone: b.phone,
        email: b.email,
        website: b.website,
        facebook: b.facebook,
        instagram: b.instagram,
        tiktok: b.tiktok,
        address: b.address,
        district: b.district,
        city: b.city,
        latitude: b.latitude,
        longitude: b.longitude,
        coverUrl: b.coverUrl,
        logoUrl: b.logoUrl,
        priceLevel: b.priceLevel,
        tags: [...b.tags],
        isVerified: b.isVerified,
        ratingAvg: b.ratingAvg,
        ratingCount: b.ratingCount,
        status: "ACTIVE",
        owner: { connect: { id: owner.id } },
        category: { connect: { id: category.id } },
        hours: {
          create: b.hours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            opensAt: h.opensAt,
            closesAt: h.closesAt,
            is24h: h.is24h,
          })),
        },
        holidays: {
          create: b.holidays.map((h) => ({
            date: new Date(h.date),
            name: h.name,
            opensAt: h.opensAt,
            closesAt: h.closesAt,
          })),
        },
        media: {
          create: b.media.map((m, i) => ({
            type: m.type,
            url: m.url,
            thumbnailUrl: m.thumbnailUrl,
            alt: m.alt,
            order: i,
          })),
        },
        faqs: {
          create: b.faqs.map((f, i) => ({
            question: f.question,
            answer: f.answer,
            order: i,
          })),
        },
        staff: {
          create: b.staff.map((s) => ({
            name: s.name,
            title: s.title,
            bio: s.bio,
            photoUrl: s.photoUrl,
            specialty: s.specialty,
          })),
        },
        amenities: {
          create: b.amenities.map((slug) => ({ amenity: { connect: { slug } } })),
        },
        services: {
          create: b.services.map((s) => ({
            name: s.name,
            description: s.description,
            priceMnt: s.priceMnt,
            priceMaxMnt: s.priceMaxMnt,
            durationMin: s.durationMin,
            isBookable: s.isBookable,
            category: s.categoryName
              ? { connect: { id: serviceCategoryIdByName.get(s.categoryName)! } }
              : undefined,
          })),
        },
      },
    });

    // Each fixture review gets its own non-loginable seed reviewer so
    // Review.userId FKs are real without inventing shared identities.
    for (const r of b.reviews) {
      const reviewer = await prisma.user.upsert({
        where: { email: `reviewer+${r.id}@seed.petnet.local` },
        update: {},
        create: {
          email: `reviewer+${r.id}@seed.petnet.local`,
          name: r.authorName,
          image: r.authorImage,
        },
      });
      await prisma.review.create({
        data: {
          userId: reviewer.id,
          businessId: business.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          reply: r.reply,
          repliedAt: r.repliedAt ? new Date(r.repliedAt) : undefined,
          isVerified: r.isVerified,
          helpfulCount: r.helpfulCount,
          createdAt: new Date(r.createdAt),
          media: { create: r.photos.map((url, i) => ({ url, order: i })) },
        },
      });
    }

    created += 1;
  }

  console.log(`  ✓ ${created} businesses created, ${skipped} already present (skipped)`);
}

async function main() {
  console.log("🌱 Seeding business domain…");
  await seedCategories();
  await seedAmenities();
  const serviceCategoryIdByName = await seedServiceCategories();
  await seedBusinesses(serviceCategoryIdByName);
  console.log("🌱 Business domain seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
