import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  initiateAgentCheckout,
  verifyPayment,
  getUserOrders,
} from "../controllers/checkoutController";

const router = Router();

router.post("/checkout", protect, initiateAgentCheckout);
router.post("/verify-payment", protect, verifyPayment);
router.get("/my-orders", protect, getUserOrders);

export default router;