// frontend/src/pages/Rides.js
import React, { useEffect, useState } from "react";
import API_BASE from "../config";

export default function Rides() {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/rides/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setRides(data.rides || []);
        }
      } catch (err) {
        console.error("Failed to fetch rides", err);
      }
    };
    fetchRides();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">My Rides</h1>
      {rides.length === 0 ? (
        <p className="text-gray-500">No rides found.</p>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="p-4 bg-white rounded-lg shadow border"
            >
              <p>
                <span className="font-semibold">Pickup:</span> {ride.pickup}
              </p>
              <p>
                <span className="font-semibold">Dropoff:</span> {ride.dropoff}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {ride.status}
              </p>
              <p>
                <span className="font-semibold">Fare:</span> ₹
                {(ride.fare_cents || 0) / 100}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
