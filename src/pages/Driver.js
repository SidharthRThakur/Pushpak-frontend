// frontend/src/pages/Driver.js
import React, { useEffect, useState, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import API_BASE from "../config";
import useSocket, { getSocket } from "../hooks/useSocket";
import { handleError, handleSuccess } from "../util";

export default function Driver() {
  const [driverName] = useState(localStorage.getItem("loggedInUser") || "");
  const [available, setAvailable] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const navigate = useNavigate();

  useSocket(
    (ride) => {
      if (
        !currentRide ||
        (ride && ride.id === currentRide.id) ||
        (ride.driver_id && ride.driver_id === localStorage.getItem("userId"))
      ) {
        setCurrentRide(ride);
        if (ride?.status) {
          handleSuccess(`Ride status: ${ride.status}`);
        }
      }
    },
    (rideId, lat, lng) => {
      if (currentRide && rideId === currentRide.id && mapRef.current) {
        try {
          if (!markerRef.current) {
            markerRef.current = new maplibregl.Marker({ color: "blue" })
              .setLngLat([lng, lat])
              .addTo(mapRef.current);
          } else {
            markerRef.current.setLngLat([lng, lat]);
          }
          mapRef.current.easeTo({ center: [lng, lat] });
        } catch (e) {
          console.warn("driver location update err", e);
        }
      }
    }
  );

  useEffect(() => {
    if (mapRef.current) return;
    const map = new maplibregl.Map({
      container: "driver-map",
      style: "https://demotiles.maplibre.org/style.json",
      center: [77.5946, 12.9716],
      zoom: 12,
    });
    mapRef.current = map;
    return () => {
      try {
        map.remove();
      } catch (e) {
        console.warn("map cleanup failed", e);
      }
      mapRef.current = null;
    };
  }, []);

  const toggleAvailability = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/drivers/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ available: !available }),
      });
      const result = await res.json();
      if (result.success) {
        setAvailable(!available);
        handleSuccess(`You are now ${!available ? "online" : "offline"}`);
      } else {
        handleError(result.error || "Failed to update availability");
      }
    } catch (err) {
      handleError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptRide = async () => {
    if (!currentRide) return handleError("No ride to accept");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/rides/${currentRide.id}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setCurrentRide(result.ride);
        handleSuccess("Ride accepted");
        const socket = getSocket();
        if (socket) socket.emit("joinRideRoom", { rideId: result.ride.id });
      } else {
        handleError(result.error || "Failed to accept ride");
      }
    } catch (err) {
      handleError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startRide = async () => {
    if (!currentRide) return handleError("No ride to start");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/rides/${currentRide.id}/start`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setCurrentRide(result.ride);
        handleSuccess("Ride started");
      } else {
        handleError(result.error || "Failed to start ride");
      }
    } catch (err) {
      handleError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeRide = async () => {
    if (!currentRide) return handleError("No ride to complete");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/rides/${currentRide.id}/complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setCurrentRide(null);
        handleSuccess("Ride completed");
        const socket = getSocket();
        if (socket) socket.emit("leaveRideRoom", { rideId: currentRide.id });
      } else {
        handleError(result.error || "Failed to complete ride");
      }
    } catch (err) {
      handleError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    const socket = getSocket();
    const userId = localStorage.getItem("userId");
    if (socket && userId) socket.emit("leaveRoom", { userId });
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userId");
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-1/3 p-6 bg-white border-r border-gray-200 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {driverName || "Driver"}</p>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">Logout</button>
        </div>

        <div className="mb-6">
          <button
            onClick={toggleAvailability}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              available ? "bg-black text-white hover:bg-gray-800" : "bg-white text-black border border-gray-300 hover:bg-gray-100"
            }`}
          >
            {available ? "Go Offline" : "Go Online"}
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg shadow-md">
          <h2 className="font-semibold text-lg mb-3">Current Ride</h2>
          {!currentRide ? (
            <div className="text-sm text-gray-500">No active rides</div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-700 space-y-1">
                <p><b>Ride ID:</b> {currentRide.id}</p>
                <p><b>Status:</b> {currentRide.status}</p>
                <p><b>Pickup:</b> {String(currentRide.pickup)}</p>
                <p><b>Dropoff:</b> {String(currentRide.dropoff)}</p>
                <p><b>Fare:</b> ₹{(currentRide.fare_cents || 0) / 100}</p>
              </div>

              <div className="flex gap-2">
                {currentRide.status === "requested" && (
                  <button onClick={acceptRide} disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">Accept</button>
                )}
                {currentRide.status === "accepted" && (
                  <button onClick={startRide} disabled={loading} className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600">Start</button>
                )}
                {(currentRide.status === "in_progress" || currentRide.status === "accepted") && (
                  <button onClick={completeRide} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">Complete</button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-500">Tip: Toggle online to receive ride requests.</p>
        <ToastContainer />
      </div>

      <div className="w-2/3 relative">
        <div id="driver-map" className="w-full h-full" />
      </div>
    </div>
  );
}
