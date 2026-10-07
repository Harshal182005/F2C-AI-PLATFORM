import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    getAdminDashboardStats,

    getAllFarmers,
    toggleFarmerBlock,
    deleteFarmer,

    getAllCustomers,
    toggleCustomerBlock,
    deleteCustomer,

    getAllProducts,
    deleteProduct,
    toggleProductAvailability,

    getAllOrders,
    getAdminOrderById,
    updateAdminOrderStatus

} from "../controllers/adminController.js";

const router = express.Router();


// ==========================================
// ADMIN DASHBOARD
// ==========================================

router.get(
    "/dashboard",
    authMiddleware,
    roleMiddleware("admin"),
    getAdminDashboardStats
);


// ==========================================
// FARMER MANAGEMENT
// ==========================================

router.get(
    "/farmers",
    authMiddleware,
    roleMiddleware("admin"),
    getAllFarmers
);

router.put(
    "/farmers/:id/toggle-block",
    authMiddleware,
    roleMiddleware("admin"),
    toggleFarmerBlock
);

router.delete(
    "/farmers/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteFarmer
);


// ==========================================
// CUSTOMER MANAGEMENT
// ==========================================

router.get(
    "/customers",
    authMiddleware,
    roleMiddleware("admin"),
    getAllCustomers
);

router.put(
    "/customers/:id/toggle-block",
    authMiddleware,
    roleMiddleware("admin"),
    toggleCustomerBlock
);

router.delete(
    "/customers/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteCustomer
);


// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

router.get(
    "/products",
    authMiddleware,
    roleMiddleware("admin"),
    getAllProducts
);

router.put(
    "/products/:id/toggle-availability",
    authMiddleware,
    roleMiddleware("admin"),
    toggleProductAvailability
);

router.delete(
    "/products/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteProduct
);


// ==========================================
// ORDER MANAGEMENT
// ==========================================

router.get(
    "/orders",
    authMiddleware,
    roleMiddleware("admin"),
    getAllOrders
);

router.get(
    "/orders/:id",
    authMiddleware,
    roleMiddleware("admin"),
    getAdminOrderById
);

router.put(
    "/orders/:id/status",
    authMiddleware,
    roleMiddleware("admin"),
    updateAdminOrderStatus
);


export default router;