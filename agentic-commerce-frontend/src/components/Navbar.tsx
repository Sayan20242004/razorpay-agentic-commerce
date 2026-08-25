import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Agentic Commerce
      </Link>
      <div className="navbar-links">
        <Link to="/" className="nav-link">
          Search
        </Link>
        {user ? (
          <>
            <Link to="/profile" className="nav-link">
              Profile ({user.name || user.email})
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};