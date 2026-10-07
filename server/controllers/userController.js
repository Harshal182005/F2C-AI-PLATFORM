import User from "../models/User.js";
import bcrypt from "bcryptjs";

/* =========================
   GET CUSTOMER PROFILE
========================= */

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("GET PROFILE ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch profile"
        });
    }
};


/* =========================
   UPDATE CUSTOMER PROFILE
========================= */

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            name,
            phone,
            address
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.name = name.trim();
        user.phone = phone?.trim() || "";
        user.address = address?.trim() || "";

        await user.save();

        const updatedUser = await User.findById(userId)
            .select("-password");

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("UPDATE PROFILE ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });
    }
};