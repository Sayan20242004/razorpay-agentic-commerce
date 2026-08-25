import { Router, Response } from "express";
import { searchProducts } from "../controllers/agentController";
import { protect, AuthRequest } from "../middleware/authMiddleware";
import { processAutomatedPurchase } from "../services/agent/agentExecutionService";

const router = Router();

// 1. Search products (public or protected)
router.post("/search", searchProducts);

// 2. Direct Agent Autonomous Purchase Endpoint
router.post("/auto-buy", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { title, price, image, url } = req.body;

    if (!title || !price || !url) {
      return res.status(400).json({
        success: false,
        message: "title, price, and url are required",
      });
    }

    const result = await processAutomatedPurchase({
      userId: req.userId!,
      title,
      price,
      image,
      url,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Auto-buy error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to execute agent purchase",
    });
  }
});

export default router;