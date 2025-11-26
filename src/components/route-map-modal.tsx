"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface Stop {
  latitude: number;
  longitude: number;
  name?: string;
  stop_order?: number;
}

interface RouteMapModalProps {
  routeId?: number;
  startLocation: { latitude: number; longitude: number; name?: string };
  endLocation: { latitude: number; longitude: number; name?: string };
  stops: Stop[];
  onClose: () => void;
}

export function RouteMapModal({
  startLocation,
  endLocation,
  stops,
  onClose,
}: RouteMapModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [startLocation.longitude, startLocation.latitude],
        zoom: 12,
      });

      map.current.on("load", () => {
        updateRouteLayer();
      });
    } else {
      if (map.current.isStyleLoaded()) {
        updateRouteLayer();
      } else {
        map.current.once("styledata", updateRouteLayer);
      }
    }
  }, [startLocation, endLocation, stops]);

  async function updateRouteLayer() {
    if (!map.current) return;

    // Ordenar stops por stop_order
    const orderedStops = [...stops].sort(
      (a, b) => (a.stop_order ?? 0) - (b.stop_order ?? 0)
    );

    // Construir coordenadas incluyendo inicio y fin
    const allPoints = [startLocation, ...orderedStops, endLocation];
    const coordinates = allPoints.map((s) => `${s.longitude},${s.latitude}`).join(";");

    try {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) return;

      const route = data.routes[0].geometry;

      if (map.current.getSource("route")) {
        map.current.removeLayer("routeLine");
        map.current.removeSource("route");
      }

      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: route,
        },
      });

      map.current.addLayer({
        id: "routeLine",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#1db7dd", "line-width": 5 },
      });

      // Limpiar marcadores previos
      markers.current.forEach((m) => m.remove());
      markers.current = [];

      // Agregar marcadores con popup para cada parada
      allPoints.forEach((point, i) => {
        const el = document.createElement("div");
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor =
          i === 0
            ? "green"
            : i === allPoints.length - 1
            ? "red"
            : "orange";
        el.style.border = "2px solid white";

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="color: black;">
                ${point.name
                ? point.name
                : i === 0
                ? "Inicio"
                : i === allPoints.length - 1
                ? "Fin"
                : `Parada ${i}`}
            </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([point.longitude, point.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.push(marker);
      });

      // Ajustar bounds para que se vean todos los puntos
      const bounds = new mapboxgl.LngLatBounds();
      allPoints.forEach((s) => bounds.extend([s.longitude, s.latitude]));
      map.current.fitBounds(bounds, { padding: 50 });
    } catch (error) {
      console.error("Error fetching route from Mapbox Directions API", error);
    }
  }

  return <div style={{ width: "100%", height: "400px" }} ref={mapContainer} />;
}
