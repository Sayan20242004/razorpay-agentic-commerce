import React, { useState } from "react";
import type { Product, AutoBuyResponse } from "../types";
import { useAuth } from "../context/AuthContext";
import { executeAutoBuy } from "../services/agentService";
import { LocationModal } from "./LocationModal";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const processPurchase = async () => {
    try {
      console.log("FRONTEND: Calling executeAutoBuy with product ->", product);
      setLoading(true);
      const result: AutoBuyResponse = await executeAutoBuy(product);

      console.log("FRONTEND: executeAutoBuy Result ->", result);

      if (result.success && result.order) {
        alert(`Order Placed Successfully!\nDispatched From: ${result.order.fulfillment?.dispatchedFrom || 'Hub'}\nDistance: ${result.order.fulfillment?.distanceKm || 0} km`);
      } else {
        alert(`Purchase failed: ${result.reason || "Execution Error"}`);
      }
    } catch (error: any) {
      console.error("FRONTEND_PURCHASE_ERROR:", error);
      alert(error.response?.data?.message || "Failed to process automated purchase.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClick = () => {
    console.log("FRONTEND: Confirm Purchase clicked. Current User State ->", user);

    // 1. Authentication Guardrail
    if (!user) {
      alert("Please log in to confirm purchase.");
      navigate("/login");
      return;
    }

    // 2. Location Guardrail
    const hasCity = Boolean(user.location?.city && user.location.city.trim() !== "");
    const hasPincode = Boolean(user.location?.pincode && user.location.pincode.trim() !== "");

    console.log(`FRONTEND: Location Checks -> HasCity: ${hasCity} ("${user.location?.city}"), HasPincode: ${hasPincode} ("${user.location?.pincode}")`);

    if (!hasCity || !hasPincode) {
      console.log("FRONTEND: Location missing. Showing LocationModal...");
      setShowLocationModal(true);
      return;
    }

    // Both pass -> Run Auto-Buy
    console.log("FRONTEND: Guardrails passed! Initiating processPurchase()...");
    processPurchase();
  };

  return (
    <>
      <div className="product-card">
        <div>
          {product.image && (
            <img src={product.image} alt={product.title} className="product-image" />
          )}
          <h3 className="product-title" title={product.title}>
            {product.title}
          </h3>
          <p className="product-price">
            {typeof product.price === "number" ? `₹${product.price}` : product.price}
          </p>
        </div>

        <button
          onClick={handleConfirmClick}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          {loading ? "Executing Order..." : "Confirm Purchase"}
        </button>
      </div>

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSuccess={() => {
          setShowLocationModal(false);
          processPurchase();
        }}
      />
    </>
  );
};