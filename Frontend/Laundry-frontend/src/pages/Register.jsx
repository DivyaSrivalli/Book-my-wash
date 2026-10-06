import { useState } from "react";
import { apiRequest } from "../services/api";

function Register({ onBackToLogin }) {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const goToLogin = () => {
        if (onBackToLogin) {
            onBackToLogin();
        } else {
            window.location.href = "/";
        }
    };

    const handleRegister = async (event) => {

        event.preventDefault();
        setMessage("");

        try {

            await apiRequest(
                "/auth/user/register",
                {
                    method: "POST",

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            setName("");
            setEmail("");
            setPassword("");

            alert("Registration successful. Please log in.");

            goToLogin();

        } catch (error) {

            setMessage(error.message);

        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-mark">
                    <span className="dot" />
                    <span>Book My wash</span>
                </div>

                <h2>Create your account</h2>
                <p className="auth-sub">Sign up to start booking laundry slots.</p>

                {message && <p className="auth-message">{message}</p>}

                <form onSubmit={handleRegister}>

                    <div className="field">
                        <label htmlFor="register-name">Name</label>
                        <input
                            id="register-name"
                            type="text"
                            placeholder="Your full name"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="register-email">Email</label>
                        <input
                            id="register-email"
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
                        <label htmlFor="register-password">Password</label>
                        <input
                            id="register-password"
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                        />
                    </div>

                    <button type="submit">
                        Create account
                    </button>

                </form>

                <div className="auth-switch">
                    <span>Already have an account?</span>
                    <button type="button" onClick={goToLogin}>
                        Log in
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Register;
