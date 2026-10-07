import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";


import {
    addProduct,
    getFarmerProducts,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
} from "../controllers/productController.js";

const router = express.Router();


// FARMER
router.get(
    "/farmer/my-products",
    authMiddleware,
    roleMiddleware("farmer"),
    getFarmerProducts
);

router.post(
    "/",
    authMiddleware,
    roleMiddleware("farmer"),
    upload.array("images", 5),
    addProduct
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("farmer"),
    updateProduct
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("farmer"),
    deleteProduct
);


// PUBLIC
router.get("/", getAllProducts);

router.get("/:id", getProductById);

export default router;