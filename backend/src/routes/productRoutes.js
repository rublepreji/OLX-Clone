import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
    createProduct,
    updateProduct,
    getProducts,
    getProductById,
    deleteProduct
} from "../controllers/productController";

const router = express.Router();

router.get("/", getProducts);

router.get('/:id', getProductById)

router.post('/', authMiddleware, createProduct)

router.patch('/:id', authMiddleware, updateProduct)

router.delete('/:id', authMiddleware, deleteProduct)

export default router;
