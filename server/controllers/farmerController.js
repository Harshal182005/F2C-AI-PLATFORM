import Product from "../models/Product.js";
import Order from "../models/Order.js";


// ======================================================
// FARMER ANALYTICS DASHBOARD
// ======================================================

export const getFarmerAnalytics = async (req, res) => {
    try {
        const farmerId = req.user.id;

        // ==================================================
        // TOTAL PRODUCTS
        // ==================================================

        const totalProducts =
            await Product.countDocuments({
                farmer: farmerId
            });

        // ==================================================
        // AVAILABLE PRODUCTS
        // ==================================================

        const availableProducts =
            await Product.countDocuments({
                farmer: farmerId,
                isAvailable: true,
                quantity: { $gt: 0 }
            });

        // ==================================================
        // GET ORDERS CONTAINING FARMER PRODUCTS
        // ==================================================

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

        // ==================================================
        // VARIABLES
        // ==================================================

        let totalRevenue = 0;

        let deliveredRevenue = 0;

        let totalItemsSold = 0;

        // ==================================================
        // ORDER STATUS
        // ==================================================

        const orderStatus = {
            PLACED: 0,
            CONFIRMED: 0,
            PROCESSING: 0,
            PACKED: 0,
            OUT_FOR_DELIVERY: 0,
            DELIVERED: 0,
            CANCELLED: 0
        };

        // ==================================================
        // PRODUCT SALES
        // ==================================================

        const productSales = {};

        // ==================================================
        // MONTHLY REVENUE
        // ==================================================

        const monthlyRevenue = {};

        // ==================================================
        // PROCESS ORDERS
        // ==================================================

        orders.forEach((order) => {
            const status = order.orderStatus;

            // ----------------------------------------------
            // ORDER STATUS COUNT
            // ----------------------------------------------

            if (
                orderStatus[status] !== undefined
            ) {
                orderStatus[status]++;
            }

            // ----------------------------------------------
            // PROCESS ONLY FARMER ITEMS
            // ----------------------------------------------

            const farmerItems =
                order.items.filter(
                    (item) =>
                        item.farmer?.toString() ===
                        farmerId.toString()
                );

            farmerItems.forEach((item) => {
                const quantity =
                    Number(item.quantity) || 0;

                const price =
                    Number(item.price) || 0;

                const subtotal =
                    Number(item.subtotal) ||
                    price * quantity;

                // ------------------------------------------
                // ITEMS SOLD
                // ------------------------------------------

                // Cancelled orders should not count
                // as completed sales.
                if (status !== "CANCELLED") {
                    totalItemsSold += quantity;
                }

                // ------------------------------------------
                // TOTAL REVENUE
                // ------------------------------------------

                if (status !== "CANCELLED") {
                    totalRevenue += subtotal;
                }

                // ------------------------------------------
                // DELIVERED REVENUE
                // ------------------------------------------

                if (status === "DELIVERED") {
                    deliveredRevenue += subtotal;
                }

                // ------------------------------------------
                // TOP PRODUCTS
                // ------------------------------------------

                if (status !== "CANCELLED") {
                    const productId =
                        item.product?.toString() ||
                        item.productName;

                    if (
                        !productSales[productId]
                    ) {
                        productSales[
                            productId
                        ] = {
                            productId,

                            name:
                                item.productName ||
                                "Unknown Product",

                            quantity: 0,

                            revenue: 0
                        };
                    }

                    productSales[
                        productId
                    ].quantity += quantity;

                    productSales[
                        productId
                    ].revenue += subtotal;
                }

                // ------------------------------------------
                // MONTHLY REVENUE
                // ------------------------------------------

                if (status !== "CANCELLED") {
                    const date =
                        new Date(
                            order.createdAt
                        );

                    const year =
                        date.getFullYear();

                    const month =
                        date.getMonth();

                    const monthKey =
                        `${year}-${String(
                            month + 1
                        ).padStart(2, "0")}`;

                    if (
                        !monthlyRevenue[
                            monthKey
                        ]
                    ) {
                        monthlyRevenue[
                            monthKey
                        ] = {
                            year,
                            month,
                            revenue: 0
                        };
                    }

                    monthlyRevenue[
                        monthKey
                    ].revenue += subtotal;
                }
            });
        });

        // ==================================================
        // ACTIVE ORDERS
        // ==================================================

        const activeOrderStatuses = [
            "PLACED",
            "CONFIRMED",
            "PROCESSING",
            "PACKED",
            "OUT_FOR_DELIVERY"
        ];

        const activeOrders =
            orders.filter((order) =>
                activeOrderStatuses.includes(
                    order.orderStatus
                )
            ).length;

        // ==================================================
        // TOP PRODUCTS
        // ==================================================

        const topProducts =
            Object.values(productSales)
                .sort(
                    (a, b) =>
                        b.revenue -
                        a.revenue
                )
                .slice(0, 5);

        // ==================================================
        // REVENUE CHART
        // ==================================================

        const revenueChart =
            Object.entries(monthlyRevenue)
                .sort(
                    ([a], [b]) =>
                        a.localeCompare(b)
                )
                .map(
                    ([monthKey, data]) => {
                        const date =
                            new Date(
                                data.year,
                                data.month
                            );

                        return {
                            month:
                                date.toLocaleString(
                                    "en-IN",
                                    {
                                        month: "short",
                                        year: "numeric"
                                    }
                                ),

                            date:
                                date.toLocaleString(
                                    "en-IN",
                                    {
                                        month: "short"
                                    }
                                ),

                            revenue:
                                Math.round(
                                    data.revenue
                                )
                        };
                    }
                );

        // ==================================================
        // RECENT ORDERS
        // ==================================================

        const recentOrders =
            orders
                .slice(0, 8)
                .map((order) => {
                    const farmerItems =
                        order.items.filter(
                            (item) =>
                                item.farmer
                                    ?.toString() ===
                                farmerId.toString()
                        );

                    const farmerSubtotal =
                        farmerItems.reduce(
                            (
                                total,
                                item
                            ) =>
                                total +
                                (
                                    Number(
                                        item.subtotal
                                    ) ||
                                    (
                                        Number(
                                            item.price
                                        ) *
                                        Number(
                                            item.quantity
                                        )
                                    )
                                ),
                            0
                        );

                    const totalItems =
                        farmerItems.reduce(
                            (
                                total,
                                item
                            ) =>
                                total +
                                (
                                    Number(
                                        item.quantity
                                    ) || 0
                                ),
                            0
                        );

                    return {
                        _id: order._id,

                        customer:
                            order.customer,

                        orderStatus:
                            order.orderStatus,

                        paymentMethod:
                            order.paymentMethod,

                        paymentStatus:
                            order.paymentStatus,

                        deliveryAddress:
                            order.deliveryAddress,

                        phone:
                            order.phone,

                        createdAt:
                            order.createdAt,

                        updatedAt:
                            order.updatedAt,

                        items:
                            farmerItems,

                        totalItems,

                        itemCount:
                            farmerItems.length,

                        farmerSubtotal
                    };
                });

        // ==================================================
        // RESPONSE
        // ==================================================

        res.status(200).json({
            success: true,

            analytics: {
                totalProducts,

                availableProducts,

                totalOrders:
                    orders.length,

                activeOrders,

                totalItemsSold,

                totalRevenue:
                    Math.round(
                        totalRevenue
                    ),

                deliveredRevenue:
                    Math.round(
                        deliveredRevenue
                    ),

                deliveredOrders:
                    orderStatus.DELIVERED,

                cancelledOrders:
                    orderStatus.CANCELLED,

                orderStatus,

                topProducts,

                revenueChart,

                recentOrders
            }
        });

    } catch (error) {
        console.error(
            "FARMER ANALYTICS ERROR:",
            error
        );

        res.status(500).json({
            success: false,

            message:
                error.message ||
                "Failed to fetch farmer analytics"
        });
    }
};