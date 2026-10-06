import { useEffect, useState } from "react";
import { apiRequest, API_URL } from "../services/api";
import { io } from "socket.io-client";

function UserDashboard() {

    const [slots, setSlots] = useState(null);
    const [clothesCount, setClothesCount] = useState(20);
    const [bookings, setBookings] = useState([]);
    const [message, setMessage] = useState("");
    const [monthlyBookings, setMonthlyBookings] = useState(0);
    const token = localStorage.getItem("token");

    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    };

    // =========================
    // GET AVAILABLE SLOTS
    // =========================

    const getSlots = async () => {
        try {

            const data = await apiRequest(
                "/bookings/slots"
            );

            setSlots(data);

        } catch (error) {

            setMessage(error.message);

        }
    };

    // =========================
    // GET MY BOOKINGS
    // =========================

    const getMyBookings = async () => {
        try {

            const data = await apiRequest(
                "/bookings/my-bookings",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setBookings(data.bookings);
            setMonthlyBookings(data.monthlyBookings);

        } catch (error) {

            setMessage(error.message);

        }
    };

    // =========================
    // LOAD DATA WHEN PAGE OPENS
    // =========================

    useEffect(() => {

        getSlots();
        getMyBookings();

    }, []);

    // =========================
    // SOCKET.IO
    // =========================

    useEffect(() => {

        const socket = io(
            API_URL.replace(/\/api\/?$/, ""),
            {
                auth: {
                    token
                }
            }
        );

        // -------------------------
        // SLOT UPDATE
        // -------------------------

        socket.on(
            "slotsUpdated",
            (data) => {

                setSlots((currentSlots) => {

                    if (!currentSlots) {
                        return currentSlots;
                    }

                    if (
                        data.bookingDate ===
                        currentSlots.bookingDate
                    ) {

                        return {
                            ...currentSlots,

                            totalCapacity:
                                data.totalCapacity,

                            booked:
                                data.booked,

                            slotsLeft:
                                data.slotsLeft
                        };
                    }

                    return currentSlots;
                });
            }
        );

        // -------------------------
        // BOOKING ACCEPTED
        // -------------------------

        socket.on(
            "bookingAccepted",
            (data) => {

                setBookings(
                    (currentBookings) => {

                        return currentBookings.map(
                            (booking) => {

                                if (
                                    booking.id ===
                                    data.bookingId
                                ) {

                                    return {
                                        ...booking,
                                        status:
                                            data.status
                                    };
                                }

                                return booking;
                            }
                        );
                    }
                );
            }
        );

        // -------------------------
        // CLEANUP
        // -------------------------

        return () => {

            socket.disconnect();

        };

    }, [token]);

    // =========================
    // BOOK LAUNDRY
    // =========================
    const handleBooking = async () => {

        if (!slots) {
            return;
        }

        if (clothesCount < 20 || clothesCount > 25) {
            setMessage("Clothes count must be between 20 and 25");
            return;
        }

        if (slots.slotsLeft === 0) {
            setMessage("No slots available for tomorrow");
            return;
        }

        try {

            const data = await apiRequest(
                "/bookings",
                {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        bookingDate: slots.bookingDate,
                        clothesCount
                    })
                }
            );

            setMessage(data.message);

            getSlots();
            getMyBookings();

        } catch (error) {

            setMessage(error.message);

        }
    };

    // =========================
    // DOWNLOAD RECEIPT
    // =========================
    // The receipt route requires an Authorization header, so a plain
    // <a href> link can't be used (browsers don't attach custom headers
    // to link navigations). Fetch it with the token instead and save
    // the resulting PDF as a blob.
    const handleDownloadReceipt = async (bookingId) => {

        try {

            const response = await fetch(
                `${API_URL}/bookings/${bookingId}/receipt`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Receipt not available");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `receipt-${bookingId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (error) {

            setMessage(error.message);

        }
    };

    // =========================
    // UI
    // =========================

    return (
        <div className="page">

            <div className="topbar">
                <div className="topbar-inner">
                    <div className="topbar-brand">
                        <span className="dot" />
                        <span>Book My wash</span>
                        <span className="topbar-role">Student</span>
                    </div>
                    <div className="topbar-actions">
                        <button className="btn-ghost-light" onClick={handleLogout}>
                            Log out
                        </button>
                    </div>
                </div>
            </div>

            <div className="container">

                <div className="section">
                    <h1>Laundry Dashboard</h1>
                    <p className="section-sub">Book tomorrow's slot and track your bookings.</p>
                </div>

                {message && <p className="auth-message">{message}</p>}

                {/* =========================
                    AVAILABLE SLOTS
                ========================= */}

                <div className="section">
                    <div className="section-head">
                        <h2>Tomorrow's availability</h2>
                    </div>

                    {slots ? (
                        <div className="stat-grid">
                            <div className="stat">
                                <p className="stat-label">Laundry date</p>
                                <p className="stat-value">{slots.bookingDate}</p>
                            </div>
                            <div className="stat">
                                <p className="stat-label">Total capacity</p>
                                <p className="stat-value">{slots.totalCapacity}</p>
                            </div>
                            <div className="stat">
                                <p className="stat-label">Booked</p>
                                <p className="stat-value">{slots.booked}</p>
                            </div>
                            <div className="stat">
                                <p className="stat-label">Slots left</p>
                                <p className="stat-value">{slots.slotsLeft}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <p className="empty-state">Loading availability…</p>
                        </div>
                    )}
                </div>

                {/* =========================
                    BOOKING
                ========================= */}

                <div className="section">
                    <div className="section-head">
                        <h2>Book laundry</h2>
                        <span className="section-sub">
                            {monthlyBookings} / 4 used this month
                        </span>
                    </div>

                    <div className="card">
                        <div className="field">
                            <label htmlFor="clothes-count">Number of clothes (20–25)</label>
                            <input
                                id="clothes-count"
                                type="number"
                                min="20"
                                max="25"
                                value={clothesCount}
                                onChange={(event) =>
                                    setClothesCount(
                                        Number(event.target.value)
                                    )
                                }
                            />
                        </div>

                        <button
                            onClick={handleBooking}
                            disabled={
                                !slots ||
                                slots.slotsLeft === 0
                                || monthlyBookings >= 4
                            }
                        >
                            Book laundry
                        </button>

                        {monthlyBookings >= 4 && (
                            <p className="empty-state">
                                You've reached your monthly booking limit.
                            </p>
                        )}
                    </div>
                </div>

                {/* =========================
                    MY BOOKINGS
                ========================= */}

                <div className="section">
                    <div className="section-head">
                        <h2>My bookings</h2>
                    </div>

                    {bookings.length === 0 ? (

                        <div className="card">
                            <p className="empty-state">No bookings yet.</p>
                        </div>

                    ) : (

                        <div className="item-list">
                            {bookings.map((booking) => (

                                <div className="item" key={booking.id}>

                                    <div className="item-main">
                                        <p className="item-title">
                                            Booking #{booking.id} — {booking.clothes_count} clothes
                                        </p>
                                        <p className="item-meta">
                                            {booking.booking_date}
                                        </p>
                                    </div>

                                    <div className="item-side">
                                        <span
                                            className={
                                                booking.status === "ACCEPTED"
                                                    ? "badge badge-accepted"
                                                    : "badge badge-booked"
                                            }
                                        >
                                            {booking.status}
                                        </span>

                                        <button
                                            type="button"
                                            className="btn-secondary btn-inline"
                                            onClick={() => handleDownloadReceipt(booking.id)}
                                        >
                                            Receipt
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default UserDashboard;
