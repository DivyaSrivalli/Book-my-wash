import express from "express";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cors from "cors";
import "dotenv/config";
const app=express();
app.use(
    cors({
        origin: process.env.FRONTEND_URL
    })
);
app.use(express.json());


app.use("/api/auth",authRoutes);
app.use("/api/admin",adminRoutes);
app.use('/api/bookings',bookingRoutes);


export default app;