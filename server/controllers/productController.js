import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";


// ==========================================
// OPTIONAL SERVER-SIDE CLOUDINARY UPLOAD
// ==========================================

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder: "f2c-products"
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

        uploadStream.end(fileBuffer);
    });
};


// ==========================================
// ADD PRODUCT
// ==========================================

export const addProduct = async (req, res) => {
    try {
        console.log("FILES RECEIVED:", req.files);
        console.log("BODY RECEIVED:", req.body);
        const {
            name,
            category,
            description,
            price,
            quantity,
            unit,
            images,
            location,
            isOrganic,
            isAvailable
        } = req.body;

        // ==========================================
        // REQUIRED FIELD VALIDATION
        // ==========================================

        if (
            !name ||
            !name.trim() ||
            !category ||
            !category.trim() ||
            price === undefined ||
            quantity === undefined ||
            !unit ||
            !unit.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Required product fields are missing"
            });
        }

        const numericPrice = Number(price);
        const numericQuantity = Number(quantity);

        if (
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid non-negative number"
            });
        }

        if (
            !Number.isFinite(numericQuantity) ||
            numericQuantity < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a valid non-negative number"
            });
        }

        // ==========================================
        // PRODUCT IMAGES
        // ==========================================

        let productImages = [];

        // Frontend Cloudinary URLs
        if (Array.isArray(images)) {
            productImages = images
                .filter(
                    (image) =>
                        typeof image === "string" &&
                        image.trim() !== ""
                )
                .map((image) => image.trim());
        }

        // Backend multer fallback
        if (
            req.files &&
            req.files.length > 0
        ) {
            for (const file of req.files) {
                const result =
                    await uploadToCloudinary(
                        file.buffer
                    );

                productImages.push(
                    result.secure_url
                );
            }
        }

        // ==========================================
        // AVAILABILITY
        // ==========================================

        const organic =
            isOrganic === true ||
            isOrganic === "true";

        let available =
            isAvailable === undefined
                ? true
                : (
                    isAvailable === true ||
                    isAvailable === "true"
                );

        // Product cannot be available without stock
        if (numericQuantity <= 0) {
            available = false;
        }

        // ==========================================
        // CREATE PRODUCT
        // ==========================================

        const product =
            await Product.create({
                farmer: req.user.id,

                name: name.trim(),

                category: category.trim(),

                description:
                    description?.trim() || "",

                price: numericPrice,

                quantity: numericQuantity,

                unit: unit.trim(),

                images: productImages,

                location:
                    location?.trim() || "",

                isOrganic: organic,

                isAvailable: available
            });

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            product
        });

    } catch (error) {
        console.error(
            "ADD PRODUCT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to add product"
        });
    }
};


// ==========================================
// GET FARMER'S PRODUCTS
// ==========================================

export const getFarmerProducts = async (
    req,
    res
) => {
    try {
        const products =
            await Product.find({
                farmer: req.user.id
            }).sort({
                createdAt: -1
            });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error(
            "GET FARMER PRODUCTS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};


// ==========================================
// GET ALL AVAILABLE PRODUCTS
// ==========================================

export const getAllProducts = async (
    req,
    res
) => {
    try {
        const {
            search,
            category
        } = req.query;

        const filter = {
            isAvailable: true,
            quantity: {
                $gt: 0
            }
        };

        // Search
        if (search?.trim()) {
            filter.name = {
                $regex: search.trim(),
                $options: "i"
            };
        }

        // Category
        if (category?.trim()) {
            filter.category = {
                $regex:
                    `^${category.trim()}$`,
                $options: "i"
            };
        }

        const products =
            await Product.find(filter)
                .populate(
                    "farmer",
                    "name email phone address"
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
            "GET ALL PRODUCTS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};


// ==========================================
// GET SINGLE PRODUCT
// ==========================================

export const getProductById = async (
    req,
    res
) => {
    try {
        const product =
            await Product.findById(
                req.params.id
            ).populate(
                "farmer",
                "name email phone address"
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        console.error(
            "GET PRODUCT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};


// ==========================================
// UPDATE PRODUCT
// ==========================================

export const updateProduct = async (
    req,
    res
) => {
    try {
        const product =
            await Product.findOne({
                _id: req.params.id,
                farmer: req.user.id
            });

        if (!product) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found or unauthorized"
            });
        }

        const {
            name,
            category,
            description,
            price,
            quantity,
            unit,
            location,
            isOrganic,
            isAvailable,
            images
        } = req.body;

        // ==========================================
        // BASIC FIELD VALIDATION
        // ==========================================

        if (
            name !== undefined &&
            (!name || !name.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Product name cannot be empty"
            });
        }

        if (
            category !== undefined &&
            (!category || !category.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Category cannot be empty"
            });
        }

        if (
            unit !== undefined &&
            (!unit || !unit.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Unit cannot be empty"
            });
        }

        // ==========================================
        // NUMERIC VALIDATION
        // ==========================================

        if (price !== undefined) {
            const numericPrice = Number(price);

            if (
                !Number.isFinite(numericPrice) ||
                numericPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Price must be a valid non-negative number"
                });
            }

            product.price = numericPrice;
        }

        if (quantity !== undefined) {
            const numericQuantity = Number(quantity);

            if (
                !Number.isFinite(numericQuantity) ||
                numericQuantity < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Quantity must be a valid non-negative number"
                });
            }

            product.quantity = numericQuantity;
        }

        // ==========================================
        // UPDATE BASIC DETAILS
        // ==========================================

        if (name !== undefined) {
            product.name = name.trim();
        }

        if (category !== undefined) {
            product.category = category.trim();
        }

        if (description !== undefined) {
            product.description =
                description?.trim() || "";
        }

        if (unit !== undefined) {
            product.unit = unit.trim();
        }

        if (location !== undefined) {
            product.location =
                location?.trim() || "";
        }

        if (isOrganic !== undefined) {
            product.isOrganic =
                isOrganic === true ||
                isOrganic === "true";
        }

        if (isAvailable !== undefined) {
            product.isAvailable =
                isAvailable === true ||
                isAvailable === "true";
        }

        // Product cannot be available without stock
        if (product.quantity <= 0) {
            product.isAvailable = false;
        }

        // ==========================================
        // UPDATE IMAGES
        // ==========================================

        if (Array.isArray(images)) {
            product.images =
                images
                    .filter(
                        (image) =>
                            typeof image === "string" &&
                            image.trim() !== ""
                    )
                    .map((image) => image.trim());
        }

        await product.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        console.error(
            "UPDATE PRODUCT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update product"
        });
    }
};


// ==========================================
// DELETE PRODUCT
// ==========================================

export const deleteProduct = async (
    req,
    res
) => {
    try {
        const product =
            await Product.findOneAndDelete({
                _id: req.params.id,
                farmer: req.user.id
            });

        if (!product) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found or unauthorized"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error(
            "DELETE PRODUCT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete product"
        });
    }
};