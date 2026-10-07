import dns from "dns";

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const existingAdmin = await User.findOne({
            email: "admin@f2c.com"
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            await mongoose.disconnect();
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(
            "Admin@123",
            10
        );

        await User.create({
            name: "F2C Admin",
            email: "admin@f2c.com",
            password: hashedPassword,
            role: "admin",
            phone: "",
            address: "",
            isBlocked: false
        });

        console.log("================================");
        console.log("Admin created successfully");
        console.log("Email: admin@f2c.com");
        console.log("Password: Admin@123");
        console.log("================================");

        await mongoose.disconnect();

        process.exit(0);

    } catch (error) {
        console.error("CREATE ADMIN ERROR:", error);

        await mongoose.disconnect().catch(() => {});

        process.exit(1);
    }
};

createAdmin();