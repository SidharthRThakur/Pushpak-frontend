// frontend/src/components/MapLibreMap.js
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapLibreMap({
  center = [77.5946, 12.9716],
  zoom = 12,
  styleUrl = "https://demotiles.maplibre.org/style.json",
  className = "h-full w-full",
  onMapReady = () => {},
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (mapRef.current) {
      try {
        mapRef.current.setCenter(center);
        mapRef.current.setZoom(zoom);
      } catch (err) {}
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center,
      zoom,
      attributionControl: true,
    });

    mapRef.current = map;

    map.on("load", () => {
      onMapReady(map);
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }));

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapContainer, center, zoom, styleUrl, onMapReady]);

  useEffect(() => {
    if (!mapRef.current) return;
    try {
      mapRef.current.easeTo({ center, zoom });
    } catch (e) {}
  }, [center, zoom]);

  return (
    <div className={className} style={{ position: "relative" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} data-testid="maplibre-container" />
    </div>
  );
}
