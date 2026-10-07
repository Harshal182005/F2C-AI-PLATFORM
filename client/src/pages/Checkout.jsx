import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronRight,
    CreditCard,
    Leaf,
    Loader2,
    MapPin,
    Phone,
    ShieldCheck,
    ShoppingBag,
    Truck,
    Wallet,
    X,
    AlertCircle
} from "lucide-react";

import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

function Checkout() {
    const navigate = useNavigate();

    const { user } = useAuth();
    const { cart, refreshCart } = useCart();

    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");

    const [paymentMethod, setPaymentMethod] = useState("COD");

    const [loading, setLoading] = useState(false);
    const [razorpayLoading, setRazorpayLoading] = useState(false);

    const [error, setError] = useState("");
    const [razorpayReady, setRazorpayReady] = useState(
        !!window.Razorpay
    );

    // =========================================================
    // CART ITEMS
    // =========================================================

    const items = cart?.items || [];

    // =========================================================
    // TOTALS
    // =========================================================

    const subtotal = useMemo(() => {
        return items.reduce((total, item) => {
            const price = Number(item?.product?.price || 0);
            const quantity = Number(item?.quantity || 0);

            return total + price * quantity;
        }, 0);
    }, [items]);

    const deliveryFee =
        subtotal === 0 || subtotal >= 500 ? 0 : 40;

    const totalAmount = subtotal + deliveryFee;

    // =========================================================
    // LOAD RAZORPAY
    // =========================================================

    useEffect(() => {
        if (window.Razorpay) {
            setRazorpayReady(true);
            return;
        }

        const existingScript = document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        );

        if (existingScript) {
            existingScript.addEventListener("load", () => {
                setRazorpayReady(true);
            });

            return;
        }

        const script = document.createElement("script");

        script.src =
            "https://checkout.razorpay.com/v1/checkout.js";

        script.async = true;

        script.onload = () => {
            setRazorpayReady(true);
        };

        script.onerror = () => {
            setRazorpayReady(false);
        };

        document.body.appendChild(script);

        return () => {
            script.onload = null;
            script.onerror = null;
        };
    }, []);

    // =========================================================
    // PREFILL CUSTOMER DETAILS
    // =========================================================

    useEffect(() => {
        if (user) {
            setAddress(user.address || "");
            setPhone(user.phone || "");
        }
    }, [user]);

    // =========================================================
    // AUTH ERROR
    // =========================================================

    const handleUnauthorized = () => {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerUser");

        navigate("/login");
    };

    // =========================================================
    // CREATE F2C ORDER
    // =========================================================

    const createF2COrder = async () => {
        const token = localStorage.getItem("customerToken");

        if (!token) {
            handleUnauthorized();
            throw new Error("Please login to continue.");
        }

        try {
            const response = await API.post(
                "/orders",
                {
                    deliveryAddress: address.trim(),
                    phone: phone.trim(),
                    paymentMethod
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return response.data.order;
        } catch (error) {
            console.error(
                "CREATE F2C ORDER BACKEND RESPONSE:",
                error.response?.data
            );

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                handleUnauthorized();
            }

            throw error;
        }
    };

    // =========================================================
    // COD
    // =========================================================

    const handleCODPayment = async () => {
        const order = await createF2COrder();

        await refreshCart();

        navigate(`/orders/${order._id}`);
    };

    // =========================================================
    // RAZORPAY
    // =========================================================

    const handleRazorpayPayment = async () => {
        const token =
            localStorage.getItem("customerToken");

        if (!token) {
            handleUnauthorized();
            return;
        }

        if (!RAZORPAY_KEY_ID) {
            throw new Error(
                "Razorpay is not configured. Please check your environment settings."
            );
        }

        if (!window.Razorpay) {
            throw new Error(
                "Razorpay Checkout is still loading. Please try again."
            );
        }

        setRazorpayLoading(true);

        try {
            // ---------------------------------------------
            // 1. CREATE F2C ORDER
            // ---------------------------------------------

            const f2cOrder =
                await createF2COrder();

            // ---------------------------------------------
            // 2. CREATE RAZORPAY ORDER
            // ---------------------------------------------

            const razorpayResponse =
                await API.post(
                    "/payments/create-order",
                    {
                        orderId: f2cOrder._id
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const razorpayOrder =
                razorpayResponse.data.order;

            // ---------------------------------------------
            // 3. RAZORPAY OPTIONS
            // ---------------------------------------------

            const options = {
                key: RAZORPAY_KEY_ID,

                amount:
                    razorpayOrder.amount,

                currency:
                    razorpayOrder.currency,

                name: "F2C AI Platform",

                description:
                    "Farmer to Consumer Order",

                order_id:
                    razorpayOrder.id,

                prefill: {
                    name:
                        user?.name || "",

                    email:
                        user?.email || "",

                    contact:
                        phone || ""
                },

                notes: {
                    f2cOrderId:
                        f2cOrder._id
                },

                theme: {
                    color: "#16a34a"
                },

                handler: async function (
                    paymentResponse
                ) {
                    try {
                        setError("");

                        // ---------------------------------
                        // VERIFY PAYMENT
                        // ---------------------------------

                        const verifyResponse =
                            await API.post(
                                "/payments/verify",
                                {
                                    orderId:
                                        f2cOrder._id,

                                    razorpay_order_id:
                                        paymentResponse.razorpay_order_id,

                                    razorpay_payment_id:
                                        paymentResponse.razorpay_payment_id,

                                    razorpay_signature:
                                        paymentResponse.razorpay_signature
                                },
                                {
                                    headers: {
                                        Authorization:
                                            `Bearer ${token}`
                                    }
                                }
                            );

                        if (
                            verifyResponse.data.success
                        ) {
                            await refreshCart();

                            navigate(
                                `/orders/${f2cOrder._id}`
                            );
                        } else {
                            setError(
                                "Payment verification failed. Please contact support if money was deducted."
                            );
                        }
                    } catch (error) {
                        console.error(
                            "Payment verification error:",
                            error
                        );

                        if (
                            error.response?.status === 401 ||
                            error.response?.status === 403
                        ) {
                            handleUnauthorized();
                            return;
                        }

                        setError(
                            error.response?.data?.message ||
                            "Payment verification failed. Please contact support if money was deducted."
                        );
                    } finally {
                        setRazorpayLoading(false);
                    }
                },

                modal: {
                    ondismiss: function () {
                        setRazorpayLoading(false);

                        setError(
                            "Payment was cancelled. Your order has not been completed."
                        );
                    }
                }
            };

            // ---------------------------------------------
            // OPEN RAZORPAY
            // ---------------------------------------------

            const razorpay =
                new window.Razorpay(options);

            razorpay.on(
                "payment.failed",
                function (response) {
                    console.error(
                        "Razorpay payment failed:",
                        response.error
                    );

                    setRazorpayLoading(false);

                    setError(
                        response.error?.description ||
                        "Payment failed. Please try again."
                    );
                }
            );

            razorpay.open();
        } catch (error) {
            setRazorpayLoading(false);
            throw error;
        }
    };

    // =========================================================
    // PLACE ORDER
    // =========================================================

    const handlePlaceOrder = async () => {
        try {
            setError("");

            // ---------------------------------------------
            // AUTH
            // ---------------------------------------------

            const token =
                localStorage.getItem("customerToken");

            if (!token) {
                handleUnauthorized();
                return;
            }

            // ---------------------------------------------
            // ADDRESS
            // ---------------------------------------------

            if (!address.trim()) {
                setError(
                    "Please enter your complete delivery address."
                );
                return;
            }

            if (address.trim().length < 10) {
                setError(
                    "Please enter a more complete delivery address."
                );
                return;
            }

            // ---------------------------------------------
            // PHONE
            // ---------------------------------------------

            const cleanPhone =
                phone.replace(/\D/g, "");

            if (!cleanPhone) {
                setError(
                    "Please enter your phone number."
                );
                return;
            }

            if (cleanPhone.length !== 10) {
                setError(
                    "Please enter a valid 10-digit phone number."
                );
                return;
            }

            // ---------------------------------------------
            // CART
            // ---------------------------------------------

            if (!items.length) {
                setError(
                    "Your cart is empty."
                );
                return;
            }

            // ---------------------------------------------
            // PRODUCT VALIDATION
            // ---------------------------------------------

            const invalidItem = items.find(
                (item) => {
                    const product =
                        item?.product;

                    const requestedQuantity =
                        Number(item?.quantity || 0);

                    const availableQuantity =
                        Number(product?.quantity || 0);

                    return (
                        !product ||
                        requestedQuantity <= 0 ||
                        requestedQuantity >
                            availableQuantity
                    );
                }
            );

            if (invalidItem) {
                setError(
                    "One or more products in your cart no longer have enough stock. Please review your cart."
                );
                return;
            }

            setLoading(true);

            // ---------------------------------------------
            // PAYMENT
            // ---------------------------------------------

            if (paymentMethod === "COD") {
                await handleCODPayment();
            } else {
                await handleRazorpayPayment();
            }
        } catch (error) {
            console.error(
                "Checkout error:",
                error
            );

            setError(
                error.response?.data?.message ||
                error.message ||
                "Something went wrong while placing your order."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // EMPTY CART
    // =========================================================

    if (!items.length) {
        return (
            <div className="min-h-screen bg-[#f6f8f3]">

                <header className="border-b border-gray-100 bg-white">

                    <div className="mx-auto flex h-20 max-w-7xl items-center px-4 sm:px-6 lg:px-8">

                        <Link
                            to="/marketplace"
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 shadow-lg shadow-green-600/20">
                                <Leaf
                                    size={21}
                                    className="text-white"
                                />
                            </div>

                            <div>
                                <p className="text-xl font-extrabold text-gray-900">
                                    F2C
                                </p>

                                <p className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-green-600 sm:block">
                                    Farm to Customer
                                </p>
                            </div>
                        </Link>

                    </div>

                </header>

                <main className="flex min-h-[75vh] items-center justify-center px-6">

                    <div className="w-full max-w-md rounded-[2rem] border border-gray-100 bg-white p-10 text-center shadow-sm">

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50">
                            <ShoppingBag
                                size={36}
                                className="text-green-600"
                            />
                        </div>

                        <h1 className="mt-7 text-3xl font-black text-gray-900">
                            Your cart is empty
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-gray-500">
                            Add some fresh products from local
                            farmers before proceeding to checkout.
                        </p>

                        <button
                            onClick={() =>
                                navigate("/marketplace")
                            }
                            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
                        >
                            Browse Marketplace
                            <ArrowRight size={18} />
                        </button>

                    </div>

                </main>

            </div>
        );
    }

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="min-h-screen bg-[#f6f8f3]">

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">

                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    <Link
                        to="/marketplace"
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 shadow-lg shadow-green-600/20">
                            <Leaf
                                size={21}
                                strokeWidth={2.5}
                                className="text-white"
                            />
                        </div>

                        <div>
                            <p className="text-xl font-extrabold tracking-tight text-gray-900">
                                F2C
                            </p>

                            <p className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-green-600 sm:block">
                                Farm to Customer
                            </p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700">

                        <ShieldCheck size={18} />

                        <span className="hidden sm:inline">
                            Secure Checkout
                        </span>

                    </div>

                </div>

            </header>


            {/* ================================================= */}
            {/* MAIN */}
            {/* ================================================= */}

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">

                {/* BREADCRUMB */}

                <div className="flex items-center gap-2 text-sm text-gray-400">

                    <Link
                        to="/marketplace"
                        className="transition hover:text-green-600"
                    >
                        Marketplace
                    </Link>

                    <ChevronRight size={15} />

                    <Link
                        to="/cart"
                        className="transition hover:text-green-600"
                    >
                        Cart
                    </Link>

                    <ChevronRight size={15} />

                    <span className="font-medium text-gray-700">
                        Checkout
                    </span>

                </div>


                {/* PAGE HEADER */}

                <div className="mt-7 mb-8">

                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                        <div>

                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-600">
                                Almost there
                            </p>

                            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                                Complete your order
                            </h1>

                            <p className="mt-2 text-sm text-gray-500 sm:text-base">
                                Enter your delivery details and choose
                                your preferred payment method.
                            </p>

                        </div>

                        <Link
                            to="/cart"
                            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-green-200 hover:text-green-700"
                        >
                            <ArrowLeft size={16} />
                            Back to Cart
                        </Link>

                    </div>

                </div>


                {/* ================================================= */}
                {/* ERROR */}
                {/* ================================================= */}

                {error && (

                    <div className="mb-7 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">

                        <AlertCircle
                            size={19}
                            className="mt-0.5 shrink-0"
                        />

                        <div className="flex-1">

                            <p className="font-semibold">
                                Unable to continue
                            </p>

                            <p className="mt-0.5 leading-5">
                                {error}
                            </p>

                        </div>

                        <button
                            onClick={() => setError("")}
                            className="rounded-lg p-1 transition hover:bg-red-100"
                            aria-label="Close error"
                        >
                            <X size={16} />
                        </button>

                    </div>

                )}


                {/* ================================================= */}
                {/* CHECKOUT GRID */}
                {/* ================================================= */}

                <div className="grid items-start gap-7 lg:grid-cols-[1fr_390px]">

                    {/* ================================================= */}
                    {/* LEFT */}
                    {/* ================================================= */}

                    <div className="space-y-7">

                        {/* --------------------------------------------- */}
                        {/* DELIVERY */}
                        {/* --------------------------------------------- */}

                        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

                            <div className="border-b border-gray-100 px-6 py-5 sm:px-7">

                                <div className="flex items-center gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50">
                                        <MapPin
                                            size={21}
                                            className="text-green-600"
                                        />
                                    </div>

                                    <div>

                                        <h2 className="text-xl font-bold text-gray-900">
                                            Delivery details
                                        </h2>

                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Where should we deliver your order?
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="space-y-6 p-6 sm:p-7">

                                {/* ADDRESS */}

                                <div>

                                    <label className="mb-2.5 flex items-center justify-between text-sm font-semibold text-gray-700">

                                        <span>
                                            Delivery Address
                                        </span>

                                        <span className="text-xs font-normal text-gray-400">
                                            Required
                                        </span>

                                    </label>

                                    <div className="relative">

                                        <MapPin
                                            size={18}
                                            className="pointer-events-none absolute left-4 top-4 text-gray-400"
                                        />

                                        <textarea
                                            value={address}
                                            onChange={(e) => {
                                                setAddress(
                                                    e.target.value
                                                );
                                                setError("");
                                            }}
                                            rows={4}
                                            placeholder="House / Flat No., Street, Area, City, State, PIN code"
                                            className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                                        />

                                    </div>

                                </div>


                                {/* PHONE */}

                                <div>

                                    <label className="mb-2.5 flex items-center justify-between text-sm font-semibold text-gray-700">

                                        <span>
                                            Phone Number
                                        </span>

                                        <span className="text-xs font-normal text-gray-400">
                                            10 digits
                                        </span>

                                    </label>

                                    <div className="relative">

                                        <Phone
                                            size={18}
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => {
                                                const value =
                                                    e.target.value
                                                        .replace(
                                                            /\D/g,
                                                            ""
                                                        )
                                                        .slice(
                                                            0,
                                                            10
                                                        );

                                                setPhone(value);
                                                setError("");
                                            }}
                                            placeholder="Enter 10-digit mobile number"
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                                        />

                                    </div>

                                </div>

                                {/* INFO */}

                                <div className="flex items-start gap-3 rounded-2xl bg-green-50 px-4 py-3.5">

                                    <Truck
                                        size={18}
                                        className="mt-0.5 shrink-0 text-green-600"
                                    />

                                    <p className="text-xs leading-5 text-green-800">
                                        Your order will be delivered to
                                        the address provided above by the
                                        farmer or delivery partner.
                                    </p>

                                </div>

                            </div>

                        </section>


                        {/* --------------------------------------------- */}
                        {/* PAYMENT */}
                        {/* --------------------------------------------- */}

                        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

                            <div className="border-b border-gray-100 px-6 py-5 sm:px-7">

                                <div className="flex items-center gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50">
                                        <Wallet
                                            size={21}
                                            className="text-green-600"
                                        />
                                    </div>

                                    <div>

                                        <h2 className="text-xl font-bold text-gray-900">
                                            Payment method
                                        </h2>

                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Choose how you'd like to pay.
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="space-y-4 p-6 sm:p-7">

                                {/* COD */}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPaymentMethod("COD");
                                        setError("");
                                    }}
                                    className={`w-full rounded-2xl border p-5 text-left transition-all ${
                                        paymentMethod === "COD"
                                            ? "border-green-500 bg-green-50/70 ring-2 ring-green-500/10"
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >

                                    <div className="flex items-center gap-4">

                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                                paymentMethod === "COD"
                                                    ? "bg-green-600 text-white"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            <Truck size={22} />
                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <div className="flex flex-wrap items-center gap-2">

                                                <p className="font-bold text-gray-900">
                                                    Cash on Delivery
                                                </p>

                                                {paymentMethod ===
                                                    "COD" && (
                                                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                                                        <Check size={11} />
                                                        SELECTED
                                                    </span>
                                                )}

                                            </div>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Pay when your order arrives.
                                            </p>

                                        </div>

                                        <div
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                                paymentMethod === "COD"
                                                    ? "border-green-600 bg-green-600"
                                                    : "border-gray-300"
                                            }`}
                                        >
                                            {paymentMethod ===
                                                "COD" && (
                                                <Check
                                                    size={12}
                                                    strokeWidth={3}
                                                    className="text-white"
                                                />
                                            )}
                                        </div>

                                    </div>

                                </button>


                                {/* RAZORPAY */}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPaymentMethod(
                                            "RAZORPAY"
                                        );
                                        setError("");
                                    }}
                                    className={`w-full rounded-2xl border p-5 text-left transition-all ${
                                        paymentMethod ===
                                        "RAZORPAY"
                                            ? "border-green-500 bg-green-50/70 ring-2 ring-green-500/10"
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >

                                    <div className="flex items-center gap-4">

                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                                paymentMethod ===
                                                "RAZORPAY"
                                                    ? "bg-green-600 text-white"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            <CreditCard size={22} />
                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <div className="flex flex-wrap items-center gap-2">

                                                <p className="font-bold text-gray-900">
                                                    Online Payment
                                                </p>

                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                                                    RAZORPAY
                                                </span>

                                            </div>

                                            <p className="mt-1 text-sm text-gray-500">
                                                UPI, cards, net banking and
                                                more.
                                            </p>

                                        </div>

                                        <div
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                                paymentMethod ===
                                                "RAZORPAY"
                                                    ? "border-green-600 bg-green-600"
                                                    : "border-gray-300"
                                            }`}
                                        >
                                            {paymentMethod ===
                                                "RAZORPAY" && (
                                                <Check
                                                    size={12}
                                                    strokeWidth={3}
                                                    className="text-white"
                                                />
                                            )}
                                        </div>

                                    </div>

                                </button>

                                {paymentMethod ===
                                    "RAZORPAY" && (
                                    <div className="flex items-start gap-3 rounded-2xl bg-blue-50 px-4 py-3.5">

                                        <ShieldCheck
                                            size={18}
                                            className="mt-0.5 shrink-0 text-blue-600"
                                        />

                                        <p className="text-xs leading-5 text-blue-800">
                                            You'll be redirected to
                                            Razorpay's secure payment
                                            window to complete your
                                            transaction.
                                        </p>

                                    </div>
                                )}

                            </div>

                        </section>

                    </div>


                    {/* ================================================= */}
                    {/* RIGHT SUMMARY */}
                    {/* ================================================= */}

                    <aside className="lg:sticky lg:top-24">

                        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

                            {/* HEADER */}

                            <div className="border-b border-gray-100 px-6 py-5">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-green-600">
                                            Your order
                                        </p>

                                        <h2 className="mt-1 text-xl font-bold text-gray-900">
                                            Order Summary
                                        </h2>

                                    </div>

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                                        <ShoppingBag
                                            size={20}
                                            className="text-green-600"
                                        />
                                    </div>

                                </div>

                            </div>


                            {/* ITEMS */}

                            <div className="max-h-[360px] space-y-4 overflow-y-auto px-6 py-5">

                                {items.map((item) => {

                                    const product =
                                        item?.product;

                                    if (!product) {
                                        return null;
                                    }

                                    const price =
                                        Number(
                                            product.price || 0
                                        );

                                    const quantity =
                                        Number(
                                            item.quantity || 0
                                        );

                                    return (
                                        <div
                                            key={
                                                product._id
                                            }
                                            className="flex gap-3"
                                        >

                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">

                                                {product.images?.[0] ? (
                                                    <img
                                                        src={
                                                            product.images[0]
                                                        }
                                                        alt={
                                                            product.name
                                                        }
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <Leaf
                                                            size={22}
                                                            className="text-green-300"
                                                        />
                                                    </div>
                                                )}

                                            </div>

                                            <div className="min-w-0 flex-1">

                                                <p className="truncate text-sm font-semibold text-gray-900">
                                                    {product.name}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    {quantity} × ₹
                                                    {price.toFixed(
                                                        2
                                                    )}
                                                </p>

                                            </div>

                                            <p className="shrink-0 text-sm font-bold text-gray-900">
                                                ₹
                                                {(
                                                    price *
                                                    quantity
                                                ).toFixed(2)}
                                            </p>

                                        </div>
                                    );
                                })}

                            </div>


                            {/* PRICE */}

                            <div className="border-t border-gray-100 px-6 py-5">

                                <div className="space-y-3 text-sm">

                                    <div className="flex justify-between">

                                        <span className="text-gray-500">
                                            Subtotal
                                        </span>

                                        <span className="font-semibold text-gray-900">
                                            ₹
                                            {subtotal.toFixed(
                                                2
                                            )}
                                        </span>

                                    </div>

                                    <div className="flex justify-between">

                                        <span className="flex items-center gap-2 text-gray-500">
                                            <Truck size={15} />
                                            Delivery
                                        </span>

                                        <span
                                            className={`font-semibold ${
                                                deliveryFee ===
                                                0
                                                    ? "text-green-600"
                                                    : "text-gray-900"
                                            }`}
                                        >
                                            {deliveryFee ===
                                            0
                                                ? "FREE"
                                                : `₹${deliveryFee}`}
                                        </span>

                                    </div>

                                </div>


                                {/* FREE DELIVERY */}

                                {subtotal >= 500 && (
                                    <div className="mt-5 flex items-center gap-2 rounded-xl bg-green-50 px-3.5 py-3 text-xs font-semibold text-green-700">

                                        <Check
                                            size={15}
                                            strokeWidth={3}
                                        />

                                        You've unlocked free delivery!

                                    </div>
                                )}


                                {/* TOTAL */}

                                <div className="mt-5 border-t border-gray-100 pt-5">

                                    <div className="flex items-end justify-between">

                                        <div>

                                            <p className="text-xs text-gray-500">
                                                Total payable
                                            </p>

                                            <p className="mt-1 text-2xl font-black text-gray-900">
                                                ₹
                                                {totalAmount.toFixed(
                                                    2
                                                )}
                                            </p>

                                        </div>

                                        <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold text-green-700">
                                            INR
                                        </span>

                                    </div>

                                </div>


                                {/* PLACE ORDER */}

                                <button
                                    type="button"
                                    onClick={
                                        handlePlaceOrder
                                    }
                                    disabled={
                                        loading ||
                                        razorpayLoading
                                    }
                                    className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 font-bold text-white shadow-lg shadow-green-600/20 transition-all hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                                >

                                    {loading ||
                                    razorpayLoading ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />

                                            {paymentMethod ===
                                            "RAZORPAY"
                                                ? "Opening Secure Payment..."
                                                : "Placing Order..."}
                                        </>
                                    ) : (
                                        <>
                                            {paymentMethod ===
                                            "COD"
                                                ? "Place Order"
                                                : `Pay ₹${totalAmount.toFixed(
                                                      2
                                                  )}`}

                                            <ArrowRight
                                                size={18}
                                                className="transition-transform group-hover:translate-x-1"
                                            />
                                        </>
                                    )}

                                </button>


                                {/* SECURITY */}

                                <div className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-gray-400">

                                    <ShieldCheck size={14} />

                                    Secure checkout • Your details are protected

                                </div>

                            </div>

                        </div>


                        {/* TRUST FEATURES */}

                        <div className="mt-4 grid grid-cols-2 gap-3">

                            <div className="rounded-2xl border border-gray-100 bg-white p-4">

                                <Truck
                                    size={18}
                                    className="text-green-600"
                                />

                                <p className="mt-2 text-xs font-bold text-gray-900">
                                    Fresh Delivery
                                </p>

                                <p className="mt-1 text-[10px] leading-4 text-gray-400">
                                    Direct from local farmers
                                </p>

                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-white p-4">

                                <ShieldCheck
                                    size={18}
                                    className="text-green-600"
                                />

                                <p className="mt-2 text-xs font-bold text-gray-900">
                                    Secure Payment
                                </p>

                                <p className="mt-1 text-[10px] leading-4 text-gray-400">
                                    Safe and protected checkout
                                </p>

                            </div>

                        </div>

                    </aside>

                </div>

            </main>


            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            <footer className="mt-10 border-t border-gray-100 bg-white">

                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-7 sm:flex-row sm:px-6 lg:px-8">

                    <Link
                        to="/marketplace"
                        className="flex items-center gap-2.5"
                    >

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600">
                            <Leaf
                                size={17}
                                className="text-white"
                            />
                        </div>

                        <div>

                            <p className="font-bold text-gray-900">
                                F2C
                            </p>

                            <p className="text-[10px] text-gray-400">
                                Farm to Customer
                            </p>

                        </div>

                    </Link>

                    <p className="text-center text-xs text-gray-400">
                        Fresh food. Fair prices. Direct from farmers.
                    </p>

                </div>

            </footer>

        </div>
    );
}

export default Checkout;