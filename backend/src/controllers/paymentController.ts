import { Response } from "express";
import Razorpay from "razorpay";
import User from "../models/User";
import Order, { IAuditLog } from "../models/Order";
import { AuthRequest } from "../middleware/authMiddleware";
import { calculateDeliveryEstimate } from "../utils/logistics";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// Save Razorpay customer ID and token to User profile
export const savePaymentToken = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, razorpayCustomerId, paymentToken, token } = req.body;

    // Accept both key conventions from the frontend request body
    const finalCustomerId = customerId || razorpayCustomerId;
    const finalToken = paymentToken || token;

    if (!finalCustomerId || !finalToken) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and Payment Token are required.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        razorpayCustomerId: finalCustomerId,
        paymentToken: finalToken,
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment token registered successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("SAVE_PAYMENT_TOKEN_ERROR:", error?.error || error);

    return res.status(500).json({
      success: false,
      message: "Failed to save payment token",
      errorDetail: error?.error?.description || error.message || error,
    });
  }
};

// Direct Agent Execution Endpoint
export const executeAgentPurchase = async (req: AuthRequest, res: Response) => {

    // At the top of executeAgentPurchase in paymentController.ts:
console.log("ROUTE_HIT: executeAgentPurchase called with body:", req.body);

// At the top of initiateAgentCheckout in checkoutController.ts:
console.log("ROUTE_HIT: initiateAgentCheckout called with body:", req.body);
  const auditTrail: IAuditLog[] = [];

  try {
    // Support both short (title, price) and long (productTitle, priceAmount) key formats
    const { title, productTitle, price, priceAmount, image, productImage, url, productUrl } = req.body;

    const finalTitle = title || productTitle || "Untitled Product";
    const finalImage = image || productImage || "";
    const finalUrl = url || productUrl || "";

    // Parse numeric price safely from string or number
    const rawPrice = price !== undefined ? price : priceAmount;
    const numericPrice = typeof rawPrice === "number"
      ? rawPrice
      : parseFloat(String(rawPrice || "").replace(/[^0-9.]/g, ""));

    auditTrail.push({
      step: "AGENT_INTENT",
      status: "PASSED",
      detail: `Agent initiated checkout for "${finalTitle}" priced at ₹${numericPrice}`,
      timestamp: new Date(),
    });

    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid product price format: ${rawPrice}`,
        auditTrail,
      });
    }

    // 1. Fetch User & Verify Location & Payment Token Gate
    const user = await User.findById(req.userId);

    if (!user || !user.paymentToken || !user.razorpayCustomerId) {
      auditTrail.push({
        step: "TOKEN_VERIFICATION",
        status: "FAILED",
        detail: "No active Razorpay payment token found for this user account.",
        timestamp: new Date(),
      });

      return res.status(400).json({
        success: false,
        message: "No registered payment token found. Please save payment details in your Profile first.",
        auditTrail,
      });
    }

    auditTrail.push({
      step: "TOKEN_VERIFICATION",
      status: "PASSED",
      detail: `Valid payment token found for customer ${user.razorpayCustomerId}`,
      timestamp: new Date(),
    });

    // 2. Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(numericPrice * 100),
      currency: "INR",
      receipt: `agent_rcpt_${Date.now()}`,
      notes: {
        executedBy: "AGENTIC_COMMERCE_ENGINE",
        userId: user._id.toString(),
      },
    });

    auditTrail.push({
      step: "RAZORPAY_ORDER_CREATE",
      status: "PASSED",
      detail: `Created Razorpay Order ID: ${razorpayOrder.id}`,
      timestamp: new Date(),
    });

    // 3. Charge Saved Token via direct API
    const paymentService = razorpay.payments as unknown as {
      createPaymentWithToken: (data: Record<string, unknown>) => Promise<{ id: string }>;
    };

    const paymentResponse = await paymentService.createPaymentWithToken({
      email: user.email,
      contact: "9876543210",
      amount: Math.round(numericPrice * 100),
      currency: "INR",
      order_id: razorpayOrder.id,
      customer_id: user.razorpayCustomerId,
      token: user.paymentToken,
    });

    auditTrail.push({
      step: "API_TOKEN_PAYMENT",
      status: "PASSED",
      detail: `Payment captured successfully. Payment ID: ${paymentResponse.id}`,
      timestamp: new Date(),
    });

    // 4. Dynamically Calculate Fulfillment Logistics based on User Location
    // 4. Dynamically Calculate Fulfillment Logistics based on User Location
// 4. Dynamically Calculate Fulfillment Logistics based on User Location
    const userCity = user.location?.city || "Chennai";
    const logistics = await calculateDeliveryEstimate(userCity);

    auditTrail.push({
      step: "LOGISTICS_CALCULATION",
      status: "PASSED",
      detail: `Routed via ${logistics.nearestHub} (${logistics.distanceKm} km away)`,
      timestamp: new Date(),
    });

    // 5. Save Order matching nested Schema format
    const order = await Order.create({
      user: user._id,
      product: {
        title: finalTitle,
        price: numericPrice,
        image: finalImage,
        url: finalUrl,
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
        paymentId: paymentResponse.id,
        status: "PAID",
      },
      auditTrail,
    });

    return res.status(200).json({
      success: true,
      message: "Purchase completed successfully.",
      order,
    });
  } catch (error: any) {
    console.error("Agent purchase execution error:", error);
    auditTrail.push({
      step: "EXECUTION_FAILURE",
      status: "FAILED",
      detail: error.message || "Failed to process token payment",
      timestamp: new Date(),
    });

    return res.status(500).json({
      success: false,
      message: "Agent checkout failed",
      auditTrail,
    });
  }
};