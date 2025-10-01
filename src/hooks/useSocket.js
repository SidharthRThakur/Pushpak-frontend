import { useEffect } from "react";
import { io } from "socket.io-client";
import API_BASE from "../config";

let socket;

export function getSocket() {
  return socket;
}

/**
 * Hook to setup socket connection with JWT authentication
 * @param {function} onRideUpdate - called when a ride update is received
 * @param {function} onDriverLocationUpdate - called when driver location update is received
 */
export default function useSocket(onRideUpdate, onDriverLocationUpdate) {
  useEffect(() => {
    socket = io(API_BASE, {
      auth: { token: localStorage.getItem("token") }, // send JWT
    });

    socket.on("connect", () => {
      console.log("✅ Connected to Socket.IO:", socket.id);

      const userId = localStorage.getItem("userId");
      if (userId) {
        socket.emit("joinRoom", { userId });
        console.log("📡 Joined personal room:", userId);
      }
    });

    // Ride status updates
    socket.on("rideUpdated", (ride) => {
      if (onRideUpdate) onRideUpdate(ride);

      // 🚪 Auto-leave ride room if ride ended
      if (ride?.status === "completed" || ride?.status === "cancelled") {
        if (socket) {
          socket.emit("leaveRideRoom", { rideId: ride.id });
          console.log(`🚪 Left ride room: ride_${ride.id}`);
        }
      }
    });

    // Driver location updates
    socket.on("driverLocationUpdate", ({ rideId, lat, lng }) => {
      if (onDriverLocationUpdate) onDriverLocationUpdate(rideId, lat, lng);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from Socket.IO");
      const userId = localStorage.getItem("userId");
      if (userId) {
        socket.emit("leaveRoom", { userId });
        console.log("📴 Left personal room:", userId);
      }
    });

    return () => {
      if (socket) {
        const userId = localStorage.getItem("userId");
        if (userId) socket.emit("leaveRoom", { userId });
        socket.disconnect();
      }
    };
  }, [onRideUpdate, onDriverLocationUpdate]);
}
