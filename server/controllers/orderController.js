import mongoose from "mongoose";

import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Razorpay from "../config/razorpay.js";

import { emitOrderStatusUpdate } from "../services/socketService.js";


// ======================================================
// CREATE ORDER
// ======================================================

export const createOrder = async (req, res) => {
    try {
        const customerId = req.user.id;

        const {
            deliveryAddress,
            phone,
            paymentMethod = "COD"
        } = req.body || {};


        // ==================================================
        // VALIDATE DELIVERY ADDRESS
        // ==================================================

        if (
            typeof deliveryAddress !== "string" ||
            !deliveryAddress.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Delivery address is required"
            });
        }


        // ==================================================
        // VALIDATE PHONE
        // ==================================================

        if (
            phone !== undefined &&
            phone !== null &&
            typeof phone !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }


        // ==================================================
        // VALIDATE PAYMENT METHOD
        // ==================================================

        const allowedPaymentMethods = [
            "COD",
            "RAZORPAY"
        ];

        if (
            !allowedPaymentMethods.includes(
                paymentMethod
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }


        // ==================================================
        // GET CUSTOMER CART
        // ==================================================

        const cart =
            await Cart.findOne({
                customer: customerId
            }).populate("items.product");


        if (
            !cart ||
            !cart.items ||
            cart.items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty"
            });
        }


        // ==================================================
        // VALIDATE CART ITEMS
        // ==================================================

        for (const item of cart.items) {

            const product = item.product;


            // ----------------------------------------------
            // Product exists
            // ----------------------------------------------

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message:
                        "One of the products in your cart no longer exists"
                });
            }


            // ----------------------------------------------
            // Quantity validation
            // ----------------------------------------------

            if (
                !Number.isFinite(
                    Number(item.quantity)
                ) ||
                Number(item.quantity) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Invalid quantity for ${product.name}`
                });
            }


            // ----------------------------------------------
            // Product price validation
            // ----------------------------------------------

            if (
                !Number.isFinite(
                    Number(product.price)
                ) ||
                Number(product.price) < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Invalid price for ${product.name}`
                });
            }


            // ----------------------------------------------
            // Product availability
            // ----------------------------------------------

            if (!product.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.name} is currently unavailable`
                });
            }


            // ----------------------------------------------
            // Stock validation
            // ----------------------------------------------

            if (
                !Number.isFinite(
                    Number(product.quantity)
                ) ||
                Number(product.quantity) <
                    Number(item.quantity)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Only ${product.quantity} ${product.unit} of ${product.name} is available`
                });
            }
        }


        // ==================================================
        // CREATE ORDER ITEMS
        // ==================================================

        const orderItems =
            cart.items.map((item) => {

                const product =
                    item.product;

                const quantity =
                    Number(item.quantity);

                const price =
                    Number(product.price);

                const subtotal =
                    price * quantity;


                return {
                    product:
                        product._id,

                    productName:
                        product.name,

                    image:
                        product.images?.[0] || "",

                    farmer:
                        product.farmer,

                    quantity,

                    unit:
                        product.unit,

                    price,

                    subtotal
                };
            });


        // ==================================================
        // CALCULATE SUBTOTAL
        // ==================================================

        const subtotal =
            orderItems.reduce(
                (total, item) =>
                    total + item.subtotal,
                0
            );


        // ==================================================
        // DELIVERY FEE
        // ==================================================

        const deliveryFee =
            subtotal >= 500
                ? 0
                : 40;


        // ==================================================
        // TOTAL AMOUNT
        // ==================================================

        const totalAmount =
            subtotal + deliveryFee;


        // ==================================================
        // DATABASE TRANSACTION
        // ==================================================

        const session =
            await mongoose.startSession();

        let createdOrder;


        try {

            session.startTransaction();


            // ==============================================
            // REDUCE PRODUCT STOCK SAFELY
            // ==============================================

            for (const item of cart.items) {

                const product =
                    item.product;

                const quantity =
                    Number(item.quantity);


                const updatedProduct =
                    await Product.findOneAndUpdate(

                        {
                            _id:
                                product._id,

                            isAvailable:
                                true,

                            quantity: {
                                $gte:
                                    quantity
                            }
                        },

                        {
                            $inc: {
                                quantity:
                                    -quantity
                            }
                        },

                        {
                            new: true,
                            session
                        }
                    );


                if (!updatedProduct) {

                    throw new Error(
                        `${product.name} is no longer available in the requested quantity`
                    );
                }


                // ------------------------------------------
                // Automatically disable when stock reaches 0
                // ------------------------------------------

                if (
                    updatedProduct.quantity <= 0
                ) {

                    await Product.findByIdAndUpdate(

                        product._id,

                        {
                            $set: {
                                isAvailable:
                                    false
                            }
                        },

                        {
                            session
                        }
                    );
                }
            }


            // ==============================================
            // CREATE ORDER
            // ==============================================

            const newOrder =
                await Order.create(
                    [
                        {
                            customer:
                                customerId,

                            items:
                                orderItems,

                            deliveryAddress:
                                deliveryAddress.trim(),

                            phone:
                                typeof phone === "string"
                                    ? phone.trim()
                                    : "",

                            subtotal,

                            deliveryFee,

                            totalAmount,

                            paymentMethod,

                            paymentStatus:
                                "PENDING",

                            orderStatus:
                                "PLACED",

                            statusHistory: [
                                {
                                    status:
                                        "PLACED",

                                    updatedAt:
                                        new Date(),

                                    updatedBy:
                                        customerId
                                }
                            ]
                        }
                    ],
                    {
                        session
                    }
                );


            createdOrder =
                newOrder[0];


            // ==============================================
            // CLEAR CART
            // ==============================================

            cart.items = [];


            await cart.save({
                session
            });


            // ==============================================
            // COMMIT TRANSACTION
            // ==============================================

            await session.commitTransaction();

        } catch (error) {

            await session.abortTransaction();

            throw error;

        } finally {

            await session.endSession();
        }


        // ==================================================
        // RESPONSE
        // ==================================================

        res.status(201).json({

            success: true,

            message:
                "Order created successfully",

            order: {

                _id:
                    createdOrder._id,

                subtotal:
                    createdOrder.subtotal,

                deliveryFee:
                    createdOrder.deliveryFee,

                totalAmount:
                    createdOrder.totalAmount,

                paymentMethod:
                    createdOrder.paymentMethod,

                paymentStatus:
                    createdOrder.paymentStatus,

                orderStatus:
                    createdOrder.orderStatus,

                statusHistory:
                    createdOrder.statusHistory
            }
        });

    } catch (error) {

        console.error(
            "CREATE ORDER ERROR:"
        );

        console.error(error);


        // ------------------------------------------
        // Stock conflict
        // ------------------------------------------

        if (
            error.message?.includes(
                "no longer available"
            )
        ) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }


        res.status(500).json({

            success: false,

            message:
                "Failed to create order"

        });
    }
};


// ======================================================
// GET CUSTOMER ORDERS
// ======================================================

export const getCustomerOrders = async (
    req,
    res
) => {

    try {

        const customerId =
            req.user.id;


        const orders =
            await Order.find({
                customer:
                    customerId
            })
                .populate(
                    "items.product",
                    "name images price unit"
                )
                .sort({
                    createdAt: -1
                });


        res.status(200).json({

            success: true,

            count:
                orders.length,

            orders

        });

    } catch (error) {

        console.error(
            "GET CUSTOMER ORDERS ERROR:"
        );

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch customer orders"

        });
    }
};


// ======================================================
// GET CUSTOMER ORDER BY ID
// ======================================================

export const getCustomerOrderById = async (
    req,
    res
) => {

    try {

        const customerId =
            req.user.id;

        const { id } =
            req.params;


        // ==================================================
        // VALIDATE ORDER ID
        // ==================================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }


        const order =
            await Order.findOne({

                _id:
                    id,

                customer:
                    customerId

            })
                .populate(
                    "items.product",
                    "name images price unit"
                )
                .populate(
                    "items.farmer",
                    "name email phone"
                );


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

            });
        }


        res.status(200).json({

            success: true,

            order

        });

    } catch (error) {

        console.error(
            "GET CUSTOMER ORDER ERROR:"
        );

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch order"

        });
    }
};


// ======================================================
// CANCEL CUSTOMER ORDER
// ======================================================

export const cancelOrder = async (
    req,
    res
) => {

    const session =
        await mongoose.startSession();


    try {

        const customerId =
            req.user.id;

        const { id } =
            req.params;


        // ==================================================
        // VALIDATE ORDER ID
        // ==================================================

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }


        session.startTransaction();


        // ==================================================
        // FIND ORDER
        // ==================================================

        const order =
            await Order.findOne({

                _id:
                    id,

                customer:
                    customerId

            }).session(session);


        if (!order) {

            await session.abortTransaction();

            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

            });
        }


        // ==================================================
        // CHECK STATUS
        // ==================================================

        if (
            order.orderStatus !==
                "PLACED" &&
            order.orderStatus !==
                "CONFIRMED"
        ) {

            await session.abortTransaction();

            return res.status(400).json({

                success: false,

                message:
                    "This order cannot be cancelled now"

            });

        }


        // ==================================================
        // REMEMBER PAYMENT STATE
        // ==================================================

        const wasPaidRazorpay =
            order.paymentMethod === "RAZORPAY" &&
            order.paymentStatus === "PAID" &&
            Boolean(order.razorpayPaymentId);


        // ==================================================
        // RESTORE PRODUCT STOCK
        // ==================================================

        for (const item of order.items) {

            if (
                !item.product ||
                !mongoose.Types.ObjectId.isValid(
                    item.product
                )
            ) {
                continue;
            }


            const restoredProduct =
                await Product.findByIdAndUpdate(

                    item.product,

                    {
                        $inc: {
                            quantity:
                                item.quantity
                        },

                        $set: {
                            isAvailable:
                                true
                        }
                    },

                    {
                        new: true,
                        session
                    }
                );


            // Product may have been deleted.
            // The order remains cancelled even
            // if the original product no longer exists.

            if (!restoredProduct) {

                console.warn(
                    `Product ${item.product} no longer exists while restoring cancelled order ${order._id}`
                );

            }

        }


        // ==================================================
        // UPDATE ORDER STATUS
        // ==================================================

        order.orderStatus =
            "CANCELLED";


        // ==================================================
        // ADD CANCELLATION HISTORY
        // ==================================================

        if (!order.statusHistory) {
            order.statusHistory = [];
        }


        order.statusHistory.push({

            status:
                "CANCELLED",

            updatedAt:
                new Date(),

            updatedBy:
                customerId

        });


        // ==================================================
        // PAYMENT STATUS
        // ==================================================

        /*
         * Paid Razorpay orders remain PAID inside the
         * transaction.
         *
         * The real Razorpay refund is processed only
         * after the cancellation transaction commits.
         *
         * This prevents MongoDB from claiming that a
         * refund happened when Razorpay has not confirmed it.
         */

        if (!wasPaidRazorpay) {

            order.paymentStatus =
                "PENDING";

        }


        // ==================================================
        // SAVE ORDER
        // ==================================================

        await order.save({
            session
        });


        // ==================================================
        // COMMIT TRANSACTION
        // ==================================================

        await session.commitTransaction();


        // ==================================================
        // RAZORPAY REFUND
        // ==================================================

        let refundSuccessful = false;
        let refund = null;


        if (wasPaidRazorpay) {

            try {

                console.log(
                    `Processing Razorpay refund for order ${order._id}`
                );


                const refundAmount =
                    Math.round(
                        Number(order.totalAmount) * 100
                    );


                if (
                    !Number.isFinite(
                        refundAmount
                    ) ||
                    refundAmount <= 0
                ) {

                    throw new Error(
                        "Invalid Razorpay refund amount"
                    );

                }


                refund =
                    await Razorpay.payments.refund(

                        order.razorpayPaymentId,

                        {
                            amount:
                                refundAmount
                        }

                    );


                // ------------------------------------------
                // Update payment status only after successful
                // Razorpay refund
                // ------------------------------------------

                order.paymentStatus =
                    "REFUNDED";


                // ------------------------------------------
                // Save refund ID only if the schema supports it
                // ------------------------------------------

                if (
                    Object.prototype.hasOwnProperty.call(
                        order.toObject(),
                        "razorpayRefundId"
                    )
                ) {

                    order.razorpayRefundId =
                        refund.id;

                }


                await order.save();


                refundSuccessful = true;


                console.log(
                    `Razorpay refund successful for order ${order._id}`
                );

            } catch (refundError) {

                console.error(
                    "RAZORPAY REFUND ERROR:"
                );

                console.error(
                    refundError
                );

                /*
                 * The order is already safely cancelled.
                 *
                 * We intentionally keep paymentStatus as PAID
                 * because Razorpay did not confirm the refund.
                 *
                 * The existing /payment/refund endpoint can
                 * be used to retry the refund.
                 */

            }

        }


        // ==================================================
        // SOCKET.IO UPDATE
        // ==================================================

        try {

            await order.populate([
                {
                    path:
                        "customer",

                    select:
                        "name email phone address"
                },

                {
                    path:
                        "items.product",

                    select:
                        "name images price unit farmer"
                },

                {
                    path:
                        "items.farmer",

                    select:
                        "name email phone address"
                }
            ]);


            emitOrderStatusUpdate(
                order._id,
                order
            );

        } catch (socketError) {

            console.error(
                "CANCEL ORDER SOCKET ERROR:",
                socketError
            );

        }


        // ==================================================
        // RESPONSE
        // ==================================================

        if (
            wasPaidRazorpay &&
            !refundSuccessful
        ) {

            return res.status(200).json({

                success: true,

                message:
                    "Order cancelled successfully. Razorpay refund is pending and can be retried.",

                refundPending:
                    true,

                order

            });

        }


        return res.status(200).json({

            success: true,

            message:
                wasPaidRazorpay
                    ? "Order cancelled and payment refunded successfully"
                    : "Order cancelled successfully",

            refundPending:
                false,

            order

        });


    } catch (error) {

        if (
            session.inTransaction()
        ) {

            await session.abortTransaction();

        }


        console.error(
            "CANCEL ORDER ERROR:"
        );

        console.error(error);


        res.status(500).json({

            success: false,

            message:
                "Failed to cancel order"

        });

    } finally {

        await session.endSession();

    }

};