import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";


// ==========================================
// POPULATE CART
// ==========================================

const populateCart = (cartId) => {
    return Cart.findById(cartId).populate({
        path: "items.product",
        populate: {
            path: "farmer",
            select: "name email phone address"
        }
    });
};


// ==========================================
// GET CART
// ==========================================

export const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({
            customer: req.user.id
        }).populate({
            path: "items.product",
            populate: {
                path: "farmer",
                select: "name email phone address"
            }
        });

        if (!cart) {
            cart = await Cart.create({
                customer: req.user.id,
                items: []
            });
        }

        res.status(200).json({
            success: true,
            cart
        });

    } catch (error) {
        console.error("GET CART ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch cart"
        });
    }
};


// ==========================================
// ADD TO CART
// ==========================================

export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const numericQuantity = Number(quantity);

        if (
            !Number.isFinite(numericQuantity) ||
            numericQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1"
            });
        }

        const product =
            await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (
            !product.isAvailable ||
            product.quantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product is currently unavailable"
            });
        }

        if (numericQuantity > product.quantity) {
            return res.status(400).json({
                success: false,
                message:
                    `Only ${product.quantity} ${product.unit} available`
            });
        }

        let cart =
            await Cart.findOne({
                customer: req.user.id
            });

        if (!cart) {
            cart = await Cart.create({
                customer: req.user.id,
                items: []
            });
        }

        const existingItem =
            cart.items.find(
                (item) =>
                    item.product.toString() ===
                    productId
            );

        if (existingItem) {
            const newQuantity =
                existingItem.quantity +
                numericQuantity;

            if (newQuantity > product.quantity) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Only ${product.quantity} ${product.unit} available`
                });
            }

            existingItem.quantity =
                newQuantity;

        } else {
            cart.items.push({
                product: productId,
                quantity: numericQuantity
            });
        }

        await cart.save();

        const updatedCart =
            await populateCart(cart._id);

        res.status(200).json({
            success: true,
            message: "Product added to cart",
            cart: updatedCart
        });

    } catch (error) {
        console.error(
            "ADD TO CART ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to add product to cart"
        });
    }
};


// ==========================================
// UPDATE CART ITEM
// ==========================================

export const updateCartItem = async (
    req,
    res
) => {
    try {
        const { productId } =
            req.params;

        const { quantity } =
            req.body;

        if (
            !mongoose.Types.ObjectId.isValid(
                productId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const numericQuantity =
            Number(quantity);

        if (
            !Number.isFinite(
                numericQuantity
            ) ||
            numericQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be at least 1"
            });
        }

        const product =
            await Product.findById(
                productId
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (
            !product.isAvailable ||
            product.quantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product is currently unavailable"
            });
        }

        if (
            numericQuantity >
            product.quantity
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Only ${product.quantity} ${product.unit} available`
            });
        }

        const cart =
            await Cart.findOne({
                customer: req.user.id
            });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const item =
            cart.items.find(
                (item) =>
                    item.product.toString() ===
                    productId
            );

        if (!item) {
            return res.status(404).json({
                success: false,
                message:
                    "Product is not in cart"
            });
        }

        item.quantity =
            numericQuantity;

        await cart.save();

        const updatedCart =
            await populateCart(
                cart._id
            );

        res.status(200).json({
            success: true,
            message:
                "Cart updated successfully",
            cart: updatedCart
        });

    } catch (error) {
        console.error(
            "UPDATE CART ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update cart"
        });
    }
};


// ==========================================
// REMOVE FROM CART
// ==========================================

export const removeFromCart = async (
    req,
    res
) => {
    try {
        const { productId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                productId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const cart =
            await Cart.findOne({
                customer: req.user.id
            });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const originalLength =
            cart.items.length;

        cart.items =
            cart.items.filter(
                (item) =>
                    item.product.toString() !==
                    productId
            );

        if (
            cart.items.length ===
            originalLength
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Product is not in cart"
            });
        }

        await cart.save();

        const updatedCart =
            await populateCart(
                cart._id
            );

        res.status(200).json({
            success: true,
            message:
                "Product removed from cart",
            cart: updatedCart
        });

    } catch (error) {
        console.error(
            "REMOVE CART ITEM ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to remove product"
        });
    }
};


// ==========================================
// CLEAR CART
// ==========================================

export const clearCart = async (
    req,
    res
) => {
    try {
        const cart =
            await Cart.findOne({
                customer: req.user.id
            });

        if (!cart) {
            return res.status(200).json({
                success: true,
                message:
                    "Cart already empty"
            });
        }

        cart.items = [];

        await cart.save();

        res.status(200).json({
            success: true,
            message:
                "Cart cleared successfully"
        });

    } catch (error) {
        console.error(
            "CLEAR CART ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to clear cart"
        });
    }
};