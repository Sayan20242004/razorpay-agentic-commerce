import React from "react";
import { Link, useLocation } from "react-router-dom";

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#ffffff",
        padding: "6px 12px",
        borderRadius: "9999px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        zIndex: 1000,
        width: "max-content",
      }}
    >
      <Link
        to="/"
        style={{
          textDecoration: "none",
          padding: "8px 20px",
          borderRadius: "9999px",
          fontSize: "0.9rem",
          fontWeight: isActive("/") ? 600 : 500,
          color: isActive("/") ? "#2563eb" : "#64748b",
          backgroundColor: isActive("/") ? "#eff6ff" : "transparent",
          transition: "all 0.15s ease",
        }}
      >
        Home
      </Link>

      <Link
        to="/orders"
        style={{
          textDecoration: "none",
          padding: "8px 20px",
          borderRadius: "9999px",
          fontSize: "0.9rem",
          fontWeight: isActive("/orders") ? 600 : 500,
          color: isActive("/orders") ? "#2563eb" : "#64748b",
          backgroundColor: isActive("/orders") ? "#eff6ff" : "transparent",
          transition: "all 0.15s ease",
        }}
      >
        Orders
      </Link>

      <Link
        to="/profile"
        style={{
          textDecoration: "none",
          padding: "8px 20px",
          borderRadius: "9999px",
          fontSize: "0.9rem",
          fontWeight: isActive("/profile") ? 600 : 500,
          color: isActive("/profile") ? "#2563eb" : "#64748b",
          backgroundColor: isActive("/profile") ? "#eff6ff" : "transparent",
          transition: "all 0.15s ease",
        }}
      >
        Profile
      </Link>
    </nav>
  );
};