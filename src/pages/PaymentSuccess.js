import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: clean up localStorage / refresh ride status
    console.log("Payment completed successfully!");
    const timer = setTimeout(() => {
      navigate("/home"); // Redirect after 3s
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>✅ Payment Successful!</h1>
      <p>Your ride has been confirmed. Redirecting to Home...</p>
    </div>
  );
}

export default PaymentSuccess;
