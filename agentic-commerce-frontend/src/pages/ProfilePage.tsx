import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUserLocation, savePaymentToken } from "../services/agentService";
import type { User } from "../types";

export const ProfilePage: React.FC = () => {
  const { user, updateUserState } = useAuth();

  const [city, setCity] = useState(user?.location?.city || "");
  const [pincode, setPincode] = useState(user?.location?.pincode || "");
  const [savingLocation, setSavingLocation] = useState(false);

  const [tokenInput, setTokenInput] = useState(user?.paymentToken || "");
  const [customerIdInput, setCustomerIdInput] = useState(user?.razorpayCustomerId || "");
  const [savingPayment, setSavingPayment] = useState(false);

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingLocation(true);
      const updatedUser: User = await updateUserLocation({ city, pincode });
      updateUserState(updatedUser);
      alert("Location details updated successfully.");
    } catch (error) {
      console.error("Failed to update location:", error);
      alert("Failed to update location.");
    } finally {
      setSavingLocation(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPayment(true);
      const updatedUser: User = await savePaymentToken({
        paymentToken: tokenInput,
        customerId: customerIdInput,
      });
      updateUserState(updatedUser);
      alert("Payment tokenization details updated.");
    } catch (error) {
      console.error("Failed to save payment token:", error);
      alert("Failed to update payment token.");
    } finally {
      setSavingPayment(false);
    }
  };

  if (!user) {
    return <div className="container">Please log in to view your profile.</div>;
  }

  return (
    <div className="container" style={{ maxWidth: "600px" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>User Settings & Mandates</h1>

      {/* Account Info */}
      <div className="product-card" style={{ marginBottom: "1.5rem" }}>
        <h3>Account Information</h3>
        <p style={{ marginTop: "0.5rem", color: "#475569" }}>
          <strong>Email:</strong> {user.email}
        </p>
      </div>

      {/* Shipping Location */}
      <div className="product-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Default Shipping Location</h3>
        <form onSubmit={handleLocationSubmit}>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai"
            />
          </div>
          <div className="form-group">
            <label>Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="e.g. 400001"
            />
          </div>
          <button type="submit" disabled={savingLocation} className="btn btn-primary">
            {savingLocation ? "Saving..." : "Save Location"}
          </button>
        </form>
      </div>

      {/* Razorpay Tokenization */}
      <div className="product-card">
        <h3 style={{ marginBottom: "0.5rem" }}>Autonomous Payment Token</h3>
        <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1rem" }}>
          Provide tokenized credentials for automated agent execution.
        </p>
        <form onSubmit={handlePaymentSubmit}>
          <div className="form-group">
            <label>Razorpay Customer ID</label>
            <input
              type="text"
              value={customerIdInput}
              onChange={(e) => setCustomerIdInput(e.target.value)}
              placeholder="cust_XXXXXXXXXXXXXX"
            />
          </div>
          <div className="form-group">
            <label>Saved Token / Mandate ID</label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="token_XXXXXXXXXXXXXX"
            />
          </div>
          <button type="submit" disabled={savingPayment} className="btn btn-primary">
            {savingPayment ? "Saving..." : "Save Payment Details"}
          </button>
        </form>
      </div>
    </div>
  );
};