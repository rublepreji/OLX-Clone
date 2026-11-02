
import mongoose from "mongoose";
import Product from "../models/Product.js";

// Create structured errors
function createError(message, statusCode, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;

    return error;
}

// Escape special regex characters
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Validate product fields
function validateProductFields(data, isPartial = false) {
    const allowedFields = [
        "title",
        "description",
        "price",
        "category",
        "imageUrl",
    ];

    const receivedFields = Object.keys(data);

    // Reject fields that clients are not allowed to modify
    const forbiddenFields = ["seller", "isSold"];

    if (receivedFields.some(field => forbiddenFields.includes(field))) {
        throw createError(
            "You cannot modify seller or isSold",
            400,
            "FORBIDDEN_PRODUCT_FIELDS"
        );
    }

    // Reject unknown fields
    if (receivedFields.some(field => !allowedFields.includes(field))) {
        throw createError(
            "Invalid product fields",
            400,
            "INVALID_PRODUCT_FIELDS"
        );
    }

    // Require all fields during creation
    if (!isPartial) {
        for (const field of allowedFields) {
            if (
                data[field] === undefined ||
                data[field] === null ||
                data[field] === ""
            ) {
                throw createError(
                    `${field} is required`,
                    400,
                    "VALIDATION_ERROR"
                );
            }
        }
    }

    // Validate title
    if (data.title !== undefined) {
        if (
            typeof data.title !== "string" ||
            data.title.trim().length < 3 ||
            data.title.trim().length > 100
        ) {
            throw createError(
                "Title must contain 3 to 100 characters",
                400,
                "INVALID_TITLE"
            );
        }
    }

    // Validate description
    if (data.description !== undefined) {
        if (
            typeof data.description !== "string" ||
            data.description.trim().length < 10 ||
            data.description.trim().length > 2000
        ) {
            throw createError(
                "Description must contain 10 to 2000 characters",
                400,
                "INVALID_DESCRIPTION"
            );
        }
    }

    // Validate price
    if (data.price !== undefined) {
        const price = data.price;

        if (
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            throw createError(
                "Price must be a valid non-negative number",
                400,
                "INVALID_PRICE"
            );
        }
    }

    // Validate category
    if (data.category !== undefined) {
        if (
            typeof data.category !== "string" ||
            !data.category.trim()
        ) {
            throw createError(
                "Valid category is required",
                400,
                "INVALID_CATEGORY"
            );
        }
    }

    // Validate image URL
    if (data.imageUrl !== undefined) {
        if (typeof data.imageUrl !== "string") {
            throw createError(
                "Image URL must be a string",
                400,
                "INVALID_IMAGE_URL"
            );
        }

        try {
            const url = new URL(data.imageUrl);

            if (!["http:", "https:"].includes(url.protocol)) {
                throw new Error("Invalid protocol");
            }
        } catch {
            throw createError(
                "Please provide a valid image URL",
                400,
                "INVALID_IMAGE_URL"
            );
        }
    }
}




export const getProducts = async (req, res, next) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            search,
        } = req.query;

        // 1. Start with unsold products only
        const filter = {
            isSold: false,
        };

        // 2. Validate category
        if (category !== undefined) {
            if (
                typeof category !== "string" ||
                !category.trim()
            ) {
                throw createError(
                    "Invalid category",
                    400,
                    "INVALID_CATEGORY"
                );
            }

            filter.category = category.trim();
        }

        // 3. Validate minimum price
        if (minPrice !== undefined) {
            if (
                typeof minPrice !== "string" ||
                minPrice.trim() === "" ||
                !Number.isFinite(Number(minPrice)) ||
                Number(minPrice) < 0
            ) {
                throw createError(
                    "Invalid minimum price",
                    400,
                    "INVALID_MIN_PRICE"
                );
            }
        }

        // 4. Validate maximum price
        if (maxPrice !== undefined) {
            if (
                typeof maxPrice !== "string" ||
                maxPrice.trim() === "" ||
                !Number.isFinite(Number(maxPrice)) ||
                Number(maxPrice) < 0
            ) {
                throw createError(
                    "Invalid maximum price",
                    400,
                    "INVALID_MAX_PRICE"
                );
            }
        }

        // 5. Check minimum price is not greater than maximum
        if (
            minPrice !== undefined &&
            maxPrice !== undefined &&
            Number(minPrice) > Number(maxPrice)
        ) {
            throw createError(
                "Minimum price cannot exceed maximum price",
                400,
                "INVALID_PRICE_RANGE"
            );
        }

        // 6. Build price filter
        if (
            minPrice !== undefined ||
            maxPrice !== undefined
        ) {
            filter.price = {};

            if (minPrice !== undefined) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        // 7. Build search filter
        if (search !== undefined) {
            if (
                typeof search !== "string" ||
                !search.trim() ||
                search.trim().length > 100
            ) {
                throw createError(
                    "Invalid search query",
                    400,
                    "INVALID_SEARCH"
                );
            }

            const safeSearch = escapeRegex(search.trim());

            filter.$or = [
                {
                    title: {
                        $regex: safeSearch,
                        $options: "i",
                    },
                },
                {
                    description: {
                        $regex: safeSearch,
                        $options: "i",
                    },
                },
            ];
        }

        // 8. Fetch products
        const products = await Product.find(filter)
            .populate("seller", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: {
                products,
            },
        });

    } catch (error) {
        next(error);
    }
};



export const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ID
        if (!mongoose.isValidObjectId(id)) {
            throw createError(
                "Invalid product ID",
                400,
                "INVALID_PRODUCT_ID"
            );
        }

        // Find product that is not sold
        const product = await Product.findOne({
            _id: id,
            isSold: false,
        }).populate("seller", "name");

        if (!product) {
            throw createError(
                "Product not found",
                404,
                "PRODUCT_NOT_FOUND"
            );
        }

        res.status(200).json({
            success: true,
            data: {
                product,
            },
        });

    } catch (error) {
        next(error);
    }
};



export const createProduct = async (req, res, next) => {
    try {
        const {
            title,
            description,
            price,
            category,
            imageUrl,
        } = req.body;

        // 1. Validate product fields
        validateProductFields(req.body);

        // 2. Create product
        const product = await Product.create({
            title: title.trim(),
            description: description.trim(),
            price,
            category: category.trim(),
            imageUrl: imageUrl.trim(),

            // Get seller ID from authenticated user
            seller: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: {
                product,
            },
        });

    } catch (error) {
        next(error);
    }
};



export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Validate product ID
        if (!mongoose.isValidObjectId(id)) {
            throw createError(
                "Invalid product ID",
                400,
                "INVALID_PRODUCT_ID"
            );
        }

        // 2. Validate request body
        if (
            !req.body ||
            Object.keys(req.body).length === 0
        ) {
            throw createError(
                "Provide at least one field to update",
                400,
                "EMPTY_UPDATE"
            );
        }

        validateProductFields(req.body, true);

        // 3. Find product owned by authenticated user
        const product = await Product.findOne({
            _id: id,
            seller: req.user.id,
            isSold: false,
        });

        if (!product) {
            throw createError(
                "Product not found or you are not authorized to update it",
                404,
                "PRODUCT_NOT_FOUND"
            );
        }

        if (product.seller.toString() !== req.user.id) {
            throw createError(
                "You cannot update another user's product",
                403,
                "FORBIDDEN"
            );
        }

        if (product.isSold) {
            throw createError(
                "Sold products cannot be updated",
                400,
                "PRODUCT_ALREADY_SOLD"
            );
        }

        // 4. Update only allowed fields
        const allowedFields = [
            "title",
            "description",
            "price",
            "category",
            "imageUrl",
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                product[field] =
                    typeof req.body[field] === "string"
                        ? req.body[field].trim()
                        : req.body[field];
            }
        }

        // 5. Save updated product
        await product.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: {
                product,
            },
        });

    } catch (error) {
        next(error);
    }
};


export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Validate ID
        if (!mongoose.isValidObjectId(id)) {
            throw createError(
                "Invalid product ID",
                400,
                "INVALID_PRODUCT_ID"
            );
        }

        // 2. Find product
        const product = await Product.findById(id);

        if (!product) {
            throw createError(
                "Product not found",
                404,
                "PRODUCT_NOT_FOUND"
            );
        }

        // 3. Check ownership
        if (product.seller.toString() !== req.user.id) {
            throw createError(
                "You cannot delete another user's product",
                403,
                "FORBIDDEN"
            );
        }

        // 4. Prevent deleting sold products
        if (product.isSold) {
            throw createError(
                "Sold products cannot be deleted",
                400,
                "PRODUCT_ALREADY_SOLD"
            );
        }

        // 5. Delete product
        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });

    } catch (error) {
        next(error);
    }
};
