import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

function Profile() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        address: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const token = localStorage.getItem("customerToken");


    /* =========================
       FETCH PROFILE
    ========================= */

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError("");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await API.get("/users/profile", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = response.data.user;

            setProfile({
                name: data.name || "",
                email: data.email || "",
                phone: data.phone || "",
                address: data.address || ""
            });

        } catch (err) {
            console.error("Profile fetch error:", err);

            if (err.response?.status === 401) {
                logout();
                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                "Unable to load profile"
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchProfile();
    }, []);


    /* =========================
       HANDLE INPUT
    ========================= */

    const handleChange = (e) => {
        const { name, value } = e.target;

        setProfile((prev) => ({
            ...prev,
            [name]: value
        }));

        setMessage("");
        setError("");
    };


    /* =========================
       UPDATE PROFILE
    ========================= */

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");

            const response = await API.put(
                "/users/profile",
                {
                    name: profile.name,
                    phone: profile.phone,
                    address: profile.address
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const updatedUser = response.data.user;

            localStorage.setItem(
                "customerUser",
                JSON.stringify({
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role
                })
            );

            setProfile({
                name: updatedUser.name || "",
                email: updatedUser.email || "",
                phone: updatedUser.phone || "",
                address: updatedUser.address || ""
            });

            setMessage(
                response.data.message ||
                "Profile updated successfully"
            );

        } catch (err) {
            console.error("Profile update error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to update profile"
            );

        } finally {
            setSaving(false);
        }
    };


    /* =========================
       LOADING
    ========================= */

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f6f8f3] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-4"></div>

                    <p className="text-gray-500">
                        Loading your profile...
                    </p>
                </div>
            </div>
        );
    }


    /* =========================
       UI
    ========================= */

    return (
        <div className="min-h-screen bg-[#f6f8f3]">

            {/* NAVBAR */}

            <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">

                <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between">

                    <button
                        onClick={() => navigate("/marketplace")}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center justify-center text-xl">
                            🌾
                        </div>

                        <div className="text-left">
                            <h1 className="text-xl font-bold text-gray-900">
                                F2C
                            </h1>

                            <p className="text-[10px] uppercase tracking-[0.2em] text-green-700 font-semibold">
                                Farm to Customer
                            </p>
                        </div>
                    </button>


                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => navigate("/marketplace")}
                            className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-600 hover:text-green-700"
                        >
                            Marketplace
                        </button>

                        <button
                            onClick={() => navigate("/orders")}
                            className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-600 hover:text-green-700"
                        >
                            My Orders
                        </button>

                        <button
                            onClick={() => navigate("/cart")}
                            className="px-4 py-2 rounded-xl bg-green-50 text-green-700 font-semibold text-sm hover:bg-green-100"
                        >
                            🛒 Cart
                        </button>

                    </div>

                </div>

            </nav>


            {/* MAIN */}

            <main className="max-w-5xl mx-auto px-5 lg:px-8 py-10">

                {/* HEADER */}

                <div className="mb-8">

                    <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-2">
                        Account
                    </p>

                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                        Your Profile
                    </h2>

                    <p className="mt-2 text-gray-500">
                        Manage your personal information and delivery details.
                    </p>

                </div>


                {/* PROFILE CARD */}

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                    {/* PROFILE HEADER */}

                    <div className="bg-gradient-to-r from-green-800 to-green-600 px-6 md:px-10 py-8">

                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

                            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl text-white font-bold border border-white/20">
                                {profile.name
                                    ? profile.name.charAt(0).toUpperCase()
                                    : "U"}
                            </div>

                            <div className="text-white">

                                <h3 className="text-2xl font-bold">
                                    {profile.name || "Customer"}
                                </h3>

                                <p className="text-green-100 mt-1">
                                    {profile.email}
                                </p>

                                <span className="inline-block mt-3 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold">
                                    CUSTOMER
                                </span>

                            </div>

                        </div>

                    </div>


                    {/* FORM */}

                    <form
                        onSubmit={handleSubmit}
                        className="p-6 md:p-10"
                    >

                        {/* MESSAGE */}

                        {message && (
                            <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm font-medium">
                                ✓ {message}
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-medium">
                                {error}
                            </div>
                        )}


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* NAME */}

                            <div>

                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleChange}
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition"
                                    required
                                />

                            </div>


                            {/* EMAIL */}

                            <div>

                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                                />

                                <p className="text-xs text-gray-400 mt-2">
                                    Email cannot be changed.
                                </p>

                            </div>


                            {/* PHONE */}

                            <div>

                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    placeholder="Enter your phone number"
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition"
                                />

                            </div>


                            {/* ROLE */}

                            <div>

                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Account Type
                                </label>

                                <input
                                    type="text"
                                    value="Customer"
                                    disabled
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                                />

                            </div>

                        </div>


                        {/* ADDRESS */}

                        <div className="mt-6">

                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Delivery Address
                            </label>

                            <textarea
                                name="address"
                                value={profile.address}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Enter your complete delivery address"
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition resize-none"
                            />

                        </div>


                        {/* ACTIONS */}

                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-4">

                            <button
                                type="button"
                                onClick={() => navigate("/orders")}
                                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                            >
                                View My Orders
                            </button>


                            <button
                                type="submit"
                                disabled={saving}
                                className="px-7 py-3 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg shadow-green-700/20"
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>

                        </div>

                    </form>

                </div>

            </main>

        </div>
    );
}

export default Profile;