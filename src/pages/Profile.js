// frontend/src/pages/Profile.js
import React from "react";

export default function Profile() {
  const user = localStorage.getItem("loggedInUser");

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Profile</h1>
        {user ? (
          <div className="space-y-4 text-gray-700">
            <p>
              <span className="font-semibold">Name:</span> {user}
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              {localStorage.getItem("userEmail") || "Not provided"}
            </p>
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Please log in to view your profile.
          </p>
        )}
      </div>
    </div>
  );
}
