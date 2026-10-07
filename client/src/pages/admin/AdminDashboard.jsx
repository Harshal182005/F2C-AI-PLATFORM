import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import {
    Activity,
    ArrowRight,
    BarChart3,
    Box,
    CheckCircle2,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    LayoutDashboard,
    Leaf,
    LogOut,
    Menu,
    Package,
    RefreshCw,
    ShoppingBag,
    ShoppingCart,
    Sparkles,
    Store,
    Truck,
    UserCheck,
    Users,
    X,
    XCircle
} from "lucide-react";

import API from "../../services/api";


// ======================================================
// CONSTANTS
// ======================================================

const DEFAULT_STATS = {
    totalFarmers: 0,
    totalCustomers: 0,
    totalProducts: 0,
    availableProducts: 0,
    totalOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    deliveredRevenue: 0
};

const DEFAULT_ORDER_STATUS = {
    PLACED: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    PACKED: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    CANCELLED: 0
};


// ======================================================
// HELPERS
// ======================================================

const formatStatus = (status = "") => {
    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
};


const getStatusClasses = (status) => {
    const styles = {
        PLACED:
            "bg-amber-50 text-amber-700 border-amber-100",

        CONFIRMED:
            "bg-blue-50 text-blue-700 border-blue-100",

        PROCESSING:
            "bg-violet-50 text-violet-700 border-violet-100",

        PACKED:
            "bg-indigo-50 text-indigo-700 border-indigo-100",

        OUT_FOR_DELIVERY:
            "bg-orange-50 text-orange-700 border-orange-100",

        DELIVERED:
            "bg-emerald-50 text-emerald-700 border-emerald-100",

        CANCELLED:
            "bg-red-50 text-red-700 border-red-100"
    };

    return (
        styles[status] ||
        "bg-gray-50 text-gray-600 border-gray-100"
    );
};


const getInitial = (name = "") => {
    return (
        name
            ?.trim()
            ?.charAt(0)
            ?.toUpperCase() || "U"
    );
};


const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
};


const formatDate = (date) => {
    if (!date) {
        return "-";
    }

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
};


const formatCompactNumber = (number) => {
    const value = Number(number) || 0;

    if (value >= 10000000) {
        return `${(value / 10000000).toFixed(1)}Cr`;
    }

    if (value >= 100000) {
        return `${(value / 100000).toFixed(1)}L`;
    }

    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }

    return value.toString();
};


// ======================================================
// STAT CARD
// ======================================================

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconClass,
    onClick
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-xl"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">
                        {title}
                    </p>

                    <h3 className="mt-2 truncate text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                        {value}
                    </h3>

                    <p className="mt-2 text-xs text-gray-400">
                        {subtitle}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass} transition duration-300 group-hover:scale-110`}
                >
                    <Icon size={21} />
                </div>
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-400 transition group-hover:text-[#1f6b3a]">
                View details
                <ArrowRight
                    size={13}
                    className="transition group-hover:translate-x-1"
                />
            </div>
        </button>
    );
}


// ======================================================
// DASHBOARD
// ======================================================

function AdminDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] =
        useState(DEFAULT_STATS);

    const [orderStatus, setOrderStatus] =
        useState(DEFAULT_ORDER_STATUS);

    const [recentOrders, setRecentOrders] =
        useState([]);

    const [recentFarmers, setRecentFarmers] =
        useState([]);

    const [recentCustomers, setRecentCustomers] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [mobileMenuOpen, setMobileMenuOpen] =
        useState(false);

    const adminUser = JSON.parse(
        localStorage.getItem("adminUser") || "null"
    );


    // ==================================================
    // FETCH DASHBOARD
    // ==================================================

    const fetchDashboard = async (
        showRefresh = false
    ) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token =
                localStorage.getItem("adminToken");

            if (!token) {
                navigate("/admin/login");
                return;
            }

            const response = await API.get(
                "/admin/dashboard",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setStats({
                ...DEFAULT_STATS,
                ...(response.data?.stats || {})
            });

            setOrderStatus({
                ...DEFAULT_ORDER_STATUS,
                ...(response.data?.orderStatus || {})
            });

            setRecentOrders(
                response.data?.recentOrders || []
            );

            setRecentFarmers(
                response.data?.recentFarmers || []
            );

            setRecentCustomers(
                response.data?.recentCustomers || []
            );

        } catch (error) {
            console.error(
                "Admin dashboard error:",
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
                "Failed to load dashboard"
            );

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    useEffect(() => {
        fetchDashboard();
    }, []);


    // ==================================================
    // LOGOUT
    // ==================================================

    const logout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        navigate("/admin/login");
    };


    // ==================================================
    // ORDER STATUS DATA
    // ==================================================

    const orderChartData = useMemo(() => {
        return [
            {
                name: "Placed",
                value: orderStatus.PLACED || 0
            },
            {
                name: "Confirmed",
                value: orderStatus.CONFIRMED || 0
            },
            {
                name: "Processing",
                value: orderStatus.PROCESSING || 0
            },
            {
                name: "Packed",
                value: orderStatus.PACKED || 0
            },
            {
                name: "Out for delivery",
                value:
                    orderStatus.OUT_FOR_DELIVERY || 0
            },
            {
                name: "Delivered",
                value: orderStatus.DELIVERED || 0
            },
            {
                name: "Cancelled",
                value: orderStatus.CANCELLED || 0
            }
        ];
    }, [orderStatus]);


    // ==================================================
    // MARKETPLACE DATA
    // ==================================================

    const marketplaceData = useMemo(() => {
        return [
            {
                name: "Farmers",
                value: stats.totalFarmers || 0
            },
            {
                name: "Customers",
                value: stats.totalCustomers || 0
            },
            {
                name: "Products",
                value: stats.totalProducts || 0
            },
            {
                name: "Orders",
                value: stats.totalOrders || 0
            }
        ];
    }, [stats]);


    const orderPieData = useMemo(() => {
        return orderChartData.filter(
            (item) => item.value > 0
        );
    }, [orderChartData]);


    const pieColors = [
        "#f59e0b",
        "#3b82f6",
        "#8b5cf6",
        "#6366f1",
        "#f97316",
        "#10b981",
        "#ef4444"
    ];


    // ==================================================
    // NAVIGATION
    // ==================================================

    const navigation = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/admin/dashboard",
            active: true
        },
        {
            label: "Farmers",
            icon: Store,
            path: "/admin/farmers"
        },
        {
            label: "Customers",
            icon: Users,
            path: "/admin/customers"
        },
        {
            label: "Products",
            icon: Package,
            path: "/admin/products"
        },
        {
            label: "Orders",
            icon: ShoppingCart,
            path: "/admin/orders"
        }
    ];


    const handleNavigation = (path) => {
        setMobileMenuOpen(false);
        navigate(path);
    };


    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f7f3]">
                <div className="hidden h-screen w-64 animate-pulse bg-[#17351f] lg:fixed lg:block" />

                <main className="lg:ml-64">
                    <div className="h-20 animate-pulse border-b border-gray-100 bg-white" />

                    <div className="space-y-6 p-5 sm:p-8">

                        <div className="h-44 animate-pulse rounded-3xl bg-gray-200" />

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                            {[1, 2, 3, 4].map(
                                (item) => (
                                    <div
                                        key={item}
                                        className="h-36 animate-pulse rounded-2xl bg-white"
                                    />
                                )
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                            <div className="h-80 animate-pulse rounded-2xl bg-white xl:col-span-2" />
                            <div className="h-80 animate-pulse rounded-2xl bg-white" />
                        </div>

                    </div>
                </main>
            </div>
        );
    }


    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div className="min-h-screen bg-[#f5f7f3]">

            {/* ==================================================
                DESKTOP SIDEBAR
            ================================================== */}

            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-[#17351f] text-white lg:flex">

                {/* Brand */}

                <div className="border-b border-white/10 px-6 py-6">
                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 shadow-inner">
                            <Leaf
                                size={22}
                                className="text-green-300"
                            />
                        </div>

                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                F2C Admin
                            </h1>

                            <p className="text-xs text-green-200">
                                Control Center
                            </p>
                        </div>

                    </div>
                </div>


                {/* Navigation */}

                <div className="flex-1 px-4 py-6">

                    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-green-300/60">
                        Main Menu
                    </p>

                    <nav className="space-y-1.5">

                        {navigation.map(
                            ({
                                label,
                                icon: Icon,
                                path,
                                active
                            }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() =>
                                        handleNavigation(
                                            path
                                        )
                                    }
                                    className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                                        active
                                            ? "bg-white text-[#17351f] shadow-lg"
                                            : "text-green-100 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <Icon
                                        size={18}
                                        className={
                                            active
                                                ? "text-[#1f6b3a]"
                                                : "text-green-200/80 group-hover:text-white"
                                        }
                                    />

                                    <span>
                                        {label}
                                    </span>

                                    {active && (
                                        <ChevronRight
                                            size={15}
                                            className="ml-auto text-[#1f6b3a]"
                                        />
                                    )}
                                </button>
                            )
                        )}

                    </nav>


                    {/* Platform status */}

                    <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">

                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
                            </span>

                            <span className="text-xs font-semibold text-green-100">
                                Platform Online
                            </span>
                        </div>

                        <p className="mt-2 text-[11px] leading-5 text-green-200/60">
                            F2C marketplace services are operational.
                        </p>

                    </div>

                </div>


                {/* Admin profile */}

                <div className="border-t border-white/10 p-4">

                    <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-[#17351f]">
                            {getInitial(
                                adminUser?.name
                            )}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                                {adminUser?.name ||
                                    "F2C Admin"}
                            </p>

                            <p className="truncate text-[11px] text-green-200/60">
                                Administrator
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-green-100 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                        <LogOut size={17} />
                        Logout
                    </button>

                </div>

            </aside>


            {/* ==================================================
                MOBILE MENU
            ================================================== */}

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">

                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() =>
                            setMobileMenuOpen(false)
                        }
                    />

                    <aside className="relative flex h-full w-72 flex-col bg-[#17351f] text-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                    <Leaf
                                        size={20}
                                        className="text-green-300"
                                    />
                                </div>

                                <div>
                                    <h2 className="font-bold">
                                        F2C Admin
                                    </h2>

                                    <p className="text-[11px] text-green-200">
                                        Control Center
                                    </p>
                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                                className="rounded-lg p-2 hover:bg-white/10"
                            >
                                <X size={20} />
                            </button>

                        </div>


                        <nav className="flex-1 space-y-1 p-4">

                            {navigation.map(
                                ({
                                    label,
                                    icon: Icon,
                                    path,
                                    active
                                }) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() =>
                                            handleNavigation(
                                                path
                                            )
                                        }
                                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                                            active
                                                ? "bg-white text-[#17351f]"
                                                : "text-green-100 hover:bg-white/10"
                                        }`}
                                    >
                                        <Icon size={18} />
                                        {label}
                                    </button>
                                )
                            )}

                        </nav>


                        <div className="border-t border-white/10 p-4">

                            <button
                                type="button"
                                onClick={logout}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-green-100 hover:bg-red-500/10 hover:text-red-300"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>

                        </div>

                    </aside>
                </div>
            )}


            {/* ==================================================
                MAIN
            ================================================== */}

            <main className="min-h-screen lg:ml-64">

                {/* Header */}

                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white/90 px-5 backdrop-blur-xl sm:px-8">

                    <div className="flex items-center gap-3">

                        <button
                            type="button"
                            onClick={() =>
                                setMobileMenuOpen(true)
                            }
                            className="rounded-xl border border-gray-200 p-2.5 text-gray-700 lg:hidden"
                        >
                            <Menu size={20} />
                        </button>

                        <div>
                            <p className="hidden text-xs font-semibold uppercase tracking-widest text-[#1f6b3a] sm:block">
                                Admin Workspace
                            </p>

                            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                                Dashboard
                            </h2>
                        </div>

                    </div>


                    <div className="flex items-center gap-3">

                        <button
                            type="button"
                            onClick={() =>
                                fetchDashboard(true)
                            }
                            disabled={refreshing}
                            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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


                        <div className="hidden h-8 w-px bg-gray-200 sm:block" />


                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-bold text-gray-900">
                                {adminUser?.name ||
                                    "F2C Admin"}
                            </p>

                            <p className="text-[11px] text-gray-400">
                                Administrator
                            </p>
                        </div>


                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 font-bold text-[#17351f] ring-4 ring-green-50">
                            {getInitial(
                                adminUser?.name
                            )}
                        </div>

                    </div>

                </header>


                {/* ==================================================
                    CONTENT
                ================================================== */}

                <section className="p-5 sm:p-8">

                    {/* Error */}

                    {error && (
                        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-3 text-sm text-red-700">
                                <XCircle
                                    size={18}
                                    className="shrink-0"
                                />

                                <span>{error}</span>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    fetchDashboard()
                                }
                                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                            >
                                <RefreshCw size={14} />
                                Retry
                            </button>

                        </div>
                    )}


                    {/* ==================================================
                        HERO
                    ================================================== */}

                    <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#17351f] via-[#1f5130] to-[#2d7042] p-6 text-white shadow-xl sm:p-8">

                        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-green-300/10 blur-3xl" />

                        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

                        <div className="absolute right-8 top-8 hidden opacity-10 sm:block">
                            <Leaf size={130} />
                        </div>

                        <div className="relative max-w-3xl">

                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-green-100 backdrop-blur">
                                <Sparkles size={13} />
                                F2C Marketplace
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                                Welcome back,{" "}
                                {adminUser?.name ||
                                    "Admin"}
                                .
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-green-100 sm:text-base">
                                Monitor farmers, customers,
                                products, orders and marketplace
                                performance from one central
                                control center.
                            </p>


                            <div className="mt-6 flex flex-wrap gap-3">

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/admin/orders"
                                        )
                                    }
                                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#17351f] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    <ShoppingCart
                                        size={16}
                                    />
                                    Manage Orders
                                    <ArrowRight
                                        size={15}
                                    />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/admin/products"
                                        )
                                    }
                                    className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                                >
                                    <Package
                                        size={16}
                                    />
                                    View Products
                                </button>

                            </div>

                        </div>

                    </section>


                    {/* ==================================================
                        KPI CARDS
                    ================================================== */}

                    <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                        <StatCard
                            title="Total Farmers"
                            value={
                                stats.totalFarmers
                            }
                            subtitle="Registered marketplace sellers"
                            icon={Store}
                            iconClass="bg-green-50 text-green-700"
                            onClick={() =>
                                navigate(
                                    "/admin/farmers"
                                )
                            }
                        />

                        <StatCard
                            title="Total Customers"
                            value={
                                stats.totalCustomers
                            }
                            subtitle="Registered marketplace buyers"
                            icon={Users}
                            iconClass="bg-blue-50 text-blue-700"
                            onClick={() =>
                                navigate(
                                    "/admin/customers"
                                )
                            }
                        />

                        <StatCard
                            title="Marketplace Products"
                            value={
                                stats.totalProducts
                            }
                            subtitle={`${stats.availableProducts || 0} currently available`}
                            icon={Package}
                            iconClass="bg-orange-50 text-orange-700"
                            onClick={() =>
                                navigate(
                                    "/admin/products"
                                )
                            }
                        />

                        <StatCard
                            title="Total Orders"
                            value={
                                stats.totalOrders
                            }
                            subtitle={`${stats.activeOrders || 0} active orders`}
                            icon={ShoppingCart}
                            iconClass="bg-violet-50 text-violet-700"
                            onClick={() =>
                                navigate(
                                    "/admin/orders"
                                )
                            }
                        />

                    </div>


                    {/* ==================================================
                        REVENUE + ORDER SUMMARY
                    ================================================== */}

                    <div className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-3">

                        {/* Revenue */}

                        <div className="relative overflow-hidden rounded-2xl bg-[#17351f] p-6 text-white shadow-lg xl:col-span-2">

                            <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-green-400/10 blur-3xl" />

                            <div className="relative">

                                <div className="flex items-start justify-between gap-4">

                                    <div>
                                        <p className="text-sm font-medium text-green-200">
                                            Marketplace Revenue
                                        </p>

                                        <h3 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                                            {formatCurrency(
                                                stats.totalRevenue
                                            )}
                                        </h3>

                                        <p className="mt-2 text-xs text-green-200/70">
                                            Total non-cancelled
                                            marketplace value
                                        </p>
                                    </div>

                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                                        <CircleDollarSign
                                            size={23}
                                            className="text-green-300"
                                        />
                                    </div>

                                </div>


                                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                        <p className="text-[11px] text-green-200/60">
                                            Delivered Revenue
                                        </p>

                                        <p className="mt-1 text-lg font-bold">
                                            {formatCurrency(
                                                stats.deliveredRevenue
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                        <p className="text-[11px] text-green-200/60">
                                            Delivered Orders
                                        </p>

                                        <p className="mt-1 text-lg font-bold">
                                            {stats.deliveredOrders ||
                                                0}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                        <p className="text-[11px] text-green-200/60">
                                            Cancelled Orders
                                        </p>

                                        <p className="mt-1 text-lg font-bold">
                                            {stats.cancelledOrders ||
                                                0}
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* Marketplace snapshot */}

                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                            <div className="mb-5 flex items-center justify-between">

                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        Marketplace Snapshot
                                    </h3>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Platform scale at a glance
                                    </p>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
                                    <Activity
                                        size={19}
                                    />
                                </div>

                            </div>


                            <div className="h-48">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <BarChart
                                        data={
                                            marketplaceData
                                        }
                                        margin={{
                                            top: 5,
                                            right: 0,
                                            left: -25,
                                            bottom: 0
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#eef2ed"
                                        />

                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 10,
                                                fill: "#9ca3af"
                                            }}
                                        />

                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 10,
                                                fill: "#9ca3af"
                                            }}
                                        />

                                        <Tooltip
                                            cursor={{
                                                fill: "#f3f7f3"
                                            }}
                                            contentStyle={{
                                                borderRadius:
                                                    "12px",
                                                border:
                                                    "1px solid #e5e7eb",
                                                boxShadow:
                                                    "0 10px 30px rgba(0,0,0,0.08)"
                                            }}
                                        />

                                        <Bar
                                            dataKey="value"
                                            fill="#2f7d46"
                                            radius={[
                                                6,
                                                6,
                                                0,
                                                0
                                            ]}
                                            barSize={28}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                        ORDER ANALYTICS
                    ================================================== */}

                    <div className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-5">

                        {/* Area chart */}

                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-3">

                            <div className="mb-5 flex items-center justify-between">

                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        Order Pipeline
                                    </h3>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Current distribution across
                                        order stages
                                    </p>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <BarChart3
                                        size={19}
                                    />
                                </div>

                            </div>


                            <div className="h-72">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <AreaChart
                                        data={
                                            orderChartData
                                        }
                                        margin={{
                                            top: 10,
                                            right: 5,
                                            left: -20,
                                            bottom: 0
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="orderGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#2f7d46"
                                                    stopOpacity={
                                                        0.3
                                                    }
                                                />

                                                <stop
                                                    offset="100%"
                                                    stopColor="#2f7d46"
                                                    stopOpacity={
                                                        0.02
                                                    }
                                                />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#eef2ed"
                                        />

                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 9,
                                                fill: "#9ca3af"
                                            }}
                                            interval={0}
                                            angle={-20}
                                            textAnchor="end"
                                            height={45}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 10,
                                                fill: "#9ca3af"
                                            }}
                                        />

                                        <Tooltip
                                            contentStyle={{
                                                borderRadius:
                                                    "12px",
                                                border:
                                                    "1px solid #e5e7eb",
                                                boxShadow:
                                                    "0 10px 30px rgba(0,0,0,0.08)"
                                            }}
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#2f7d46"
                                            strokeWidth={3}
                                            fill="url(#orderGradient)"
                                            activeDot={{
                                                r: 5
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                        </div>


                        {/* Pie */}

                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">

                            <div className="mb-3">
                                <h3 className="font-bold text-gray-900">
                                    Order Status
                                </h3>

                                <p className="mt-1 text-xs text-gray-400">
                                    Current marketplace order mix
                                </p>
                            </div>


                            {orderPieData.length > 0 ? (
                                <>
                                    <div className="h-52">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={
                                                        orderPieData
                                                    }
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={
                                                        52
                                                    }
                                                    outerRadius={
                                                        78
                                                    }
                                                    paddingAngle={
                                                        3
                                                    }
                                                    stroke="none"
                                                >
                                                    {orderPieData.map(
                                                        (
                                                            entry,
                                                            index
                                                        ) => (
                                                            <Cell
                                                                key={
                                                                    entry.name
                                                                }
                                                                fill={
                                                                    pieColors[
                                                                        index %
                                                                            pieColors.length
                                                                    ]
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </Pie>

                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius:
                                                            "12px",
                                                        border:
                                                            "1px solid #e5e7eb",
                                                        boxShadow:
                                                            "0 10px 30px rgba(0,0,0,0.08)"
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>


                                    <div className="grid grid-cols-2 gap-2">

                                        {orderChartData.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <div
                                                    key={
                                                        item.name
                                                    }
                                                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                                                >
                                                    <div className="flex min-w-0 items-center gap-2">

                                                        <span
                                                            className="h-2 w-2 shrink-0 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    pieColors[
                                                                        index %
                                                                            pieColors.length
                                                                    ]
                                                            }}
                                                        />

                                                        <span className="truncate text-[11px] text-gray-500">
                                                            {
                                                                item.name
                                                            }
                                                        </span>

                                                    </div>

                                                    <span className="ml-2 text-xs font-bold text-gray-900">
                                                        {
                                                            item.value
                                                        }
                                                    </span>

                                                </div>
                                            )
                                        )}

                                    </div>
                                </>
                            ) : (
                                <div className="flex h-72 flex-col items-center justify-center text-center">

                                    <ShoppingBag
                                        size={32}
                                        className="text-gray-300"
                                    />

                                    <p className="mt-3 text-sm font-semibold text-gray-600">
                                        No order data
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Order analytics will appear here.
                                    </p>

                                </div>
                            )}

                        </div>

                    </div>


                    {/* ==================================================
                        QUICK METRICS
                    ================================================== */}

                    <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                    <Clock3
                                        size={18}
                                    />
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Pending / Active
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-gray-900">
                                        {stats.activeOrders ||
                                            0}
                                    </p>
                                </div>
                            </div>
                        </div>


                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <CheckCircle2
                                        size={18}
                                    />
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Delivered
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-gray-900">
                                        {stats.deliveredOrders ||
                                            0}
                                    </p>
                                </div>
                            </div>
                        </div>


                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                    <XCircle
                                        size={18}
                                    />
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Cancelled
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-gray-900">
                                        {stats.cancelledOrders ||
                                            0}
                                    </p>
                                </div>
                            </div>
                        </div>


                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                                    <Box
                                        size={18}
                                    />
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Available Products
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-gray-900">
                                        {stats.availableProducts ||
                                            0}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>


                    {/* ==================================================
                        RECENT ORDERS
                    ================================================== */}

                    <div className="mb-7 rounded-2xl border border-gray-100 bg-white shadow-sm">

                        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900">
                                        Recent Orders
                                    </h3>

                                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                        LIVE DATA
                                    </span>
                                </div>

                                <p className="mt-1 text-xs text-gray-400">
                                    Latest marketplace transactions
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/admin/orders"
                                    )
                                }
                                className="flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-xs font-bold text-[#1f6b3a] transition hover:bg-green-50 sm:self-auto"
                            >
                                View all
                                <ArrowRight
                                    size={14}
                                />
                            </button>

                        </div>


                        {recentOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                                    <ShoppingBag
                                        size={25}
                                        className="text-gray-300"
                                    />
                                </div>

                                <p className="mt-4 font-semibold text-gray-700">
                                    No orders yet
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    New marketplace orders will appear here.
                                </p>

                            </div>
                        ) : (
                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[700px]">

                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/60 text-left">

                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                Customer
                                            </th>

                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                Order
                                            </th>

                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                Amount
                                            </th>

                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                Payment
                                            </th>

                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                Status
                                            </th>

                                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                Date
                                            </th>

                                            <th />
                                        </tr>
                                    </thead>


                                    <tbody>

                                        {recentOrders.map(
                                            (order) => (
                                                <tr
                                                    key={
                                                        order._id
                                                    }
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/orders/${order._id}`
                                                        )
                                                    }
                                                    className="group cursor-pointer border-b border-gray-50 transition hover:bg-green-50/40"
                                                >

                                                    <td className="px-6 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800">
                                                                {getInitial(
                                                                    order
                                                                        .customer
                                                                        ?.name
                                                                )}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-semibold text-gray-900">
                                                                    {order
                                                                        .customer
                                                                        ?.name ||
                                                                        "Unknown"}
                                                                </p>

                                                                <p className="max-w-[170px] truncate text-[11px] text-gray-400">
                                                                    {order
                                                                        .customer
                                                                        ?.email ||
                                                                        "No email"}
                                                                </p>
                                                            </div>

                                                        </div>

                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <p className="font-mono text-xs font-semibold text-gray-600">
                                                            #
                                                            {String(
                                                                order._id ||
                                                                    ""
                                                            ).slice(
                                                                -8
                                                            ).toUpperCase()}
                                                        </p>

                                                    </td>


                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {formatCurrency(
                                                                order.totalAmount
                                                            )}
                                                        </p>
                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600">
                                                            {order.paymentMethod ||
                                                                "COD"}
                                                        </span>

                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <span
                                                            className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                                                                order.orderStatus
                                                            )}`}
                                                        >
                                                            {formatStatus(
                                                                order.orderStatus
                                                            )}
                                                        </span>

                                                    </td>


                                                    <td className="px-6 py-4 text-xs text-gray-500">
                                                        {formatDate(
                                                            order.createdAt
                                                        )}
                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <ChevronRight
                                                            size={16}
                                                            className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-green-600"
                                                        />

                                                    </td>

                                                </tr>
                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>
                        )}

                    </div>


                    {/* ==================================================
                        RECENT FARMERS + CUSTOMERS
                    ================================================== */}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                        {/* Farmers */}

                        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

                            <div className="flex items-center justify-between border-b border-gray-100 p-5">

                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        New Farmers
                                    </h3>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Recently registered sellers
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/admin/farmers"
                                        )
                                    }
                                    className="rounded-lg p-2 text-gray-400 transition hover:bg-green-50 hover:text-green-700"
                                >
                                    <ArrowRight
                                        size={17}
                                    />
                                </button>

                            </div>


                            <div className="divide-y divide-gray-50">

                                {recentFarmers.length ===
                                0 ? (
                                    <div className="px-5 py-10 text-center text-xs text-gray-400">
                                        No recent farmers.
                                    </div>
                                ) : (
                                    recentFarmers
                                        .slice(0, 5)
                                        .map(
                                            (
                                                farmer
                                            ) => (
                                                <div
                                                    key={
                                                        farmer._id
                                                    }
                                                    className="flex items-center justify-between gap-3 px-5 py-4"
                                                >

                                                    <div className="flex min-w-0 items-center gap-3">

                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800">
                                                            {getInitial(
                                                                farmer.name
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-gray-800">
                                                                {farmer.name ||
                                                                    "Unnamed farmer"}
                                                            </p>

                                                            <p className="truncate text-[11px] text-gray-400">
                                                                {farmer.email ||
                                                                    "No email"}
                                                            </p>
                                                        </div>

                                                    </div>


                                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-green-600">
                                                        <UserCheck
                                                            size={
                                                                13
                                                            }
                                                        />
                                                        Farmer
                                                    </div>

                                                </div>
                                            )
                                        )
                                )}

                            </div>

                        </div>


                        {/* Customers */}

                        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

                            <div className="flex items-center justify-between border-b border-gray-100 p-5">

                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        New Customers
                                    </h3>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Recently registered buyers
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/admin/customers"
                                        )
                                    }
                                    className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-700"
                                >
                                    <ArrowRight
                                        size={17}
                                    />
                                </button>

                            </div>


                            <div className="divide-y divide-gray-50">

                                {recentCustomers.length ===
                                0 ? (
                                    <div className="px-5 py-10 text-center text-xs text-gray-400">
                                        No recent customers.
                                    </div>
                                ) : (
                                    recentCustomers
                                        .slice(0, 5)
                                        .map(
                                            (
                                                customer
                                            ) => (
                                                <div
                                                    key={
                                                        customer._id
                                                    }
                                                    className="flex items-center justify-between gap-3 px-5 py-4"
                                                >

                                                    <div className="flex min-w-0 items-center gap-3">

                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                                                            {getInitial(
                                                                customer.name
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-gray-800">
                                                                {customer.name ||
                                                                    "Unnamed customer"}
                                                            </p>

                                                            <p className="truncate text-[11px] text-gray-400">
                                                                {customer.email ||
                                                                    "No email"}
                                                            </p>
                                                        </div>

                                                    </div>


                                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-600">
                                                        <UserCheck
                                                            size={
                                                                13
                                                            }
                                                        />
                                                        Customer
                                                    </div>

                                                </div>
                                            )
                                        )
                                )}

                            </div>

                        </div>

                    </div>


                    {/* Footer */}

                    <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-gray-200 pt-5 text-[11px] text-gray-400 sm:flex-row">

                        <p>
                            F2C AI Powered Marketplace
                        </p>

                        <div className="flex items-center gap-2">
                            <span>
                                Admin Control Center
                            </span>

                            <span>•</span>

                            <span className="flex items-center gap-1 text-green-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                System Online
                            </span>
                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default AdminDashboard;