import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { Html5Qrcode } from "html5-qrcode";

function AdminDashboard() {

    const [date, setDate] = useState("");
    const [bookings, setBookings] = useState([]);
    const [message, setMessage] = useState("");
    const [history, setHistory] = useState([]);
    const token = localStorage.getItem("token");
    const [scanner, setScanner] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    };

    const getBookingsByDate = async () => {

        if (!date) {
            setMessage("Please select a date");
            return;
        }

        try {

            const data = await apiRequest(
                `/admin/bookings?date=${date}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setBookings(data.bookings);
            setMessage("");

        } catch (error) {

            setMessage(error.message);

        }
    };

    const getHistory = async () => {

        try {

            const data = await apiRequest(
                "/admin/history",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setHistory(data.history);

        } catch (error) {

            setMessage(error.message);

        }
    };

    const acceptBooking = async (qrToken) => {

        try {

            const data = await apiRequest(
                "/admin/bookings/accept",
                {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        qrToken
                    })
                }
            );

            setMessage(data.message);

            await stopScanner();

            if (date) {
                getBookingsByDate();
            }

            getHistory();

        } catch (error) {

            setMessage(error.message);

        }
    };

    // Stops whichever scanner instance is currently running.
    // (Previously this created a brand-new, never-started Html5Qrcode
    // instance and called .stop() on it, and also flipped isScanning to
    // true instead of false — so the Stop button didn't actually work.)
    const stopScanner = async () => {

        if (!scanner) {
            return;
        }

        try {

            await scanner.stop();
            scanner.clear();

        } catch (error) {

            console.error(error);

        } finally {

            setScanner(null);
            setIsScanning(false);
        }
    };

    const startScanner = async () => {

        const html5QrCode = new Html5Qrcode("qr-reader");

        setScanner(html5QrCode);

        try {

            const cameras =
                await Html5Qrcode.getCameras();

            if (cameras.length === 0) {
                setMessage("No camera found");
                setScanner(null);
                return;
            }

            await html5QrCode.start(
                cameras[0].id,

                {
                    fps: 10,
                    qrbox: {
                        width: 250,
                        height: 250
                    }
                },

                async (decodedText) => {

                    console.log(
                        "QR Token:",
                        decodedText
                    );

                    await acceptBooking(decodedText);
                },

                (errorMessage) => {

                    // QR not detected yet.
                    // No action needed.
                }
            );

            // Scanner started successfully — reflect that in the UI so
            // the Start button disables and the Stop button becomes useful.
            setIsScanning(true);

        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to start camera"
            );
            setScanner(null);
        }
    };

    useEffect(() => {

        getHistory();

    }, []);

    return (
        <div className="page">

            <div className="topbar">
                <div className="topbar-inner">
                    <div className="topbar-brand">
                        <span className="dot" />
                        <span>Book My wash</span>
                        <span className="topbar-role">Admin</span>
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
                    <h1>Admin Dashboard</h1>
                    <p className="section-sub">Scan drop-offs and review bookings.</p>
                </div>

                {message && <p className="auth-message">{message}</p>}

                {/* =========================
                    SCANNER
                ========================= */}

                <div className="section">
                    <div className="section-head">
                        <h2>Scan laundry QR</h2>
                    </div>

                    <div className="card">
                        <div id="qr-reader"></div>

                        <div className="btn-row" style={{ marginTop: 14 }}>
                            <button
                                className="btn-inline"
                                onClick={startScanner}
                                disabled={isScanning}
                            >
                                Start scanner
                            </button>

                            <button
                                type="button"
                                className="btn-secondary btn-inline"
                                onClick={stopScanner}
                                disabled={!isScanning}
                            >
                                Stop scanner
                            </button>
                        </div>
                    </div>
                </div>

                {/* =========================
                    VIEW BY DATE
                ========================= */}

                <div className="section">
                    <div className="section-head">
                        <h2>View bookings</h2>
                    </div>

                    <div className="card">
                        <div className="field">
                            <label htmlFor="booking-date">Select date</label>
                            <input
                                id="booking-date"
                                type="date"
                                value={date}
                                onChange={(event) =>
                                    setDate(event.target.value)
                                }
                            />
                        </div>

                        <button onClick={getBookingsByDate}>
                            Get bookings
                        </button>
                    </div>
                </div>

                <div className="section">
                    <div className="section-head">
                        <h2>Bookings</h2>
                    </div>

                    {bookings.length === 0 ? (

                        <div className="card">
                            <p className="empty-state">No bookings found.</p>
                        </div>

                    ) : (

                        <div className="item-list">
                            {bookings.map((booking) => (

                                <div className="item" key={booking.id}>
                                    <div className="item-main">
                                        <p className="item-title">
                                            #{booking.id} — {booking.name}
                                        </p>
                                        <p className="item-meta">
                                            {booking.email} · {booking.clothes_count} clothes
                                        </p>
                                    </div>

                                    <span
                                        className={
                                            booking.status === "ACCEPTED"
                                                ? "badge badge-accepted"
                                                : "badge badge-booked"
                                        }
                                    >
                                        {booking.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* =========================
                    HISTORY
                ========================= */}

                <div className="section">
                    <div className="section-head">
                        <h2>7-day booking history</h2>
                    </div>

                    {history.length === 0 ? (

                        <div className="card">
                            <p className="empty-state">No booking history found.</p>
                        </div>

                    ) : (

                        <div className="item-list">
                            {history.map((booking) => (

                                <div className="item" key={booking.id}>
                                    <div className="item-main">
                                        <p className="item-title">
                                            #{booking.id} — {booking.name}
                                        </p>
                                        <p className="item-meta">
                                            {booking.booking_date} · {booking.clothes_count} clothes
                                        </p>
                                    </div>

                                    <span
                                        className={
                                            booking.status === "ACCEPTED"
                                                ? "badge badge-accepted"
                                                : "badge badge-booked"
                                        }
                                    >
                                        {booking.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default AdminDashboard;
