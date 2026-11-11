import { NextRequest, NextResponse } from "next/server";
import type { PetSpecies } from "@prisma/client";

import { withErrorHandling } from "@/lib/api-handler";
import { getAdoptionListings } from "@/server/services/adoption-service";

const SPECIES = new Set(["DOG", "CAT", "OTHER"]);

export const GET = withErrorHandling(async (request: NextRequest) => {
  const species = request.nextUrl.searchParams.get("species");
  const listings = await getAdoptionListings({
    species: species && SPECIES.has(species) ? (species as PetSpecies) : undefined,
  });
  return NextResponse.json({ listings });
});
