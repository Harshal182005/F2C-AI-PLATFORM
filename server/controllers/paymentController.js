import crypto from "crypto";
import mongoose from "mongoose";

import Razorpay from "../config/razorpay.js";
import Order from "../models/Order.js";


// ======================================================
// CREATE RAZORPAY ORDER
// ======================================================

export const createRazorpayOrder = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { orderId } = req.body;

        // ------------------------------------------
        // Validate order ID
        // ------------------------------------------

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        // ------------------------------------------
        // Find customer's order
        // ------------------------------------------

        const order = await Order.findOne({
            _id: orderId,
            customer: customerId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // ------------------------------------------
        // Check payment method
        // ------------------------------------------

        if (order.paymentMethod !== "RAZORPAY") {
            return res.status(400).json({
                success: false,
                message: "This order is not a Razorpay order"
            });
        }

        // ------------------------------------------
        // Check payment status
        // ------------------------------------------

        if (order.paymentStatus === "PAID") {
            return res.status(400).json({
                success: false,
                message: "Order is already paid"
            });
        }

        if (order.paymentStatus === "REFUNDED") {
            return res.status(400).json({
                success: false,
                message: "Order has already been refunded"
            });
        }

        // ------------------------------------------
        // Check order status
        // ------------------------------------------

        if (order.orderStatus === "CANCELLED") {
            return res.status(400).json({
                success: false,
                message: "Cancelled orders cannot be paid"
            });
        }

        // ------------------------------------------
        // Check amount
        // ------------------------------------------

        if (
            !Number.isFinite(Number(order.totalAmount)) ||
            Number(order.totalAmount) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order amount"
            });
        }

        // ------------------------------------------
        // Create Razorpay order
        // ------------------------------------------

        const options = {
            amount: Math.round(
                Number(order.totalAmount) * 100
            ),
            currency: "INR",
            receipt: `f2c_${order._id}`
        };

        const razorpayOrder =
            await Razorpay.orders.create(options);

        // ------------------------------------------
        // Save Razorpay Order ID
        // ------------------------------------------

        order.razorpayOrderId =
            razorpayOrder.id;

        await order.save();

        // ------------------------------------------
        // Response
        // ------------------------------------------

        res.status(200).json({
            success: true,
            message:
                "Razorpay order created successfully",

            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                status: razorpayOrder.status
            },

            f2cOrderId: order._id
        });

    } catch (error) {

        console.error(
            "RAZORPAY CREATE ORDER ERROR:"
        );

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Failed to create Razorpay order"
        });
    }
};


// ======================================================
// VERIFY RAZORPAY PAYMENT
// ======================================================

export const verifyRazorpayPayment = async (
    req,
    res
) => {
    try {

        const customerId =
            req.user.id;

        const {
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;


        // ==================================================
        // VALIDATE REQUEST
        // ==================================================

        if (
            !orderId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment verification data is incomplete"
            });
        }


        // ==================================================
        // VALIDATE F2C ORDER ID
        // ==================================================

        if (
            !mongoose.Types.ObjectId.isValid(
                orderId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }


        // ==================================================
        // FIND CUSTOMER'S ORDER
        // ==================================================

        const order =
            await Order.findOne({
                _id: orderId,
                customer: customerId
            });


        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }


        // ==================================================
        // CHECK PAYMENT METHOD
        // ==================================================

        if (
            order.paymentMethod !==
            "RAZORPAY"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This order is not a Razorpay order"
            });
        }


        // ==================================================
        // HANDLE ALREADY VERIFIED PAYMENT
        // ==================================================

        if (
            order.paymentStatus ===
            "PAID"
        ) {
            return res.status(200).json({
                success: true,

                message:
                    "Payment already verified",

                order: {
                    _id: order._id,

                    paymentStatus:
                        order.paymentStatus,

                    orderStatus:
                        order.orderStatus,

                    totalAmount:
                        order.totalAmount
                }
            });
        }


        // ==================================================
        // CHECK ORDER STATUS
        // ==================================================

        if (
            order.orderStatus ===
            "CANCELLED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Cancelled orders cannot be paid"
            });
        }


        // ==================================================
        // CHECK RAZORPAY ORDER ID
        // ==================================================

        if (
            !order.razorpayOrderId ||
            order.razorpayOrderId !==
                razorpay_order_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Razorpay order ID does not match"
            });
        }


        // ==================================================
        // CHECK RAZORPAY SECRET
        // ==================================================

        if (
            !process.env
                .RAZORPAY_KEY_SECRET
        ) {
            console.error(
                "RAZORPAY_KEY_SECRET is missing"
            );

            return res.status(500).json({
                success: false,
                message:
                    "Payment service configuration error"
            });
        }


        // ==================================================
        // CREATE EXPECTED SIGNATURE
        // ==================================================

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env
                        .RAZORPAY_KEY_SECRET
                )
                .update(
                    `${razorpay_order_id}|${razorpay_payment_id}`
                )
                .digest("hex");


        // ==================================================
        // SAFE SIGNATURE COMPARISON
        // ==================================================

        let isSignatureValid = false;

        try {

            const generatedBuffer =
                Buffer.from(
                    generatedSignature,
                    "hex"
                );

            const receivedBuffer =
                Buffer.from(
                    razorpay_signature,
                    "hex"
                );

            if (
                generatedBuffer.length ===
                receivedBuffer.length
            ) {
                isSignatureValid =
                    crypto.timingSafeEqual(
                        generatedBuffer,
                        receivedBuffer
                    );
            }

        } catch (signatureError) {

            console.error(
                "SIGNATURE COMPARISON ERROR:",
                signatureError
            );

            isSignatureValid = false;
        }


        // ==================================================
        // INVALID SIGNATURE
        // ==================================================

        if (!isSignatureValid) {

            order.paymentStatus =
                "FAILED";

            await order.save();

            return res.status(400).json({
                success: false,
                message:
                    "Invalid Razorpay payment signature"
            });
        }


        // ==================================================
        // PAYMENT SUCCESS
        // ==================================================

        order.razorpayPaymentId =
            razorpay_payment_id;

        order.razorpaySignature =
            razorpay_signature;

        order.paymentStatus =
            "PAID";

        order.orderStatus =
            "CONFIRMED";


        // ==================================================
        // ADD STATUS HISTORY
        // ==================================================

        if (!order.statusHistory) {
            order.statusHistory = [];
        }


        order.statusHistory.push({
            status: "CONFIRMED",

            updatedAt:
                new Date(),

            updatedBy:
                customerId
        });


        // ==================================================
        // SAVE ORDER
        // ==================================================

        await order.save();


        // ==================================================
        // RESPONSE
        // ==================================================

        res.status(200).json({
            success: true,

            message:
                "Payment verified successfully",

            order: {
                _id: order._id,

                paymentStatus:
                    order.paymentStatus,

                orderStatus:
                    order.orderStatus,

                totalAmount:
                    order.totalAmount
            }
        });

    } catch (error) {

        console.error(
            "RAZORPAY PAYMENT VERIFICATION ERROR:"
        );

        console.error(error);

        res.status(500).json({
            success: false,

            message:
                "Payment verification failed"
        });
    }
};


// ======================================================
// REFUND RAZORPAY PAYMENT
// ======================================================

export const refundRazorpayPayment = async (
    req,
    res
) => {
    try {

        const customerId =
            req.user.id;

        const { orderId } = req.body;


        // ==================================================
        // VALIDATE ORDER ID
        // ==================================================

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }


        if (
            !mongoose.Types.ObjectId.isValid(
                orderId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }


        // ==================================================
        // FIND CUSTOMER'S ORDER
        // ==================================================

        const order =
            await Order.findOne({
                _id: orderId,
                customer: customerId
            });


        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }


        // ==================================================
        // CHECK PAYMENT METHOD
        // ==================================================

        if (
            order.paymentMethod !==
            "RAZORPAY"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This order is not a Razorpay order"
            });
        }


        // ==================================================
        // CHECK PAYMENT STATUS
        // ==================================================

        if (
            order.paymentStatus !==
            "PAID"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only paid orders can be refunded"
            });
        }


        // ==================================================
        // CHECK PAYMENT ID
        // ==================================================

        if (!order.razorpayPaymentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Razorpay payment ID is missing"
            });
        }


        // ==================================================
        // CHECK ORDER STATUS
        // ==================================================

        if (
            order.orderStatus !==
            "CANCELLED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Order must be cancelled before refund"
            });
        }


        // ==================================================
        // VALIDATE AMOUNT
        // ==================================================

        if (
            !Number.isFinite(
                Number(order.totalAmount)
            ) ||
            Number(order.totalAmount) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid refund amount"
            });
        }


        // ==================================================
        // CREATE RAZORPAY REFUND
        // ==================================================

        const refundAmount =
            Math.round(
                Number(order.totalAmount) * 100
            );

        const refund =
            await Razorpay.payments.refund(
                order.razorpayPaymentId,
                {
                    amount: refundAmount
                }
            );


        // ==================================================
        // UPDATE ORDER PAYMENT STATUS
        // ==================================================

        order.paymentStatus =
            "REFUNDED";


        // Store refund ID if the schema supports it.
        // This is intentionally conditional so that
        // the existing Order schema does not break.
        if (
            Object.prototype.hasOwnProperty.call(
                order.toObject(),
                "razorpayRefundId"
            )
        ) {
            order.razorpayRefundId =
                refund.id;
        }


        // ==================================================
        // SAVE ORDER
        // ==================================================

        await order.save();


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({
            success: true,

            message:
                "Razorpay refund processed successfully",

            refund: {
                id: refund.id,
                amount: refund.amount,
                currency: refund.currency,
                status: refund.status
            },

            order: {
                _id: order._id,
                paymentStatus:
                    order.paymentStatus,
                orderStatus:
                    order.orderStatus
            }
        });

    } catch (error) {

        console.error(
            "RAZORPAY REFUND ERROR:"
        );

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Razorpay refund could not be processed"
        });
    }
};