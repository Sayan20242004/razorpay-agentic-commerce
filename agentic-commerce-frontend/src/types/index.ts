export interface Location {
  city?: string;
  pincode?: string;
}

export interface User {
  _id: string;
  email: string;
  name?: string;
  location?: Location;
  paymentToken?: string;
  razorpayCustomerId?: string;
}

export interface Product {
  title: string;
  price: string | number;
  image?: string;
  url: string;
}

export interface AuditLog {
  step: string;
  status: "PASSED" | "FAILED";
  detail: string;
  timestamp: string;
  _id?: string;
}

export interface Order {
  _id: string;
  user: string;
  product: Product;
  shippingAddress: Location;
  fulfillment: {
    dispatchedFrom: string;
    distanceKm: number;
    estimatedDays: number;
    trackingStatus: string;
  };
  razorpay: {
    orderId: string;
    paymentId?: string;
    status: string;
  };
  auditTrail: AuditLog[];
  createdAt: string;
}

export interface AutoBuyResponse {
  success: boolean;
  order?: Order;
  reason?: string;
  auditTrail?: AuditLog[];
}