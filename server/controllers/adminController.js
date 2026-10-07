import mongoose from "mongoose";

import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

import { emitOrderStatusUpdate } from "../services/socketService.js";


// ======================================================
// ADMIN DASHBOARD
// ======================================================

export const getAdminDashboardStats = async (req, res) => {
    try {

        // ==========================================
        // TOTAL FARMERS
        // ==========================================

        const totalFarmers =
            await User.countDocuments({
                role: "farmer"
            });


        // ==========================================
        // TOTAL CUSTOMERS
        // ==========================================

        const totalCustomers =
            await User.countDocuments({
                role: "customer"
            });


        // ==========================================
        // TOTAL PRODUCTS
        // ==========================================

        const totalProducts =
            await Product.countDocuments();


        // ==========================================
        // AVAILABLE PRODUCTS
        // ==========================================

        const availableProducts =
            await Product.countDocuments({
                isAvailable: true,
                quantity: {
                    $gt: 0
                }
            });


        // ==========================================
        // TOTAL ORDERS
        // ==========================================

        const totalOrders =
            await Order.countDocuments();


        // ==========================================
        // ACTIVE ORDERS
        // ==========================================

        const activeOrders =
            await Order.countDocuments({
                orderStatus: {
                    $in: [
                        "PLACED",
                        "CONFIRMED",
                        "PROCESSING",
                        "PACKED",
                        "OUT_FOR_DELIVERY"
                    ]
                }
            });


        // ==========================================
        // DELIVERED ORDERS
        // ==========================================

        const deliveredOrders =
            await Order.countDocuments({
                orderStatus: "DELIVERED"
            });


        // ==========================================
        // CANCELLED ORDERS
        // ==========================================

        const cancelledOrders =
            await Order.countDocuments({
                orderStatus: "CANCELLED"
            });


        // ==========================================
        // TOTAL REVENUE
        // ==========================================

        const revenueResult =
            await Order.aggregate([
                {
                    $match: {
                        orderStatus: {
                            $ne: "CANCELLED"
                        }
                    }
                },

                {
                    $group: {
                        _id: null,

                        totalRevenue: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]);


        const totalRevenue =
            revenueResult.length > 0
                ? revenueResult[0].totalRevenue
                : 0;


        // ==========================================
        // DELIVERED REVENUE
        // ==========================================

        const deliveredRevenueResult =
            await Order.aggregate([
                {
                    $match: {
                        orderStatus: "DELIVERED"
                    }
                },

                {
                    $group: {
                        _id: null,

                        deliveredRevenue: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]);


        const deliveredRevenue =
            deliveredRevenueResult.length > 0
                ? deliveredRevenueResult[0].deliveredRevenue
                : 0;


        // ==========================================
        // ORDER STATUS STATISTICS
        // ==========================================

        const orderStatusResult =
            await Order.aggregate([
                {
                    $group: {
                        _id: "$orderStatus",

                        count: {
                            $sum: 1
                        }
                    }
                }
            ]);


        const orderStatus = {
            PLACED: 0,
            CONFIRMED: 0,
            PROCESSING: 0,
            PACKED: 0,
            OUT_FOR_DELIVERY: 0,
            DELIVERED: 0,
            CANCELLED: 0
        };


        orderStatusResult.forEach((item) => {

            if (
                orderStatus[item._id] !== undefined
            ) {
                orderStatus[item._id] =
                    item.count;
            }

        });


        // ==========================================
        // RECENT ORDERS
        // ==========================================

        const recentOrders =
            await Order.find()
                .populate(
                    "customer",
                    "name email phone"
                )
                .populate(
                    "items.farmer",
                    "name email"
                )
                .sort({
                    createdAt: -1
                })
                .limit(8)
                .select(
                    "_id customer items totalAmount subtotal deliveryFee paymentMethod paymentStatus orderStatus createdAt"
                );


        // ==========================================
        // RECENT FARMERS
        // ==========================================

        const recentFarmers =
            await User.find({
                role: "farmer"
            })
                .select(
                    "name email phone isBlocked createdAt"
                )
                .sort({
                    createdAt: -1
                })
                .limit(5);


        // ==========================================
        // RECENT CUSTOMERS
        // ==========================================

        const recentCustomers =
            await User.find({
                role: "customer"
            })
                .select(
                    "name email phone isBlocked createdAt"
                )
                .sort({
                    createdAt: -1
                })
                .limit(5);


        // ==========================================
        // RESPONSE
        // ==========================================

        res.status(200).json({

            success: true,

            stats: {

                totalFarmers,

                totalCustomers,

                totalProducts,

                availableProducts,

                totalOrders,

                activeOrders,

                deliveredOrders,

                cancelledOrders,

                totalRevenue:
                    Math.round(totalRevenue),

                deliveredRevenue:
                    Math.round(deliveredRevenue)

            },

            orderStatus,

            recentOrders,

            recentFarmers,

            recentCustomers

        });


    } catch (error) {

        console.error(
            "ADMIN DASHBOARD ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch dashboard statistics"

        });

    }
};


// ======================================================
// GET ALL FARMERS
// ======================================================

export const getAllFarmers = async (req, res) => {
    try {

        const farmers =
            await User.find({
                role: "farmer"
            })
                .select("-password")
                .sort({
                    createdAt: -1
                });


        res.status(200).json({
            success: true,
            count: farmers.length,
            farmers
        });

    } catch (error) {

        console.error(
            "GET FARMERS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch farmers"
        });

    }
};


// ======================================================
// BLOCK / UNBLOCK FARMER
// ======================================================

export const toggleFarmerBlock = async (req, res) => {
    try {

        const { id } = req.params;


        // ------------------------------------------
        // Validate ID
        // ------------------------------------------

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid farmer ID"
            });
        }


        const farmer =
            await User.findOne({
                _id: id,
                role: "farmer"
            });


        if (!farmer) {

            return res.status(404).json({
                success: false,
                message: "Farmer not found"
            });

        }


        farmer.isBlocked =
            !farmer.isBlocked;


        await farmer.save();


        res.status(200).json({
            success: true,

            message: farmer.isBlocked
                ? "Farmer blocked successfully"
                : "Farmer unblocked successfully",

            farmer: {
                id: farmer._id,
                name: farmer.name,
                email: farmer.email,
                isBlocked: farmer.isBlocked
            }
        });

    } catch (error) {

        console.error(
            "TOGGLE FARMER BLOCK ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update farmer status"
        });

    }
};


// ======================================================
// DELETE FARMER
// ======================================================

export const deleteFarmer = async (req, res) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid farmer ID"
            });
        }


        const farmer =
            await User.findOne({
                _id: id,
                role: "farmer"
            });


        if (!farmer) {

            return res.status(404).json({
                success: false,
                message: "Farmer not found"
            });

        }


        // ------------------------------------------
        // Prevent deletion if farmer has products
        // ------------------------------------------

        const productCount =
            await Product.countDocuments({
                farmer: id
            });


        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete farmer while products are associated with this account"
            });
        }


        await User.findByIdAndDelete(id);


        res.status(200).json({
            success: true,
            message:
                "Farmer deleted successfully"
        });

    } catch (error) {

        console.error(
            "DELETE FARMER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete farmer"
        });

    }
};


// ======================================================
// GET ALL CUSTOMERS
// ======================================================

export const getAllCustomers = async (req, res) => {
    try {

        const customers =
            await User.find({
                role: "customer"
            })
                .select("-password")
                .sort({
                    createdAt: -1
                });


        res.status(200).json({
            success: true,
            count: customers.length,
            customers
        });

    } catch (error) {

        console.error(
            "GET CUSTOMERS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch customers"
        });

    }
};


// ======================================================
// BLOCK / UNBLOCK CUSTOMER
// ======================================================

export const toggleCustomerBlock = async (
    req,
    res
) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }


        const customer =
            await User.findOne({
                _id: id,
                role: "customer"
            });


        if (!customer) {

            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });

        }


        customer.isBlocked =
            !customer.isBlocked;


        await customer.save();


        res.status(200).json({
            success: true,

            message: customer.isBlocked
                ? "Customer blocked successfully"
                : "Customer unblocked successfully",

            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                isBlocked: customer.isBlocked
            }
        });

    } catch (error) {

        console.error(
            "TOGGLE CUSTOMER BLOCK ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update customer status"
        });

    }
};


// ======================================================
// DELETE CUSTOMER
// ======================================================

export const deleteCustomer = async (req, res) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }


        const customer =
            await User.findOne({
                _id: id,
                role: "customer"
            });


        if (!customer) {

            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });

        }


        // ------------------------------------------
        // Prevent deletion if customer has orders
        // ------------------------------------------

        const orderCount =
            await Order.countDocuments({
                customer: id
            });


        if (orderCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete customer while orders are associated with this account"
            });
        }


        await User.findByIdAndDelete(id);


        res.status(200).json({
            success: true,
            message:
                "Customer deleted successfully"
        });

    } catch (error) {

        console.error(
            "DELETE CUSTOMER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete customer"
        });

    }
};


// ======================================================
// GET ALL PRODUCTS
// ======================================================

export const getAllProducts = async (req, res) => {
    try {

        const products =
            await Product.find()
                .populate(
                    "farmer",
                    "name email phone"
                )
                .sort({
                    createdAt: -1
                });


        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {

        console.error(
            "GET ADMIN PRODUCTS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch products"
        });

    }
};


// ======================================================
// DELETE PRODUCT
// ======================================================

export const deleteProduct = async (req, res) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }


        const product =
            await Product.findById(id);


        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        // ------------------------------------------
        // Prevent deleting product already present
        // in existing orders
        // ------------------------------------------

        const orderCount =
            await Order.countDocuments({
                "items.product": id
            });


        if (orderCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete a product that is already part of an order"
            });
        }


        await Product.findByIdAndDelete(id);


        res.status(200).json({
            success: true,
            message:
                "Product deleted successfully"
        });

    } catch (error) {

        console.error(
            "ADMIN DELETE PRODUCT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete product"
        });

    }
};


// ======================================================
// TOGGLE PRODUCT AVAILABILITY
// ======================================================

export const toggleProductAvailability = async (
    req,
    res
) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }


        const product =
            await Product.findById(id);


        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        // ------------------------------------------
        // Don't enable products with zero stock
        // ------------------------------------------

        if (
            !product.isAvailable &&
            Number(product.quantity) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product cannot be enabled because stock is zero"
            });
        }


        product.isAvailable =
            !product.isAvailable;


        await product.save();


        res.status(200).json({
            success: true,

            message: product.isAvailable
                ? "Product enabled successfully"
                : "Product disabled successfully",

            product: {
                id: product._id,
                name: product.name,
                isAvailable:
                    product.isAvailable
            }
        });

    } catch (error) {

        console.error(
            "TOGGLE PRODUCT AVAILABILITY ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update product availability"
        });

    }
};


// ======================================================
// GET ALL ORDERS
// ======================================================

export const getAllOrders = async (req, res) => {
    try {

        const orders =
            await Order.find()
                .populate(
                    "customer",
                    "name email phone address"
                )
                .populate(
                    "items.farmer",
                    "name email phone"
                )
                .sort({
                    createdAt: -1
                });


        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {

        console.error(
            "GET ADMIN ORDERS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch orders"
        });

    }
};


// ======================================================
// GET SINGLE ORDER
// ======================================================

export const getAdminOrderById = async (
    req,
    res
) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }


        const order =
            await Order.findById(id)
                .populate(
                    "customer",
                    "name email phone address"
                )
                .populate(
                    "items.farmer",
                    "name email phone"
                )
                .populate(
                    "items.product",
                    "name category images"
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
            "GET ADMIN ORDER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch order"
        });

    }
};


// ======================================================
// UPDATE ADMIN ORDER STATUS
// ======================================================

export const updateAdminOrderStatus = async (
    req,
    res
) => {
    try {

        const { id } = req.params;

        const { status } =
            req.body || {};


        // ------------------------------------------
        // Validate order ID
        // ------------------------------------------

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }


        // ------------------------------------------
        // Validate status
        // ------------------------------------------

        const allowedStatuses = [
            "PLACED",
            "CONFIRMED",
            "PROCESSING",
            "PACKED",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED"
        ];


        if (
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order status"
            });
        }


        // ------------------------------------------
        // Find order
        // ------------------------------------------

        const order =
            await Order.findById(id);


        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }


        // ------------------------------------------
        // Prevent unnecessary update
        // ------------------------------------------

        if (
            order.orderStatus ===
            status
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Order is already ${status}`
            });
        }


        // ------------------------------------------
        // Update status
        // ------------------------------------------

        order.orderStatus =
            status;


        // ------------------------------------------
        // Status history
        // ------------------------------------------

        if (!order.statusHistory) {
            order.statusHistory = [];
        }


        order.statusHistory.push({
            status,
            updatedAt: new Date(),
            updatedBy: req.user.id
        });


        // ------------------------------------------
        // Save
        // ------------------------------------------

        await order.save();


        // ------------------------------------------
        // Populate for Socket.IO
        // ------------------------------------------

        await order.populate([
            {
                path: "customer",
                select:
                    "name email phone address"
            },
            {
                path: "items.product",
                select:
                    "name images price unit farmer"
            },
            {
                path: "items.farmer",
                select:
                    "name email phone address"
            }
        ]);


        // ------------------------------------------
        // REAL-TIME UPDATE
        // ------------------------------------------

        emitOrderStatusUpdate(
            order._id,
            order
        );


        // ------------------------------------------
        // Response
        // ------------------------------------------

        res.status(200).json({

            success: true,

            message:
                "Order status updated successfully",

            order: {
                id: order._id,

                orderStatus:
                    order.orderStatus
            }

        });

    } catch (error) {

        console.error(
            "ADMIN UPDATE ORDER STATUS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update order status"
        });

    }
};