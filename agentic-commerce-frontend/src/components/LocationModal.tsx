import React, { useState } from "react";
import type { User } from "../types";
import { updateUserLocation } from "../services/agentService";
import { useAuth } from "../context/AuthContext";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { updateUserState } = useAuth();
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !pincode.trim()) {
      alert("City and Pincode are required.");
      return;
    }

    try {
      setSaving(true);
      const updatedUser: User = await updateUserLocation({ city: city.trim(), pincode: pincode.trim() });
      updateUserState(updatedUser);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update location:", error);
      alert("Failed to save location. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Delivery Location Required</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1rem" }}>
          You must set your city and pincode before placing an order.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai"
            />
          </div>

          <div className="form-group">
            <label>Pincode</label>
            <input
              type="text"
              required
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="e.g. 400001"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : "Save & Proceed"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};