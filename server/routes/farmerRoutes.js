import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    getFarmerAnalytics
} from "../controllers/farmerController.js";


const router = express.Router();


// ==========================================
// FARMER ANALYTICS
// ==========================================

router.get(
    "/analytics",
    authMiddleware,
    roleMiddleware("farmer"),
    getFarmerAnalytics
);


export default router;