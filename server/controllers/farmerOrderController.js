import Order from "../models/Order.js";
import { emitOrderStatusUpdate } from "../services/socketService.js";

// ======================================================
// GET FARMER ORDERS
// ======================================================

export const getFarmerOrders = async (req, res) => {
    try {
        const farmerId = req.user.id;

        const orders = await Order.find({
            "items.farmer": farmerId
        })
            .populate(
                "customer",
                "name email phone address"
            )
            .sort({
                createdAt: -1
            });

        const farmerOrders = orders.map((order) => {
            const farmerItems = order.items.filter(
                (item) =>
                    item.farmer.toString() ===
                    farmerId.toString()
            );

            const farmerSubtotal = farmerItems.reduce(
                (total, item) =>
                    total + item.subtotal,
                0
            );

            return {
                _id: order._id,

                customer: order.customer,

                deliveryAddress:
                    order.deliveryAddress,

                phone: order.phone,

                paymentMethod:
                    order.paymentMethod,

                paymentStatus:
                    order.paymentStatus,

                orderStatus:
                    order.orderStatus,

                statusHistory:
                    order.statusHistory || [],

                createdAt:
                    order.createdAt,

                updatedAt:
                    order.updatedAt,

                items: farmerItems,

                farmerSubtotal
            };
        });

        res.status(200).json({
            success: true,
            count: farmerOrders.length,
            orders: farmerOrders
        });

    } catch (error) {
        console.error(
            "FARMER ORDERS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch farmer orders"
        });
    }
};


// ======================================================
// GET FARMER ORDER BY ID
// ======================================================

export const getFarmerOrderById = async (
    req,
    res
) => {
    try {
        const farmerId = req.user.id;

        const { id } = req.params;

        const order = await Order.findOne({
            _id: id,
            "items.farmer": farmerId
        }).populate(
            "customer",
            "name email phone address"
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const farmerItems =
            order.items.filter(
                (item) =>
                    item.farmer.toString() ===
                    farmerId.toString()
            );

        const farmerSubtotal =
            farmerItems.reduce(
                (total, item) =>
                    total + item.subtotal,
                0
            );

        res.status(200).json({
            success: true,

            order: {
                _id: order._id,

                customer: order.customer,

                deliveryAddress:
                    order.deliveryAddress,

                phone: order.phone,

                paymentMethod:
                    order.paymentMethod,

                paymentStatus:
                    order.paymentStatus,

                orderStatus:
                    order.orderStatus,

                statusHistory:
                    order.statusHistory || [],

                createdAt:
                    order.createdAt,

                updatedAt:
                    order.updatedAt,

                items: farmerItems,

                farmerSubtotal
            }
        });

    } catch (error) {
        console.error(
            "GET FARMER ORDER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch farmer order"
        });
    }
};


// ======================================================
// UPDATE FARMER ORDER STATUS
// ======================================================

export const updateFarmerOrderStatus = async (
    req,
    res
) => {
    try {
        const farmerId = req.user.id;

        const { id } = req.params;

        const { status } = req.body || {};

        // ------------------------------------------------
        // Validate status
        // ------------------------------------------------

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Order status is required"
            });
        }


        // ------------------------------------------------
        // Allowed statuses
        // ------------------------------------------------

        const allowedStatuses = [
            "CONFIRMED",
            "PROCESSING",
            "PACKED",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }


        // ------------------------------------------------
        // Find order belonging to farmer
        // ------------------------------------------------

        const order = await Order.findOne({
            _id: id,
            "items.farmer": farmerId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }


        // ------------------------------------------------
        // Status transition rules
        // ------------------------------------------------

        const currentStatus =
            order.orderStatus;

        const statusFlow = {
            PLACED: [
                "CONFIRMED",
                "CANCELLED"
            ],

            CONFIRMED: [
                "PROCESSING",
                "CANCELLED"
            ],

            PROCESSING: [
                "PACKED"
            ],

            PACKED: [
                "OUT_FOR_DELIVERY"
            ],

            OUT_FOR_DELIVERY: [
                "DELIVERED"
            ],

            // Backward compatibility
            // for older orders.
            SHIPPED: [
                "OUT_FOR_DELIVERY",
                "DELIVERED"
            ],

            DELIVERED: [],

            CANCELLED: []
        };


        // ------------------------------------------------
        // Validate status transition
        // ------------------------------------------------

        if (
            !statusFlow[currentStatus]?.includes(
                status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot change order status from ${currentStatus} to ${status}`
            });
        }


        // ------------------------------------------------
        // Update order status
        // ------------------------------------------------

        order.orderStatus = status;


        // ------------------------------------------------
        // Add status history
        // ------------------------------------------------

        if (!order.statusHistory) {
            order.statusHistory = [];
        }

        order.statusHistory.push({
            status,
            updatedAt: new Date(),
            updatedBy: farmerId
        });


        // ------------------------------------------------
        // Save order
        // ------------------------------------------------

        await order.save();


        // ------------------------------------------------
        // Populate order before Socket.IO emission
        // ------------------------------------------------

        await order.populate([
            {
                path: "customer",
                select: "name email phone address"
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


        // ------------------------------------------------
        // REAL-TIME SOCKET.IO UPDATE
        // ------------------------------------------------
        // Customer OrderDetails.jsx has already joined:
        //
        // order_<orderId>
        //
        // Example:
        // order_6ac529da26eefddef92307dd
        //
        // This sends the updated order only to
        // customers watching this particular order.
        // ------------------------------------------------

        emitOrderStatusUpdate(
            order._id,
            order
        );


        // ------------------------------------------------
        // Response
        // ------------------------------------------------

        res.status(200).json({
            success: true,

            message:
                `Order status updated to ${status}`,

            orderStatus:
                order.orderStatus,

            statusHistory:
                order.statusHistory
        });

    } catch (error) {
        console.error(
            "UPDATE FARMER ORDER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to update order status"
        });
    }
};