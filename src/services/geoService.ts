/**
 * Geolocation & GeoHash service for HUSH.
 * 
 * Uses the browser Geolocation API for position tracking,
 * GeoHash for efficient Firestore range queries (500m feed radius),
 * and Haversine formula for precise 2m proximity checks.
 */

// GeoHash encoding for Firestore geo-queries
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeoHash(lat: number, lng: number, precision: number = 7): string {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = '';
  let isLng = true;
  let bit = 0;
  let ch = 0;

  while (hash.length < precision) {
    if (isLng) {
      const mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch |= (1 << (4 - bit));
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    isLng = !isLng;
    if (bit < 4) {
      bit++;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

/**
 * Get GeoHash range for querying secrets within a radius.
 * Returns [start, end] bound for Firestore where() queries.
 */
export function getGeoHashRange(lat: number, lng: number, radiusMeters: number): { lower: string; upper: string } {
  // Approximate precision based on radius
  let precision: number;
  if (radiusMeters <= 5) precision = 9;
  else if (radiusMeters <= 20) precision = 8;
  else if (radiusMeters <= 80) precision = 7;
  else if (radiusMeters <= 600) precision = 6;
  else if (radiusMeters <= 2400) precision = 5;
  else precision = 4;

  const hash = encodeGeoHash(lat, lng, precision);
  return {
    lower: hash,
    upper: hash + '~', // ~ is after z in ASCII, so this captures all within prefix
  };
}

/**
 * Calculate distance between two coordinates using the Haversine formula.
 * @returns distance in meters
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if a point is within a given radius of another point.
 */
export function isWithinRadius(
  userLat: number, userLng: number,
  targetLat: number, targetLng: number,
  radiusMeters: number
): boolean {
  return haversineDistance(userLat, userLng, targetLat, targetLng) <= radiusMeters;
}

export const FEED_RADIUS_METERS = 500;
export const REVEAL_RADIUS_METERS = 15;
export const ECHO_MAP_RADIUS_METERS = 200;
