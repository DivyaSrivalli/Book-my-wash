import express from "express";
import { createBooking,getSlots ,getMyBookings,downloadReceipt} from "../controllers/bookingController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createBooking);
router.get("/slots", getSlots);
router.get("/my-bookings", authMiddleware, getMyBookings);
router.get(
    "/:id/receipt",
    authMiddleware,
    downloadReceipt
);
export default router;