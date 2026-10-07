import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    getProfile,
    updateProfile
} from "../controllers/userController.js";

const router = express.Router();


/* =========================
   CUSTOMER PROFILE
========================= */

router.get(
    "/profile",
    authMiddleware,
    roleMiddleware("customer"),
    getProfile
);


router.put(
    "/profile",
    authMiddleware,
    roleMiddleware("customer"),
    updateProfile
);


export default router;