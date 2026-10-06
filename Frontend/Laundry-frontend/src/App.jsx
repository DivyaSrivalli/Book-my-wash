import { useEffect, useState } from "react";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { apiRequest } from "./services/api";

function App() {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const token = localStorage.getItem("token");

        // No token → show login
        if (!token) {
            setLoading(false);
            return;
        }

        const checkUser = async () => {

            try {

                const data = await apiRequest(
                    "/auth/user/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setUser(data.user);

            } catch (error) {

                // Token is invalid or expired
                localStorage.removeItem("token");
                setUser(null);

            } finally {

                setLoading(false);

            }
        };

        checkUser();

    }, []);

    // Wait while checking JWT
    if (loading) {
        return (
            <div className="auth-page">
                <p style={{ color: "var(--muted)" }}>Checking authentication…</p>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return <Login />;
    }

    // Admin
    if (user.role === "ADMIN") {
        return <AdminDashboard />;
    }

    // Normal user
    if (user.role === "USER") {
        return <UserDashboard />;
    }

    // Unknown role
    localStorage.removeItem("token");

    return <Login />;
}

export default App;