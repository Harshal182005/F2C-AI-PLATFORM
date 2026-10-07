import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronRight,
    CircleAlert,
    Clock3,
    CreditCard,
    MapPin,
    Package,
    Phone,
    RefreshCw,
    ShoppingCart,
    Truck,
    User,
    X,
    XCircle,
    Loader2,
    Box,
    Settings,
    Sparkles
} from "lucide-react";

import API from "../services/api";

const STATUS_STEPS = [
    {
        key: "PLACED",
        label: "Order Placed",
        description: "Customer placed the order",
        icon: ShoppingCart
    },
    {
        key: "CONFIRMED",
        label: "Confirmed",
        description: "Farmer confirmed the order",
        icon: CheckCircle2
    },
    {
        key: "PROCESSING",
        label: "Processing",
        description: "Order is being prepared",
        icon: Settings
    },
    {
        key: "PACKED",
        label: "Packed",
        description: "Products have been packed",
        icon: Box
    },
    {
        key: "OUT_FOR_DELIVERY",
        label: "Out for Delivery",
        description: "Order is on its way",
        icon: Truck
    },
    {
        key: "DELIVERED",
        label: "Delivered",
        description: "Order delivered successfully",
        icon: CheckCircle2
    }
];

const STATUS_ORDER = [
    "PLACED",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "OUT_FOR_DELIVERY",
    "DELIVERED"
];

const getStatusIndex = (status) => {
    return STATUS_ORDER.indexOf(status);
};

const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const getNextStatus = (currentStatus) => {
    const flow = {
        PLACED: "CONFIRMED",
        CONFIRMED: "PROCESSING",
        PROCESSING: "PACKED",
        PACKED: "OUT_FOR_DELIVERY",
        OUT_FOR_DELIVERY: "DELIVERED"
    };

    return flow[currentStatus] || null;
};

const getNextButtonText = (currentStatus) => {
    const buttonText = {
        PLACED: "Confirm Order",
        CONFIRMED: "Start Processing",
        PROCESSING: "Mark as Packed",
        PACKED: "Send for Delivery",
        OUT_FOR_DELIVERY: "Mark as Delivered"
    };

    return buttonText[currentStatus] || null;
};

const getImageUrl = (image) => {
    if (!image || typeof image !== "string") {
        return "";
    }

    if (image.startsWith("[") && image.includes("](")) {
        const match = image.match(/\]\((.*?)\)/);

        if (match?.[1]) {
            return match[1];
        }
    }

    return image;
};

const getStatusColors = (status) => {
    switch (status) {
        case "PLACED":
            return {
                badge: "border-amber-200 bg-amber-50 text-amber-700",
                dot: "bg-amber-500",
                soft: "bg-amber-50",
                text: "text-amber-700"
            };

        case "CONFIRMED":
            return {
                badge: "border-blue-200 bg-blue-50 text-blue-700",
                dot: "bg-blue-500",
                soft: "bg-blue-50",
                text: "text-blue-700"
            };

        case "PROCESSING":
            return {
                badge: "border-violet-200 bg-violet-50 text-violet-700",
                dot: "bg-violet-500",
                soft: "bg-violet-50",
                text: "text-violet-700"
            };

        case "PACKED":
            return {
                badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
                dot: "bg-indigo-500",
                soft: "bg-indigo-50",
                text: "text-indigo-700"
            };

        case "OUT_FOR_DELIVERY":
            return {
                badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
                dot: "bg-cyan-500",
                soft: "bg-cyan-50",
                text: "text-cyan-700"
            };

        case "DELIVERED":
            return {
                badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
                dot: "bg-emerald-500",
                soft: "bg-emerald-50",
                text: "text-emerald-700"
            };

        case "CANCELLED":
            return {
                badge: "border-red-200 bg-red-50 text-red-700",
                dot: "bg-red-500",
                soft: "bg-red-50",
                text: "text-red-700"
            };

        default:
            return {
                badge: "border-slate-200 bg-slate-50 text-slate-600",
                dot: "bg-slate-400",
                soft: "bg-slate-50",
                text: "text-slate-600"
            };
    }
};

function FarmerOrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showCancelModal, setShowCancelModal] = useState(false);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("farmerToken");

            if (!token) {
                navigate("/farmer/login");
                return;
            }

            const response = await API.get(
                `/farmer/orders/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setOrder(response.data.order);
        } catch (error) {
            console.error("FETCH FARMER ORDER ERROR:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem("farmerToken");
                localStorage.removeItem("farmerUser");

                navigate("/farmer/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to load order details."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const updateStatus = async () => {
        const nextStatus = getNextStatus(order?.orderStatus);

        if (!nextStatus || updating) {
            return;
        }

        try {
            setUpdating(true);
            setError("");
            setSuccessMessage("");

            const token = localStorage.getItem("farmerToken");

            await API.put(
                `/farmer/orders/${id}/status`,
                {
                    status: nextStatus
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSuccessMessage(
                `Order updated to ${formatStatus(nextStatus)}`
            );

            await fetchOrder();
        } catch (error) {
            console.error("UPDATE ORDER STATUS ERROR:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem("farmerToken");
                localStorage.removeItem("farmerUser");

                navigate("/farmer/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to update order status."
            );
        } finally {
            setUpdating(false);
        }
    };

    const cancelOrder = async () => {
        if (
            !order ||
            updating ||
            !["PLACED", "CONFIRMED"].includes(
                order.orderStatus
            )
        ) {
            return;
        }

        try {
            setUpdating(true);
            setError("");
            setSuccessMessage("");
            setShowCancelModal(false);

            const token = localStorage.getItem("farmerToken");

            await API.put(
                `/farmer/orders/${id}/status`,
                {
                    status: "CANCELLED"
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSuccessMessage("Order cancelled successfully.");

            await fetchOrder();
        } catch (error) {
            console.error("CANCEL ORDER ERROR:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem("farmerToken");
                localStorage.removeItem("farmerUser");

                navigate("/farmer/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to cancel order."
            );
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f6f8f3]">
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
                        <div className="animate-pulse">
                            <div className="h-7 w-32 rounded-lg bg-slate-200" />
                            <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
                        </div>

                        <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 w-72 rounded-xl bg-slate-200" />

                        <div className="grid gap-4 md:grid-cols-3">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="h-32 rounded-3xl bg-white"
                                />
                            ))}
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                            <div className="space-y-6">
                                <div className="h-[520px] rounded-3xl bg-white" />
                                <div className="h-80 rounded-3xl bg-white" />
                            </div>

                            <div className="space-y-6">
                                <div className="h-64 rounded-3xl bg-white" />
                                <div className="h-48 rounded-3xl bg-white" />
                                <div className="h-48 rounded-3xl bg-white" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f6f8f3] px-5">
                <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <CircleAlert size={30} />
                    </div>

                    <h2 className="mt-5 text-2xl font-black text-slate-900">
                        Unable to load order
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {error}
                    </p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <button
                            onClick={fetchOrder}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>

                        <button
                            onClick={() =>
                                navigate("/farmer/orders")
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                            <ArrowLeft size={16} />
                            Back to Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    const currentStatus = order.orderStatus;
    const currentStatusIndex = getStatusIndex(currentStatus);
    const nextStatus = getNextStatus(currentStatus);
    const nextButtonText = getNextButtonText(currentStatus);

    const isCancelled = currentStatus === "CANCELLED";
    const isDelivered = currentStatus === "DELIVERED";

    const canCancel = [
        "PLACED",
        "CONFIRMED"
    ].includes(currentStatus);

    const statusColors = getStatusColors(currentStatus);

    const progressPercentage =
        currentStatusIndex >= 0
            ? ((currentStatusIndex + 1) / STATUS_STEPS.length) * 100
            : 0;

    return (
        <div className="min-h-screen bg-[#f6f8f3]">

            {/* ================= HEADER ================= */}

            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

                    <button
                        onClick={() =>
                            navigate("/farmer/dashboard")
                        }
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/10">
                            <span className="text-lg">🌾</span>
                        </div>

                        <div className="text-left">
                            <p className="text-lg font-black tracking-tight text-slate-900">
                                F2C
                            </p>

                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                                Farmer Portal
                            </p>
                        </div>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() =>
                                navigate("/farmer/orders")
                            }
                            className="hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:flex"
                        >
                            <ArrowLeft size={16} />
                            Orders
                        </button>

                        <button
                            onClick={fetchOrder}
                            disabled={updating}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    loading
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            <span className="hidden sm:inline">
                                Refresh
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ================= MAIN ================= */}

            <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">

                {/* ================= PAGE HEADER ================= */}

                <section className="mb-7">

                    <button
                        onClick={() =>
                            navigate("/farmer/orders")
                        }
                        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
                    >
                        <ArrowLeft size={16} />
                        Back to Orders
                    </button>

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                                    Order Details
                                </h1>

                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm">
                                    #
                                    {String(order._id)
                                        .slice(-8)
                                        .toUpperCase()}
                                </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-500">
                                Received on{" "}
                                <span className="font-semibold text-slate-700">
                                    {formatDate(order.createdAt)}
                                </span>
                            </p>
                        </div>

                        <div
                            className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${statusColors.badge}`}
                        >
                            <span
                                className={`h-2.5 w-2.5 rounded-full ${statusColors.dot}`}
                            />

                            {formatStatus(currentStatus)}
                        </div>
                    </div>
                </section>

                {/* ================= ALERTS ================= */}

                {successMessage && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <Check size={17} />
                        </div>

                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                        <CircleAlert
                            size={18}
                            className="shrink-0"
                        />
                        {error}
                    </div>
                )}

                {/* ================= SUMMARY CARDS ================= */}

                <section className="mb-7 grid gap-4 md:grid-cols-3">

                    {/* Status */}

                    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                    Current Status
                                </p>

                                <p className="mt-3 text-2xl font-black text-slate-900">
                                    {formatStatus(currentStatus)}
                                </p>
                            </div>

                            <div
                                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${statusColors.soft} ${statusColors.text}`}
                            >
                                {isCancelled ? (
                                    <XCircle size={21} />
                                ) : isDelivered ? (
                                    <CheckCircle2 size={21} />
                                ) : (
                                    <Clock3 size={21} />
                                )}
                            </div>
                        </div>

                        {!isCancelled && (
                            <div className="mt-5">
                                <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
                                    <span>Order progress</span>
                                    <span>
                                        {Math.max(
                                            currentStatusIndex + 1,
                                            0
                                        )}{" "}
                                        / {STATUS_STEPS.length}
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                                        style={{
                                            width: `${progressPercentage}%`
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sales */}

                    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                    Your Sales Value
                                </p>

                                <p className="mt-3 text-3xl font-black text-slate-900">
                                    ₹
                                    {Number(
                                        order.farmerSubtotal || 0
                                    ).toLocaleString("en-IN")}
                                </p>

                                <p className="mt-1 text-xs font-medium text-slate-400">
                                    Revenue from your products
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                ₹
                            </div>
                        </div>
                    </div>

                    {/* Payment */}

                    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                    Payment
                                </p>

                                <p className="mt-3 text-xl font-black text-slate-900">
                                    {order.paymentMethod ||
                                        "Not specified"}
                                </p>

                                <p className="mt-1 text-xs font-medium text-slate-400">
                                    Payment method
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                <CreditCard size={21} />
                            </div>
                        </div>

                        <div className="mt-4">
                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                                    order.paymentStatus ===
                                    "PAID"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : order.paymentStatus ===
                                            "FAILED"
                                            ? "bg-red-50 text-red-700"
                                            : "bg-amber-50 text-amber-700"
                                }`}
                            >
                                {order.paymentStatus ||
                                    "PENDING"}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ================= MAIN GRID ================= */}

                <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

                    {/* ================= LEFT ================= */}

                    <div className="space-y-6">

                        {/* STATUS TIMELINE */}

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">

                            <div className="mb-8 flex items-start justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                                        <Truck size={15} />
                                        Delivery Journey
                                    </div>

                                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                                        Order Progress
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Follow every stage of this
                                        customer's order.
                                    </p>
                                </div>

                                {!isCancelled &&
                                    !isDelivered && (
                                        <div className="hidden rounded-2xl bg-emerald-50 px-4 py-3 text-right sm:block">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                                                Next step
                                            </p>

                                            <p className="mt-1 text-sm font-black text-emerald-900">
                                                {formatStatus(
                                                    nextStatus
                                                )}
                                            </p>
                                        </div>
                                    )}
                            </div>

                            {isCancelled ? (
                                <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                                            <XCircle size={24} />
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-black text-red-900">
                                                Order Cancelled
                                            </h3>

                                            <p className="mt-1 text-sm leading-6 text-red-700">
                                                This order can no
                                                longer be processed
                                                or moved to another
                                                delivery stage.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    {STATUS_STEPS.map(
                                        (step, index) => {
                                            const StepIcon =
                                                step.icon;

                                            const stepIndex =
                                                getStatusIndex(
                                                    step.key
                                                );

                                            const completed =
                                                currentStatusIndex >=
                                                stepIndex;

                                            const isCurrent =
                                                currentStatus ===
                                                step.key;

                                            const historyEntry =
                                                order.statusHistory?.find(
                                                    (entry) =>
                                                        entry.status ===
                                                        step.key
                                                );

                                            const isLast =
                                                index ===
                                                STATUS_STEPS.length -
                                                    1;

                                            return (
                                                <div
                                                    key={step.key}
                                                    className="relative flex gap-4"
                                                >
                                                    {!isLast && (
                                                        <div
                                                            className={`absolute left-[23px] top-12 h-[calc(100%-20px)] w-0.5 ${
                                                                currentStatusIndex >
                                                                stepIndex
                                                                    ? "bg-emerald-500"
                                                                    : "bg-slate-200"
                                                            }`}
                                                        />
                                                    )}

                                                    <div
                                                        className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                                                            completed
                                                                ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                                                                : "border-slate-200 bg-slate-50 text-slate-400"
                                                        } ${
                                                            isCurrent
                                                                ? "ring-4 ring-emerald-100"
                                                                : ""
                                                        }`}
                                                    >
                                                        {completed ? (
                                                            <Check
                                                                size={19}
                                                                strokeWidth={
                                                                    3
                                                                }
                                                            />
                                                        ) : (
                                                            <StepIcon
                                                                size={
                                                                    19
                                                                }
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="min-h-[104px] flex-1 pb-7">
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h3
                                                                        className={`font-black ${
                                                                            isCurrent
                                                                                ? "text-emerald-700"
                                                                                : completed
                                                                                    ? "text-slate-900"
                                                                                    : "text-slate-400"
                                                                        }`}
                                                                    >
                                                                        {
                                                                            step.label
                                                                        }
                                                                    </h3>

                                                                    {isCurrent && (
                                                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                                                                            Current
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                                                    {
                                                                        step.description
                                                                    }
                                                                </p>
                                                            </div>

                                                            {historyEntry && (
                                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                                                    <Clock3
                                                                        size={
                                                                            13
                                                                        }
                                                                    />

                                                                    {formatDate(
                                                                        historyEntry.updatedAt
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </section>

                        {/* PRODUCTS */}

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">

                            <div className="mb-6 flex items-end justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                                        <Package size={15} />
                                        Order Items
                                    </div>

                                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                                        Products
                                    </h2>
                                </div>

                                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                                    {order.items?.length || 0}{" "}
                                    items
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {order.items?.map(
                                    (item, index) => {
                                        const image =
                                            getImageUrl(
                                                item.image
                                            );

                                        return (
                                            <div
                                                key={`${item.product}-${index}`}
                                                className="flex gap-4 py-5 first:pt-0 last:pb-0"
                                            >
                                                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                                    {image ? (
                                                        <img
                                                            src={
                                                                image
                                                            }
                                                            alt={
                                                                item.productName ||
                                                                "Product"
                                                            }
                                                            className="h-full w-full object-cover"
                                                            onError={(
                                                                event
                                                            ) => {
                                                                event.currentTarget.style.display =
                                                                    "none";

                                                                event.currentTarget.parentElement.classList.add(
                                                                    "flex",
                                                                    "items-center",
                                                                    "justify-center"
                                                                );

                                                                event.currentTarget.parentElement.innerHTML =
                                                                    '<span class="text-2xl">🌾</span>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center">
                                                            <Package
                                                                size={
                                                                    28
                                                                }
                                                                className="text-slate-300"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div>
                                                            <h3 className="font-black text-slate-900">
                                                                {item.productName ||
                                                                    "Product"}
                                                            </h3>

                                                            <p className="mt-1 text-sm text-slate-500">
                                                                {item.quantity}{" "}
                                                                {
                                                                    item.unit
                                                                }{" "}
                                                                × ₹
                                                                {Number(
                                                                    item.price ||
                                                                        0
                                                                ).toLocaleString(
                                                                    "en-IN"
                                                                )}
                                                            </p>
                                                        </div>

                                                        <p className="text-lg font-black text-slate-900">
                                                            ₹
                                                            {Number(
                                                                item.subtotal ||
                                                                    0
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                                                            <Package
                                                                size={
                                                                    12
                                                                }
                                                            />
                                                            Qty{" "}
                                                            {
                                                                item.quantity
                                                            }
                                                        </span>

                                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700">
                                                            <Check
                                                                size={
                                                                    12
                                                                }
                                                            />
                                                            Product
                                                            subtotal
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>

                            <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-emerald-700">
                                            Your Sales Total
                                        </p>

                                        <p className="mt-1 text-xs text-emerald-600">
                                            Total value of your products
                                            in this order
                                        </p>
                                    </div>

                                    <p className="text-2xl font-black text-emerald-900">
                                        ₹
                                        {Number(
                                            order.farmerSubtotal ||
                                                0
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ================= RIGHT ================= */}

                    <aside className="space-y-6">

                        {/* ACTION CARD */}

                        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">

                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                                        <Sparkles size={15} />
                                        Order Action
                                    </div>

                                    <h2 className="mt-2 text-xl font-black text-slate-900">
                                        Manage Status
                                    </h2>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <Truck size={19} />
                                </div>
                            </div>

                            {nextStatus &&
                                !isCancelled &&
                                !isDelivered && (
                                    <div>
                                        <div className="mb-3 rounded-2xl bg-slate-50 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                Next status
                                            </p>

                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                                    <ChevronRight
                                                        size={
                                                            17
                                                        }
                                                    />
                                                </span>

                                                <span className="font-black text-slate-900">
                                                    {formatStatus(
                                                        nextStatus
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={updateStatus}
                                            disabled={updating}
                                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {updating ? (
                                                <>
                                                    <Loader2
                                                        size={18}
                                                        className="animate-spin"
                                                    />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    {nextButtonText}
                                                    <ArrowRight
                                                        size={18}
                                                    />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                            {canCancel && (
                                <button
                                    onClick={() =>
                                        setShowCancelModal(true)
                                    }
                                    disabled={updating}
                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3.5 font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <X size={17} />
                                    Cancel Order
                                </button>
                            )}

                            {isDelivered && (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                        <CheckCircle2
                                            size={25}
                                        />
                                    </div>

                                    <p className="mt-3 font-black text-emerald-900">
                                        Order Delivered
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                                        This order has been completed
                                        successfully.
                                    </p>
                                </div>
                            )}

                            {isCancelled && (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                                        <XCircle size={25} />
                                    </div>

                                    <p className="mt-3 font-black text-red-900">
                                        Order Cancelled
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-red-700">
                                        No further status changes are
                                        available.
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* CUSTOMER */}

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                                        Customer
                                    </p>

                                    <h2 className="mt-1 text-xl font-black text-slate-900">
                                        Buyer Information
                                    </h2>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <User size={19} />
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-50 text-lg font-black text-emerald-700">
                                    {order.customer?.name
                                        ?.charAt(0)
                                        ?.toUpperCase() || "C"}
                                </div>

                                <div className="min-w-0">
                                    <h3 className="truncate font-black text-slate-900">
                                        {order.customer?.name ||
                                            "Customer"}
                                    </h3>

                                    <p className="truncate text-sm text-slate-500">
                                        {order.customer?.email ||
                                            "No email available"}
                                    </p>
                                </div>
                            </div>

                            {(order.customer?.phone ||
                                order.phone) && (
                                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                                        <Phone size={16} />
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Phone
                                        </p>

                                        <p className="mt-0.5 text-sm font-bold text-slate-800">
                                            {order.customer?.phone ||
                                                order.phone}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* DELIVERY */}

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                                        Delivery
                                    </p>

                                    <h2 className="mt-1 text-xl font-black text-slate-900">
                                        Pickup & Delivery
                                    </h2>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                    <MapPin size={19} />
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="mb-3 flex items-center gap-2">
                                    <MapPin
                                        size={16}
                                        className="text-emerald-600"
                                    />

                                    <span className="text-sm font-black text-slate-900">
                                        Delivery Address
                                    </span>
                                </div>

                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <p className="text-sm leading-6 text-slate-600">
                                        {order.deliveryAddress ||
                                            "Address not available"}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* PAYMENT */}

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                                        Payment
                                    </p>

                                    <h2 className="mt-1 text-xl font-black text-slate-900">
                                        Payment Details
                                    </h2>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                                    <CreditCard size={19} />
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">

                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-slate-500">
                                        Method
                                    </span>

                                    <span className="text-sm font-black text-slate-900">
                                        {order.paymentMethod ||
                                            "—"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-slate-500">
                                        Status
                                    </span>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-black ${
                                            order.paymentStatus ===
                                            "PAID"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : order.paymentStatus ===
                                                    "FAILED"
                                                    ? "bg-red-50 text-red-700"
                                                    : "bg-amber-50 text-amber-700"
                                        }`}
                                    >
                                        {order.paymentStatus ||
                                            "PENDING"}
                                    </span>
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="font-bold text-slate-500">
                                            Your Total
                                        </span>

                                        <span className="text-xl font-black text-emerald-700">
                                            ₹
                                            {Number(
                                                order.farmerSubtotal ||
                                                    0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </main>

            {/* ================= FOOTER ================= */}

            <footer className="mt-8 border-t border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-6 text-center text-xs font-medium text-slate-400 lg:px-8">
                    F2C Farmer Portal • Manage your farm business smarter
                </div>
            </footer>

            {/* ================= CANCEL MODAL ================= */}

            {showCancelModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-5 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">

                        <div className="p-7">

                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                    <CircleAlert size={24} />
                                </div>

                                <div>
                                    <h3 className="text-xl font-black text-slate-900">
                                        Cancel this order?
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        This action will mark the order as
                                        cancelled. You won't be able to
                                        move it to another status afterward.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400">
                                        Order
                                    </span>

                                    <span className="text-sm font-black text-slate-900">
                                        #
                                        {String(order._id)
                                            .slice(-8)
                                            .toUpperCase()}
                                    </span>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400">
                                        Current status
                                    </span>

                                    <span className="text-sm font-black text-slate-700">
                                        {formatStatus(
                                            order.orderStatus
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCancelModal(false)
                                    }
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Keep Order
                                </button>

                                <button
                                    type="button"
                                    onClick={cancelOrder}
                                    disabled={updating}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {updating && (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    )}

                                    Cancel Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FarmerOrderDetails;