import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock3,
    Filter,
    Loader2,
    MapPin,
    Package,
    Phone,
    RefreshCw,
    Search,
    ShoppingBag,
    Truck,
    User,
    X,
    XCircle,
    CircleAlert,
    LayoutDashboard
} from "lucide-react";

import API from "../services/api";

const STATUS_CONFIG = {
    PLACED: {
        label: "Placed",
        icon: ShoppingBag,
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500"
    },
    CONFIRMED: {
        label: "Confirmed",
        icon: CheckCircle2,
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500"
    },
    PROCESSING: {
        label: "Processing",
        icon: Clock3,
        badge: "bg-violet-50 text-violet-700 border-violet-200",
        dot: "bg-violet-500"
    },
    PACKED: {
        label: "Packed",
        icon: Package,
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
        dot: "bg-indigo-500"
    },
    OUT_FOR_DELIVERY: {
        label: "Out for Delivery",
        icon: Truck,
        badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
        dot: "bg-cyan-500"
    },
    DELIVERED: {
        label: "Delivered",
        icon: CheckCircle2,
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500"
    },
    CANCELLED: {
        label: "Cancelled",
        icon: XCircle,
        badge: "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-500"
    }
};

const getStatusConfig = (status) => {
    return (
        STATUS_CONFIG[status] || {
            label: status || "Unknown",
            icon: Clock3,
            badge: "bg-slate-50 text-slate-600 border-slate-200",
            dot: "bg-slate-400"
        }
    );
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

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const formatDateTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const getNextStatus = (status) => {
    const flow = {
        PLACED: "CONFIRMED",
        CONFIRMED: "PROCESSING",
        PROCESSING: "PACKED",
        PACKED: "OUT_FOR_DELIVERY",
        OUT_FOR_DELIVERY: "DELIVERED"
    };

    return flow[status] || null;
};

const getNextAction = (status) => {
    const actions = {
        PLACED: "Confirm Order",
        CONFIRMED: "Start Processing",
        PROCESSING: "Mark as Packed",
        PACKED: "Send for Delivery",
        OUT_FOR_DELIVERY: "Mark as Delivered"
    };

    return actions[status] || null;
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

function FarmerOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [updatingId, setUpdatingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [expandedOrder, setExpandedOrder] = useState(null);

    const [cancelOrderId, setCancelOrderId] = useState(null);

    const farmerToken = localStorage.getItem("farmerToken");

    const logoutFarmer = () => {
        localStorage.removeItem("farmerToken");
        localStorage.removeItem("farmerUser");
        navigate("/farmer/login");
    };

    const fetchOrders = async (silent = false) => {
        try {
            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token = localStorage.getItem("farmerToken");

            if (!token) {
                navigate("/farmer/login");
                return;
            }

            const response = await API.get("/farmer/orders", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setOrders(response.data.orders || []);
        } catch (error) {
            console.error("FETCH FARMER ORDERS ERROR:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                logoutFarmer();
                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to load your orders."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!farmerToken) {
            navigate("/farmer/login");
            return;
        }

        fetchOrders();
    }, []);

    const updateStatus = async (orderId, status) => {
        if (!orderId || !status || updatingId) {
            return;
        }

        try {
            setUpdatingId(orderId);
            setError("");
            setSuccessMessage("");

            const token = localStorage.getItem("farmerToken");

            const response = await API.put(
                `/farmer/orders/${orderId}/status`,
                {
                    status
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const updatedStatus =
                response.data.orderStatus || status;

            setOrders((previousOrders) =>
                previousOrders.map((order) =>
                    order._id === orderId
                        ? {
                              ...order,
                              orderStatus: updatedStatus
                          }
                        : order
                )
            );

            setSuccessMessage(
                `Order updated to ${formatStatus(updatedStatus)}`
            );

            setTimeout(() => {
                setSuccessMessage("");
            }, 3000);
        } catch (error) {
            console.error("UPDATE FARMER ORDER ERROR:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                logoutFarmer();
                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to update order status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const confirmCancel = async () => {
        if (!cancelOrderId) {
            return;
        }

        await updateStatus(cancelOrderId, "CANCELLED");

        setCancelOrderId(null);
    };

    const filteredOrders = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return orders.filter((order) => {
            const customerName =
                order.customer?.name?.toLowerCase() || "";

            const customerEmail =
                order.customer?.email?.toLowerCase() || "";

            const orderId =
                String(order._id || "").toLowerCase();

            const productNames =
                order.items
                    ?.map((item) =>
                        String(item.productName || "").toLowerCase()
                    )
                    .join(" ") || "";

            const matchesSearch =
                !search ||
                customerName.includes(search) ||
                customerEmail.includes(search) ||
                orderId.includes(search) ||
                productNames.includes(search);

            let matchesStatus = true;

            if (statusFilter === "ACTIVE") {
                matchesStatus = ![
                    "DELIVERED",
                    "CANCELLED"
                ].includes(order.orderStatus);
            } else if (statusFilter !== "ALL") {
                matchesStatus =
                    order.orderStatus === statusFilter;
            }

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const totalOrders = orders.length;

        const activeOrders = orders.filter(
            (order) =>
                !["DELIVERED", "CANCELLED"].includes(
                    order.orderStatus
                )
        ).length;

        const deliveredOrders = orders.filter(
            (order) => order.orderStatus === "DELIVERED"
        ).length;

        const cancelledOrders = orders.filter(
            (order) => order.orderStatus === "CANCELLED"
        ).length;

        const salesValue = orders.reduce((total, order) => {
            if (order.orderStatus === "CANCELLED") {
                return total;
            }

            return (
                total +
                Number(order.farmerSubtotal || 0)
            );
        }, 0);

        return {
            totalOrders,
            activeOrders,
            deliveredOrders,
            cancelledOrders,
            salesValue
        };
    }, [orders]);

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("ALL");
    };

    const statusFilterOptions = [
        {
            key: "ALL",
            label: "All Orders",
            count: orders.length
        },
        {
            key: "ACTIVE",
            label: "Active",
            count: stats.activeOrders
        },
        {
            key: "PLACED",
            label: "Placed",
            count: orders.filter(
                (o) => o.orderStatus === "PLACED"
            ).length
        },
        {
            key: "PROCESSING",
            label: "Processing",
            count: orders.filter(
                (o) => o.orderStatus === "PROCESSING"
            ).length
        },
        {
            key: "OUT_FOR_DELIVERY",
            label: "Delivery",
            count: orders.filter(
                (o) =>
                    o.orderStatus ===
                    "OUT_FOR_DELIVERY"
            ).length
        },
        {
            key: "DELIVERED",
            label: "Delivered",
            count: stats.deliveredOrders
        },
        {
            key: "CANCELLED",
            label: "Cancelled",
            count: stats.cancelledOrders
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f6f8f3]">

                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
                        <div className="animate-pulse">
                            <div className="h-7 w-32 rounded-lg bg-slate-200" />
                            <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

                    <div className="animate-pulse space-y-6">

                        <div className="h-12 w-72 rounded-xl bg-slate-200" />

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="h-32 rounded-3xl bg-white"
                                />
                            ))}
                        </div>

                        <div className="h-24 rounded-3xl bg-white" />

                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-44 rounded-3xl bg-white"
                            />
                        ))}
                    </div>
                </main>
            </div>
        );
    }

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
                            🌾
                        </div>

                        <div className="text-left">
                            <p className="text-lg font-black tracking-tight text-slate-900">
                                F2C
                            </p>

                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                Farmer Portal
                            </p>
                        </div>
                    </button>

                    <div className="flex items-center gap-2">

                        <button
                            onClick={() =>
                                navigate("/farmer/dashboard")
                            }
                            className="hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 sm:flex"
                        >
                            <LayoutDashboard size={16} />
                            Dashboard
                        </button>

                        <button
                            onClick={() => fetchOrders(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    refreshing
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

                {/* HERO */}

                <section className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-700 p-7 text-white shadow-xl shadow-emerald-900/10 md:p-9">

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

                        <div className="max-w-2xl">

                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                                <Truck size={14} />
                                Farmer Order Management
                            </div>

                            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                                Manage your orders
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80 md:text-base">
                                Track customer orders, update delivery
                                progress and monitor your sales from one
                                place.
                            </p>
                        </div>

                        <div className="hidden lg:block">
                            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-100/70">
                                    Sales value
                                </p>

                                <p className="mt-1 text-3xl font-black">
                                    ₹
                                    {stats.salesValue.toLocaleString(
                                        "en-IN"
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= ALERTS ================= */}

                {successMessage && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
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

                        <span>{error}</span>

                        <button
                            onClick={() => fetchOrders()}
                            className="ml-auto shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-black text-red-700 shadow-sm"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ================= STATS ================= */}

                <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                                    Total Orders
                                </p>

                                <p className="mt-3 text-3xl font-black text-slate-900">
                                    {stats.totalOrders}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                                <ShoppingBag size={21} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                                    Active
                                </p>

                                <p className="mt-3 text-3xl font-black text-amber-600">
                                    {stats.activeOrders}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                <Clock3 size={21} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                                    Delivered
                                </p>

                                <p className="mt-3 text-3xl font-black text-emerald-600">
                                    {stats.deliveredOrders}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 size={21} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                                    Sales Value
                                </p>

                                <p className="mt-3 text-2xl font-black text-slate-900">
                                    ₹
                                    {stats.salesValue.toLocaleString(
                                        "en-IN"
                                    )}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                ₹
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= FILTERS ================= */}

                <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">

                    <div className="flex flex-col gap-4">

                        <div className="flex flex-col gap-3 md:flex-row">

                            <div className="relative flex-1">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search by customer, product or order ID..."
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                                />
                            </div>

                            {(searchTerm ||
                                statusFilter !== "ALL") && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                                >
                                    <X size={16} />
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            <Filter
                                size={16}
                                className="mr-1 shrink-0 text-slate-400"
                            />

                            {statusFilterOptions.map((option) => (
                                <button
                                    key={option.key}
                                    onClick={() =>
                                        setStatusFilter(
                                            option.key
                                        )
                                    }
                                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                                        statusFilter ===
                                        option.key
                                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    {option.label}

                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                            statusFilter ===
                                            option.key
                                                ? "bg-white/20 text-white"
                                                : "bg-white text-slate-500"
                                        }`}
                                    >
                                        {option.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================= RESULTS HEADER ================= */}

                <div className="mb-4 flex items-center justify-between gap-4">

                    <div>
                        <p className="text-sm font-bold text-slate-500">
                            Showing{" "}
                            <span className="font-black text-slate-900">
                                {filteredOrders.length}
                            </span>{" "}
                            orders
                        </p>
                    </div>

                    {searchTerm && (
                        <p className="hidden text-xs text-slate-400 sm:block">
                            Search: "{searchTerm}"
                        </p>
                    )}
                </div>

                {/* ================= EMPTY ================= */}

                {filteredOrders.length === 0 ? (
                    <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                            <Package size={34} />
                        </div>

                        <h2 className="mt-6 text-2xl font-black text-slate-900">
                            {orders.length === 0
                                ? "No orders yet"
                                : "No matching orders"}
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            {orders.length === 0
                                ? "When customers purchase your products, their orders will appear here."
                                : "Try changing your search or status filter to find the order you're looking for."}
                        </p>

                        {orders.length > 0 && (
                            <button
                                onClick={clearFilters}
                                className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                            >
                                Clear Filters
                            </button>
                        )}
                    </section>
                ) : (
                    <div className="space-y-4">

                        {filteredOrders.map((order) => {
                            const status =
                                getStatusConfig(
                                    order.orderStatus
                                );

                            const StatusIcon = status.icon;

                            const nextStatus =
                                getNextStatus(
                                    order.orderStatus
                                );

                            const nextAction =
                                getNextAction(
                                    order.orderStatus
                                );

                            const canCancel = [
                                "PLACED",
                                "CONFIRMED"
                            ].includes(
                                order.orderStatus
                            );

                            const isExpanded =
                                expandedOrder ===
                                order._id;

                            const isUpdating =
                                updatingId ===
                                order._id;

                            return (
                                <article
                                    key={order._id}
                                    className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
                                >

                                    {/* ORDER HEADER */}

                                    <div className="p-5 md:p-6">

                                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                                            <div className="flex min-w-0 items-start gap-4">

                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                                    <Package
                                                        size={22}
                                                    />
                                                </div>

                                                <div className="min-w-0">

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h2 className="font-black text-slate-900">
                                                            Order #
                                                            {String(
                                                                order._id
                                                            )
                                                                .slice(
                                                                    -8
                                                                )
                                                                .toUpperCase()}
                                                        </h2>

                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${status.badge}`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                                            />

                                                            {
                                                                status.label
                                                            }
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                                        <span>
                                                            {formatDateTime(
                                                                order.createdAt
                                                            )}
                                                        </span>

                                                        <span>
                                                            •
                                                        </span>

                                                        <span>
                                                            {order.items
                                                                ?.length ||
                                                                0}{" "}
                                                            products
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                                                <div className="rounded-2xl bg-slate-50 px-5 py-3 sm:text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                        Your sales
                                                    </p>

                                                    <p className="mt-0.5 text-xl font-black text-slate-900">
                                                        ₹
                                                        {Number(
                                                            order.farmerSubtotal ||
                                                                0
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        setExpandedOrder(
                                                            isExpanded
                                                                ? null
                                                                : order._id
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                                                >
                                                    {isExpanded
                                                        ? "Hide"
                                                        : "Quick View"}

                                                    {isExpanded ? (
                                                        <ChevronUp
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    ) : (
                                                        <ChevronDown
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/farmer/orders/${order._id}`
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800"
                                                >
                                                    Details
                                                    <ArrowRight
                                                        size={
                                                            15
                                                        }
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        {/* CUSTOMER / DELIVERY */}

                                        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-3">

                                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                                                    <User
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                        Customer
                                                    </p>

                                                    <p className="truncate text-sm font-bold text-slate-800">
                                                        {order
                                                            .customer
                                                            ?.name ||
                                                            "Customer"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                                                    <MapPin
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                        Delivery
                                                    </p>

                                                    <p className="truncate text-sm font-bold text-slate-800">
                                                        {order.deliveryAddress ||
                                                            "Address unavailable"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                                                    <CreditCardIcon />
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                        Payment
                                                    </p>

                                                    <p className="text-sm font-bold text-slate-800">
                                                        {order.paymentMethod ||
                                                            "Not specified"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* QUICK VIEW */}

                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-6 md:px-6">

                                            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

                                                {/* PRODUCTS */}

                                                <div>
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">
                                                                Order Items
                                                            </p>

                                                            <h3 className="mt-1 font-black text-slate-900">
                                                                Products
                                                            </h3>
                                                        </div>

                                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                                                            {order.items
                                                                ?.length ||
                                                                0}{" "}
                                                            items
                                                        </span>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {order.items?.map(
                                                            (
                                                                item,
                                                                index
                                                            ) => {
                                                                const image =
                                                                    getImageUrl(
                                                                        item.image
                                                                    );

                                                                return (
                                                                    <div
                                                                        key={`${item.product}-${index}`}
                                                                        className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                                                                    >
                                                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
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
                                                                                />
                                                                            ) : (
                                                                                <div className="flex h-full items-center justify-center text-slate-300">
                                                                                    <Package
                                                                                        size={
                                                                                            22
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div>
                                                                                    <p className="truncate text-sm font-black text-slate-900">
                                                                                        {item.productName ||
                                                                                            "Product"}
                                                                                    </p>

                                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                                        {
                                                                                            item.quantity
                                                                                        }{" "}
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

                                                                                <p className="shrink-0 text-sm font-black text-slate-900">
                                                                                    ₹
                                                                                    {Number(
                                                                                        item.subtotal ||
                                                                                            0
                                                                                    ).toLocaleString(
                                                                                        "en-IN"
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>

                                                {/* QUICK ACTION */}

                                                <div className="rounded-3xl border border-slate-200 bg-white p-5">

                                                    <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">
                                                        Quick Action
                                                    </p>

                                                    <div className="mt-4">
                                                        <p className="text-xs font-bold text-slate-400">
                                                            Current status
                                                        </p>

                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span
                                                                className={`h-2.5 w-2.5 rounded-full ${status.dot}`}
                                                            />

                                                            <span className="font-black text-slate-900">
                                                                {formatStatus(
                                                                    order.orderStatus
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {nextStatus &&
                                                        nextAction && (
                                                            <button
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        order._id,
                                                                        nextStatus
                                                                    )
                                                                }
                                                                disabled={
                                                                    isUpdating
                                                                }
                                                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {isUpdating ? (
                                                                    <Loader2
                                                                        size={
                                                                            17
                                                                        }
                                                                        className="animate-spin"
                                                                    />
                                                                ) : (
                                                                    <Check
                                                                        size={
                                                                            17
                                                                        }
                                                                    />
                                                                )}

                                                                {isUpdating
                                                                    ? "Updating..."
                                                                    : nextAction}
                                                            </button>
                                                        )}

                                                    {canCancel && (
                                                        <button
                                                            onClick={() =>
                                                                setCancelOrderId(
                                                                    order._id
                                                                )
                                                            }
                                                            disabled={
                                                                isUpdating
                                                            }
                                                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                                        >
                                                            <X
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                            Cancel Order
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                `/farmer/orders/${order._id}`
                                                            )
                                                        }
                                                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                                                    >
                                                        View Full Details
                                                        <ArrowRight
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ================= FOOTER ================= */}

            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-6 text-center text-xs font-medium text-slate-400 lg:px-8">
                    F2C Farmer Portal • Grow better. Sell smarter.
                </div>
            </footer>

            {/* ================= CANCEL MODAL ================= */}

            {cancelOrderId && (
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
                                        This will permanently mark the
                                        order as cancelled. Further status
                                        updates will not be available.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                                <button
                                    onClick={() =>
                                        setCancelOrderId(null)
                                    }
                                    disabled={updatingId}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Keep Order
                                </button>

                                <button
                                    onClick={confirmCancel}
                                    disabled={updatingId}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
                                >
                                    {updatingId ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <X size={16} />
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

/*
    Small isolated icon component so the payment card
    stays clean without adding another dependency.
*/
function CreditCardIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect
                width="20"
                height="14"
                x="2"
                y="5"
                rx="2"
            />
            <line
                x1="2"
                x2="22"
                y1="10"
                y2="10"
            />
        </svg>
    );
}

export default FarmerOrders;