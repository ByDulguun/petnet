// Geo helpers for the services map. All distances in kilometers.

export interface LatLng {
  lat: number;
  lng: number;
}

/** Ulaanbaatar city center (Sükhbaatar Square) — default map focus. */
export const UB_CENTER: LatLng = { lat: 47.9186, lng: 106.9177 };

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** "650 m" below 1 km, otherwise "2.4 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Rough door-to-door drive estimate for Ulaanbaatar traffic (~22 km/h
 * effective) with a 4-minute park-and-walk buffer.
 */
export function estimateTravelMinutes(km: number): number {
  return Math.max(3, Math.round((km / 22) * 60) + 4);
}

/** Google Maps deep links (work on web, iOS and Android). */
export function googleMapsPlaceUrl(point: LatLng, name?: string): string {
  const query = name
    ? encodeURIComponent(`${name} ${point.lat},${point.lng}`)
    : `${point.lat},${point.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function googleMapsDirectionsUrl(dest: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`;
}

export function googleStreetViewUrl(point: LatLng): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${point.lat},${point.lng}`;
}

/**
 * Project a point into a 0–1 unit square inside `bounds` (for the offline
 * fallback map). Y is inverted because screen coordinates grow downward.
 */
export function projectToUnit(
  point: LatLng,
  bounds: { north: number; south: number; east: number; west: number },
): { x: number; y: number } {
  const x = (point.lng - bounds.west) / (bounds.east - bounds.west);
  const y = 1 - (point.lat - bounds.south) / (bounds.north - bounds.south);
  return { x: clamp01(x), y: clamp01(y) };
}

export function boundsOf(points: LatLng[], padRatio = 0.12) {
  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;
  for (const p of points) {
    north = Math.max(north, p.lat);
    south = Math.min(south, p.lat);
    east = Math.max(east, p.lng);
    west = Math.min(west, p.lng);
  }
  const latPad = Math.max((north - south) * padRatio, 0.004);
  const lngPad = Math.max((east - west) * padRatio, 0.004);
  return {
    north: north + latPad,
    south: south - latPad,
    east: east + lngPad,
    west: west - lngPad,
  };
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
