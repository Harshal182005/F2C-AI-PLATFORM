import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        quantity: {
            type: Number,
            required: true,
            min: 0
        },

        unit: {
            type: String,
            required: true,
            enum: [
                "kg",
                "gram",
                "quintal",
                "ton",
                "liter",
                "dozen",
                "piece"
            ]
        },

        images: [
            {
                type: String
            }
        ],

        location: {
            type: String,
            default: ""
        },

        isOrganic: {
            type: Boolean,
            default: false
        },

        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Product = mongoose.model("Product", productSchema);

export default Product;