import Razorpay from "razorpay";

declare module "razorpay" {
  interface Payments {
    createPaymentWithToken(params: {
      email: string;
      contact: string;
      amount: number;
      currency: string;
      order_id: string;
      customer_id: string;
      token: string;
    }): Promise<{
      id: string;
      entity: string;
      amount: number;
      currency: string;
      status: string;
      order_id: string;
      method: string;
    }>;
  }
}