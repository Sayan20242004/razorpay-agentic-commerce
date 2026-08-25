import { API } from "./api";
import type { Product, AutoBuyResponse, User } from "../types";

export const searchProducts = async (query: string): Promise<Product[]> => {
  const response = await API.post("/agent/search", { query });
  return response.data.products;
};

export const executeAutoBuy = async (product: Product): Promise<AutoBuyResponse> => {
  const response = await API.post<AutoBuyResponse>("/agent/auto-buy", {
    title: product.title,
    price: product.price,
    image: product.image,
    url: product.url,
  });
  return response.data;
};

export const updateUserLocation = async (location: { city: string; pincode: string }): Promise<User> => {
  // Use API.patch to match router.patch("/location", ...) on your backend
  const response = await API.patch("/auth/location", location);
  return response.data.user;
};

export const savePaymentToken = async (payload: { paymentToken: string; customerId: string }): Promise<User> => {
  const response = await API.post("/payments/save-token", payload);
  return response.data.user;
};