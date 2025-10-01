// frontend/src/components/BookingMap.js
import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const BookingMap = ({ pickupCoord, dropoffCoord, pickupName, dropoffName, onRouteInfo }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.REACT_APP_MAPTILER_KEY}`,
      center: pickupCoord || (dropoffCoord || [77.5946, 12.9716]),
      zoom: 12,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }));

    const addMarkersAndRoute = async () => {
      try {
        // Clear old layers
        if (map.getLayer("route")) map.removeLayer("route");
        if (map.getSource("route")) map.removeSource("route");

        if (pickupCoord) {
          new maplibregl.Marker({ color: "green" })
            .setLngLat(pickupCoord)
            .setPopup(new maplibregl.Popup().setText(`Pickup: ${pickupName}`))
            .addTo(map);
        }

        if (dropoffCoord) {
          new maplibregl.Marker({ color: "red" })
            .setLngLat(dropoffCoord)
            .setPopup(new maplibregl.Popup().setText(`Dropoff: ${dropoffName}`))
            .addTo(map);
        }

        if (pickupCoord && dropoffCoord) {
          const key = process.env.REACT_APP_MAPTILER_KEY;
          const url = `https://api.maptiler.com/routes/driving/${pickupCoord[0]},${pickupCoord[1]};${dropoffCoord[0]},${dropoffCoord[1]}?key=${key}&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const geojson = {
              type: "Feature",
              properties: {},
              geometry: route.geometry,
            };

            map.addSource("route", { type: "geojson", data: geojson });
            map.addLayer({
              id: "route",
              type: "line",
              source: "route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: { "line-color": "#3b82f6", "line-width": 5 },
            });

            // Fit bounds
            const coords = route.geometry.coordinates;
            const bounds = coords.reduce(
              (b, coord) => b.extend(coord),
              new maplibregl.LngLatBounds(coords[0], coords[0])
            );
            map.fitBounds(bounds, { padding: 60 });

            if (onRouteInfo) {
              onRouteInfo({
                duration: Math.round(route.duration / 60),
                distance: (route.distance / 1000).toFixed(2),
              });
            }
          }
        }
      } catch (err) {
        console.error("BookingMap error:", err);
      }
    };

    addMarkersAndRoute();

    return () => {
      try {
        map.remove();
      } catch (e) {}
      mapRef.current = null;
    };
  }, [pickupCoord, dropoffCoord, pickupName, dropoffName, onRouteInfo]);

  return <div ref={mapContainer} className="h-96 w-full rounded-lg shadow" />;
};

BookingMap.propTypes = {
  pickupCoord: PropTypes.array,
  dropoffCoord: PropTypes.array,
  pickupName: PropTypes.string,
  dropoffName: PropTypes.string,
  onRouteInfo: PropTypes.func,
};

export default BookingMap;
