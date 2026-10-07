import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from "recharts";

import {
    ArrowLeft,
    ArrowUpRight,
    BarChart3,
    Boxes,
    CheckCircle2,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    Package,
    RefreshCw,
    ShoppingBag,
    TrendingUp,
    Truck,
    XCircle
} from "lucide-react";

import API from "../../services/api";


// ======================================================
// HELPERS
// ======================================================

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
};


const formatNumber = (value = 0) => {
    return new Intl.NumberFormat("en-IN").format(
        Number(value) || 0
    );
};


const formatStatus = (status = "") => {
    return status
        .toLowerCase()
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
};


// ======================================================
// STATUS CONFIG
// ======================================================

const statusConfig = {
    PLACED: {
        label: "Placed",
        icon: Clock3,
        className:
            "bg-amber-50 text-amber-700 border-amber-200"
    },

    CONFIRMED: {
        label: "Confirmed",
        icon: CheckCircle2,
        className:
            "bg-blue-50 text-blue-700 border-blue-200"
    },

    PROCESSING: {
        label: "Processing",
        icon: RefreshCw,
        className:
            "bg-violet-50 text-violet-700 border-violet-200"
    },

    PACKED: {
        label: "Packed",
        icon: Package,
        className:
            "bg-indigo-50 text-indigo-700 border-indigo-200"
    },

    OUT_FOR_DELIVERY: {
        label: "Out for Delivery",
        icon: Truck,
        className:
            "bg-orange-50 text-orange-700 border-orange-200"
    },

    DELIVERED: {
        label: "Delivered",
        icon: CheckCircle2,
        className:
            "bg-emerald-50 text-emerald-700 border-emerald-200"
    },

    CANCELLED: {
        label: "Cancelled",
        icon: XCircle,
        className:
            "bg-red-50 text-red-700 border-red-200"
    }
};


// ======================================================
// TOOLTIP
// ======================================================

const RevenueTooltip = ({
    active,
    payload,
    label
}) => {
    if (!active || !payload || !payload.length) {
        return null;
    }

    const revenue =
        payload[0]?.value || 0;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
            <p className="mb-1 text-xs font-medium text-slate-500">
                {label}
            </p>

            <p className="text-sm font-bold text-slate-900">
                {formatCurrency(revenue)}
            </p>
        </div>
    );
};


// ======================================================
// MAIN COMPONENT
// ======================================================

const FarmerAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // ==================================================
    // FETCH ANALYTICS
    // ==================================================

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem(
                    "farmerToken"
                );

            const response = await API.get(
                "/farmers/analytics",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (
                response.data?.analytics
            ) {
                setAnalytics(
                    response.data.analytics
                );
            } else {
                setAnalytics(
                    response.data
                );
            }

        } catch (err) {
            console.error(
                "FARMER ANALYTICS ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to load analytics"
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchAnalytics();
    }, []);


    // ==================================================
    // CALCULATIONS
    // ==================================================

    const deliveryRate = useMemo(() => {
        if (
            !analytics?.totalOrders ||
            analytics.totalOrders <= 0
        ) {
            return 0;
        }

        return Math.round(
            ((analytics.deliveredOrders || 0) /
                analytics.totalOrders) *
                100
        );
    }, [analytics]);


    const revenueChart = useMemo(() => {
        if (
            !analytics?.revenueChart ||
            !Array.isArray(
                analytics.revenueChart
            )
        ) {
            return [];
        }

        return analytics.revenueChart.map(
            (item) => ({
                ...item,
                revenue:
                    Number(
                        item.revenue
                    ) || 0
            })
        );
    }, [analytics]);


    const topProducts = useMemo(() => {
        if (
            !analytics?.topProducts ||
            !Array.isArray(
                analytics.topProducts
            )
        ) {
            return [];
        }

        return analytics.topProducts;
    }, [analytics]);


    const recentOrders = useMemo(() => {
        if (
            !analytics?.recentOrders ||
            !Array.isArray(
                analytics.recentOrders
            )
        ) {
            return [];
        }

        return analytics.recentOrders;
    }, [analytics]);


    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                    <div className="mb-8">
                        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />

                        <div className="mt-4 h-10 w-72 animate-pulse rounded-xl bg-slate-200" />

                        <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />
                    </div>


                    <div className="mb-6 h-52 animate-pulse rounded-3xl bg-slate-200" />


                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="h-36 animate-pulse rounded-3xl bg-slate-200"
                                />
                            )
                        )}
                    </div>


                    <div className="mt-6 h-96 animate-pulse rounded-3xl bg-slate-200" />
                </div>
            </div>
        );
    }


    // ==================================================
    // ERROR
    // ==================================================

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4">

                    <div className="w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                            <BarChart3
                                size={30}
                            />
                        </div>

                        <h2 className="mt-5 text-2xl font-bold text-slate-900">
                            Unable to load analytics
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={
                                fetchAnalytics
                            }
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            <RefreshCw
                                size={16}
                            />
                            Try Again
                        </button>

                    </div>
                </div>
            </div>
        );
    }


    // ==================================================
    // DEFAULT DATA
    // ==================================================

    const totalProducts =
        analytics?.totalProducts || 0;

    const availableProducts =
        analytics?.availableProducts || 0;

    const totalOrders =
        analytics?.totalOrders || 0;

    const activeOrders =
        analytics?.activeOrders || 0;

    const totalItemsSold =
        analytics?.totalItemsSold || 0;

    const totalRevenue =
        analytics?.totalRevenue || 0;

    const deliveredRevenue =
        analytics?.deliveredRevenue || 0;

    const bestProduct =
        topProducts[0];


    // ==================================================
    // UI
    // ==================================================

    return (
        <div className="min-h-screen bg-slate-50">

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* =====================================
                    HEADER
                ===================================== */}

                <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">

                    <div>

                        <Link
                            to="/farmer/dashboard"
                            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-600"
                        >
                            <ArrowLeft
                                size={16}
                            />
                            Back to Dashboard
                        </Link>

                        <div className="flex items-center gap-3">

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                <BarChart3
                                    size={25}
                                />
                            </div>

                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                                    Business Analytics
                                </h1>

                                <p className="mt-1 text-sm text-slate-500 sm:text-base">
                                    Track your sales, products,
                                    orders and farm business
                                    performance.
                                </p>
                            </div>

                        </div>

                    </div>


                    <div className="flex gap-3">

                        <button
                            type="button"
                            onClick={
                                fetchAnalytics
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
                        >
                            <RefreshCw
                                size={16}
                            />
                            Refresh
                        </button>

                        <Link
                            to="/farmer/products/add"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            <Package
                                size={17}
                            />
                            Add Product
                        </Link>

                    </div>

                </div>


                {/* =====================================
                    REVENUE HERO
                ===================================== */}

                <section className="relative mb-6 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8">

                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

                    <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />


                    <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">

                        <div>

                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                                <TrendingUp
                                    size={14}
                                />
                                Business Overview
                            </div>

                            <p className="text-sm font-medium text-slate-400">
                                Total Revenue
                            </p>

                            <h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                                {formatCurrency(
                                    totalRevenue
                                )}
                            </h2>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                                Revenue generated from
                                orders containing your
                                products across the
                                marketplace.
                            </p>

                        </div>


                        <div className="grid grid-cols-2 gap-3 sm:gap-4">

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">

                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                                    <CircleDollarSign
                                        size={19}
                                    />
                                </div>

                                <p className="mt-4 text-xs text-slate-400">
                                    Delivered Revenue
                                </p>

                                <p className="mt-1 text-lg font-bold text-white">
                                    {formatCurrency(
                                        deliveredRevenue
                                    )}
                                </p>

                            </div>


                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">

                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                                    <Truck
                                        size={19}
                                    />
                                </div>

                                <p className="mt-4 text-xs text-slate-400">
                                    Delivery Rate
                                </p>

                                <p className="mt-1 text-lg font-bold text-white">
                                    {deliveryRate}%
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================
                    STAT CARDS
                ===================================== */}

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-start justify-between">

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <Boxes
                                    size={22}
                                />
                            </div>

                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Products
                            </span>

                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Total Products
                        </p>

                        <p className="mt-1 text-3xl font-black text-slate-900">
                            {formatNumber(
                                totalProducts
                            )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            {availableProducts} currently
                            available
                        </p>

                    </div>


                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-start justify-between">

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <ShoppingBag
                                    size={22}
                                />
                            </div>

                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                Orders
                            </span>

                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Total Orders
                        </p>

                        <p className="mt-1 text-3xl font-black text-slate-900">
                            {formatNumber(
                                totalOrders
                            )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            {activeOrders} active orders
                        </p>

                    </div>


                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-start justify-between">

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                                <Package
                                    size={22}
                                />
                            </div>

                            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                Sales
                            </span>

                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Items Sold
                        </p>

                        <p className="mt-1 text-3xl font-black text-slate-900">
                            {formatNumber(
                                totalItemsSold
                            )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Across all orders
                        </p>

                    </div>


                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-start justify-between">

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                                <CheckCircle2
                                    size={22}
                                />
                            </div>

                            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                                Delivered
                            </span>

                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-500">
                            Delivered Revenue
                        </p>

                        <p className="mt-1 text-3xl font-black text-slate-900">
                            {formatCurrency(
                                deliveredRevenue
                            )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            {analytics?.deliveredOrders ||
                                0}{" "}
                            delivered orders
                        </p>

                    </div>

                </div>


                {/* =====================================
                    REVENUE CHART
                ===================================== */}

                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                        <div>

                            <div className="flex items-center gap-2">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <TrendingUp
                                        size={19}
                                    />
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Revenue Overview
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Your revenue trend
                                    </p>
                                </div>

                            </div>

                        </div>

                        <div className="rounded-xl bg-slate-50 px-4 py-2">
                            <p className="text-xs font-medium text-slate-400">
                                Total
                            </p>

                            <p className="text-sm font-bold text-slate-900">
                                {formatCurrency(
                                    totalRevenue
                                )}
                            </p>
                        </div>

                    </div>


                    {revenueChart.length > 0 ? (
                        <div className="h-[320px] w-full">

                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <AreaChart
                                    data={
                                        revenueChart
                                    }
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: 0,
                                        bottom: 0
                                    }}
                                >

                                    <defs>
                                        <linearGradient
                                            id="revenueGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopOpacity={
                                                    0.3
                                                }
                                            />

                                            <stop
                                                offset="100%"
                                                stopOpacity={
                                                    0
                                                }
                                            />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="4 4"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="date"
                                        axisLine={
                                            false
                                        }
                                        tickLine={
                                            false
                                        }
                                        tick={{
                                            fontSize: 12
                                        }}
                                        tickMargin={10}
                                    />

                                    <YAxis
                                        axisLine={
                                            false
                                        }
                                        tickLine={
                                            false
                                        }
                                        tick={{
                                            fontSize: 12
                                        }}
                                        tickFormatter={(
                                            value
                                        ) =>
                                            `₹${value}`
                                        }
                                    />

                                    <Tooltip
                                        content={
                                            <RevenueTooltip />
                                        }
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        strokeWidth={
                                            3
                                        }
                                        fill="url(#revenueGradient)"
                                        dot={false}
                                        activeDot={{
                                            r: 6
                                        }}
                                    />

                                </AreaChart>
                            </ResponsiveContainer>

                        </div>
                    ) : (
                        <div className="flex h-[320px] items-center justify-center rounded-2xl bg-slate-50">

                            <div className="text-center">

                                <BarChart3
                                    className="mx-auto text-slate-300"
                                    size={42}
                                />

                                <p className="mt-3 font-semibold text-slate-600">
                                    No revenue data yet
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                    Revenue trends will
                                    appear here as customers
                                    place orders.
                                </p>

                            </div>

                        </div>
                    )}

                </section>


                {/* =====================================
                    ORDER STATUS + TOP PRODUCTS
                ===================================== */}

                <div className="mt-6 grid gap-6 lg:grid-cols-2">

                    {/* ORDER STATUS */}

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                        <div className="mb-6">

                            <h2 className="text-lg font-bold text-slate-900">
                                Order Status
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Current distribution of your
                                orders
                            </p>

                        </div>


                        <div className="space-y-3">

                            {[
                                [
                                    "PLACED",
                                    "Placed"
                                ],
                                [
                                    "CONFIRMED",
                                    "Confirmed"
                                ],
                                [
                                    "PROCESSING",
                                    "Processing"
                                ],
                                [
                                    "PACKED",
                                    "Packed"
                                ],
                                [
                                    "OUT_FOR_DELIVERY",
                                    "Out for Delivery"
                                ],
                                [
                                    "DELIVERED",
                                    "Delivered"
                                ],
                                [
                                    "CANCELLED",
                                    "Cancelled"
                                ]
                            ].map(
                                ([
                                    status,
                                    label
                                ]) => {

                                    const count =
                                        analytics
                                            ?.orderStatus?.[
                                            status
                                        ] || 0;

                                    const config =
                                        statusConfig[
                                            status
                                        ];

                                    const Icon =
                                        config?.icon ||
                                        Package;

                                    return (
                                        <div
                                            key={
                                                status
                                            }
                                            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                                        >

                                            <div className="flex items-center gap-3">

                                                <div
                                                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${config?.className || "bg-slate-50 text-slate-600 border-slate-200"}`}
                                                >
                                                    <Icon
                                                        size={
                                                            17
                                                        }
                                                    />
                                                </div>

                                                <span className="text-sm font-semibold text-slate-700">
                                                    {label}
                                                </span>

                                            </div>

                                            <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm">
                                                {count}
                                            </span>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    </section>


                    {/* TOP PRODUCTS */}

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                        <div className="mb-6 flex items-center justify-between">

                            <div>

                                <h2 className="text-lg font-bold text-slate-900">
                                    Top Products
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Your best-performing
                                    products
                                </p>

                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <TrendingUp
                                    size={19}
                                />
                            </div>

                        </div>


                        {topProducts.length > 0 ? (
                            <div className="space-y-3">

                                {topProducts
                                    .slice(
                                        0,
                                        5
                                    )
                                    .map(
                                        (
                                            product,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    product._id ||
                                                    product.productId ||
                                                    index
                                                }
                                                className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"
                                            >

                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600">
                                                    #
                                                    {index +
                                                        1}
                                                </div>

                                                <div className="min-w-0 flex-1">

                                                    <p className="truncate text-sm font-bold text-slate-900">
                                                        {product.name ||
                                                            product.productName ||
                                                            "Product"}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {formatNumber(
                                                            product.totalQuantity ||
                                                                product.quantitySold ||
                                                                product.soldQuantity ||
                                                                0
                                                        )}{" "}
                                                        units sold
                                                    </p>

                                                </div>

                                                <div className="text-right">

                                                    <p className="text-sm font-bold text-emerald-600">
                                                        {formatCurrency(
                                                            product.revenue ||
                                                                product.totalRevenue ||
                                                                0
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Revenue
                                                    </p>

                                                </div>

                                            </div>
                                        )
                                    )}

                            </div>
                        ) : (
                            <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-slate-50">

                                <div className="text-center">

                                    <Package
                                        className="mx-auto text-slate-300"
                                        size={40}
                                    />

                                    <p className="mt-3 font-semibold text-slate-600">
                                        No product sales yet
                                    </p>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Your best-performing
                                        products will appear
                                        here.
                                    </p>

                                </div>

                            </div>
                        )}

                    </section>

                </div>


                {/* =====================================
                    RECENT ORDERS
                ===================================== */}

                <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">

                        <div>

                            <h2 className="text-lg font-bold text-slate-900">
                                Recent Orders
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Latest orders containing
                                your products
                            </p>

                        </div>


                        <Link
                            to="/farmer/orders"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                        >
                            View all orders
                            <ChevronRight
                                size={16}
                            />
                        </Link>

                    </div>


                    {recentOrders.length > 0 ? (
                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[760px]">

                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left">

                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Order
                                        </th>

                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Customer
                                        </th>

                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Items
                                        </th>

                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Amount
                                        </th>

                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Action
                                        </th>

                                    </tr>
                                </thead>


                                <tbody>

                                    {recentOrders.map(
                                        (
                                            order,
                                            index
                                        ) => {

                                            const config =
                                                statusConfig[
                                                    order.orderStatus
                                                ];

                                            const StatusIcon =
                                                config?.icon ||
                                                Package;

                                            return (
                                                <tr
                                                    key={
                                                        order._id ||
                                                        index
                                                    }
                                                    className="border-b border-slate-100 last:border-0"
                                                >

                                                    <td className="px-6 py-4">

                                                        <p className="font-mono text-xs font-semibold text-slate-700">
                                                            #
                                                            {String(
                                                                order._id ||
                                                                    ""
                                                            ).slice(
                                                                -8
                                                            )}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-400">
                                                            {order.createdAt
                                                                ? new Date(
                                                                      order.createdAt
                                                                  ).toLocaleDateString(
                                                                      "en-IN",
                                                                      {
                                                                          day: "2-digit",
                                                                          month: "short",
                                                                          year: "numeric"
                                                                      }
                                                                  )
                                                                : "—"}
                                                        </p>

                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <p className="text-sm font-semibold text-slate-800">
                                                            {order.customer?.name ||
                                                                order.customerName ||
                                                                "Customer"}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-400">
                                                            {order.customer?.email ||
                                                                ""}
                                                        </p>

                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <span className="text-sm font-semibold text-slate-700">
                                                            {formatNumber(
                                                                order.totalItems ||
                                                                    order.itemCount ||
                                                                    order.itemsCount ||
                                                                    order.items?.length ||
                                                                    0
                                                            )}
                                                        </span>

                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <span className="text-sm font-bold text-slate-900">
                                                            {formatCurrency(
                                                                order.farmerSubtotal ||
                                                                    order.totalAmount ||
                                                                    order.amount ||
                                                                    0
                                                            )}
                                                        </span>

                                                    </td>


                                                    <td className="px-6 py-4">

                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${config?.className || "border-slate-200 bg-slate-50 text-slate-600"}`}
                                                        >

                                                            <StatusIcon
                                                                size={
                                                                    13
                                                                }
                                                            />

                                                            {config?.label ||
                                                                formatStatus(
                                                                    order.orderStatus
                                                                )}

                                                        </span>

                                                    </td>


                                                    <td className="px-6 py-4 text-right">

                                                        <Link
                                                            to={`/farmer/orders/${order._id}`}
                                                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                        >
                                                            View
                                                            <ArrowUpRight
                                                                size={
                                                                    14
                                                                }
                                                            />
                                                        </Link>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>
                    ) : (
                        <div className="px-6 py-16 text-center">

                            <ShoppingBag
                                className="mx-auto text-slate-300"
                                size={44}
                            />

                            <h3 className="mt-4 text-base font-bold text-slate-700">
                                No orders yet
                            </h3>

                            <p className="mt-1 text-sm text-slate-400">
                                Orders containing your
                                products will appear here.
                            </p>

                        </div>
                    )}

                </section>


                {/* =====================================
                    BUSINESS SNAPSHOT
                ===================================== */}

                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                    <div className="mb-6">

                        <h2 className="text-lg font-bold text-slate-900">
                            Business Snapshot
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Quick insights into your current
                            marketplace performance.
                        </p>

                    </div>


                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                        <div className="rounded-2xl bg-slate-50 p-4">

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Best Product
                            </p>

                            <p className="mt-2 truncate text-sm font-bold text-slate-900">
                                {bestProduct?.name ||
                                    bestProduct?.productName ||
                                    "No sales yet"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                {bestProduct
                                    ? `${formatCurrency(
                                          bestProduct.revenue ||
                                              bestProduct.totalRevenue ||
                                              0
                                      )} revenue`
                                    : "Start selling to see insights"}
                            </p>

                        </div>


                        <div className="rounded-2xl bg-slate-50 p-4">

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Active Orders
                            </p>

                            <p className="mt-2 text-2xl font-black text-slate-900">
                                {formatNumber(
                                    activeOrders
                                )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Orders requiring attention
                            </p>

                        </div>


                        <div className="rounded-2xl bg-slate-50 p-4">

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Product Availability
                            </p>

                            <p className="mt-2 text-2xl font-black text-slate-900">
                                {totalProducts > 0
                                    ? Math.round(
                                          (availableProducts /
                                              totalProducts) *
                                              100
                                      )
                                    : 0}
                                %
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                {availableProducts} of{" "}
                                {totalProducts} products
                                available
                            </p>

                        </div>


                        <Link
                            to="/farmer/orders"
                            className="group rounded-2xl bg-emerald-50 p-4 transition hover:bg-emerald-100"
                        >

                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                Manage Orders
                            </p>

                            <div className="mt-3 flex items-center justify-between">

                                <span className="text-sm font-bold text-emerald-800">
                                    Open order management
                                </span>

                                <ArrowUpRight
                                    size={18}
                                    className="text-emerald-600 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                />

                            </div>

                        </Link>

                    </div>

                </section>


                {/* =====================================
                    FOOTER SPACE
                ===================================== */}

                <div className="h-10" />

            </div>

        </div>
    );
};


export default FarmerAnalytics;