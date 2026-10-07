import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    Leaf,
    LockKeyhole,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Sprout,
    Store,
    User,
    Wheat
} from "lucide-react";
import API from "../services/api";

function FarmerRegister() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        const {
            name,
            email,
            password,
            phone,
            address
        } = formData;

        if (!name || !email || !password || !phone || !address) {
            setError("Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            setError("Password must contain at least 6 characters.");
            return;
        }

        try {
            setLoading(true);

            const response = await API.post("/auth/register", {
                name,
                email,
                password,
                phone,
                address,
                role: "farmer"
            });

            console.log(response.data);

            navigate("/farmer/login");
        } catch (error) {
            console.error("Farmer registration error:", error);

            setError(
                error.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f7faf5]">

            {/* ================= HEADER ================= */}
            <header className="border-b border-gray-100 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

                    <Link
                        to="/"
                        className="group flex items-center gap-3"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-700 text-white shadow-lg shadow-green-700/20 transition duration-300 group-hover:scale-105">
                            <Leaf size={22} strokeWidth={2.5} />
                        </div>

                        <div>
                            <p className="text-lg font-black tracking-tight text-gray-900">
                                F2C
                            </p>

                            <p className="text-[11px] font-medium text-gray-500">
                                Farmer to Consumer
                            </p>
                        </div>
                    </Link>

                    <Link
                        to="/farmer/login"
                        className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-green-50 hover:text-green-700"
                    >
                        Farmer Login
                    </Link>

                </div>
            </header>

            {/* ================= MAIN ================= */}
            <main className="relative overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

                {/* Background decoration */}
                <div className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full bg-green-200/30 blur-3xl" />
                <div className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-lime-200/30 blur-3xl" />

                <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-gray-200/70 bg-white shadow-[0_25px_80px_-25px_rgba(22,101,52,0.22)]">

                    {/* ================= TOP BANNER ================= */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-green-800 px-6 py-9 text-white sm:px-10 lg:px-14 lg:py-12">

                        {/* Decorative circles */}
                        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-white/10" />
                        <div className="absolute -right-2 -top-10 h-48 w-48 rounded-full border border-white/10" />
                        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-green-700/30 blur-3xl" />

                        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

                            <div className="max-w-3xl">

                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-300/20 bg-green-300/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-green-200">
                                    <Sprout size={14} />
                                    Join the F2C Network
                                </div>

                                <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                                    Turn your harvest into
                                    <span className="block text-green-300">
                                        a growing business.
                                    </span>
                                </h1>

                                <p className="mt-5 max-w-2xl text-sm leading-7 text-green-100/75 sm:text-[15px]">
                                    Create your farmer account and connect
                                    directly with customers looking for
                                    fresh, quality farm products.
                                </p>

                            </div>

                            <div className="hidden shrink-0 lg:flex">

                                <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl backdrop-blur">
                                    <Wheat
                                        size={54}
                                        strokeWidth={1.5}
                                    />
                                </div>

                            </div>

                        </div>

                        {/* Benefits */}
                        <div className="relative z-10 mt-9 grid gap-3 sm:grid-cols-3">

                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                    <Store size={18} />
                                </div>

                                <div>
                                    <p className="text-xs font-bold">
                                        Your Digital Store
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-green-100/55">
                                        Sell your products online
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                    <User size={18} />
                                </div>

                                <div>
                                    <p className="text-xs font-bold">
                                        Direct Customers
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-green-100/55">
                                        Connect without middlemen
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                    <CheckCircle2 size={18} />
                                </div>

                                <div>
                                    <p className="text-xs font-bold">
                                        Simple Management
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-green-100/55">
                                        Products and orders in one place
                                    </p>
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* ================= FORM SECTION ================= */}
                    <div className="p-6 sm:p-9 lg:p-12 xl:p-14">

                        <div className="max-w-3xl">

                            <div className="mb-8">

                                <div className="mb-3 flex items-center gap-2 text-green-700">
                                    <Sprout size={18} />
                                    <span className="text-xs font-extrabold uppercase tracking-[0.15em]">
                                        Create your account
                                    </span>
                                </div>

                                <h2 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                                    Farmer Account Details
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-gray-500">
                                    Tell us a little about yourself and your
                                    farm to get started.
                                </p>

                            </div>

                            {/* Error */}
                            {error && (
                                <div className="mb-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">

                                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
                                        !
                                    </div>

                                    <p>{error}</p>

                                </div>
                            )}

                            <form
                                onSubmit={handleSubmit}
                                className="grid gap-5 sm:grid-cols-2"
                            >

                                {/* Full Name */}
                                <div>
                                    <label className="mb-2.5 block text-sm font-bold text-gray-700">
                                        Full Name
                                    </label>

                                    <div className="group relative">

                                        <User
                                            size={18}
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-green-600"
                                        />

                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter your full name"
                                            autoComplete="name"
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                                        />

                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="mb-2.5 block text-sm font-bold text-gray-700">
                                        Email Address
                                    </label>

                                    <div className="group relative">

                                        <Mail
                                            size={18}
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-green-600"
                                        />

                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="farmer@example.com"
                                            autoComplete="email"
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                                        />

                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="mb-2.5 block text-sm font-bold text-gray-700">
                                        Phone Number
                                    </label>

                                    <div className="group relative">

                                        <Phone
                                            size={18}
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-green-600"
                                        />

                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Enter phone number"
                                            autoComplete="tel"
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                                        />

                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="mb-2.5 block text-sm font-bold text-gray-700">
                                        Password
                                    </label>

                                    <div className="group relative">

                                        <LockKeyhole
                                            size={18}
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-green-600"
                                        />

                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Minimum 6 characters"
                                            autoComplete="new-password"
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-12 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    !showPassword
                                                )
                                            }
                                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>

                                    </div>

                                    <p className="mt-2 text-[11px] text-gray-400">
                                        Use at least 6 characters for a secure
                                        password.
                                    </p>
                                </div>

                                {/* Address */}
                                <div className="sm:col-span-2">

                                    <label className="mb-2.5 block text-sm font-bold text-gray-700">
                                        Farm / Business Address
                                    </label>

                                    <div className="group relative">

                                        <MapPin
                                            size={18}
                                            className="pointer-events-none absolute left-4 top-4 text-gray-400 transition group-focus-within:text-green-600"
                                        />

                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows="4"
                                            placeholder="Enter your farm or business address"
                                            autoComplete="street-address"
                                            className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                                        />

                                    </div>

                                </div>

                                {/* Submit */}
                                <div className="sm:col-span-2 mt-2">

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 py-4 text-sm font-extrabold text-white shadow-lg shadow-green-700/20 transition duration-300 hover:-translate-y-0.5 hover:bg-green-800 hover:shadow-xl hover:shadow-green-700/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                Creating your account...
                                            </>
                                        ) : (
                                            <>
                                                Create Farmer Account
                                                <ArrowRight
                                                    size={18}
                                                    className="transition-transform duration-300 group-hover:translate-x-1"
                                                />
                                            </>
                                        )}
                                    </button>

                                </div>

                            </form>

                            {/* Login */}
                            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-7 sm:flex-row">

                                <p className="text-sm text-gray-500">
                                    Already have a farmer account?
                                    {" "}
                                    <Link
                                        to="/farmer/login"
                                        className="font-extrabold text-green-700 transition hover:text-green-800"
                                    >
                                        Login here
                                    </Link>
                                </p>

                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                    <ShieldCheck size={15} />
                                    Secure account registration
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default FarmerRegister;