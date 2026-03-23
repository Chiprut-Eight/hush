import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE, DEFAULT_ZOOM } from '../../config/mapbox';
import { useGeolocation } from '../../hooks/useGeolocation';
import { getSecretsNearby, type Secret } from '../../services/secretService';
import { ECHO_MAP_RADIUS_METERS } from '../../services/geoService';

export function EchoMap() {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { position } = useGeolocation();
  const [secrets, setSecrets] = useState<Secret[]>([]);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'your-mapbox-token') return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: position ? [position.lng, position.lat] : [34.78, 32.08],
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      })
    );

    return () => {
      map.current?.remove();
    };
  }, []);

  // Fetch nearby secrets for echo visualization
  useEffect(() => {
    if (!position) return;

    const fetchSecrets = async () => {
      try {
        const nearby = await getSecretsNearby(position.lat, position.lng, 1000);
        setSecrets(nearby);
      } catch (err) {
        console.error('Failed to fetch secrets for map:', err);
      }
    };

    fetchSecrets();
  }, [position]);

  // Add pulsing markers for active zones
  useEffect(() => {
    if (!map.current || secrets.length === 0) return;

    // Keep track of markers to remove them when secrets change
    const markers: mapboxgl.Marker[] = [];

    const updateMarkers = () => {
      if (!map.current) return;

      // Clear existing markers
      markers.forEach(m => m.remove());
      markers.length = 0;

      // Ensure any old WebGL layers are removed just in case
      if (map.current.getSource('echo-secrets')) {
        if (map.current.getLayer('echo-pulse-outer')) map.current.removeLayer('echo-pulse-outer');
        if (map.current.getLayer('echo-pulse-inner')) map.current.removeLayer('echo-pulse-inner');
        if (map.current.getLayer('echo-center')) map.current.removeLayer('echo-center');
        map.current.removeSource('echo-secrets');
      }

      secrets.forEach((secret) => {
        // Create custom HTML element for the marker
        const el = document.createElement('div');
        el.className = 'echo-marker';
        el.style.color = secret.creatorTierColor;

        // Inner solid core
        const core = document.createElement('div');
        core.className = 'echo-pulse-core';
        el.appendChild(core);

        // Ring 1
        const ring1 = document.createElement('div');
        ring1.className = 'echo-pulse-ring';
        el.appendChild(ring1);

        // Ring 2 (delayed animation)
        const ring2 = document.createElement('div');
        ring2.className = 'echo-pulse-ring';
        el.appendChild(ring2);

        // Add to map
        const marker = new mapboxgl.Marker(el)
          .setLngLat([secret.lng, secret.lat])
          .addTo(map.current!);
          
        markers.push(marker);
      });
    };

    if (map.current.isStyleLoaded()) {
      updateMarkers();
    } else {
      map.current.on('load', updateMarkers);
    }

    // Cleanup markers on unmount or deps change
    return () => {
      markers.forEach(m => m.remove());
    };
  }, [secrets]);

  // Update map center when position changes
  useEffect(() => {
    if (map.current && position) {
      map.current.flyTo({
        center: [position.lng, position.lat],
        zoom: DEFAULT_ZOOM,
        speed: 1.5,
      });
    }
  }, [position]);

  if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'your-mapbox-token') {
    return (
      <div className="empty-state" style={{ flex: 1 }}>
        <span className="empty-state-icon">🗺️</span>
        <p>Mapbox token not configured</p>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
          Add VITE_MAPBOX_ACCESS_TOKEN to your .env file
        </p>
      </div>
    );
  }

  return (
    <div className="map-container" id="echo-map">
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
