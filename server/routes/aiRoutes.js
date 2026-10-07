import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    farmerAI,
    generateProductDescription
} from "../controllers/aiController.js";

const router = express.Router();


// ==========================================
// FARMER AI ASSISTANT
// ==========================================

router.post(
    "/farmer",
    authMiddleware,
    roleMiddleware("farmer"),
    farmerAI
);


// ==========================================
// AI PRODUCT DESCRIPTION
// ==========================================

router.post(
    "/product-description",
    authMiddleware,
    roleMiddleware("farmer"),
    generateProductDescription
);


export default router;