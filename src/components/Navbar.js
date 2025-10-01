// frontend/src/components/Navbar.js
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSocket } from "../hooks/useSocket";

export default function Navbar() {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(
    localStorage.getItem("loggedInUser") || null
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // keep navbar in sync with storage changes
  useEffect(() => {
    const updateUser = () =>
      setLoggedInUser(localStorage.getItem("loggedInUser") || null);
    window.addEventListener("storage", updateUser);
    return () => window.removeEventListener("storage", updateUser);
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    const socket = getSocket();
    const userId = localStorage.getItem("userId");
    if (socket && userId) {
      try {
        socket.emit("leaveRoom", { userId });
      } catch (e) {}
    }
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userId");
    window.dispatchEvent(new Event("storage"));
    setLoggedInUser(null);
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="bg-black text-white px-6 py-3 flex items-center justify-between shadow-sm z-40">
      <div
        className="text-2xl font-bold cursor-pointer"
        onClick={() => navigate("/home")}
      >
        Pushpak
      </div>

      <div className="flex items-center">
        {!loggedInUser ? (
          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition"
            >
              Signup
            </Link>
          </div>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((s) => !s)}
              className="px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 transition flex items-center gap-2"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <span className="font-semibold">{loggedInUser}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06-.02L10 10.67l3.71-3.48a.75.75 0 111.04 1.08l-4.24 3.98a.75.75 0 01-1.04 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white text-black rounded-md shadow-lg z-50">
                <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
