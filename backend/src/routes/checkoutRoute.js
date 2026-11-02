import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { checkout } from "../controllers/checkoutController.js";

const router = express.Router();

// All checkout routes require authentication
router.use(authMiddleware);

router.post("/", checkout);

export default router;
