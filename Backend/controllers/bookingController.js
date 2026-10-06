import db from "../config/db.js";
import crypto from "crypto";
import { generateQRCode } from "../services/qrService.js";
import { getIO } from "../socket.js";
import { generateReceipt } from "../services/receiptService.js";

// Returns tomorrow's date as a "YYYY-MM-DD" string, using LOCAL date
// parts (not UTC). Using Date.toISOString() to build a date string is
// timezone-unsafe: it converts to UTC first, which can roll the date
// backward by a day for any timezone ahead of UTC (e.g. India, +5:30)
// whenever local midnight is used as the starting point. Every place
// that needs "tomorrow's date" must use this same function so they
// always agree.
const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const createBooking = async (req, res) => {

    let connection;

    try {
        connection = await db.promise().getConnection();

        const { bookingDate, clothesCount } = req.body;
        const userId = req.user.userId;

        // -----------------------------
        // 1. Get user details
        // -----------------------------
        const [users] = await connection.query(
            `SELECT name, email
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];

        // -----------------------------
        // 2. Validate clothes count
        // -----------------------------
        if (
            typeof clothesCount !== "number" ||
            !Number.isInteger(clothesCount) ||
            clothesCount < 20 ||
            clothesCount > 25
        ) {
            return res.status(400).json({
                message: "Clothes count must be between 20 and 25"
            });
        }

        // -----------------------------
        // 3. Validate booking date
        // -----------------------------
        if (!bookingDate) {
            return res.status(400).json({
                message: "Booking date is required"
            });
        }
        const tomorrowDate = getTomorrowDateString();

        if (bookingDate !== tomorrowDate) {
            return res.status(400).json({
            message: "You can book only for the next day"
        });
    }

        // -----------------------------
        // 4. Check monthly limit
        // -----------------------------
        const [monthlyBookings] = await connection.query(
            `SELECT COUNT(*) AS totalBookings
             FROM bookings
             WHERE user_id = ?
             AND MONTH(booking_date) = MONTH(?)
             AND YEAR(booking_date) = YEAR(?)`,
            [userId, bookingDate, bookingDate]
        );

        if (monthlyBookings[0].totalBookings >= 4) {
            return res.status(400).json({
                message: "You can book a maximum of 4 times per month"
            });
        }

        // -----------------------------
        // 5. Start transaction
        // -----------------------------
        await connection.beginTransaction();

        // -----------------------------
        // 6. Check duplicate booking
        // -----------------------------
        const [existingBooking] = await connection.query(
            `SELECT id
             FROM bookings
             WHERE user_id = ?
             AND booking_date = ?`,
            [userId, bookingDate]
        );

        if (existingBooking.length > 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "You have already booked for this date"
            });
        }

        // -----------------------------
        // 7. Create daily slot row
        // -----------------------------
        await connection.query(
            `INSERT IGNORE INTO daily_slots
             (booking_date, total_capacity, booked)
             VALUES (?, 100, 0)`,
            [bookingDate]
        );

        // -----------------------------
        // 8. Lock daily slot row
        // -----------------------------
        const [slotRows] = await connection.query(
            `SELECT booked, total_capacity
             FROM daily_slots
             WHERE booking_date = ?
             FOR UPDATE`,
            [bookingDate]
        );

        const slot = slotRows[0];

        // -----------------------------
        // 9. Check capacity
        // -----------------------------
        if (slot.booked >= slot.total_capacity) {
            await connection.rollback();

            return res.status(400).json({
                message: "No slots available for this date"
            });
        }

        // -----------------------------
        // 10. Generate QR token
        // -----------------------------
        const qrToken = crypto.randomUUID();

        // -----------------------------
        // 11. Insert booking
        // -----------------------------
        const [bookingResult] = await connection.query(
            `INSERT INTO bookings
             (user_id, booking_date, clothes_count, qr_token)
             VALUES (?, ?, ?, ?)`,
            [userId, bookingDate, clothesCount, qrToken]
        );

        const bookingId = bookingResult.insertId;

        // -----------------------------
        // 12. Increase booked count
        // -----------------------------
        await connection.query(
            `UPDATE daily_slots
             SET booked = booked + 1
             WHERE booking_date = ?`,
            [bookingDate]
        );

        // -----------------------------
        // 13. Commit transaction
        // -----------------------------
        await connection.commit();

        // -----------------------------
        // 14. Generate QR + Receipt
        // -----------------------------
        try {

            const qrImage = await generateQRCode(
                qrToken,
                bookingId
            );

            const receiptPath = await generateReceipt({
                id: bookingId,
                bookingDate,
                clothesCount,
                qrImage,
                name: user.name,
                email: user.email
            });

            // Save receipt path
            await db.promise().query(
                `UPDATE bookings
                 SET receipt_key = ?
                 WHERE id = ?`,
                [receiptPath, bookingId]
            );

            // -----------------------------
            // 15. Get updated slots
            // -----------------------------
            const [slotResult] = await db.promise().query(
                `SELECT booked, total_capacity
                 FROM daily_slots
                 WHERE booking_date = ?`,
                [bookingDate]
            );

            const totalBookings = slotResult[0].booked;

            const slotsLeft =
                slotResult[0].total_capacity - totalBookings;

            // -----------------------------
            // 16. Socket.IO update
            // -----------------------------
            const io = getIO();

            io.emit("slotsUpdated", {
                bookingDate,
                totalCapacity: slotResult[0].total_capacity,
                booked: totalBookings,
                slotsLeft
            });

            // -----------------------------
            // 17. Response
            // -----------------------------
            return res.status(201).json({
                message: "Booking request received",
                bookingId,
                bookingDate,
                clothesCount,
                status: "BOOKED",
                receipt: receiptPath
            });

        } catch (receiptError) {

            console.error(
                "QR/Receipt generation failed:",
                receiptError
            );

            // Undo booking
            await db.promise().query(
                `DELETE FROM bookings
                 WHERE id = ?`,
                [bookingId]
            );

            // Restore slot
            await db.promise().query(
                `UPDATE daily_slots
                 SET booked = booked - 1
                 WHERE booking_date = ?`,
                [bookingDate]
            );

            return res.status(500).json({
                message:
                    "Booking failed because receipt could not be generated"
            });
        }

    } catch (error) {

        console.error(error);

        // Rollback if transaction failed
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Rollback failed:",
                    rollbackError
                );
            }
        }

        return res.status(500).json({
            message: "Internal server error"
        });

    } finally {

        // Always return connection to pool
        if (connection) {
            connection.release();
        }
    }
};








const createDailySlotIfNeeded = async (bookingDate) => {
    await db.promise().query(
        `INSERT IGNORE INTO daily_slots
         (booking_date, total_capacity, booked)
         VALUES (?, 100, 0)`,
        [bookingDate]
    );
};

const getSlots = async (req, res) => {
    try {
        const bookingDate = getTomorrowDateString();

        await createDailySlotIfNeeded(bookingDate);

        const [result] = await db.promise().query(
            `SELECT
                booking_date,
                total_capacity,
                booked
             FROM daily_slots
             WHERE booking_date = ?`,
            [bookingDate]
        );

        const slot = result[0];

        const slotsLeft = slot.total_capacity - slot.booked;

        res.status(200).json({
            bookingDate: slot.booking_date,
            totalCapacity: slot.total_capacity,
            booked: slot.booked,
            slotsLeft
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};



const getMyBookings = async (req, res) => {
    try {

        const userId = req.user.userId;

        const [bookings] = await db.promise().query(
            `SELECT
                id,
                booking_date,
                clothes_count,
                status,
                created_at,
                accepted_at
             FROM bookings
             WHERE user_id = ?
             ORDER BY booking_date DESC`,
            [userId]
        );

        const [monthlyResult] = await db.promise().query(
            `SELECT COUNT(*) AS monthlyBookings
             FROM bookings
             WHERE user_id = ?
             AND YEAR(booking_date) = YEAR(CURDATE())
             AND MONTH(booking_date) = MONTH(CURDATE())`,
            [userId]
        );

        const monthlyBookings =
            monthlyResult[0].monthlyBookings;

        const bookingsWithReceipt = bookings.map(
            (booking) => ({
                ...booking,
                receiptUrl:
                    `/api/bookings/${booking.id}/receipt`
            })
        );

        res.status(200).json({
            bookings: bookingsWithReceipt,
            monthlyBookings,
            monthlyLimit: 4
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};









const downloadReceipt = async (req, res) => {
    try {
        const userId = req.user.userId;
        const bookingId = req.params.id;

        const [bookings] = await db.promise().query(
            `SELECT receipt_key
             FROM bookings
             WHERE id = ? AND user_id = ?`,
            [bookingId, userId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const receiptPath = bookings[0].receipt_key;

        if (!receiptPath) {
            return res.status(404).json({
                message: "Receipt not available"
            });
        }

        res.download(receiptPath, `receipt-${bookingId}.pdf`);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};
export { createBooking ,getSlots,getMyBookings,downloadReceipt};