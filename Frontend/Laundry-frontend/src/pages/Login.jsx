import { useState } from "react";
import { apiRequest } from "../services/api";
import Register from "./Register";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showRegister, setShowRegister] = useState(false);
    const [message, setMessage] = useState("");

    const handleLogin = async (event) => {
        event.preventDefault();
        setMessage("");

        try {

            const data = await apiRequest("/auth/user/login", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password
                })
            });

            localStorage.setItem("token", data.token);

            window.location.reload();

        } catch (error) {

            setMessage(error.message);

        }
    };

    if (showRegister) {
        return <Register onBackToLogin={() => setShowRegister(false)} />;
    }

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-mark">
                    <span className="dot" />
                    <span>Book My wash</span>
                </div>

                <h2>Welcome back</h2>
                <p className="auth-sub">Log in to book or manage laundry slots.</p>

                {message && <p className="auth-message">{message}</p>}

                <form onSubmit={handleLogin}>

                    <div className="field">
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@college.edu"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                        />
                    </div>

                    <button type="submit">
                        Log in
                    </button>

                </form>

                <div className="auth-switch">
                    <span>Don't have an account?</span>
                    <button
                        type="button"
                        onClick={() => setShowRegister(true)}
                    >
                        Create one
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Login;
