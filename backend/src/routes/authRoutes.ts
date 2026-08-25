import { Router } from "express";

import {
  register,
  login,
  updateLocation,
  getMe
} from "../controllers/authController";

import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", protect, getMe);

router.patch("/location", protect, updateLocation);

export default router;