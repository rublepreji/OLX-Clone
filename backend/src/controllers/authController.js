
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// REGISTER
export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // 1. Validate input
        if (!name || !email || !password) {
            const error = new Error("Name, email and password are required");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            throw error;
        }

        if (name.trim().length < 2) {
            const error = new Error("Name must contain at least 2 characters");
            error.statusCode = 400;
            error.code = "INVALID_NAME";
            throw error;
        }

        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            const error = new Error("Please provide a valid email");
            error.statusCode = 400;
            error.code = "INVALID_EMAIL";
            throw error;
        }

        if (password.length < 8) {
            const error = new Error("Password must contain at least 8 characters");
            error.statusCode = 400;
            error.code = "WEAK_PASSWORD";
            throw error;
        }

        // 2. Check if email already exists
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            const error = new Error("Email already registered");
            error.statusCode = 409;
            error.code = "EMAIL_ALREADY_EXISTS";
            throw error;
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Save user
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        // 5. Return safe user details
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            },
        });

    } catch (error) {
        next(error);
    }
};


// LOGIN
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            const error = new Error("Email and password are required");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            throw error;
        }

        // 2. Find user
        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        });

        if (!user) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            error.code = "INVALID_CREDENTIALS";
            throw error;
        }

        // 3. Compare password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            error.code = "INVALID_CREDENTIALS";
            throw error;
        }

        // 4. Generate JWT
        const token = jwt.sign(
            {
                sub: user._id.toString(),
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d",
            }
        );

        // 5. Return token and safe user details
        res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            },
        });

    } catch (error) {
        next(error);
    }
};


// GET CURRENT USER
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select(
            "_id name email"
        );

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            error.code = "USER_NOT_FOUND";
            throw error;
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            },
        });

    } catch (error) {
        next(error);
    }
};
