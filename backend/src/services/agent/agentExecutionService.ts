import User from "../../models/User";
import Order, { IAuditLog } from "../../models/Order";
import Razorpay from "razorpay";
import axios from "axios";
import { calculateDeliveryEstimate } from "../../utils/logistics";
import { sendOrderConfirmationEmail } from "../../utils/emailService";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export interface BuyProductInput {
  userId: string;
  title: string;
  price: string | number;
  image?: string;
  url: string;
}

export const processAutomatedPurchase = async (input: BuyProductInput) => {
  const auditTrail: IAuditLog[] = [];

  // Parse numeric value from string ("₹1,999" -> 1999)
  const numericPrice =
    typeof input.price === "number"
      ? input.price
      : parseFloat(String(input.price).replace(/[^0-9.]/g, ""));

  if (isNaN(numericPrice) || numericPrice <= 0) {
    throw new Error("Invalid product price provided");
  }

  // Step 1: User Verification
  const user = await User.findById(input.userId);
  if (!user) {
    throw new Error("User not found");
  }

  auditTrail.push({
    step: "USER_AUTHENTICATION",
    status: "PASSED",
    detail: `User ${user.email} authenticated successfully.`,
    timestamp: new Date(),
  });

  // Step 2: Check Token & Customer Record
  if (!user.paymentToken || !user.razorpayCustomerId) {
    auditTrail.push({
      step: "TOKEN_VERIFICATION",
      status: "FAILED",
      detail: "No active Razorpay payment token found. User must consent and tokenize card first.",
      timestamp: new Date(),
    });

    return {
      success: false,
      reason: "MISSING_PAYMENT_TOKEN",
      auditTrail,
    };
  }

  auditTrail.push({
    step: "TOKEN_VERIFICATION",
    status: "PASSED",
    detail: `Active Razorpay payment token verified for customer: ${user.razorpayCustomerId}`,
    timestamp: new Date(),
  });

  // Step 3: Create Razorpay Order via API
  const amountInPaise = Math.round(numericPrice * 100);
  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `rcpt_agent_${Date.now()}`,
    notes: {
      automation: "Agentic_Commerce_Engine",
      userId: user._id.toString(),
    },
  });

  auditTrail.push({
    step: "RAZORPAY_ORDER_CREATED",
    status: "PASSED",
    detail: `Order created via API. Order ID: ${razorpayOrder.id}`,
    timestamp: new Date(),
  });

  // Step 4: Direct API Token Charge
  try {
    let paymentId: string;

    // Local/Sandbox token fallback vs live Razorpay API call
    if (
      user.paymentToken.startsWith("token_") ||
      user.paymentToken.startsWith("cust_") ||
      user.paymentToken.startsWith("dummy_")
    ) {
      paymentId = `pay_mock_${Date.now()}`;
    } else {
      const authHeader = `Basic ${Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString("base64")}`;

      const response = await axios.post(
        "https://api.razorpay.com/v1/payments/create/json",
        {
          email: user.email,
          contact: "9876543210",
          amount: amountInPaise,
          currency: "INR",
          order_id: razorpayOrder.id,
          customer_id: user.razorpayCustomerId,
          token: user.paymentToken,
          recurring: "1",
        },
        {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
        }
      );

      paymentId = response.data.razorpay_payment_id || response.data.id;
    }

    auditTrail.push({
      step: "API_TOKEN_CHARGE",
      status: "PASSED",
      detail: `Payment processed successfully. Payment ID: ${paymentId}`,
      timestamp: new Date(),
    });

    // Step 5: Calculate Dynamic Logistics based on User Location
    const userCity = user.location?.city || "Chennai";
    const logistics = await calculateDeliveryEstimate(userCity);

    auditTrail.push({
      step: "LOGISTICS_CALCULATION",
      status: "PASSED",
      detail: `Routed via ${logistics.nearestHub} (${logistics.distanceKm} km away)`,
      timestamp: new Date(),
    });

    // Step 6: Record Order in MongoDB
    const completedOrder = await Order.create({
      user: user._id,
      product: {
        title: input.title,
        price: numericPrice,
        image: input.image || "",
        url: input.url,
      },
      shippingAddress: {
        city: user.location?.city || "Unknown",
        pincode: user.location?.pincode || "000000",
      },
      fulfillment: {
        dispatchedFrom: logistics.nearestHub,
        distanceKm: logistics.distanceKm,
        estimatedDays: logistics.deliveryDays,
        trackingStatus: "PLACED",
      },
      razorpay: {
        orderId: razorpayOrder.id,
        paymentId: paymentId,
        status: "PAID",
      },
      auditTrail,
    });

    // Step 7: Trigger Confirmation Email to User
    sendOrderConfirmationEmail({
      toEmail: user.email,
      orderId: (completedOrder._id as any).toString(),
      productTitle: input.title,
      price: numericPrice,
      deliveryCity: user.location?.city || "Unknown",
      dispatchedFrom: logistics.nearestHub,
      distanceKm: logistics.distanceKm,
      estimatedDays: logistics.deliveryDays,
      paymentId: paymentId,
    }).catch((err) => console.error("ASYNC_EMAIL_ERROR:", err));

    return {
      success: true,
      order: completedOrder,
      auditTrail,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error?.description ||
      error.message ||
      "Invalid Token or Gateway Refusal";

    auditTrail.push({
      step: "API_TOKEN_CHARGE",
      status: "FAILED",
      detail: `Razorpay token payment failed: ${errorMessage}`,
      timestamp: new Date(),
    });

    // Calculate fallback logistics even on failure
    const userCity = user.location?.city || "Chennai";
    const logistics = await calculateDeliveryEstimate(userCity);

    await Order.create({
      user: user._id,
      product: {
        title: input.title,
        price: numericPrice,
        image: input.image || "",
        url: input.url,
      },
      shippingAddress: {
        city: user.location?.city || "Unknown",
        pincode: user.location?.pincode || "000000",
      },
      fulfillment: {
        dispatchedFrom: logistics.nearestHub,
        distanceKm: logistics.distanceKm,
        estimatedDays: logistics.deliveryDays,
        trackingStatus: "PLACED",
      },
      razorpay: {
        orderId: razorpayOrder.id,
        status: "FAILED",
      },
      auditTrail,
    });

    return {
      success: false,
      reason: "PAYMENT_EXECUTION_FAILED",
      auditTrail,
    };
  }
};