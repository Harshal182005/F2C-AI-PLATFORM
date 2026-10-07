import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

function AdminLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const response = await API.post(
                "/auth/admin-login",
                {
                    email,
                    password
                }
            );

            const {
                token,
                user
            } = response.data;

            localStorage.setItem(
                "adminToken",
                token
            );

            localStorage.setItem(
                "adminUser",
                JSON.stringify(user)
            );

            navigate("/admin/dashboard");

        } catch (err) {
            console.error("Admin login error:", err);

            setError(
                err.response?.data?.message ||
                "Admin login failed"
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f8f3] flex items-center justify-center px-5">

            <div className="w-full max-w-md">

                {/* LOGO */}

                <div className="text-center mb-8">

                    <div className="w-16 h-16 mx-auto rounded-2xl bg-green-700 text-white flex items-center justify-center text-3xl shadow-lg shadow-green-700/20">
                        🌾
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mt-5">
                        F2C Admin
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Marketplace administration portal
                    </p>

                </div>


                {/* CARD */}

                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-7 md:p-9">

                    <div className="mb-7">

                        <h2 className="text-xl font-bold text-gray-900">
                            Welcome back
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Sign in to manage the F2C platform.
                        </p>

                    </div>


                    {error && (
                        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}


                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* EMAIL */}

                        <div>

                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Admin Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="admin@f2c.com"
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition"
                                required
                            />

                        </div>


                        {/* PASSWORD */}

                        <div>

                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="Enter admin password"
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition"
                                required
                            />

                        </div>


                        {/* LOGIN */}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold transition shadow-lg shadow-green-700/20 disabled:opacity-60"
                        >
                            {loading
                                ? "Signing in..."
                                : "Sign in to Admin"}
                        </button>

                    </form>


                    <button
                        onClick={() =>
                            navigate("/marketplace")
                        }
                        className="w-full mt-5 text-sm text-gray-500 hover:text-green-700 transition"
                    >
                        ← Back to marketplace
                    </button>

                </div>


                <p className="text-center text-xs text-gray-400 mt-6">
                    F2C AI Platform • Admin Portal
                </p>

            </div>

        </div>
    );
}

export default AdminLogin;