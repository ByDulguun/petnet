// Seed reference data: core vaccines, popular breeds, article categories.
// Run with: npm run db:seed  (requires DATABASE_URL)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VACCINES = [
  {
    name: "Rabies",
    isCore: true,
    recommendedAgeWk: 12,
    boosterMonths: 12,
    description:
      "Legally required in Mongolia. Protects against the fatal rabies virus.",
  },
  {
    name: "Distemper (CDV)",
    isCore: true,
    recommendedAgeWk: 6,
    boosterMonths: 12,
    description: "Core vaccine against canine distemper virus.",
  },
  {
    name: "Parvovirus (CPV)",
    isCore: true,
    recommendedAgeWk: 6,
    boosterMonths: 12,
    description: "Core vaccine against the highly contagious parvovirus.",
  },
  {
    name: "Adenovirus / Hepatitis (CAV-2)",
    isCore: true,
    recommendedAgeWk: 8,
    boosterMonths: 12,
    description: "Core vaccine against infectious canine hepatitis.",
  },
  {
    name: "Parainfluenza",
    isCore: false,
    recommendedAgeWk: 8,
    boosterMonths: 12,
    description: "Non-core vaccine, often combined in DHPP.",
  },
  {
    name: "Bordetella (Kennel Cough)",
    isCore: false,
    recommendedAgeWk: 8,
    boosterMonths: 12,
    description:
      "Recommended for dogs that board, attend daycare or dog parks.",
  },
  {
    name: "Leptospirosis",
    isCore: false,
    recommendedAgeWk: 12,
    boosterMonths: 12,
    description: "Recommended for dogs with outdoor water exposure.",
  },
] as const;

const BREEDS = [
  {
    slug: "bankhar",
    name: "Mongolian Bankhar",
    nameMn: "Монгол банхар",
    summary:
      "The legendary livestock guardian of the Mongolian steppe — loyal, independent and built for the harshest winters on earth.",
    temperament: ["Loyal", "Protective", "Independent", "Calm"],
    exerciseNeeds: 4,
    groomingNeeds: 3,
    trainability: 3,
    friendliness: 3,
    sheddingLevel: 4,
    lifeExpectancy: "12–15 years",
    weightRange: "35–60 kg",
    heightRange: "65–75 cm",
    pros: ["Extremely cold-hardy", "Devoted guardian", "Healthy landrace genetics"],
    cons: ["Needs space", "Strong guarding instinct", "Heavy seasonal shedding"],
    commonDiseases: ["Hip dysplasia"],
  },
  {
    slug: "golden-retriever",
    name: "Golden Retriever",
    nameMn: "Голден ретривер",
    summary:
      "The world's favorite family dog — gentle, eager to please and endlessly patient with children.",
    temperament: ["Friendly", "Gentle", "Intelligent", "Eager to please"],
    exerciseNeeds: 4,
    groomingNeeds: 4,
    trainability: 5,
    friendliness: 5,
    sheddingLevel: 4,
    lifeExpectancy: "10–12 years",
    weightRange: "25–34 kg",
    heightRange: "51–61 cm",
    pros: ["Great with kids", "Highly trainable", "Even temperament"],
    cons: ["Heavy shedding", "Prone to obesity", "Needs daily exercise"],
    commonDiseases: ["Hip dysplasia", "Cancer", "Ear infections"],
  },
  {
    slug: "german-shepherd",
    name: "German Shepherd",
    nameMn: "Герман хоньч",
    summary:
      "Confident, courageous and smart — the world's leading working dog excels at everything it's given.",
    temperament: ["Confident", "Courageous", "Smart", "Loyal"],
    exerciseNeeds: 5,
    groomingNeeds: 3,
    trainability: 5,
    friendliness: 4,
    sheddingLevel: 5,
    lifeExpectancy: "9–13 years",
    weightRange: "22–40 kg",
    heightRange: "55–65 cm",
    pros: ["Extremely trainable", "Versatile worker", "Devoted to family"],
    cons: ["Constant shedding", "Needs a job to do", "Prone to joint issues"],
    commonDiseases: ["Hip dysplasia", "Degenerative myelopathy", "Bloat"],
  },
  {
    slug: "pembroke-welsh-corgi",
    name: "Pembroke Welsh Corgi",
    nameMn: "Корги",
    summary:
      "A big dog in a small body — affectionate, alert and famously internet-adored.",
    temperament: ["Affectionate", "Alert", "Playful", "Bold"],
    exerciseNeeds: 3,
    groomingNeeds: 2,
    trainability: 4,
    friendliness: 4,
    sheddingLevel: 4,
    lifeExpectancy: "12–13 years",
    weightRange: "10–14 kg",
    heightRange: "25–30 cm",
    pros: ["Apartment-friendly size", "Smart and quick to learn", "Great watchdog"],
    cons: ["Prone to back problems", "Sheds heavily", "Can be vocal"],
    commonDiseases: ["Intervertebral disc disease", "Hip dysplasia", "Obesity"],
  },
  {
    slug: "siberian-husky",
    name: "Siberian Husky",
    nameMn: "Сибирь хаски",
    summary:
      "Born to run — a friendly, mischievous athlete that thrives in Mongolia's climate.",
    temperament: ["Outgoing", "Mischievous", "Energetic", "Friendly"],
    exerciseNeeds: 5,
    groomingNeeds: 3,
    trainability: 2,
    friendliness: 5,
    sheddingLevel: 5,
    lifeExpectancy: "12–14 years",
    weightRange: "16–27 kg",
    heightRange: "50–60 cm",
    pros: ["Loves cold weather", "Very social", "Striking looks"],
    cons: ["Escape artist", "High exercise needs", "Strong prey drive"],
    commonDiseases: ["Cataracts", "Hip dysplasia", "Hypothyroidism"],
  },
] as const;

const ARTICLE_CATEGORIES = [
  { slug: "getting-started", name: "Getting Started" },
  { slug: "health", name: "Health" },
  { slug: "nutrition", name: "Nutrition" },
  { slug: "training", name: "Training" },
  { slug: "grooming", name: "Grooming" },
  { slug: "lifestyle", name: "Lifestyle" },
] as const;

async function main() {
  console.log("🌱 Seeding reference data…");

  for (const vaccine of VACCINES) {
    const existing = await prisma.vaccine.findFirst({
      where: { name: vaccine.name, species: "DOG" },
    });
    if (existing) {
      await prisma.vaccine.update({ where: { id: existing.id }, data: vaccine });
    } else {
      await prisma.vaccine.create({ data: { ...vaccine, species: "DOG" } });
    }
  }
  console.log(`  ✓ ${VACCINES.length} vaccines`);

  for (const breed of BREEDS) {
    await prisma.breed.upsert({
      where: { slug: breed.slug },
      update: { ...breed, temperament: [...breed.temperament], pros: [...breed.pros], cons: [...breed.cons], commonDiseases: [...breed.commonDiseases] },
      create: { ...breed, species: "DOG", temperament: [...breed.temperament], pros: [...breed.pros], cons: [...breed.cons], commonDiseases: [...breed.commonDiseases] },
    });
  }
  console.log(`  ✓ ${BREEDS.length} breeds`);

  for (const category of ARTICLE_CATEGORIES) {
    await prisma.articleCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }
  console.log(`  ✓ ${ARTICLE_CATEGORIES.length} article categories`);

  console.log("🌱 Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
