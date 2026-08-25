import React, { useState } from "react";
import type { Product } from "../types";
import { searchProducts } from "../services/agentService";
import { ProductCard } from "../components/ProductCard";

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setSearching(true);
      const results: Product[] = await searchProducts(query.trim());
      setProducts(results);
    } catch (error) {
      console.error("Search execution failed:", error);
      alert("Failed to fetch products from search engine.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="container">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1>Agentic Commerce Engine</h1>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
          Search products and let the agent buy directly on your behalf.
        </p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to buy? (e.g. wireless headphones)"
          className="search-input"
        />
        <button type="submit" disabled={searching} className="btn btn-primary">
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="product-grid">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
    </div>
  );
};