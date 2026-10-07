import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    CircleDollarSign,
    Clock3,
    Eye,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    RefreshCw,
    Search,
    ShoppingCart,
    Truck,
    UserRound,
    Users,
    X,
    XCircle,
} from "lucide-react";
import API from "../../services/api";

const AdminOrders = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);

    const [search, setSearch] = useState("");
    const [orderStatus, setOrderStatus] = useState("ALL");
    const [paymentStatus, setPaymentStatus] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState("");

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [error, setError] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const adminToken = localStorage.getItem("adminToken");

    // ==========================================
    // FETCH ORDERS
    // ==========================================

    const fetchOrders = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token = localStorage.getItem("adminToken");

            if (!token) {
                navigate("/admin/login");
                return;
            }

            const response = await API.get("/admin/orders", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setOrders(response.data.orders || []);
            }
        } catch (error) {
            console.error("FETCH ADMIN ORDERS ERROR:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminUser");

                navigate("/admin/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                    "Unable to load orders"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // ==========================================
    // FILTER ORDERS
    // ==========================================

    const filteredOrders = useMemo(() => {
        const value = search.toLowerCase().trim();

        return orders.filter((order) => {
            const orderId = order._id
                ?.toString()
                .toLowerCase();

            const customerName = order.customer?.name
                ?.toLowerCase();

            const customerEmail = order.customer?.email
                ?.toLowerCase();

            const matchesSearch =
                !value ||
                orderId?.includes(value) ||
                customerName?.includes(value) ||
                customerEmail?.includes(value);

            const matchesOrderStatus =
                orderStatus === "ALL" ||
                order.orderStatus === orderStatus;

            const matchesPaymentStatus =
                paymentStatus === "ALL" ||
                order.paymentStatus === paymentStatus;

            return (
                matchesSearch &&
                matchesOrderStatus &&
                matchesPaymentStatus
            );
        });
    }, [
        orders,
        search,
        orderStatus,
        paymentStatus,
    ]);

    // ==========================================
    // UPDATE ORDER STATUS
    // ==========================================

    const handleStatusChange = async (
        order,
        newStatus
    ) => {
        if (order.orderStatus === newStatus) {
            return;
        }

        try {
            setActionLoading(order._id);

            const token =
                localStorage.getItem("adminToken");

            const response = await API.put(
                `/admin/orders/${order._id}/status`,
                {
                    orderStatus: newStatus,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                setOrders((previous) =>
                    previous.map((item) =>
                        item._id === order._id
                            ? {
                                  ...item,
                                  orderStatus:
                                      newStatus,
                              }
                            : item
                    )
                );

                if (
                    selectedOrder?._id ===
                    order._id
                ) {
                    setSelectedOrder((previous) => ({
                        ...previous,
                        orderStatus: newStatus,
                    }));
                }
            }
        } catch (error) {
            console.error(
                "UPDATE ORDER STATUS ERROR:",
                error
            );

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem(
                    "adminToken"
                );
                localStorage.removeItem(
                    "adminUser"
                );

                navigate("/admin/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                    "Failed to update order status"
            );
        } finally {
            setActionLoading("");
        }
    };

    // ==========================================
    // ORDER DETAILS
    // ==========================================

    const openOrderDetails = async (orderId) => {
        try {
            setDetailsLoading(true);
            setSelectedOrder(null);

            const token =
                localStorage.getItem("adminToken");

            const response = await API.get(
                `/admin/orders/${orderId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                setSelectedOrder(
                    response.data.order
                );
            }
        } catch (error) {
            console.error(
                "ORDER DETAILS ERROR:",
                error
            );

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem(
                    "adminToken"
                );
                localStorage.removeItem(
                    "adminUser"
                );

                navigate("/admin/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                    "Failed to load order details"
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    // ==========================================
    // FORMATTERS
    // ==========================================

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const formatDateTime = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    const formatCurrency = (amount) => {
        return `₹${Number(amount || 0).toLocaleString(
            "en-IN"
        )}`;
    };

    const getShortOrderId = (id, length = 8) => {
        return (
            id
                ?.toString()
                .slice(-length)
                .toUpperCase() || "ORDER"
        );
    };

    // ==========================================
    // STATUS HELPERS
    // ==========================================

    const getStatusMeta = (status) => {
        const styles = {
            PLACED: {
                className:
                    "bg-blue-50 text-blue-700 border-blue-100",
                dot: "bg-blue-500",
                icon: Clock3,
            },

            CONFIRMED: {
                className:
                    "bg-indigo-50 text-indigo-700 border-indigo-100",
                dot: "bg-indigo-500",
                icon: CheckCircle2,
            },

            PROCESSING: {
                className:
                    "bg-amber-50 text-amber-700 border-amber-100",
                dot: "bg-amber-500",
                icon: Package,
            },

            SHIPPED: {
                className:
                    "bg-purple-50 text-purple-700 border-purple-100",
                dot: "bg-purple-500",
                icon: Truck,
            },

            DELIVERED: {
                className:
                    "bg-green-50 text-green-700 border-green-100",
                dot: "bg-green-500",
                icon: CheckCircle2,
            },

            CANCELLED: {
                className:
                    "bg-red-50 text-red-700 border-red-100",
                dot: "bg-red-500",
                icon: XCircle,
            },
        };

        return (
            styles[status] || {
                className:
                    "bg-gray-100 text-gray-600 border-gray-200",
                dot: "bg-gray-400",
                icon: Clock3,
            }
        );
    };

    const getPaymentMeta = (status) => {
        const styles = {
            PAID: {
                className:
                    "bg-green-50 text-green-700 border-green-100",
                icon: CheckCircle2,
            },

            PENDING: {
                className:
                    "bg-amber-50 text-amber-700 border-amber-100",
                icon: Clock3,
            },

            FAILED: {
                className:
                    "bg-red-50 text-red-700 border-red-100",
                icon: XCircle,
            },

            REFUNDED: {
                className:
                    "bg-purple-50 text-purple-700 border-purple-100",
                icon: RefreshCw,
            },
        };

        return (
            styles[status] || {
                className:
                    "bg-gray-100 text-gray-600 border-gray-200",
                icon: Clock3,
            }
        );
    };

    // ==========================================
    // COUNTS
    // ==========================================

    const totalOrders = orders.length;

    const deliveredOrders = orders.filter(
        (order) =>
            order.orderStatus === "DELIVERED"
    ).length;

    const processingOrders = orders.filter(
        (order) =>
            [
                "PLACED",
                "CONFIRMED",
                "PROCESSING",
                "SHIPPED",
            ].includes(order.orderStatus)
    ).length;

    const cancelledOrders = orders.filter(
        (order) =>
            order.orderStatus === "CANCELLED"
    ).length;

    const paidOrders = orders.filter(
        (order) =>
            order.paymentStatus === "PAID"
    ).length;

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        navigate("/admin/login");
    };

    // ==========================================
    // NAVIGATION
    // ==========================================

    const navigationItems = [
        {
            label: "Dashboard",
            path: "/admin/dashboard",
            icon: LayoutDashboard,
        },
        {
            label: "Farmers",
            path: "/admin/farmers",
            icon: Users,
        },
        {
            label: "Customers",
            path: "/admin/customers",
            icon: UserRound,
        },
        {
            label: "Products",
            path: "/admin/products",
            icon: Package,
        },
        {
            label: "Orders",
            path: "/admin/orders",
            icon: ShoppingCart,
            active: true,
        },
    ];

    // ==========================================
    // SIDEBAR
    // ==========================================

    const Sidebar = ({ mobile = false }) => (
        <aside
            className={`${
                mobile
                    ? "flex h-full w-[270px] flex-col"
                    : "fixed left-0 top-0 hidden h-screen w-[250px] flex-col lg:flex"
            } bg-[#173b2a] text-white`}
        >
            <div className="flex h-24 items-center px-7">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#173b2a] shadow-sm">
                        <span className="text-xl">
                            🌱
                        </span>
                    </div>

                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            F2C
                        </h1>

                        <p className="text-[10px] tracking-[0.2em] text-white/40">
                            ADMIN CONSOLE
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4">
                <p className="mb-3 px-4 pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Overview
                </p>

                {navigationItems.slice(0, 1).map(
                    (item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(
                                        item.path
                                    );
                                    setSidebarOpen(
                                        false
                                    );
                                }}
                                className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                            >
                                <Icon
                                    size={17}
                                    strokeWidth={1.8}
                                />

                                {item.label}
                            </button>
                        );
                    }
                )}

                <p className="mb-3 px-4 pt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Management
                </p>

                {navigationItems.slice(1).map(
                    (item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(
                                        item.path
                                    );
                                    setSidebarOpen(
                                        false
                                    );
                                }}
                                className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                                    item.active
                                        ? "bg-white/10 font-semibold text-white"
                                        : "text-white/60 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                <Icon
                                    size={17}
                                    strokeWidth={
                                        item.active
                                            ? 2.2
                                            : 1.8
                                    }
                                />

                                {item.label}

                                {item.active && (
                                    <span className="ml-auto h-2 w-2 rounded-full bg-green-300 shadow-[0_0_10px_rgba(134,239,172,0.6)]" />
                                )}
                            </button>
                        );
                    }
                )}
            </nav>

            <div className="border-t border-white/10 p-4">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 transition hover:bg-red-400/10 hover:text-red-300"
                >
                    <LogOut size={17} />

                    Logout
                </button>
            </div>
        </aside>
    );

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="min-h-screen bg-[#f5f7f2] text-[#172018]">
            {/* DESKTOP SIDEBAR */}

            <Sidebar />

            {/* MOBILE SIDEBAR */}

            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() =>
                            setSidebarOpen(false)
                        }
                    />

                    <div className="relative h-full">
                        <Sidebar mobile />

                        <button
                            onClick={() =>
                                setSidebarOpen(false)
                            }
                            className="absolute right-4 top-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"
                        >
                            <X size={19} />
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN */}

            <main className="lg:ml-[250px]">
                {/* HEADER */}

                <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f5f7f2]/90 px-5 py-4 backdrop-blur-xl sm:px-8 lg:px-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() =>
                                    setSidebarOpen(
                                        true
                                    )
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm lg:hidden"
                            >
                                <Menu
                                    size={20}
                                />
                            </button>

                            <div>
                                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">
                                    Admin / Management
                                </p>

                                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                                    Orders
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    fetchOrders(true)
                                }
                                disabled={
                                    refreshing
                                }
                                className="flex h-10 items-center gap-2 rounded-xl border border-black/5 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
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

                            <button
                                onClick={() =>
                                    navigate(
                                        "/admin/dashboard"
                                    )
                                }
                                className="hidden items-center gap-2 rounded-xl border border-black/5 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-gray-50 sm:flex"
                            >
                                <ArrowLeft
                                    size={16}
                                />

                                Dashboard
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-5 sm:p-8 lg:p-10">
                    {/* HERO */}

                    <section className="relative mb-7 overflow-hidden rounded-[30px] bg-[#173b2a] p-7 text-white shadow-xl shadow-[#173b2a]/10 sm:p-9">
                        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#40916c]/20" />

                        <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-white/5" />

                        <div className="relative">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-green-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-300 shadow-[0_0_8px_rgba(134,239,172,0.8)]" />

                                ORDER OPERATIONS
                            </div>

                            <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
                                <div>
                                    <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                                        Manage every
                                        order.
                                    </h2>

                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                                        Monitor purchases,
                                        payments and
                                        fulfillment across
                                        the entire F2C
                                        marketplace.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                                        <div className="flex items-center gap-2">
                                            <ShoppingCart
                                                size={14}
                                                className="text-white/40"
                                            />

                                            <p className="text-[10px] text-white/45">
                                                Total
                                            </p>
                                        </div>

                                        <p className="mt-1 text-xl font-bold">
                                            {
                                                totalOrders
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock3
                                                size={14}
                                                className="text-white/40"
                                            />

                                            <p className="text-[10px] text-white/45">
                                                Active
                                            </p>
                                        </div>

                                        <p className="mt-1 text-xl font-bold">
                                            {
                                                processingOrders
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2
                                                size={14}
                                                className="text-white/40"
                                            />

                                            <p className="text-[10px] text-white/45">
                                                Delivered
                                            </p>
                                        </div>

                                        <p className="mt-1 text-xl font-bold">
                                            {
                                                deliveredOrders
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                                        <div className="flex items-center gap-2">
                                            <CircleDollarSign
                                                size={14}
                                                className="text-white/40"
                                            />

                                            <p className="text-[10px] text-white/45">
                                                Paid
                                            </p>
                                        </div>

                                        <p className="mt-1 text-xl font-bold">
                                            {
                                                paidOrders
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FILTERS */}

                    <section className="mb-6 rounded-[24px] border border-black/5 bg-white p-4 shadow-sm">
                        <div className="grid gap-3 xl:grid-cols-[1fr_190px_190px_auto]">
                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target
                                                .value
                                        )
                                    }
                                    placeholder="Search order ID, customer name or email..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#2d6a4f] focus:bg-white focus:ring-4 focus:ring-[#2d6a4f]/5"
                                />
                            </div>

                            <div className="relative">
                                <select
                                    value={
                                        orderStatus
                                    }
                                    onChange={(e) =>
                                        setOrderStatus(
                                            e.target
                                                .value
                                        )
                                    }
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-10 text-sm outline-none transition focus:border-[#2d6a4f] focus:bg-white"
                                >
                                    <option value="ALL">
                                        All Order Status
                                    </option>

                                    <option value="PLACED">
                                        Placed
                                    </option>

                                    <option value="CONFIRMED">
                                        Confirmed
                                    </option>

                                    <option value="PROCESSING">
                                        Processing
                                    </option>

                                    <option value="SHIPPED">
                                        Shipped
                                    </option>

                                    <option value="DELIVERED">
                                        Delivered
                                    </option>

                                    <option value="CANCELLED">
                                        Cancelled
                                    </option>
                                </select>

                                <ChevronDown
                                    size={16}
                                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                            </div>

                            <div className="relative">
                                <select
                                    value={
                                        paymentStatus
                                    }
                                    onChange={(e) =>
                                        setPaymentStatus(
                                            e.target
                                                .value
                                        )
                                    }
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-10 text-sm outline-none transition focus:border-[#2d6a4f] focus:bg-white"
                                >
                                    <option value="ALL">
                                        All Payment Status
                                    </option>

                                    <option value="PAID">
                                        Paid
                                    </option>

                                    <option value="PENDING">
                                        Pending
                                    </option>

                                    <option value="FAILED">
                                        Failed
                                    </option>

                                    <option value="REFUNDED">
                                        Refunded
                                    </option>
                                </select>

                                <ChevronDown
                                    size={16}
                                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                            </div>

                            <button
                                onClick={() => {
                                    setSearch("");
                                    setOrderStatus(
                                        "ALL"
                                    );
                                    setPaymentStatus(
                                        "ALL"
                                    );
                                }}
                                className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="h-2 w-2 rounded-full bg-[#2d6a4f]" />

                                Showing{" "}
                                <span className="font-semibold text-gray-600">
                                    {
                                        filteredOrders.length
                                    }
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-gray-600">
                                    {totalOrders}
                                </span>{" "}
                                orders
                            </div>

                            {cancelledOrders >
                                0 && (
                                <div className="flex items-center gap-2 text-xs text-red-500">
                                    <AlertCircle
                                        size={14}
                                    />

                                    {
                                        cancelledOrders
                                    }{" "}
                                    cancelled orders
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ERROR */}

                    {error && (
                        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                            <AlertCircle
                                size={18}
                                className="mt-0.5 shrink-0"
                            />

                            <div className="flex-1">
                                <p className="font-semibold">
                                    Something went
                                    wrong
                                </p>

                                <p className="mt-0.5 text-red-500">
                                    {error}
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    fetchOrders()
                                }
                                className="font-semibold underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* ORDERS */}

                    <section className="overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-sm">
                        {loading ? (
                            <div className="min-h-[450px] p-6">
                                <div className="mb-5 flex items-center justify-between">
                                    <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />

                                    <div className="h-9 w-24 animate-pulse rounded-xl bg-gray-100" />
                                </div>

                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5, 6].map(
                                        (item) => (
                                            <div
                                                key={
                                                    item
                                                }
                                                className="flex items-center gap-5 rounded-2xl border border-gray-100 p-5"
                                            >
                                                <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-100" />

                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />

                                                    <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
                                                </div>

                                                <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100" />

                                                <div className="h-8 w-24 animate-pulse rounded-xl bg-gray-100" />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ) : filteredOrders.length ===
                          0 ? (
                            <div className="flex min-h-[450px] items-center justify-center px-6">
                                <div className="max-w-sm text-center">
                                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#f0f4ef] text-[#285c42]">
                                        <ShoppingCart
                                            size={34}
                                            strokeWidth={
                                                1.5
                                            }
                                        />
                                    </div>

                                    <h3 className="text-xl font-bold">
                                        No orders found
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-gray-500">
                                        No orders match
                                        your current
                                        search or filter
                                        settings.
                                    </p>

                                    <button
                                        onClick={() => {
                                            setSearch(
                                                ""
                                            );
                                            setOrderStatus(
                                                "ALL"
                                            );
                                            setPaymentStatus(
                                                "ALL"
                                            );
                                        }}
                                        className="mt-5 rounded-xl bg-[#173b2a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214c38]"
                                    >
                                        Reset filters
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* DESKTOP TABLE */}

                                <div className="hidden overflow-x-auto lg:block">
                                    <table className="w-full min-w-[1180px]">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/70">
                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Order
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Customer
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Items
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Amount
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Payment
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Status
                                                </th>

                                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredOrders.map(
                                                (
                                                    order
                                                ) => {
                                                    const statusMeta =
                                                        getStatusMeta(
                                                            order.orderStatus
                                                        );

                                                    const paymentMeta =
                                                        getPaymentMeta(
                                                            order.paymentStatus
                                                        );

                                                    const StatusIcon =
                                                        statusMeta.icon;

                                                    const PaymentIcon =
                                                        paymentMeta.icon;

                                                    return (
                                                        <tr
                                                            key={
                                                                order._id
                                                            }
                                                            className="group border-b border-gray-100 transition last:border-0 hover:bg-[#fafcf9]"
                                                        >
                                                            {/* ORDER */}

                                                            <td className="px-6 py-5">
                                                                <button
                                                                    onClick={() =>
                                                                        openOrderDetails(
                                                                            order._id
                                                                        )
                                                                    }
                                                                    className="text-left"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono text-sm font-bold text-[#285c42]">
                                                                            #
                                                                            {getShortOrderId(
                                                                                order._id
                                                                            )}
                                                                        </span>

                                                                        <Eye
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="text-gray-300 transition group-hover:text-[#285c42]"
                                                                        />
                                                                    </div>

                                                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                                                                        <CalendarDays
                                                                            size={
                                                                                12
                                                                            }
                                                                        />

                                                                        {formatDate(
                                                                            order.createdAt
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            </td>

                                                            {/* CUSTOMER */}

                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef4ef] text-sm font-bold text-[#285c42]">
                                                                        {(
                                                                            order.customer?.name ||
                                                                            "U"
                                                                        )
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase()}
                                                                    </div>

                                                                    <div className="min-w-0">
                                                                        <p className="max-w-[170px] truncate text-sm font-semibold text-gray-800">
                                                                            {order.customer?.name ||
                                                                                "Unknown"}
                                                                        </p>

                                                                        <p className="mt-1 max-w-[190px] truncate text-xs text-gray-400">
                                                                            {order.customer?.email ||
                                                                                "—"}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* ITEMS */}

                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
                                                                        <Package
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <p className="text-sm font-semibold text-gray-700">
                                                                            {order.items
                                                                                ?.length ||
                                                                                0}{" "}
                                                                            {order.items
                                                                                ?.length ===
                                                                            1
                                                                                ? "item"
                                                                                : "items"}
                                                                        </p>

                                                                        <p className="mt-1 max-w-[180px] truncate text-xs text-gray-400">
                                                                            {order.items
                                                                                ?.map(
                                                                                    (
                                                                                        item
                                                                                    ) =>
                                                                                        item.productName
                                                                                )
                                                                                .filter(
                                                                                    Boolean
                                                                                )
                                                                                .join(
                                                                                    ", "
                                                                                ) ||
                                                                                "No item details"}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* AMOUNT */}

                                                            <td className="px-6 py-5">
                                                                <p className="font-bold text-gray-900">
                                                                    {formatCurrency(
                                                                        order.totalAmount
                                                                    )}
                                                                </p>

                                                                <p className="mt-1 text-xs capitalize text-gray-400">
                                                                    {order.paymentMethod ||
                                                                        "—"}
                                                                </p>
                                                            </td>

                                                            {/* PAYMENT */}

                                                            <td className="px-6 py-5">
                                                                <span
                                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${paymentMeta.className}`}
                                                                >
                                                                    <PaymentIcon
                                                                        size={
                                                                            13
                                                                        }
                                                                    />

                                                                    {order.paymentStatus ||
                                                                        "UNKNOWN"}
                                                                </span>
                                                            </td>

                                                            {/* STATUS */}

                                                            <td className="px-6 py-5">
                                                                <div className="relative inline-block">
                                                                    <select
                                                                        value={
                                                                            order.orderStatus ||
                                                                            "PLACED"
                                                                        }
                                                                        disabled={
                                                                            actionLoading ===
                                                                            order._id
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleStatusChange(
                                                                                order,
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className={`appearance-none rounded-full border py-2 pl-3 pr-8 text-xs font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${statusMeta.className}`}
                                                                    >
                                                                        <option value="PLACED">
                                                                            PLACED
                                                                        </option>

                                                                        <option value="CONFIRMED">
                                                                            CONFIRMED
                                                                        </option>

                                                                        <option value="PROCESSING">
                                                                            PROCESSING
                                                                        </option>

                                                                        <option value="SHIPPED">
                                                                            SHIPPED
                                                                        </option>

                                                                        <option value="DELIVERED">
                                                                            DELIVERED
                                                                        </option>

                                                                        <option value="CANCELLED">
                                                                            CANCELLED
                                                                        </option>
                                                                    </select>

                                                                    <ChevronDown
                                                                        size={
                                                                            13
                                                                        }
                                                                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                                                                    />
                                                                </div>
                                                            </td>

                                                            {/* ACTION */}

                                                            <td className="px-6 py-5 text-right">
                                                                <button
                                                                    onClick={() =>
                                                                        openOrderDetails(
                                                                            order._id
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-2 rounded-xl bg-[#eef4ef] px-4 py-2.5 text-xs font-semibold text-[#285c42] transition hover:bg-[#e1ece3]"
                                                                >
                                                                    <Eye
                                                                        size={
                                                                            14
                                                                        }
                                                                    />

                                                                    View
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* MOBILE / TABLET CARDS */}

                                <div className="divide-y divide-gray-100 lg:hidden">
                                    {filteredOrders.map(
                                        (
                                            order
                                        ) => {
                                            const statusMeta =
                                                getStatusMeta(
                                                    order.orderStatus
                                                );

                                            const paymentMeta =
                                                getPaymentMeta(
                                                    order.paymentStatus
                                                );

                                            const StatusIcon =
                                                statusMeta.icon;

                                            const PaymentIcon =
                                                paymentMeta.icon;

                                            return (
                                                <div
                                                    key={
                                                        order._id
                                                    }
                                                    className="p-5 sm:p-6"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <button
                                                            onClick={() =>
                                                                openOrderDetails(
                                                                    order._id
                                                                )
                                                            }
                                                            className="min-w-0 text-left"
                                                        >
                                                            <p className="font-mono text-sm font-bold text-[#285c42]">
                                                                #
                                                                {getShortOrderId(
                                                                    order._id,
                                                                    10
                                                                )}
                                                            </p>

                                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                                                                <CalendarDays
                                                                    size={
                                                                        12
                                                                    }
                                                                />

                                                                {formatDate(
                                                                    order.createdAt
                                                                )}
                                                            </p>
                                                        </button>

                                                        <span
                                                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${paymentMeta.className}`}
                                                        >
                                                            <PaymentIcon
                                                                size={
                                                                    13
                                                                }
                                                            />

                                                            {
                                                                order.paymentStatus
                                                            }
                                                        </span>
                                                    </div>

                                                    <div className="mt-5 flex items-center gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef4ef] font-bold text-[#285c42]">
                                                            {(
                                                                order.customer?.name ||
                                                                "U"
                                                            )
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold">
                                                                {order.customer?.name ||
                                                                    "Unknown"}
                                                            </p>

                                                            <p className="truncate text-xs text-gray-400">
                                                                {order.customer?.email ||
                                                                    "—"}
                                                            </p>
                                                        </div>

                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-gray-900">
                                                                {formatCurrency(
                                                                    order.totalAmount
                                                                )}
                                                            </p>

                                                            <p className="text-[11px] capitalize text-gray-400">
                                                                {order.paymentMethod ||
                                                                    "—"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                                        <div className="rounded-2xl bg-gray-50 p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                                Items
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold">
                                                                {order.items
                                                                    ?.length ||
                                                                    0}{" "}
                                                                {order.items
                                                                    ?.length ===
                                                                1
                                                                    ? "item"
                                                                    : "items"}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-2xl bg-gray-50 p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                                Status
                                                            </p>

                                                            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                                                                <span
                                                                    className={`h-2 w-2 rounded-full ${statusMeta.dot}`}
                                                                />

                                                                {
                                                                    order.orderStatus
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex gap-2">
                                                        <div className="relative flex-1">
                                                            <select
                                                                value={
                                                                    order.orderStatus ||
                                                                    "PLACED"
                                                                }
                                                                disabled={
                                                                    actionLoading ===
                                                                    order._id
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    handleStatusChange(
                                                                        order,
                                                                        e
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className={`w-full appearance-none rounded-xl border px-3 py-3 pr-9 text-xs font-semibold outline-none ${statusMeta.className}`}
                                                            >
                                                                <option value="PLACED">
                                                                    PLACED
                                                                </option>

                                                                <option value="CONFIRMED">
                                                                    CONFIRMED
                                                                </option>

                                                                <option value="PROCESSING">
                                                                    PROCESSING
                                                                </option>

                                                                <option value="SHIPPED">
                                                                    SHIPPED
                                                                </option>

                                                                <option value="DELIVERED">
                                                                    DELIVERED
                                                                </option>

                                                                <option value="CANCELLED">
                                                                    CANCELLED
                                                                </option>
                                                            </select>

                                                            <ChevronDown
                                                                size={
                                                                    14
                                                                }
                                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                                                            />
                                                        </div>

                                                        <button
                                                            onClick={() =>
                                                                openOrderDetails(
                                                                    order._id
                                                                )
                                                            }
                                                            className="flex items-center justify-center gap-2 rounded-xl bg-[#173b2a] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#214c38]"
                                                        >
                                                            <Eye
                                                                size={
                                                                    14
                                                                }
                                                            />

                                                            View
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>

            {/* DETAILS LOADING */}

            {detailsLoading && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="rounded-2xl bg-white px-7 py-6 text-center shadow-2xl">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#173b2a]" />

                        <p className="text-sm font-semibold text-gray-700">
                            Loading order details...
                        </p>
                    </div>
                </div>
            )}

            {/* ORDER DETAILS MODAL */}

            {selectedOrder && !detailsLoading && (
                <div
                    className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            setSelectedOrder(
                                null
                            );
                        }
                    }}
                >
                    <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
                        {/* MODAL HEADER */}

                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 sm:px-8">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                                    Order Details
                                </p>

                                <div className="mt-1 flex items-center gap-3">
                                    <h2 className="truncate font-mono text-xl font-bold sm:text-2xl">
                                        #
                                        {getShortOrderId(
                                            selectedOrder._id,
                                            10
                                        )}
                                    </h2>

                                    <span
                                        className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex ${
                                            getStatusMeta(
                                                selectedOrder.orderStatus
                                            )
                                                .className
                                        }`}
                                    >
                                        {selectedOrder.orderStatus}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    setSelectedOrder(
                                        null
                                    )
                                }
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="max-h-[calc(92vh-90px)] overflow-y-auto p-5 sm:p-8">
                            {/* CUSTOMER + STATUS */}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl bg-[#f5f7f2] p-5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#285c42]">
                                            <UserRound
                                                size={
                                                    15
                                                }
                                            />
                                        </div>

                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            Customer
                                        </p>
                                    </div>

                                    <p className="mt-4 font-bold">
                                        {selectedOrder
                                            .customer
                                            ?.name ||
                                            "Unknown"}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {selectedOrder
                                            .customer
                                            ?.email ||
                                            "—"}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {selectedOrder
                                            .customer
                                            ?.phone ||
                                            "—"}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-[#f5f7f2] p-5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#285c42]">
                                            <Package
                                                size={
                                                    15
                                                }
                                            />
                                        </div>

                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            Order Status
                                        </p>
                                    </div>

                                    <div className="relative mt-4 inline-block">
                                        <select
                                            value={
                                                selectedOrder.orderStatus ||
                                                "PLACED"
                                            }
                                            disabled={
                                                actionLoading ===
                                                selectedOrder._id
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleStatusChange(
                                                    selectedOrder,
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            className={`appearance-none rounded-xl border py-2.5 pl-4 pr-10 text-sm font-bold outline-none ${getStatusMeta(
                                                selectedOrder.orderStatus
                                            ).className}`}
                                        >
                                            <option value="PLACED">
                                                PLACED
                                            </option>

                                            <option value="CONFIRMED">
                                                CONFIRMED
                                            </option>

                                            <option value="PROCESSING">
                                                PROCESSING
                                            </option>

                                            <option value="SHIPPED">
                                                SHIPPED
                                            </option>

                                            <option value="DELIVERED">
                                                DELIVERED
                                            </option>

                                            <option value="CANCELLED">
                                                CANCELLED
                                            </option>
                                        </select>

                                        <ChevronDown
                                            size={
                                                15
                                            }
                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                                        />
                                    </div>

                                    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                                        <CalendarDays
                                            size={
                                                12
                                            }
                                        />

                                        Created{" "}
                                        {formatDateTime(
                                            selectedOrder.createdAt
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* DELIVERY */}

                            <div className="mt-5 rounded-2xl border border-gray-100 p-5">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef4ef] text-[#285c42]">
                                        <Truck
                                            size={
                                                15
                                            }
                                        />
                                    </div>

                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Delivery
                                        Information
                                    </p>
                                </div>

                                <div className="mt-4 rounded-xl bg-gray-50 p-4">
                                    <p className="text-sm leading-6 text-gray-600">
                                        {selectedOrder.deliveryAddress ||
                                            "No delivery address"}
                                    </p>

                                    <p className="mt-2 text-sm text-gray-500">
                                        Phone:{" "}
                                        {selectedOrder.phone ||
                                            selectedOrder
                                                .customer
                                                ?.phone ||
                                            "—"}
                                    </p>
                                </div>
                            </div>

                            {/* ITEMS */}

                            <div className="mt-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold">
                                            Order Items
                                        </h3>

                                        <p className="mt-1 text-xs text-gray-400">
                                            Products included
                                            in this order
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                                        {selectedOrder
                                            .items
                                            ?.length ||
                                            0}{" "}
                                        items
                                    </span>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-gray-100">
                                    {selectedOrder.items?.map(
                                        (
                                            item,
                                            index
                                        ) => {
                                            const image =
                                                item
                                                    .product
                                                    ?.images
                                                    ?.length
                                                    ? item
                                                          .product
                                                          .images[0]
                                                    : item.image;

                                            return (
                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className="flex items-center gap-4 border-b border-gray-100 p-4 last:border-0"
                                                >
                                                    {image ? (
                                                        <img
                                                            src={
                                                                image
                                                            }
                                                            alt={
                                                                item.productName ||
                                                                "Product"
                                                            }
                                                            className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-black/5"
                                                        />
                                                    ) : (
                                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#eef4ef] text-[#285c42]">
                                                            <Package
                                                                size={
                                                                    22
                                                                }
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-gray-800">
                                                            {item.productName ||
                                                                "Product"}
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-400">
                                                            Qty:{" "}
                                                            {
                                                                item.quantity
                                                            }{" "}
                                                            {
                                                                item.unit
                                                            }
                                                        </p>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">
                                                            {formatCurrency(
                                                                item.subtotal
                                                            )}
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-400">
                                                            {formatCurrency(
                                                                item.price
                                                            )}{" "}
                                                            / unit
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>

                            {/* PAYMENT SUMMARY */}

                            <div className="mt-6 overflow-hidden rounded-2xl bg-[#173b2a] text-white">
                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CircleDollarSign
                                                    size={
                                                        17
                                                    }
                                                    className="text-green-300"
                                                />

                                                <p className="text-xs font-medium text-white/50">
                                                    Payment
                                                </p>
                                            </div>

                                            <p className="mt-2 font-semibold">
                                                {selectedOrder.paymentMethod ||
                                                    "—"}
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getPaymentMeta(
                                                selectedOrder.paymentStatus
                                            ).className}`}
                                        >
                                            {selectedOrder.paymentStatus ||
                                                "UNKNOWN"}
                                        </span>
                                    </div>

                                    <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                                        <div className="flex justify-between text-sm text-white/60">
                                            <span>
                                                Subtotal
                                            </span>

                                            <span>
                                                {formatCurrency(
                                                    selectedOrder.subtotal
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-sm text-white/60">
                                            <span>
                                                Delivery
                                            </span>

                                            <span>
                                                {formatCurrency(
                                                    selectedOrder.deliveryFee
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between border-t border-white/10 pt-4">
                                            <span className="font-semibold">
                                                Total
                                            </span>

                                            <span className="text-2xl font-bold">
                                                {formatCurrency(
                                                    selectedOrder.totalAmount
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CLOSE */}

                            <div className="mt-5 flex justify-end">
                                <button
                                    onClick={() =>
                                        setSelectedOrder(
                                            null
                                        )
                                    }
                                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;