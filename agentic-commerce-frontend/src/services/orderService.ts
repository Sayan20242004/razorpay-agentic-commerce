import { API } from "./api";
import type { Order } from "../types";

export const getUserOrders = async (): Promise<Order[]> => {
  const response = await API.get("/orders/my-orders");
  return response.data.orders;
};