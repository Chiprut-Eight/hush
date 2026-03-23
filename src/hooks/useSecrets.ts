import { useState, useEffect, useCallback } from 'react';
import { getSecretsNearby, type Secret } from '../services/secretService';
import { haversineDistance, FEED_RADIUS_METERS } from '../services/geoService';
import type { GeoPosition } from './useGeolocation';

interface UseSecretsResult {
  secrets: Secret[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSecrets(position: GeoPosition | null): UseSecretsResult {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSecrets = useCallback(async () => {
    if (!position) return;

    setLoading(true);
    setError(null);

    try {
      const nearby = await getSecretsNearby(position.lat, position.lng, FEED_RADIUS_METERS);

      // Filter by actual Haversine distance and sort by closest
      const filtered = nearby
        .map((secret) => ({
          ...secret,
          _distance: haversineDistance(position.lat, position.lng, secret.lat, secret.lng),
        }))
        .filter((s) => s._distance <= FEED_RADIUS_METERS)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setSecrets(filtered);
    } catch (err) {
      setError('Failed to fetch secrets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [position]);

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

  return { secrets, loading, error, refresh: fetchSecrets };
}

export function useSecretDistance(
  position: GeoPosition | null,
  secretLat: number,
  secretLng: number
): number | null {
  if (!position) return null;
  return Math.round(haversineDistance(position.lat, position.lng, secretLat, secretLng));
}
