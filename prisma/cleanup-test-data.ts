// Removes accounts/businesses created by automated testing during
// development (Phases 7-9), which all share one unambiguous signature:
// the email domain `@example.com`, used by every register() call across
// every test script this session and by no real user (there are no real
// users yet). Never touches the 18 seeded demo businesses/users (real
// seed data, not test artifacts) or anything with a different email
// domain.
//
// Defaults to a DRY RUN — prints exactly what would be deleted and exits.
// Pass --execute to actually delete.
//
// Run with: npx tsx prisma/cleanup-test-data.ts          (dry run)
//           npx tsx prisma/cleanup-test-data.ts --execute (actually delete)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const EXECUTE = process.argv.includes("--execute");

async function main() {
  console.log(`PetNet test-data cleanup — ${EXECUTE ? "EXECUTE" : "DRY RUN"} — ${new Date().toISOString()}`);
  console.log("=".repeat(70));

  const testUsers = await prisma.user.findMany({
    where: { email: { endsWith: "@example.com" } },
    select: { id: true, email: true, role: true },
  });
  console.log(`Test users (email ends with @example.com): ${testUsers.length}`);
  if (testUsers.some((u) => u.role === "ADMIN")) {
    console.log(
      `  includes ${testUsers.filter((u) => u.role === "ADMIN").length} ADMIN test account(s) — ` +
        `these are dev-only credentials and must not remain in a production database.`,
    );
  }

  const testUserIds = testUsers.map((u) => u.id);

  // Catches any test business whose owner might not match the pattern
  // above (there shouldn't be any, but this is a report, not an action).
  const businessesOwnedByTestUsers = await prisma.business.count({
    where: { ownerId: { in: testUserIds } },
  });
  const otherBusinesses = await prisma.business.findMany({
    where: { ownerId: { notIn: testUserIds } },
    select: { name: true, slug: true },
  });

  console.log(`Businesses owned by test users: ${businessesOwnedByTestUsers}`);
  console.log(`Businesses NOT owned by a test user (will be preserved): ${otherBusinesses.length}`);
  otherBusinesses.forEach((b) => console.log(`  - ${b.name} (${b.slug})`));

  if (testUsers.length === 0) {
    console.log("\nNothing to clean up.");
    return;
  }

  if (!EXECUTE) {
    console.log("\nDry run only — re-run with --execute to actually delete the above test users");
    console.log("(and, via ON DELETE CASCADE, their pets/businesses/appointments/reviews/notifications).");
    return;
  }

  // User deletion cascades to: Pet, Business (as owner), Appointment (as
  // user), Review (as user), BusinessClaim, Notification, Booking, Report
  // (as reporter) — see the onDelete: Cascade relations in schema.prisma.
  // Businesses owned by a test user cascade further to their Services,
  // BusinessHours, BusinessMedia, etc. Nothing here can touch a real
  // (non-@example.com) account or a business it owns.
  const result = await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
  console.log(`\nDeleted ${result.count} test users (cascaded to their owned data).`);
}

main()
  .catch((err) => {
    console.error("Cleanup script failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
