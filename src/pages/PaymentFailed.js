import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PaymentFailed() {
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: log the failure, notify user, etc.
    console.log("Payment failed or was cancelled.");
    const timer = setTimeout(() => {
      navigate("/home"); // Redirect after 5s
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px", color: "red" }}>
      <h1>❌ Payment Failed</h1>
      <p>Something went wrong with your payment.</p>
      <p>You will be redirected to Home shortly...</p>
    </div>
  );
}

export default PaymentFailed;
