import React, { useState, useEffect } from "react";
import type { Order } from "../types";
import { getUserOrders } from "../services/orderService";

const TRACKING_STEPS = [
  "Preparing",
  "Dispatched",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

export const OrdersSection: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getUserOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStepIndex = (status: string) => {
    const idx = TRACKING_STEPS.findIndex(
      (s) => s.toLowerCase() === status.toLowerCase()
    );
    return idx !== -1 ? idx : 0;
  };

  const getArrivalDate = (createdAt: string, days: number) => {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + (days || 3));
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "2rem 1rem" }}>
        Loading orders...
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: "100px", paddingTop: "1rem" }}>
      <h2 style={{ marginBottom: "1.5rem" }}>Your Orders</h2>

      {orders.length === 0 ? (
        <p style={{ color: "#64748b" }}>No orders placed yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {orders.map((order) => {
            const arrivalDate = getArrivalDate(
              order.createdAt,
              order.fulfillment.estimatedDays
            );

            return (
              <div
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className="product-card"
                style={{
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ flex: 1, paddingRight: "1rem" }}>
                  <h4 style={{ margin: "0 0 0.4rem 0", color: "#0f172a" }}>
                    {order.product.title}
                  </h4>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#64748b",
                      display: "flex",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      📅 <strong>Ordered:</strong>{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </span>
                    <span>
                      🚚 <strong>Est. Arrival:</strong> {arrivalDate}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: "right", minWidth: "110px" }}>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "999px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      backgroundColor: "#e0f2fe",
                      color: "#0369a1",
                      display: "inline-block",
                      marginBottom: "0.4rem",
                    }}
                  >
                    {order.fulfillment.trackingStatus}
                  </span>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#0f172a",
                    }}
                  >
                    ₹{order.product.price}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Modal */}
      {selectedOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              backgroundColor: "#ffffff",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>Order #{selectedOrder._id.slice(-8)}</h3>
              <button
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.6rem", cursor: "pointer" }}
                onClick={() => setSelectedOrder(null)}
              >
                ✕
              </button>
            </div>

            {/* Dates Summary */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                margin: "1rem 0",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.85rem",
              }}
            >
              <div>
                <span style={{ color: "#64748b" }}>Order Date: </span>
                <strong>
                  {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Expected Arrival: </span>
                <strong style={{ color: "#16a34a" }}>
                  {getArrivalDate(
                    selectedOrder.createdAt,
                    selectedOrder.fulfillment.estimatedDays
                  )}
                </strong>
              </div>
            </div>

            {/* Tracking Progress Bar */}
            <div style={{ margin: "1.5rem 0" }}>
              <h4 style={{ marginBottom: "1rem" }}>Tracking Status</h4>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                {TRACKING_STEPS.map((step, idx) => {
                  const currentIdx = getStepIndex(
                    selectedOrder.fulfillment.trackingStatus
                  );
                  const isCompleted = idx <= currentIdx;

                  return (
                    <div
                      key={step}
                      style={{
                        textAlign: "center",
                        flex: 1,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: isCompleted ? "#2563eb" : "#cbd5e1",
                          color: "#ffffff",
                          lineHeight: "24px",
                          fontSize: "0.75rem",
                          margin: "0 auto 0.5rem auto",
                          fontWeight: "bold",
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: isCompleted ? "#0f172a" : "#94a3b8",
                          fontWeight: isCompleted ? 600 : 400,
                          display: "block",
                        }}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "1rem 0" }} />

            {/* Product Info */}
            <h4 style={{ marginBottom: "0.75rem" }}>Product</h4>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {selectedOrder.product.image && (
                <img
                  src={selectedOrder.product.image}
                  alt={selectedOrder.product.title}
                  style={{
                    width: "70px",
                    height: "70px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "0.95rem" }}>
                  {selectedOrder.product.title}
                </strong>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
                  Price: ₹{selectedOrder.product.price}
                </div>
                <a
                  href={selectedOrder.product.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "0.8rem",
                    color: "#2563eb",
                    textDecoration: "underline",
                  }}
                >
                  View Product Link
                </a>
              </div>
            </div>

            <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "1rem 0" }} />

            {/* Delivery & Warehouse Distance Details */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <h4 style={{ marginBottom: "0.25rem" }}>Delivery Location</h4>
                <p style={{ margin: 0, color: "#475569", fontSize: "0.85rem" }}>
                  {selectedOrder.shippingAddress.city || "N/A"} -{" "}
                  {selectedOrder.shippingAddress.pincode || "N/A"}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h4 style={{ marginBottom: "0.25rem" }}>Fulfillment Info</h4>
                <p style={{ margin: 0, color: "#475569", fontSize: "0.85rem" }}>
                  From: {selectedOrder.fulfillment.dispatchedFrom}
                </p>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>
                  Distance: ~{selectedOrder.fulfillment.distanceKm} km
                </p>
              </div>
            </div>

            <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "1rem 0" }} />

            {/* Bill / Payment Breakdown */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0" }}>Payment Details</h4>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.85rem",
                  color: "#475569",
                  marginBottom: "0.25rem",
                }}
              >
                <span>Razorpay Order ID:</span>
                <span style={{ fontFamily: "monospace" }}>
                  {selectedOrder.razorpay.orderId}
                </span>
              </div>
              {selectedOrder.razorpay.paymentId && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    color: "#475569",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span>Payment ID:</span>
                  <span style={{ fontFamily: "monospace" }}>
                    {selectedOrder.razorpay.paymentId}
                  </span>
                </div>
              )}
              <hr
                style={{
                  border: "0",
                  borderTop: "1px solid #cbd5e1",
                  margin: "0.5rem 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                }}
              >
                <span>Total Amount Paid:</span>
                <span>₹{selectedOrder.product.price}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};