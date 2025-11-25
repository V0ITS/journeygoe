import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';

interface Location {
  name: string;
  coordinates: [number, number]; // [lng, lat]
  description?: string;
}

interface MapViewProps {
  locations: Location[];
  center?: [number, number];
  zoom?: number;
}

const MapView = ({ locations, center, zoom = 10 }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Initialize map only once

    try {
      // Get Mapbox token from environment (STRICT MODE - AUTO TOKEN ONLY)
      const MAPBOX_KEY = import.meta.env.VITE_MAPBOX_API_KEY;
      
      if (!MAPBOX_KEY) {
        setMapError('Mapbox API Key belum di-set di Secrets.');
        return;
      }

      mapboxgl.accessToken = MAPBOX_KEY;

      // Calculate center from locations if not provided
      const mapCenter = center || (locations.length > 0 
        ? locations[0].coordinates 
        : [106.8272, -6.1754]); // Default to Jakarta

      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: mapCenter,
        zoom: zoom,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Get user's current location (Geolocation)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          if (map.current) {
            map.current.setCenter([longitude, latitude]);
          }
        });
      }

      // Add markers for each location
      locations.forEach((location) => {
        if (!map.current) return;

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = 'hsl(30, 30%, 41%)';
        el.style.border = '3px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 35 }).setHTML(
          `<div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px; color: hsl(30, 30%, 41%);">${location.name}</h3>
            ${location.description ? `<p style="font-size: 14px; color: hsl(30, 20%, 45%);">${location.description}</p>` : ''}
          </div>`
        );

        // Add marker to map
        new mapboxgl.Marker(el)
          .setLngLat(location.coordinates)
          .setPopup(popup)
          .addTo(map.current);
      });

      // Fit map to show all markers if multiple locations
      if (locations.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach((location) => {
          bounds.extend(location.coordinates);
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Gagal memuat peta. Periksa koneksi internet Anda.');
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [locations, center, zoom]);

  if (mapError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive font-semibold">⚠️ {mapError}</p>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default MapView;
