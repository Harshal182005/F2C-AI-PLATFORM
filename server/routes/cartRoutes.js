import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} from "../controllers/cartController.js";

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    roleMiddleware("customer"),
    getCart
);

router.post(
    "/add",
    authMiddleware,
    roleMiddleware("customer"),
    addToCart
);

router.put(
    "/update/:productId",
    authMiddleware,
    roleMiddleware("customer"),
    updateCartItem
);

router.delete(
    "/remove/:productId",
    authMiddleware,
    roleMiddleware("customer"),
    removeFromCart
);

router.delete(
    "/clear",
    authMiddleware,
    roleMiddleware("customer"),
    clearCart
);

export default router;