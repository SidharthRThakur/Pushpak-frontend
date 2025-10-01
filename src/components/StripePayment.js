// frontend/src/components/StripePayment.js
import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import API_BASE from "../config";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/payment-success",
      },
      redirect: "if_required",
    });

    if (error) {
      console.error(error.message);
      setMessage(error.message || "Payment failed");
      // Optionally show a toast instead of redirecting
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={!stripe}>Pay</button>
      {message && <div>{message}</div>}
    </form>
  );
}

export default function StripePayment({ rideId, amountCents }) {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            ride_id: rideId,
            amount_cents: amountCents,
          }),
        });
        const data = await res.json();
        if (data.client_secret) {
          setClientSecret(data.client_secret);
        } else {
          console.error("No client_secret returned", data);
        }
      } catch (err) {
        console.error("Payment init failed", err);
      }
    };

    if (rideId && amountCents) {
      fetchPaymentIntent();
    }
  }, [rideId, amountCents]);

  if (!clientSecret) return <p>Loading payment form...</p>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  );
}
