// frontend/src/pages/Login.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../util";
import API_BASE from "../config";
import { getSocket } from "../hooks/useSocket";

function Login() {
  const [loginInfo, setLoginInfo] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo((prev) => ({ ...prev, [name]: value })); // fixed: use spread operator
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginInfo;
    if (!email || !password) return handleError("Email & password required");

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginInfo),
      });

      const result = await res.json();
      // backend returns: { success, message, jwt_Token, name, userId }
      const { success, message, jwt_Token, name, userId, id } = result;
      const resolvedId = userId || id || null;

      if (success) {
        handleSuccess(message || "Login successful");

        // Save token and user info
        if (jwt_Token) localStorage.setItem("token", jwt_Token);
        if (name) localStorage.setItem("loggedInUser", name);
        if (resolvedId) localStorage.setItem("userId", resolvedId);

        // join personal socket room if socket exists
        const socket = getSocket();
        if (socket && resolvedId) {
          try {
            socket.emit("joinRoom", { userId: resolvedId });
          } catch (e) {
            console.warn("Socket joinRoom failed:", e);
          }
        }

        // notify Navbar and other listeners
        window.dispatchEvent(new Event("storage"));
        setTimeout(() => navigate("/home"), 600);
      } else {
        handleError(result.message || "Login failed");
      }
    } catch (err) {
      handleError(err.message || "Login request failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email:</label>
            <input
              type="email"
              name="email"
              value={loginInfo.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password:</label>
            <input
              type="password"
              name="password"
              value={loginInfo.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Login
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          Don’t have an account? <Link to="/signup" className="text-black font-semibold">Signup</Link>
        </p>
        <ToastContainer />
      </div>
    </div>
  );
}

export default Login;
