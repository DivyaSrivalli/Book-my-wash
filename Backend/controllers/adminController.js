import db from "../config/db.js";
import { getIO } from "../socket.js";

// Local-date "YYYY-MM-DD" string, matching the same approach used in
// bookingController — avoids the UTC-conversion timezone bug that
// Date.toISOString() has for timezones ahead of UTC.
const getTodayDateString = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};
const getBookingsByDate = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                message: "Date is required"
            });
        }

        const [bookings] = await db.promise().query(
            `SELECT
                b.id,
                b.booking_date,
                b.clothes_count,
                b.status,
                b.qr_token,
                b.created_at,
                b.accepted_at,
                u.id AS user_id,
                u.name,
                u.email
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             WHERE b.booking_date = ?
             ORDER BY b.created_at ASC`,
            [date]
        );

        res.status(200).json({
            date,
            totalBookings: bookings.length,
            bookings
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getBookingHistory = async (req, res) => {
    try {
        const [history] = await db.promise().query(
            `SELECT
                b.id,
                b.booking_date,
                b.clothes_count,
                b.status,
                b.created_at,
                b.accepted_at,
                u.id AS user_id,
                u.name,
                u.email
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             WHERE b.booking_date >= CURDATE() - INTERVAL 6 DAY
             AND b.booking_date <= CURDATE()
             ORDER BY b.booking_date DESC, b.created_at ASC`
        );

        res.status(200).json({
            days: 7,
            history
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};








const acceptBooking = async (req, res) => {
    try {
        const { qrToken } = req.body;

        if (!qrToken) {
            return res.status(400).json({
                message: "QR token is required"
            });
        }

        const [bookings] = await db.promise().query(
           `SELECT id, user_id, status,booking_date
            FROM bookings
            WHERE qr_token = ?`,
           [qrToken]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                message: "Invalid QR code"
            });
        }

        const booking = bookings[0];
        const today = getTodayDateString();

if (booking.booking_date !== today) {
    return res.status(400).json({
        message: "This booking is not valid for today"
    });
}
        if (booking.status === "ACCEPTED") {
            return res.status(400).json({
                message: "Booking has already been accepted"
            });
        }

        await db.promise().query(
            `UPDATE bookings
             SET status = 'ACCEPTED',
                 accepted_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [booking.id]
        );
        const io = getIO();

         io.to(`user_${booking.user_id}`).emit(
         "bookingAccepted",
         {
          bookingId: booking.id,
          status: "ACCEPTED"
         }
         );
        res.status(200).json({
            message: "Laundry accepted successfully",
            bookingId: booking.id,
            status: "ACCEPTED"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};




export { getBookingsByDate ,acceptBooking,getBookingHistory};