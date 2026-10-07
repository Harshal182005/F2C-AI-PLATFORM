import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    createRazorpayOrder,
    verifyRazorpayPayment,
    refundRazorpayPayment
} from "../controllers/paymentController.js";

const router = express.Router();


// ======================================================
// CREATE RAZORPAY ORDER
// ======================================================

router.post(
    "/create-order",
    authMiddleware,
    roleMiddleware("customer"),
    createRazorpayOrder
);


// ======================================================
// VERIFY RAZORPAY PAYMENT
// ======================================================

router.post(
    "/verify",
    authMiddleware,
    roleMiddleware("customer"),
    verifyRazorpayPayment
);


// ======================================================
// REFUND RAZORPAY PAYMENT
// ======================================================

router.post(
    "/refund",
    authMiddleware,
    roleMiddleware("customer"),
    refundRazorpayPayment
);


export default router;