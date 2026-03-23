import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface UseGeolocationResult {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  retry: () => void;
}

// Minimum distance (meters) the user must move before we update the position state.
// This prevents the feed from re-fetching on tiny GPS fluctuations.
const MIN_MOVE_THRESHOLD = 5;

function quickDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);
  const lastPos = useRef<{ lat: number; lng: number } | null>(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;

        // Only update state if this is the first reading or user moved significantly
        if (
          !lastPos.current ||
          quickDistance(lastPos.current.lat, lastPos.current.lng, newLat, newLng) >= MIN_MOVE_THRESHOLD
        ) {
          lastPos.current = { lat: newLat, lng: newLng };
          setPosition({
            lat: newLat,
            lng: newLng,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          });
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('PERMISSION_DENIED');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('POSITION_UNAVAILABLE');
            break;
          case err.TIMEOUT:
            setError('TIMEOUT');
            break;
          default:
            setError('UNKNOWN_ERROR');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);
  }, []);

  const retry = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    startWatching();
  }, [watchId, startWatching]);

  useEffect(() => {
    startWatching();
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { position, error, loading, retry };
}
