// frontend/src/pages/Home.js
import React, { useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// 📍 Default marker icon
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// 🚗 Car icon
const carIcon = new L.Icon({
  iconUrl: "/triber.png",
  
  
  // iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743988.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// 🔑 Helper: auto-zoom when pickup + dropoff selected
function FitBoundsOnRoute({ pickup, dropoff, route }) {
  const map = useMap();

  useEffect(() => {
    if (pickup && dropoff && route.length > 0) {
      const bounds = [
        [pickup.lat, pickup.lon],
        [dropoff.lat, dropoff.lon],
      ];
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickup, dropoff, route, map]);

  return null;
}

export default function Home() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [route, setRoute] = useState([]);
  const [fare, setFare] = useState(null);
  const [distance, setDistance] = useState(null); // km
  const [ride, setRide] = useState(null);

  // 🚕 Car animation state
  const [carPosition, setCarPosition] = useState(null);
  const [animationIndex, setAnimationIndex] = useState(0);

  // ⏱️ ETA countdown (live updating)
  const [liveEta, setLiveEta] = useState(null);

  const loggedInUser = localStorage.getItem("loggedInUser");

  // 🔍 Autocomplete using Nominatim
  const fetchSuggestions = async (query, setter) => {
    if (query.length < 3) return setter([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
      );
      const data = await res.json();
      setter(data);
    } catch (err) {
      console.error("Error fetching suggestions", err);
    }
  };

  useEffect(() => {
    fetchSuggestions(pickupQuery, setPickupSuggestions);
  }, [pickupQuery]);

  useEffect(() => {
    fetchSuggestions(dropoffQuery, setDropoffSuggestions);
  }, [dropoffQuery]);

  // 🛣️ Fetch route from OSRM
  const fetchRoute = useCallback(async () => {
    if (!pickup || !dropoff) return;

    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup.lon},${pickup.lat};${dropoff.lon},${dropoff.lat}?overview=full&geometries=geojson`
      );
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((c) => [
          c[1],
          c[0],
        ]);
        setRoute(coords);

        // ETA in minutes (starting value for countdown)
        const durationMinutes = Math.round(data.routes[0].duration / 60);
        setLiveEta(durationMinutes);

        // Distance in km
        const distanceKm = data.routes[0].distance / 1000;
        setDistance(distanceKm.toFixed(1));

        // Fare = ₹10/km (example)
        const calculatedFare = Math.round(distanceKm * 10);
        setFare(calculatedFare);

        // Reset car animation
        setAnimationIndex(0);
        setCarPosition(coords[0]); // start at pickup
      }
    } catch (err) {
      console.error("Error fetching route", err);
    }
  }, [pickup, dropoff]);

  useEffect(() => {
    if (pickup && dropoff) {
      fetchRoute();
    }
  }, [pickup, dropoff, fetchRoute]);

  // 🚕 Animate car along the route
  useEffect(() => {
    if (route.length > 0 && animationIndex < route.length - 1) {
      const interval = setInterval(() => {
        setAnimationIndex((i) => {
          const nextIndex = i + 1;
          setCarPosition(route[nextIndex]);
          return nextIndex;
        });
      }, 1000); // move every 1s
      return () => clearInterval(interval);
    }
  }, [route, animationIndex]);

  // ⏱️ Live ETA countdown
  useEffect(() => {
    if (liveEta && liveEta > 0) {
      const timer = setInterval(() => {
        setLiveEta((prev) => (prev > 0 ? prev - 1 : 0));
      }, 60000); // decrease every minute
      return () => clearInterval(timer);
    }
  }, [liveEta]);

  const handleRequestRide = async () => {
    if (!pickup || !dropoff) {
      alert("Please select both pickup and dropoff");
      return;
    }

    const body = {
      pickup: { lat: pickup.lat, lng: pickup.lon },
      dropoff: { lat: dropoff.lat, lng: dropoff.lon },
      fare_cents: fare * 100,
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/rides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setRide(data.ride);
      } else {
        alert(data.message || "Ride request failed");
      }
    } catch (err) {
      console.error("Error requesting ride", err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* LEFT COLUMN */}
      <div className="w-1/3 p-6 space-y-4 overflow-y-auto bg-gray-50">
        <h2 className="text-2xl font-bold mb-4">Request a ride now</h2>

        {/* Pickup Input */}
        <input
          type="text"
          placeholder="Enter pickup location"
          value={pickupQuery}
          onChange={(e) => setPickupQuery(e.target.value)}
          className="w-full border p-2 rounded"
        />
        {pickupSuggestions.length > 0 && (
          <ul className="border bg-white max-h-40 overflow-y-auto">
            {pickupSuggestions.map((sug) => (
              <li
                key={sug.place_id}
                className="p-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => {
                  setPickup({
                    lat: sug.lat,
                    lon: sug.lon,
                    display: sug.display_name,
                  });
                  setPickupQuery(sug.display_name);
                  setPickupSuggestions([]);
                }}
              >
                {sug.display_name}
              </li>
            ))}
          </ul>
        )}

        {/* Dropoff Input */}
        <input
          type="text"
          placeholder="Enter dropoff location"
          value={dropoffQuery}
          onChange={(e) => setDropoffQuery(e.target.value)}
          className="w-full border p-2 rounded"
        />
        {dropoffSuggestions.length > 0 && (
          <ul className="border bg-white max-h-40 overflow-y-auto">
            {dropoffSuggestions.map((sug) => (
              <li
                key={sug.place_id}
                className="p-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => {
                  setDropoff({
                    lat: sug.lat,
                    lon: sug.lon,
                    display: sug.display_name,
                  });
                  setDropoffQuery(sug.display_name);
                  setDropoffSuggestions([]);
                }}
              >
                {sug.display_name}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleRequestRide}
          className="w-full bg-black text-white p-3 rounded"
        >
          Request Ride
        </button>

        {/* Ride Card */}
        {ride && (
          <div className="mt-6 p-4 bg-white shadow rounded">
            <h3 className="text-lg font-bold mb-2">Your Ride</h3>
            <p>
              <strong>User:</strong> {loggedInUser}
            </p>
            <p>
              <strong>Status:</strong> {ride.status}
            </p>
            <p>
              <strong>Pickup:</strong> {pickup?.display}
            </p>
            <p>
              <strong>Dropoff:</strong> {dropoff?.display}
            </p>
            <p>
              <strong>Fare:</strong> ₹{fare}
            </p>
            {distance && (
              <p>
                <strong>Distance:</strong> {distance} km
              </p>
            )}
            {liveEta !== null && (
              <p>
                <strong>ETA:</strong> {liveEta} min
              </p>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN (Map) */}
      <div className="w-2/3 h-full">
        <MapContainer
          center={[30.7046, 76.7179]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pickup && (
            <Marker position={[pickup.lat, pickup.lon]} icon={markerIcon}>
              <Popup>Pickup: {pickup.display}</Popup>
            </Marker>
          )}
          {dropoff && (
            <Marker position={[dropoff.lat, dropoff.lon]} icon={markerIcon}>
              <Popup>Dropoff: {dropoff.display}</Popup>
            </Marker>
          )}
          {route.length > 0 && <Polyline positions={route} color="blue" />}

          {/* 🚕 Car Marker */}
          {carPosition && (
            <Marker position={carPosition} icon={carIcon}>
              <Popup>Driver</Popup>
            </Marker>
          )}

          {/* 👇 Auto zoom */}
          <FitBoundsOnRoute pickup={pickup} dropoff={dropoff} route={route} />
        </MapContainer>
      </div>
    </div>
  );
}
