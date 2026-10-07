import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

import {
    Users,
    UserCheck,
    UserX,
    Search,
    RefreshCw,
    ShieldCheck,
    ShieldOff,
    Trash2,
    LayoutDashboard,
    ShoppingBasket,
    Package,
    ShoppingCart,
    LogOut,
    ChevronRight,
    MapPin,
    Mail,
    Phone,
    CalendarDays,
    AlertCircle,
    X,
    CheckCircle2,
    Menu,
} from "lucide-react";

function AdminFarmers() {
    const navigate = useNavigate();

    const [farmers, setFarmers] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [actionLoading, setActionLoading] = useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ==========================================
    // FETCH FARMERS
    // ==========================================

    const fetchFarmers = async (isRefresh = false) => {
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

            const response = await API.get("/admin/farmers", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setFarmers(response.data.farmers || []);
        } catch (error) {
            console.error("Farmers error:", error);

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
                    "Failed to load farmers. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFarmers();
    }, []);

    // ==========================================
    // TOGGLE BLOCK
    // ==========================================

    const toggleBlock = async (id) => {
        try {
            setActionLoading(id);

            const token = localStorage.getItem("adminToken");

            const response = await API.put(
                `/admin/farmers/${id}/toggle-block`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const updatedFarmer = response.data?.farmer;

            if (updatedFarmer) {
                setFarmers((prev) =>
                    prev.map((farmer) =>
                        farmer._id === id ? updatedFarmer : farmer
                    )
                );
            } else {
                await fetchFarmers();
            }
        } catch (error) {
            console.error("Block farmer error:", error);

            alert(
                error.response?.data?.message ||
                    "Failed to update farmer status."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // ==========================================
    // DELETE FARMER
    // ==========================================

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            setActionLoading(deleteTarget._id);

            const token = localStorage.getItem("adminToken");

            await API.delete(`/admin/farmers/${deleteTarget._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setFarmers((prev) =>
                prev.filter(
                    (farmer) => farmer._id !== deleteTarget._id
                )
            );

            setDeleteTarget(null);
        } catch (error) {
            console.error("Delete farmer error:", error);

            alert(
                error.response?.data?.message ||
                    "Failed to delete farmer."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // ==========================================
    // FILTER FARMERS
    // ==========================================

    const filteredFarmers = useMemo(() => {
        const query = search.toLowerCase().trim();

        return farmers.filter((farmer) => {
            const matchesSearch =
                farmer.name?.toLowerCase().includes(query) ||
                farmer.email?.toLowerCase().includes(query) ||
                farmer.phone?.toLowerCase().includes(query) ||
                farmer.address?.toLowerCase().includes(query);

            const matchesFilter =
                filter === "all" ||
                (filter === "active" && !farmer.isBlocked) ||
                (filter === "blocked" && farmer.isBlocked);

            return matchesSearch && matchesFilter;
        });
    }, [farmers, search, filter]);

    // ==========================================
    // STATS
    // ==========================================

    const totalFarmers = farmers.length;

    const blockedFarmers = farmers.filter(
        (farmer) => farmer.isBlocked
    ).length;

    const activeFarmers = totalFarmers - blockedFarmers;

    // ==========================================
    // LOGOUT
    // ==========================================

    const logout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        navigate("/admin/login");
    };

    // ==========================================
    // SIDEBAR NAVIGATION
    // ==========================================

    const navigationItems = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/admin/dashboard",
        },
        {
            label: "Farmers",
            icon: Users,
            path: "/admin/farmers",
            active: true,
        },
        {
            label: "Customers",
            icon: UserCheck,
            path: "/admin/customers",
        },
        {
            label: "Products",
            icon: ShoppingBasket,
            path: "/admin/products",
        },
        {
            label: "Orders",
            icon: ShoppingCart,
            path: "/admin/orders",
        },
    ];

    return (
        <div className="min-h-screen bg-[#f5f7f3] text-slate-800">

            {/* ==========================================
                MOBILE OVERLAY
            ========================================== */}

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ==========================================
                SIDEBAR
            ========================================== */}

            <aside
                className={`
                    fixed left-0 top-0 z-50 h-screen w-[270px]
                    bg-[#12351f] text-white
                    transition-transform duration-300
                    lg:translate-x-0
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >

                {/* Brand */}

                <div className="flex h-24 items-center justify-between border-b border-white/10 px-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl">
                            🌾
                        </div>

                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                F2C Admin
                            </h1>

                            <p className="text-xs text-emerald-200">
                                Control Center
                            </p>
                        </div>

                    </div>

                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* Navigation */}

                <div className="px-4 py-6">

                    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/60">
                        Main Menu
                    </p>

                    <nav className="space-y-1.5">

                        {navigationItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        navigate(item.path);
                                        setSidebarOpen(false);
                                    }}
                                    className={`
                                        group flex w-full items-center gap-3
                                        rounded-xl px-4 py-3
                                        text-left text-sm font-medium
                                        transition
                                        ${
                                            item.active
                                                ? "bg-white text-[#12351f] shadow-lg shadow-black/10"
                                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                        }
                                    `}
                                >
                                    <Icon
                                        size={18}
                                        className={
                                            item.active
                                                ? "text-[#176b35]"
                                                : "text-white/60 group-hover:text-white"
                                        }
                                    />

                                    <span>{item.label}</span>

                                    {item.active && (
                                        <ChevronRight
                                            size={15}
                                            className="ml-auto text-[#176b35]"
                                        />
                                    )}
                                </button>
                            );
                        })}

                    </nav>
                </div>

                {/* Bottom */}

                <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">

                    <div className="mb-3 rounded-xl bg-white/5 px-4 py-3">
                        <p className="text-xs text-white/50">
                            Admin Panel
                        </p>

                        <p className="mt-1 text-sm font-semibold text-white">
                            Marketplace Control
                        </p>
                    </div>

                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>

                </div>

            </aside>

            {/* ==========================================
                MAIN
            ========================================== */}

            <main className="min-h-screen lg:ml-[270px]">

                {/* ==========================================
                    HEADER
                ========================================== */}

                <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">

                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-xl border border-slate-200 bg-white p-2.5 lg:hidden"
                        >
                            <Menu size={20} />
                        </button>

                        <div>
                            <div className="flex items-center gap-2">

                                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                                    Farmers
                                </h2>

                                <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 sm:inline-flex">
                                    Management
                                </span>

                            </div>

                            <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                                Manage farmer accounts and marketplace access.
                            </p>
                        </div>

                    </div>

                    <div className="flex items-center gap-2">

                        <button
                            onClick={() => fetchFarmers(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 sm:px-4"
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

                </header>

                {/* ==========================================
                    CONTENT
                ========================================== */}

                <section className="p-4 sm:p-6 lg:p-8">

                    {/* Page intro */}

                    <div className="mb-7">

                        <div className="flex items-end justify-between">

                            <div>
                                <p className="text-sm font-semibold text-emerald-600">
                                    Farmer Directory
                                </p>

                                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                    Manage your farmers
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                    Monitor registered farmers, control account
                                    access and keep your marketplace community
                                    secure.
                                </p>
                            </div>

                        </div>

                    </div>

                    {/* ==========================================
                        STATS
                    ========================================== */}

                    <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                        {/* Total */}

                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

                            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-50" />

                            <div className="relative flex items-start justify-between">

                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Total Farmers
                                    </p>

                                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                        {totalFarmers}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-400">
                                        Registered accounts
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Users size={21} />
                                </div>

                            </div>
                        </div>

                        {/* Active */}

                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

                            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-50" />

                            <div className="relative flex items-start justify-between">

                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Active Farmers
                                    </p>

                                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                        {activeFarmers}
                                    </p>

                                    <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                                        <CheckCircle2 size={12} />
                                        Marketplace access enabled
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <UserCheck size={21} />
                                </div>

                            </div>
                        </div>

                        {/* Blocked */}

                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

                            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-50" />

                            <div className="relative flex items-start justify-between">

                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        Blocked Farmers
                                    </p>

                                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                        {blockedFarmers}
                                    </p>

                                    <p className="mt-2 text-xs text-red-500">
                                        Restricted accounts
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                    <UserX size={21} />
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* ==========================================
                        ERROR
                    ========================================== */}

                    {error && (
                        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

                            <AlertCircle
                                size={20}
                                className="mt-0.5 shrink-0 text-red-600"
                            />

                            <div className="flex-1">
                                <p className="font-semibold text-red-800">
                                    Unable to load farmers
                                </p>

                                <p className="mt-1 text-sm text-red-600">
                                    {error}
                                </p>
                            </div>

                            <button
                                onClick={() => fetchFarmers()}
                                className="text-sm font-semibold text-red-700 hover:underline"
                            >
                                Retry
                            </button>

                        </div>
                    )}

                    {/* ==========================================
                        DIRECTORY CARD
                    ========================================== */}

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        {/* Toolbar */}

                        <div className="border-b border-slate-100 p-4 sm:p-5">

                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                                <div>
                                    <h2 className="font-bold text-slate-900">
                                        All Farmers
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Showing {filteredFarmers.length} of{" "}
                                        {totalFarmers} farmers
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">

                                    {/* Search */}

                                    <div className="relative sm:w-80">

                                        <Search
                                            size={17}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            placeholder="Search farmers..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                                        />

                                        {search && (
                                            <button
                                                onClick={() =>
                                                    setSearch("")
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                            >
                                                <X size={15} />
                                            </button>
                                        )}

                                    </div>

                                    {/* Filter */}

                                    <div className="flex rounded-xl bg-slate-100 p-1">

                                        {[
                                            ["all", "All"],
                                            ["active", "Active"],
                                            ["blocked", "Blocked"],
                                        ].map(([value, label]) => (
                                            <button
                                                key={value}
                                                onClick={() =>
                                                    setFilter(value)
                                                }
                                                className={`
                                                    rounded-lg px-3.5 py-2
                                                    text-xs font-semibold
                                                    transition
                                                    ${
                                                        filter === value
                                                            ? "bg-white text-emerald-700 shadow-sm"
                                                            : "text-slate-500 hover:text-slate-800"
                                                    }
                                                `}
                                            >
                                                {label}
                                            </button>
                                        ))}

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* ==========================================
                            LOADING
                        ========================================== */}

                        {loading ? (
                            <div className="p-5">

                                <div className="hidden md:block">

                                    <div className="mb-4 h-12 animate-pulse rounded-xl bg-slate-100" />

                                    <div className="space-y-3">

                                        {[1, 2, 3, 4, 5].map((item) => (
                                            <div
                                                key={item}
                                                className="h-20 animate-pulse rounded-xl bg-slate-50"
                                            />
                                        ))}

                                    </div>

                                </div>

                                <div className="space-y-3 md:hidden">

                                    {[1, 2, 3].map((item) => (
                                        <div
                                            key={item}
                                            className="h-40 animate-pulse rounded-2xl bg-slate-100"
                                        />
                                    ))}

                                </div>

                            </div>
                        ) : filteredFarmers.length === 0 ? (

                            /* ==========================================
                                EMPTY STATE
                            ========================================== */

                            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">

                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                    <Users
                                        size={28}
                                        className="text-slate-400"
                                    />
                                </div>

                                <h3 className="mt-5 text-lg font-bold text-slate-800">
                                    No farmers found
                                </h3>

                                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                    {search
                                        ? "No farmer matches your search. Try another name, email or phone number."
                                        : "There are no farmers available for this filter."}
                                </p>

                                {(search || filter !== "all") && (
                                    <button
                                        onClick={() => {
                                            setSearch("");
                                            setFilter("all");
                                        }}
                                        className="mt-5 rounded-xl bg-[#12351f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b4a2b]"
                                    >
                                        Clear Filters
                                    </button>
                                )}

                            </div>
                        ) : (

                            <>
                                {/* ==========================================
                                    DESKTOP TABLE
                                ========================================== */}

                                <div className="hidden overflow-x-auto md:block">

                                    <table className="w-full">

                                        <thead>

                                            <tr className="border-b border-slate-100 bg-slate-50/70">

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Farmer
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Contact
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Location
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Joined
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Status
                                                </th>

                                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Actions
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {filteredFarmers.map((farmer) => {

                                                const isLoading =
                                                    actionLoading ===
                                                    farmer._id;

                                                return (
                                                    <tr
                                                        key={farmer._id}
                                                        className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                                                    >

                                                        {/* Farmer */}

                                                        <td className="px-6 py-5">

                                                            <div className="flex items-center gap-3">

                                                                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 to-green-200 font-bold text-emerald-800">

                                                                    {farmer.name
                                                                        ?.charAt(
                                                                            0
                                                                        )
                                                                        ?.toUpperCase() ||
                                                                        "F"}

                                                                    {!farmer.isBlocked && (
                                                                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                                                                    )}

                                                                </div>

                                                                <div className="min-w-0">

                                                                    <p className="truncate font-semibold text-slate-900">
                                                                        {farmer.name ||
                                                                            "Unknown Farmer"}
                                                                    </p>

                                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                                        Farmer Account
                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>

                                                        {/* Contact */}

                                                        <td className="px-6 py-5">

                                                            <div className="space-y-1.5">

                                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                    <Mail
                                                                        size={13}
                                                                        className="text-slate-400"
                                                                    />

                                                                    <span className="max-w-[220px] truncate">
                                                                        {farmer.email ||
                                                                            "No email"}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                    <Phone
                                                                        size={12}
                                                                    />

                                                                    {farmer.phone ||
                                                                        "No phone"}
                                                                </div>

                                                            </div>

                                                        </td>

                                                        {/* Location */}

                                                        <td className="px-6 py-5">

                                                            <div className="flex max-w-[200px] items-center gap-2 text-sm text-slate-600">

                                                                <MapPin
                                                                    size={14}
                                                                    className="shrink-0 text-slate-400"
                                                                />

                                                                <span className="truncate">
                                                                    {farmer.address ||
                                                                        "No address"}
                                                                </span>

                                                            </div>

                                                        </td>

                                                        {/* Joined */}

                                                        <td className="px-6 py-5">

                                                            <div className="flex items-center gap-2 text-sm text-slate-500">

                                                                <CalendarDays
                                                                    size={14}
                                                                    className="text-slate-400"
                                                                />

                                                                {farmer.createdAt
                                                                    ? new Date(
                                                                          farmer.createdAt
                                                                      ).toLocaleDateString(
                                                                          "en-IN",
                                                                          {
                                                                              day: "2-digit",
                                                                              month: "short",
                                                                              year: "numeric",
                                                                          }
                                                                      )
                                                                    : "—"}

                                                            </div>

                                                        </td>

                                                        {/* Status */}

                                                        <td className="px-6 py-5">

                                                            {farmer.isBlocked ? (
                                                                <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">

                                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

                                                                    Blocked
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">

                                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                                                    Active
                                                                </span>
                                                            )}

                                                        </td>

                                                        {/* Actions */}

                                                        <td className="px-6 py-5">

                                                            <div className="flex justify-end gap-2">

                                                                <button
                                                                    disabled={
                                                                        isLoading
                                                                    }
                                                                    onClick={() =>
                                                                        toggleBlock(
                                                                            farmer._id
                                                                        )
                                                                    }
                                                                    title={
                                                                        farmer.isBlocked
                                                                            ? "Unblock farmer"
                                                                            : "Block farmer"
                                                                    }
                                                                    className={`
                                                                        flex items-center gap-2
                                                                        rounded-xl px-3 py-2
                                                                        text-xs font-semibold
                                                                        transition
                                                                        disabled:cursor-not-allowed
                                                                        disabled:opacity-50
                                                                        ${
                                                                            farmer.isBlocked
                                                                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                                                : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                                                        }
                                                                    `}
                                                                >
                                                                    {isLoading ? (
                                                                        <RefreshCw
                                                                            size={14}
                                                                            className="animate-spin"
                                                                        />
                                                                    ) : farmer.isBlocked ? (
                                                                        <ShieldCheck
                                                                            size={14}
                                                                        />
                                                                    ) : (
                                                                        <ShieldOff
                                                                            size={14}
                                                                        />
                                                                    )}

                                                                    {farmer.isBlocked
                                                                        ? "Unblock"
                                                                        : "Block"}
                                                                </button>

                                                                <button
                                                                    disabled={
                                                                        isLoading
                                                                    }
                                                                    onClick={() =>
                                                                        setDeleteTarget(
                                                                            farmer
                                                                        )
                                                                    }
                                                                    title="Delete farmer"
                                                                    className="rounded-xl bg-red-50 p-2.5 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                                                >
                                                                    <Trash2
                                                                        size={15}
                                                                    />
                                                                </button>

                                                            </div>

                                                        </td>

                                                    </tr>
                                                );
                                            })}

                                        </tbody>

                                    </table>

                                </div>

                                {/* ==========================================
                                    MOBILE CARDS
                                ========================================== */}

                                <div className="space-y-3 p-4 md:hidden">

                                    {filteredFarmers.map((farmer) => {

                                        const isLoading =
                                            actionLoading === farmer._id;

                                        return (
                                            <div
                                                key={farmer._id}
                                                className="rounded-2xl border border-slate-200 bg-white p-4"
                                            >

                                                <div className="flex items-start justify-between gap-3">

                                                    <div className="flex min-w-0 items-center gap-3">

                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                                                            {farmer.name
                                                                ?.charAt(0)
                                                                ?.toUpperCase() ||
                                                                "F"}
                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="truncate font-bold text-slate-900">
                                                                {farmer.name ||
                                                                    "Unknown Farmer"}
                                                            </p>

                                                            <p className="truncate text-xs text-slate-500">
                                                                {farmer.email ||
                                                                    "No email"}
                                                            </p>

                                                        </div>

                                                    </div>

                                                    {farmer.isBlocked ? (
                                                        <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                                                            Blocked
                                                        </span>
                                                    ) : (
                                                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                                                            Active
                                                        </span>
                                                    )}

                                                </div>

                                                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">

                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                            Phone
                                                        </p>

                                                        <p className="mt-1 truncate text-xs text-slate-600">
                                                            {farmer.phone ||
                                                                "—"}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                            Joined
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-600">
                                                            {farmer.createdAt
                                                                ? new Date(
                                                                      farmer.createdAt
                                                                  ).toLocaleDateString(
                                                                      "en-IN",
                                                                      {
                                                                          day: "2-digit",
                                                                          month: "short",
                                                                          year: "numeric",
                                                                      }
                                                                  )
                                                                : "—"}
                                                        </p>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                            Address
                                                        </p>

                                                        <p className="mt-1 truncate text-xs text-slate-600">
                                                            {farmer.address ||
                                                                "No address"}
                                                        </p>
                                                    </div>

                                                </div>

                                                <div className="mt-4 flex gap-2">

                                                    <button
                                                        disabled={isLoading}
                                                        onClick={() =>
                                                            toggleBlock(
                                                                farmer._id
                                                            )
                                                        }
                                                        className={`
                                                            flex flex-1
                                                            items-center justify-center
                                                            gap-2 rounded-xl
                                                            py-2.5 text-xs
                                                            font-semibold
                                                            disabled:opacity-50
                                                            ${
                                                                farmer.isBlocked
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : "bg-orange-50 text-orange-700"
                                                            }
                                                        `}
                                                    >
                                                        {isLoading ? (
                                                            <RefreshCw
                                                                size={14}
                                                                className="animate-spin"
                                                            />
                                                        ) : farmer.isBlocked ? (
                                                            <ShieldCheck
                                                                size={14}
                                                            />
                                                        ) : (
                                                            <ShieldOff
                                                                size={14}
                                                            />
                                                        )}

                                                        {farmer.isBlocked
                                                            ? "Unblock Farmer"
                                                            : "Block Farmer"}
                                                    </button>

                                                    <button
                                                        disabled={isLoading}
                                                        onClick={() =>
                                                            setDeleteTarget(
                                                                farmer
                                                            )
                                                        }
                                                        className="rounded-xl bg-red-50 px-4 py-2.5 text-red-600"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>

                                                </div>

                                            </div>
                                        );
                                    })}

                                </div>

                            </>
                        )}

                        {/* Footer */}

                        {!loading &&
                            filteredFarmers.length > 0 && (
                                <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                                    <p className="text-xs text-slate-500">
                                        Showing{" "}
                                        <span className="font-semibold text-slate-700">
                                            {filteredFarmers.length}
                                        </span>{" "}
                                        farmers
                                    </p>

                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <ShieldCheck size={14} />
                                        Admin-controlled accounts
                                    </div>

                                </div>
                            )}

                    </div>

                </section>

            </main>

            {/* ==========================================
                DELETE MODAL
            ========================================== */}

            {deleteTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

                        {/* Modal Header */}

                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                            <div className="flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                                    <Trash2
                                        size={20}
                                        className="text-red-600"
                                    />
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900">
                                        Delete Farmer
                                    </h3>

                                    <p className="text-xs text-slate-500">
                                        Permanent account removal
                                    </p>
                                </div>

                            </div>

                            <button
                                onClick={() =>
                                    setDeleteTarget(null)
                                }
                                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={18} />
                            </button>

                        </div>

                        {/* Modal Content */}

                        <div className="px-6 py-6">

                            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-emerald-700 shadow-sm">
                                        {deleteTarget.name
                                            ?.charAt(0)
                                            ?.toUpperCase() || "F"}
                                    </div>

                                    <div className="min-w-0">

                                        <p className="font-semibold text-slate-900">
                                            {deleteTarget.name ||
                                                "Unknown Farmer"}
                                        </p>

                                        <p className="truncate text-xs text-slate-500">
                                            {deleteTarget.email ||
                                                "No email"}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <p className="mt-5 text-sm leading-6 text-slate-600">
                                Are you sure you want to permanently delete
                                this farmer? This action cannot be undone.
                            </p>

                        </div>

                        {/* Modal Actions */}

                        <div className="flex gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">

                            <button
                                onClick={() =>
                                    setDeleteTarget(null)
                                }
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmDelete}
                                disabled={
                                    actionLoading ===
                                    deleteTarget._id
                                }
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                            >
                                {actionLoading === deleteTarget._id ? (
                                    <>
                                        <RefreshCw
                                            size={15}
                                            className="animate-spin"
                                        />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={15} />
                                        Delete
                                    </>
                                )}
                            </button>

                        </div>

                    </div>

                </div>
            )}
        </div>
    );
}

export default AdminFarmers;