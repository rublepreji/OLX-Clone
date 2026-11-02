
import express from "express";

import {
    register,
    login,
    getMe,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Get current authenticated user
router.get("/me", authMiddleware, getMe);

export default router;
