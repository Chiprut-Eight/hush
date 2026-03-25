import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

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

const isNative = Capacitor.isNativePlatform();

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef<string | number | null>(null);
  const lastPos = useRef<{ lat: number; lng: number } | null>(null);

  const handlePosition = useCallback((lat: number, lng: number, accuracy: number, timestamp: number) => {
    if (
      !lastPos.current ||
      quickDistance(lastPos.current.lat, lastPos.current.lng, lat, lng) >= MIN_MOVE_THRESHOLD
    ) {
      lastPos.current = { lat, lng };
      setPosition({ lat, lng, accuracy, timestamp });
    }
    setLoading(false);
    setError(null);
  }, []);

  const startWatching = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isNative) {
      // Use Capacitor Geolocation plugin on native
      try {
        const perm = await Geolocation.requestPermissions();
        if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
          setError('PERMISSION_DENIED');
          setLoading(false);
          return;
        }
        const watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
          (pos, err) => {
            if (err) {
              setError(err.message || 'UNKNOWN_ERROR');
              setLoading(false);
              return;
            }
            if (pos) {
              handlePosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, pos.timestamp);
            }
          }
        );
        watchIdRef.current = watchId;
      } catch (err) {
        setError('PERMISSION_DENIED');
        setLoading(false);
      }
    } else {
      // Use browser Geolocation API on web
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser');
        setLoading(false);
        return;
      }

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          handlePosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, pos.timestamp);
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
      watchIdRef.current = id;
    }
  }, [handlePosition]);

  const retry = useCallback(async () => {
    if (watchIdRef.current !== null) {
      if (isNative) {
        await Geolocation.clearWatch({ id: watchIdRef.current as string });
      } else {
        navigator.geolocation.clearWatch(watchIdRef.current as number);
      }
    }
    startWatching();
  }, [startWatching]);

  useEffect(() => {
    startWatching();
    return () => {
      if (watchIdRef.current !== null) {
        if (isNative) {
          Geolocation.clearWatch({ id: watchIdRef.current as string });
        } else {
          navigator.geolocation.clearWatch(watchIdRef.current as number);
        }
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { position, error, loading, retry };
}
