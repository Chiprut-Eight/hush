import { useMemo } from 'react';
import { haversineDistance, REVEAL_RADIUS_METERS } from '../services/geoService';
import type { GeoPosition } from './useGeolocation';

interface ProximityResult {
  distance: number | null;
  isInRange: boolean;
}

export function useProximity(
  position: GeoPosition | null,
  targetLat: number,
  targetLng: number,
  radiusMeters: number = REVEAL_RADIUS_METERS
): ProximityResult {
  return useMemo(() => {
    if (!position) {
      return { distance: null, isInRange: false };
    }
    const distance = Math.round(haversineDistance(position.lat, position.lng, targetLat, targetLng));
    return {
      distance,
      isInRange: distance <= radiusMeters,
    };
  }, [position, targetLat, targetLng, radiusMeters]);
}
