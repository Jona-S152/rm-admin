import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapSelectorProps {
  value?: {
    latitude: number;
    longitude: number;
  };
  onChange: (value: { latitude: number; longitude: number }) => void;
}

export default function MapSelector({ value, onChange } : MapSelectorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [-79.9, -2.1], // Ecuador por defecto
        zoom: 12,
      });

      map.current.on("click", (e: any) => {
        const { lng, lat } = e.lngLat;

        // Crear o mover marcador
        if (!marker.current) {
          marker.current = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map.current);
        } else {
          marker.current.setLngLat([lng, lat]);
        }

        // Pasar datos al padre
        onChange({ latitude: lat, longitude: lng });
      });
    }
  }, []);

  // Actualizar marcador si value cambia externamente
  useEffect(() => {
    if (
        !value ||
        !map.current ||
        typeof value.latitude !== "number" ||
        typeof value.longitude !== "number" ||
        isNaN(value.latitude) ||
        isNaN(value.longitude)
    ) {
        return;
    }

    if (!marker.current) {
        marker.current = new mapboxgl.Marker()
        .setLngLat([value.longitude, value.latitude])
        .addTo(map.current);
    } else {
        marker.current.setLngLat([value.longitude, value.latitude]);
    }
    }, [value]);


  return (
    <div
      ref={mapContainer}
      style={{ width: "100%", height: "300px", borderRadius: 10, overflow: "hidden" }}
    />
  );
}
