import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog {
  step: string;
  status: "PASSED" | "FAILED" | "WARNING";
  detail: string;
  timestamp: Date;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  product: {
    title: string;
    price: number;
    image: string;
    url: string;
  };
  shippingAddress: {
    city: string;
    pincode: string;
  };
  fulfillment: {
    dispatchedFrom: string;
    distanceKm: number;
    estimatedDays: number;
    trackingStatus: "PLACED" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED";
  };
  razorpay: {
    orderId: string;
    paymentId?: string;
    status: "PENDING" | "PAID" | "FAILED";
  };
  auditTrail: IAuditLog[];
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "UserModel", required: true },
    product: {
      title: { type: String, required: true },
      price: { type: Number, required: true },
      image: { type: String, required: true },
      url: { type: String, required: true },
    },
    shippingAddress: {
      city: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    fulfillment: {
      dispatchedFrom: { type: String, required: true },
      distanceKm: { type: Number, required: true },
      estimatedDays: { type: Number, required: true },
      trackingStatus: {
        type: String,
        enum: ["PLACED", "DISPATCHED", "IN_TRANSIT", "DELIVERED"],
        default: "PLACED",
      },
    },
    razorpay: {
      orderId: { type: String, required: true },
      paymentId: { type: String },
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING",
      },
    },
    auditTrail: [
      {
        step: { type: String, required: true },
        status: { type: String, enum: ["PASSED", "FAILED", "WARNING"], required: true },
        detail: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Order = mongoose.model<IOrder>("OrderModel", orderSchema);
export default Order;