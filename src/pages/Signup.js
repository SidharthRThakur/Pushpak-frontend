// frontend/src/pages/Signup.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../util";
import API_BASE from "../config";

function Signup() {
  const [signupInfo, setSignupInfo] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo((prev) => ({ ...prev, [name]: value })); // fixed spread
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupInfo),
      });
      const result = await res.json();
      const { success, message } = result;

      if (success) {
        handleSuccess(message);
        window.dispatchEvent(new Event("storage"));
        setTimeout(() => navigate("/login"), 1000);
      } else {
        handleError(result.message || "Signup failed");
      }
    } catch (err) {
      handleError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Signup</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name:</label>
            <input type="text" name="name" value={signupInfo.name} onChange={handleChange} placeholder="Enter your name" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium">Email:</label>
            <input type="email" name="email" value={signupInfo.email} onChange={handleChange} placeholder="Enter your email" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium">Password:</label>
            <input type="password" name="password" value={signupInfo.password} onChange={handleChange} placeholder="Enter your password" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100" />
          </div>
          <button type="submit" className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">Signup</button>
        </form>
        <p className="text-sm text-center mt-4">Already have an account? <Link to="/login" className="text-black font-semibold">Login</Link></p>
        <ToastContainer />
      </div>
    </div>
  );
}

export default Signup;
