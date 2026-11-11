// Server-only. Uses OpenStreetMap's Nominatim search API instead of
// Google's Geocoding API — no API key, no billing account, no credentials
// to leak. https://operations.osmfoundation.org/policies/nominatim/ sets
// three conditions for unauthenticated use, all handled below:
//   - max 1 request/second -> throttled via the same Postgres-backed rate
//     limiter used elsewhere in the app, keyed globally so the limit holds
//     across concurrent requests and server instances.
//   - a descriptive User-Agent identifying the application.
//   - cache results -> GeocodeCache (Postgres), keyed by normalized query,
//     so the same address is never looked up twice.

import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const NOMINATIM_BASE_URL = process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";
// No personal contact info baked in by default — operators who want a
// dedicated contact channel for Nominatim's usage-policy compliance should
// set NOMINATIM_USER_AGENT in production.
const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT || "PetNet/1.0 (Mongolia pet-services marketplace)";

export class GeocodingUnavailableError extends Error {
  constructor() {
    super("Location lookup isn't available right now — please try again later.");
    this.name = "GeocodingUnavailableError";
  }
}

export class GeocodingNotFoundError extends Error {
  constructor() {
    super("We couldn't find that address.");
    this.name = "GeocodingNotFoundError";
  }
}

export interface Coordinates {
  lat: number;
  lng: number;
}

function isValidCoordinate({ lat, lng }: Coordinates): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/** Blocks (briefly) until it's our turn under the 1 req/sec global outbound
 * cap. Geocoding only happens on explicit address-change saves, so a
 * request queuing behind at most a second of delay is an acceptable trade
 * for not violating Nominatim's usage policy. */
async function throttleOutboundRequest(): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const result = await checkRateLimit("geocode:nominatim-outbound", {
      limit: 1,
      windowMs: 1100,
    });
    if (result.allowed) return;
    await new Promise((resolve) => setTimeout(resolve, (result.retryAfterSeconds ?? 1) * 1000));
  }
  // Still can't get a slot after retrying — something is calling this far
  // more than the "once per address save" contract promises. Fail closed
  // rather than send Nominatim a burst.
  throw new GeocodingUnavailableError();
}

/** Geocodes once, on demand — callers are responsible for only invoking
 * this when an address actually changed, not on every page load/save. */
export async function geocodeAddress(input: {
  address?: string;
  district?: string;
  city?: string;
}): Promise<Coordinates> {
  if (!input.address && !input.district) throw new GeocodingNotFoundError();

  const query = [input.address, input.district, input.city || "Ulaanbaatar", "Mongolia"]
    .filter(Boolean)
    .join(", ");
  const cacheKey = query.trim().toLowerCase();

  const cached = await prisma.geocodeCache.findUnique({ where: { query: cacheKey } });
  if (cached) return { lat: cached.latitude, lng: cached.longitude };

  await throttleOutboundRequest();

  const url = `${NOMINATIM_BASE_URL}/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new GeocodingUnavailableError();
  }
  if (response.status === 429 || !response.ok) throw new GeocodingUnavailableError();

  const data = (await response.json().catch(() => null)) as
    | { lat: string; lon: string }[]
    | null;
  if (!data) throw new GeocodingUnavailableError();
  if (data.length === 0) throw new GeocodingNotFoundError();

  const lat = Number.parseFloat(data[0].lat);
  const lng = Number.parseFloat(data[0].lon);
  if (!isValidCoordinate({ lat, lng })) throw new GeocodingNotFoundError();

  // Caching is a nicety on top of a correct result — never fail the
  // geocode itself over a cache write.
  await prisma.geocodeCache
    .upsert({
      where: { query: cacheKey },
      create: { query: cacheKey, latitude: lat, longitude: lng },
      update: { latitude: lat, longitude: lng },
    })
    .catch(() => null);

  return { lat, lng };
}
