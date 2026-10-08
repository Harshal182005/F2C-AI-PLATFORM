import dns from "dns";

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import farmerRoutes from "./routes/farmerRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import farmerOrderRoutes from "./routes/farmerOrderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

import { initializeSocket } from "./services/socketService.js";

import rateLimitMiddleware from "./middleware/rateLimitMiddleware.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

dotenv.config();

const FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:5173";

const app = express();


// ===============================
// HTTP SERVER
// ===============================

const httpServer = createServer(app);


// ===============================
// SOCKET.IO
// ===============================

const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

initializeSocket(io);


// ===============================
// MIDDLEWARE
// ===============================

app.use(
    cors({
        origin: FRONTEND_URL
    })
);

app.use(express.json());


// ===============================
// RATE LIMITER
// ===============================

app.use(rateLimitMiddleware);


// ===============================
// API ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/farmer/orders", farmerOrderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);


// ===============================
// TEST ROUTE
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "F2C AI Platform API is running"
    });
});


// ===============================
// ERROR HANDLING
// ===============================

app.use(errorMiddleware);


// ===============================
// SOCKET EVENTS
// ===============================

io.on("connection", (socket) => {

    console.log(
        "Socket connected:",
        socket.id
    );


    // Customer joins a specific order room
    socket.on("joinOrder", (orderId) => {

        if (!orderId) {
            return;
        }

        const roomName = `order_${orderId}`;

        socket.join(roomName);

        console.log(
            `Socket ${socket.id} joined ${roomName}`
        );
    });


    // Customer leaves order room
    socket.on("leaveOrder", (orderId) => {

        if (!orderId) {
            return;
        }

        const roomName = `order_${orderId}`;

        socket.leave(roomName);

        console.log(
            `Socket ${socket.id} left ${roomName}`
        );
    });


    // Socket disconnected
    socket.on("disconnect", (reason) => {

        console.log(
            "Socket disconnected:",
            socket.id,
            reason
        );
    });
});


// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 5000;

const startServer = async () => {

    try {

        await connectDB();

        httpServer.listen(PORT, "0.0.0.0", () => {

            console.log(
                `Server running on port ${PORT}`
            );

            console.log(
                `Socket.IO running on port ${PORT}`
            );
        });

    } catch (error) {

        console.error(
            "Failed to start server:",
            error.message
        );

        process.exit(1);
    }
};

startServer();