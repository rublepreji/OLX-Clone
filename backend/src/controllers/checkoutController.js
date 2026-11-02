
import mongoose from "mongoose";
import Product from "../models/Product";

export const checkout = async (req, res, next) => {
    let session;

    try {
        const { productIds } = req.body;

        // 1. Validate productIds
        if (
            !Array.isArray(productIds) ||
            productIds.length === 0
        ) {
            const error = new Error(
                "Please provide at least one product ID"
            );
            error.statusCode = 400;
            error.code = "INVALID_PRODUCT_IDS";
            throw error;
        }

        // 2. Validate each product ID
        const validIds = productIds.every(
            id =>
                typeof id === "string" &&
                mongoose.isValidObjectId(id)
        );

        if (!validIds) {
            const error = new Error("One or more product IDs are invalid");
            error.statusCode = 400;
            error.code = "INVALID_PRODUCT_ID";
            throw error;
        }

        // 3. Reject duplicate IDs
        const uniqueIds = new Set(
            productIds.map(id => id.toLowerCase())
        );

        if (uniqueIds.size !== productIds.length) {
            const error = new Error(
                "Duplicate product IDs are not allowed"
            );
            error.statusCode = 400;
            error.code = "DUPLICATE_PRODUCT_IDS";
            throw error;
        }

        // 4. Start MongoDB session
        session = await mongoose.startSession();

        // 5. Start transaction
        await session.withTransaction(async () => {

            // 6. Check whether all products exist and are available
            const products = await Product.find({
                _id: { $in: productIds },
                isSold: false,
            }).session(session);

            if (products.length !== productIds.length) {
                const error = new Error(
                    "One or more products are unavailable or already sold"
                );
                error.statusCode = 409;
                error.code = "PRODUCTS_UNAVAILABLE";
                throw error;
            }

            // 7. Mark all selected products as sold
            const result = await Product.updateMany(
                {
                    _id: { $in: productIds },
                    isSold: false,
                },
                {
                    $set: {
                        isSold: true,
                    },
                },
                {
                    session,
                }
            );

            // 8. Ensure every product was updated
            if (result.matchedCount !== productIds.length) {
                const error = new Error(
                    "Checkout failed because some products are no longer available"
                );
                error.statusCode = 409;
                error.code = "CHECKOUT_CONFLICT";
                throw error;
            }
        });

        // 9. Transaction committed successfully
        res.status(200).json({
            success: true,
            message: "Checkout completed successfully",
            data: {
                purchasedCount: productIds.length,
                productIds,
            },
        });

    } catch (error) {
        next(error);

    } finally {
        // 10. Always close the session
        if (session) {
            await session.endSession();
        }
    }
};
