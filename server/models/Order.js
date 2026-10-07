import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        productName: {
            type: String,
            required: true
        },

        image: {
            type: String,
            default: ""
        },

        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        unit: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: false
    }
);


// ==========================================
// ORDER STATUS HISTORY
// ==========================================

const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            required: true
        },

        updatedAt: {
            type: Date,
            default: Date.now
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        _id: false
    }
);


// ==========================================
// ORDER SCHEMA
// ==========================================

const orderSchema = new mongoose.Schema(
    {
        // ================= CUSTOMER =================

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },


        // ================= ORDER ITEMS =================

        items: {
            type: [orderItemSchema],
            required: true,

            validate: {
                validator: function (items) {
                    return items.length > 0;
                },

                message: "Order must contain at least one item"
            }
        },


        // ================= DELIVERY =================

        deliveryAddress: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            default: ""
        },


        // ================= AMOUNT =================

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        deliveryFee: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },


        // ================= PAYMENT =================

        paymentMethod: {
            type: String,
            enum: ["COD", "RAZORPAY"],
            default: "COD"
        },

        paymentStatus: {
            type: String,
            enum: [
                "PENDING",
                "PAID",
                "FAILED",
                "REFUNDED"
            ],
            default: "PENDING"
        },


        // ================= RAZORPAY =================

        razorpayOrderId: {
            type: String,
            default: ""
        },

        razorpayPaymentId: {
            type: String,
            default: ""
        },

        razorpaySignature: {
            type: String,
            default: ""
        },
        razorpayRefundId: {
            type: String,
            default: ""
        },


        // ================= ORDER STATUS =================

        orderStatus: {
            type: String,

            enum: [
                "PLACED",
                "CONFIRMED",
                "PROCESSING",
                "PACKED",
                "SHIPPED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED"
            ],

            default: "PLACED"
        },


        // ================= STATUS HISTORY =================

        statusHistory: {
            type: [statusHistorySchema],
            default: []
        }
    },

    {
        timestamps: true
    }
);


const Order = mongoose.model("Order", orderSchema);

export default Order;