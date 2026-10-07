import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Eye,
    EyeOff,
    Leaf,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sprout,
    Store,
    TrendingUp,
    Users,
    Wheat
} from "lucide-react";
import API from "../services/api";

function FarmerLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!email || !password) {
            setError("Please enter email and password.");
            return;
        }

        try {
            setLoading(true);

            const response = await API.post("/auth/login", {
                email,
                password
            });

            const { token, user } = response.data;

            if (user.role !== "farmer") {
                setError("This account is not registered as a farmer.");
                return;
            }

            localStorage.setItem("farmerToken", token);
            localStorage.setItem("farmerUser", JSON.stringify(user));

            navigate("/farmer/dashboard");
        } catch (error) {
            console.error("Farmer login error:", error);

            setError(
                error.response?.data?.message ||
                "Login failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f7faf5]">

            {/* Top Navigation */}
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
                        to="/login"
                        className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-green-50 hover:text-green-700"
                    >
                        Customer Login
                    </Link>

                </div>
            </header>

            {/* Main */}
            <main className="relative flex min-h-[calc(100vh-73px)] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">

                {/* Background decoration */}
                <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-green-200/30 blur-3xl" />
                <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-lime-200/30 blur-3xl" />

                <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-gray-200/70 bg-white shadow-[0_25px_80px_-25px_rgba(22,101,52,0.25)] lg:grid-cols-[1.05fr_0.95fr]">

                    {/* ================= LEFT PANEL ================= */}
                    <div className="relative hidden overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-green-800 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">

                        {/* Decorative circles */}
                        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
                        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border border-white/10" />
                        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-green-700/30 blur-2xl" />

                        <div className="relative z-10">

                            {/* Brand icon */}
                            <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-xl backdrop-blur">
                                <Wheat size={31} strokeWidth={1.8} />
                            </div>

                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-300/20 bg-green-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-green-200">
                                <Sprout size={14} />
                                Farmer Portal
                            </div>

                            <h1 className="max-w-lg text-4xl font-black leading-[1.12] tracking-tight xl:text-5xl">
                                Grow more.
                                <br />
                                Sell smarter.
                                <br />
                                <span className="text-green-300">
                                    Reach further.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-lg text-[15px] leading-7 text-green-100/80">
                                Connect directly with customers and turn your
                                farm produce into a growing digital business.
                                Manage products, orders and sales from one
                                powerful platform.
                            </p>

                            {/* Feature cards */}
                            <div className="mt-9 grid grid-cols-2 gap-3">

                                <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                                    <Store
                                        size={21}
                                        className="mb-3 text-green-300"
                                    />

                                    <p className="text-sm font-bold">
                                        Digital Store
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-green-100/60">
                                        Showcase your farm products
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                                    <TrendingUp
                                        size={21}
                                        className="mb-3 text-green-300"
                                    />

                                    <p className="text-sm font-bold">
                                        Grow Sales
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-green-100/60">
                                        Reach more customers directly
                                    </p>
                                </div>

                            </div>

                        </div>

                        {/* Bottom trust section */}
                        <div className="relative z-10 mt-10 flex items-center justify-between border-t border-white/10 pt-6">

                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                                    <Users size={17} />
                                </div>

                                <div>
                                    <p className="text-xs font-bold">
                                        Direct connection
                                    </p>

                                    <p className="text-[11px] text-green-100/60">
                                        Farmer → Customer
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-semibold text-green-200">
                                <ShieldCheck size={17} />
                                Secure platform
                            </div>

                        </div>

                    </div>

                    {/* ================= RIGHT PANEL ================= */}
                    <div className="p-6 sm:p-9 lg:p-12 xl:p-14">

                        {/* Mobile brand */}
                        <div className="mb-8 flex items-center gap-3 lg:hidden">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-700 text-white">
                                <Leaf size={21} />
                            </div>

                            <div>
                                <p className="font-black text-gray-900">
                                    F2C
                                </p>

                                <p className="text-[11px] text-gray-500">
                                    Farmer to Consumer
                                </p>
                            </div>

                        </div>

                        {/* Heading */}
                        <div className="mb-8">

                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                                <Sprout size={14} />
                                Welcome back, Farmer
                            </div>

                            <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                                Sign in to your
                                <span className="text-green-700">
                                    {" "}farm.
                                </span>
                            </h2>

                            <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
                                Manage your products, track orders and grow
                                your business from your farmer dashboard.
                            </p>

                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">

                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
                                    !
                                </div>

                                <p>{error}</p>

                            </div>
                        )}

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >

                            {/* Email */}
                            <div>

                                <label className="mb-2.5 block text-sm font-bold text-gray-700">
                                    Email address
                                </label>

                                <div className="group relative">

                                    <Mail
                                        size={19}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-green-600"
                                    />

                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="farmer@example.com"
                                        autoComplete="email"
                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                                    />

                                </div>

                            </div>

                            {/* Password */}
                            <div>

                                <div className="mb-2.5 flex items-center justify-between">

                                    <label className="text-sm font-bold text-gray-700">
                                        Password
                                    </label>

                                </div>

                                <div className="group relative">

                                    <LockKeyhole
                                        size={19}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-green-600"
                                    />

                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-12 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
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

                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 py-4 text-sm font-extrabold text-white shadow-lg shadow-green-700/20 transition duration-300 hover:-translate-y-0.5 hover:bg-green-800 hover:shadow-xl hover:shadow-green-700/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Signing you in...
                                    </>
                                ) : (
                                    <>
                                        Login as Farmer
                                        <ArrowRight
                                            size={18}
                                            className="transition-transform duration-300 group-hover:translate-x-1"
                                        />
                                    </>
                                )}
                            </button>

                        </form>

                        {/* Divider */}
                        <div className="my-8 flex items-center gap-4">

                            <div className="h-px flex-1 bg-gray-200" />

                            <span className="text-[10px] font-extrabold tracking-[0.18em] text-gray-400">
                                NEW FARMER
                            </span>

                            <div className="h-px flex-1 bg-gray-200" />

                        </div>

                        {/* Register */}
                        <Link
                            to="/farmer/register"
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 py-3.5 text-sm font-extrabold text-green-800 transition duration-300 hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-100"
                        >
                            Create Farmer Account

                            <ArrowRight
                                size={17}
                                className="transition-transform duration-300 group-hover:translate-x-1"
                            />
                        </Link>

                        {/* Security note */}
                        <div className="mt-7 flex items-center justify-center gap-2 text-center text-[11px] text-gray-400">
                            <ShieldCheck size={14} />
                            <span>
                                Your account information is securely protected.
                            </span>
                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default FarmerLogin;