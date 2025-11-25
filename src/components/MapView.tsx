import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

    const mapCenter = center || (locations.length > 0 
      ? locations[0].coordinates 
      : [106.8272, -6.1754]);

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: mapCenter,
      zoom: zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        if (map.current) {
          map.current.setCenter([longitude, latitude]);
        }
      });
    }

    locations.forEach((location) => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = 'hsl(30, 30%, 41%)';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

      const popup = new mapboxgl.Popup({ offset: 35 }).setHTML(
        `<div style="padding: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 4px; color: hsl(30, 30%, 41%);">${location.name}</h3>
          ${location.description ? `<p style="font-size: 14px; color: hsl(30, 20%, 45%);">${location.description}</p>` : ''}
        </div>`
      );

      new mapboxgl.Marker(el)
        .setLngLat(location.coordinates)
        .setPopup(popup)
        .addTo(map.current);
    });

    if (locations.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach((location) => {
        bounds.extend(location.coordinates);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

    return () => {
      map.current?.remove();
    };
  }, [locations, center, zoom]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default MapView;
