import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { savePaymentToken, executeAgentPurchase } from "../controllers/paymentController";

const router = Router();

router.post("/save-token", protect, savePaymentToken);
router.post("/agent-checkout", protect, executeAgentPurchase);

export default router;