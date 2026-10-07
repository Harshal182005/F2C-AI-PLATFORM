import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    createOrder,
    getCustomerOrders,
    getCustomerOrderById,
    cancelOrder
} from "../controllers/orderController.js";

const router = express.Router();


// Create order
router.post(
    "/",
    authMiddleware,
    roleMiddleware("customer"),
    createOrder
);


// Get all customer orders
router.get(
    "/my-orders",
    authMiddleware,
    roleMiddleware("customer"),
    getCustomerOrders
);


// Get single customer order
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("customer"),
    getCustomerOrderById
);


// Cancel order
router.put(
    "/cancel/:id",
    authMiddleware,
    roleMiddleware("customer"),
    cancelOrder
);


export default router;