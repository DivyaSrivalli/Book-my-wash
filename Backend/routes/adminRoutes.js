import express from "express";
import { getBookingsByDate ,acceptBooking,getBookingHistory} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get(
    "/bookings",
    authMiddleware,
    adminMiddleware,
    getBookingsByDate
);
router.post(
    "/bookings/accept",
    authMiddleware,
    adminMiddleware,
    acceptBooking
);
router.get(
    "/history",
    authMiddleware,
    adminMiddleware,
    getBookingHistory
);
export default router;