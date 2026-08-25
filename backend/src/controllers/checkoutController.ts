import { Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/User";
import Order, { IAuditLog } from "../models/Order";
import { AuthRequest } from "../middleware/authMiddleware";
import { calculateDeliveryEstimate } from "../utils/logistics";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export const initiateAgentCheckout = async (req: AuthRequest, res: Response) => {
    console.log("ROUTE_HIT: initiateAgentCheckout called with body:", req.body);
  const auditTrail: IAuditLog[] = [];

  try {
    const userId = req.userId;
    const { title, price, image, url } = req.body;

    auditTrail.push({
      step: "INTENT_PARSE",
      status: "PASSED",
      detail: `Agent received checkout request for "${title}" at ₹${price}`,
      timestamp: new Date(),
    });

    // 1. Validate User & Location Gate
    const user = await User.findById(userId);
    if (!user || !user.location?.city || !user.location?.pincode) {
      auditTrail.push({
        step: "LOCATION_GATE",
        status: "FAILED",
        detail: "User shipping address or location missing. Transaction blocked.",
        timestamp: new Date(),
      });

      return res.status(400).json({
        success: false,
        message: "Shipping address missing. Please set location first.",
        auditTrail,
      });
    }

    auditTrail.push({
      step: "LOCATION_GATE",
      status: "PASSED",
      detail: `Destination verified: ${user.location.city} (${user.location.pincode})`,
      timestamp: new Date(),
    });

    // 2. Validate and Parse Price safely (prevents NaN from hitting Razorpay)
    if (price === undefined || price === null || price === "") {
      auditTrail.push({
        step: "PRICE_VALIDATION",
        status: "FAILED",
        detail: "Product price missing in request payload.",
        timestamp: new Date(),
      });

      return res.status(400).json({
        success: false,
        message: "Product price is required.",
        auditTrail,
      });
    }

    const numericPrice = typeof price === "number"
      ? price
      : parseFloat(String(price).replace(/[^0-9.]/g, ""));

    if (isNaN(numericPrice) || numericPrice <= 0) {
      auditTrail.push({
        step: "PRICE_VALIDATION",
        status: "FAILED",
        detail: `Failed to parse valid numeric price from value: "${price}"`,
        timestamp: new Date(),
      });

      return res.status(400).json({
        success: false,
        message: `Invalid product price format: ${price}`,
        auditTrail,
      });
    }

    auditTrail.push({
      step: "PRICE_VALIDATION",
      status: "PASSED",
      detail: `Price validated successfully: ₹${numericPrice}`,
      timestamp: new Date(),
    });

    console.log("CHECKOUT_CONTROLLER: Passing city to logistics ->", user.location.city);

    // 3. Logistics Calculation
    const logistics = await calculateDeliveryEstimate(user.location.city);
    auditTrail.push({
      step: "LOGISTICS_ESTIMATE",
      status: "PASSED",
      detail: `Assigned nearest hub: ${logistics.nearestHub} (${logistics.distanceKm} km away). ETA: ${logistics.deliveryDays} days`,
      timestamp: new Date(),
    });

    console.log("CHECKOUT_CONTROLLER: Received logistics result ->", logistics);

    // 4. Create Razorpay Test Order
    const options = {
      amount: Math.round(numericPrice * 100), // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        agentAction: "AGENTIC_COMMERCE_CHECKOUT",
        userId: user._id.toString(),
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    auditTrail.push({
      step: "RAZORPAY_ORDER_CREATE",
      status: "PASSED",
      detail: `Created test mode Razorpay order ID: ${razorpayOrder.id}`,
      timestamp: new Date(),
    });

    // 5. Save Order State
    const order = await Order.create({
      user: user._id,
      product: {
        title: title || "Untitled Product",
        price: numericPrice,
        image: image || "",
        url: url || "",
      },
      shippingAddress: {
        city: user.location.city,
        pincode: user.location.pincode,
      },
      fulfillment: {
        dispatchedFrom: logistics.nearestHub,
        distanceKm: logistics.distanceKm,
        estimatedDays: logistics.deliveryDays,
        trackingStatus: "PLACED",
      },
      razorpay: {
        orderId: razorpayOrder.id,
        status: "PENDING",
      },
      auditTrail,
    });

    return res.status(201).json({
      success: true,
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      delivery: logistics,
      auditTrail,
    });
  } catch (error: any) {
    console.error("Checkout initiation error:", error);
    auditTrail.push({
      step: "EXECUTION_FAILURE",
      status: "FAILED",
      detail: error.message || "Unhandled error during checkout processing",
      timestamp: new Date(),
    });

    return res.status(500).json({
      success: false,
      message: error.message || "Agent failed to process checkout",
      auditTrail,
    });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      await Order.findByIdAndUpdate(orderId, {
        "razorpay.status": "FAILED",
        $push: {
          auditTrail: {
            step: "PAYMENT_VERIFICATION",
            status: "FAILED",
            detail: "Razorpay payment signature mismatch",
            timestamp: new Date(),
          },
        },
      });

      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        "razorpay.paymentId": razorpay_payment_id,
        "razorpay.status": "PAID",
        $push: {
          auditTrail: {
            step: "PAYMENT_VERIFICATION",
            status: "PASSED",
            detail: `Verified payment ${razorpay_payment_id} via Razorpay Test API`,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    return res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ success: false, message: "Payment verification error" });
  }
};

export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};