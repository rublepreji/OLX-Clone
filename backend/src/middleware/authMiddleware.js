
import jwt from "jsonwebtoken";

function authMiddleware(req, res, next) {
    try {
        // 1. Get Authorization header
        const authHeader = req.headers.authorization;

        // 2. Check whether token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            const error = new Error("Authentication required");
            error.statusCode = 401;
            error.code = "TOKEN_MISSING";

            throw error;
        }

        // 3. Extract token
        const token = authHeader.split(" ")[1];

        // 4. Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // 5. Store authenticated user's identity
        req.user = {
            id: decoded.sub,
        };

        // 6. Move to next middleware/controller
        next();

    } catch (error) {
        if (error.statusCode) {
            return next(error);
        }

        const authError = new Error("Invalid or expired token");
        authError.statusCode = 401;
        authError.code = "INVALID_TOKEN";

        next(authError);
    }
}

export default authMiddleware;
