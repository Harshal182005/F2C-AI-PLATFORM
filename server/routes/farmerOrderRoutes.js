import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    getFarmerOrders,
    getFarmerOrderById,
    updateFarmerOrderStatus
} from "../controllers/farmerOrderController.js";

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    roleMiddleware("farmer"),
    getFarmerOrders
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("farmer"),
    getFarmerOrderById
);

router.put(
    "/:id/status",
    authMiddleware,
    roleMiddleware("farmer"),
    updateFarmerOrderStatus
);

export default router;