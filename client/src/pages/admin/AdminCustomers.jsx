import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    UserCheck,
    UserX,
    Search,
    RefreshCw,
    LayoutDashboard,
    Wheat,
    ShoppingBag,
    ShoppingCart,
    LogOut,
    Mail,
    Phone,
    MapPin,
    CalendarDays,
    ShieldCheck,
    ShieldOff,
    Trash2,
    AlertCircle,
    X,
    CheckCircle2,
    Menu,
    ChevronRight,
} from "lucide-react";

import API from "../../services/api";

const AdminCustomers = () => {
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const adminToken = localStorage.getItem("adminToken");

    // ==========================================
    // FETCH CUSTOMERS
    // ==========================================

    const fetchCustomers = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            if (!adminToken) {
                navigate("/admin/login");
                return;
            }

            const response = await API.get("/admin/customers", {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            if (response.data.success) {
                setCustomers(response.data.customers || []);
            } else {
                setError(
                    response.data.message || "Failed to fetch customers"
                );
            }
        } catch (error) {
            console.error("FETCH CUSTOMERS ERROR:", error);

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
                    "Unable to load customers"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // ==========================================
    // SEARCH + FILTER
    // ==========================================

    const filteredCustomers = useMemo(() => {
        const value = search.toLowerCase().trim();

        return customers.filter((customer) => {
            const matchesSearch =
                !value ||
                customer.name?.toLowerCase().includes(value) ||
                customer.email?.toLowerCase().includes(value) ||
                customer.phone?.toLowerCase().includes(value) ||
                customer.address?.toLowerCase().includes(value);

            const matchesFilter =
                filter === "all" ||
                (filter === "active" && !customer.isBlocked) ||
                (filter === "blocked" && customer.isBlocked);

            return matchesSearch && matchesFilter;
        });
    }, [customers, search, filter]);

    // ==========================================
    // STATS
    // ==========================================

    const totalCustomers = customers.length;

    const activeCustomers = customers.filter(
        (customer) => !customer.isBlocked
    ).length;

    const blockedCustomers = customers.filter(
        (customer) => customer.isBlocked
    ).length;

    // ==========================================
    // BLOCK / UNBLOCK
    // ==========================================

    const handleToggleBlock = async (customer) => {
        try {
            setActionLoading(customer._id);

            const response = await API.put(
                `/admin/customers/${customer._id}/toggle-block`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                }
            );

            if (response.data.success) {
                setCustomers((previous) =>
                    previous.map((item) =>
                        item._id === customer._id
                            ? {
                                  ...item,
                                  isBlocked:
                                      response.data.customer.isBlocked,
                              }
                            : item
                    )
                );
            } else {
                alert(
                    response.data.message ||
                        "Failed to update customer"
                );
            }
        } catch (error) {
            console.error("TOGGLE CUSTOMER ERROR:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminUser");
                navigate("/admin/login");
                return;
            }

            alert(
                error.response?.data?.message ||
                    "Failed to update customer"
            );
        } finally {
            setActionLoading("");
        }
    };

    // ==========================================
    // DELETE
    // ==========================================

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        try {
            setActionLoading(deleteTarget._id);

            const response = await API.delete(
                `/admin/customers/${deleteTarget._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                }
            );

            if (response.data.success) {
                setCustomers((previous) =>
                    previous.filter(
                        (item) => item._id !== deleteTarget._id
                    )
                );

                setDeleteTarget(null);
            } else {
                alert(
                    response.data.message ||
                        "Failed to delete customer"
                );
            }
        } catch (error) {
            console.error("DELETE CUSTOMER ERROR:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminUser");
                navigate("/admin/login");
                return;
            }

            alert(
                error.response?.data?.message ||
                    "Failed to delete customer"
            );
        } finally {
            setActionLoading("");
        }
    };

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        navigate("/admin/login");
    };

    // ==========================================
    // HELPERS
    // ==========================================

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getInitials = (name) => {
        if (!name) {
            return "CU";
        }

        return name
            .trim()
            .split(/\s+/)
            .map((word) => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    // ==========================================
    // SIDEBAR
    // ==========================================

    const Sidebar = ({ mobile = false }) => (
        <aside
            className={`${
                mobile
                    ? "fixed inset-y-0 left-0 z-50 flex w-[270px] lg:hidden"
                    : "fixed left-0 top-0 hidden h-screen w-[250px] lg:flex"
            } flex-col bg-[#173b2a] text-white`}
        >
            {/* Logo */}

            <div className="flex h-24 items-center px-7">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-lg">
                        🌱
                    </div>

                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            F2C
                        </h1>

                        <p className="text-[10px] font-medium tracking-[0.18em] text-white/40">
                            ADMIN CONSOLE
                        </p>
                    </div>
                </div>

                {mobile && (
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Navigation */}

            <nav className="flex-1 px-4">
                <p className="mb-3 px-4 pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Overview
                </p>

                <button
                    onClick={() => {
                        navigate("/admin/dashboard");
                        setSidebarOpen(false);
                    }}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                    <LayoutDashboard size={18} />
                    Dashboard
                </button>

                <p className="mb-3 px-4 pt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Management
                </p>

                <button
                    onClick={() => {
                        navigate("/admin/farmers");
                        setSidebarOpen(false);
                    }}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                    <Wheat size={18} />
                    Farmers
                </button>

                <button
                    onClick={() => {
                        navigate("/admin/customers");
                        setSidebarOpen(false);
                    }}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
                >
                    <Users size={18} />

                    Customers

                    <span className="ml-auto h-2 w-2 rounded-full bg-green-300 shadow-[0_0_10px_rgba(134,239,172,0.8)]" />
                </button>

                <button
                    onClick={() => {
                        navigate("/admin/products");
                        setSidebarOpen(false);
                    }}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                    <ShoppingBag size={18} />
                    Products
                </button>

                <button
                    onClick={() => {
                        navigate("/admin/orders");
                        setSidebarOpen(false);
                    }}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                    <ShoppingCart size={18} />
                    Orders
                </button>
            </nav>

            {/* Logout */}

            <div className="border-t border-white/10 p-4">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 transition hover:bg-red-400/10 hover:text-red-300"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </aside>
    );

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="min-h-screen bg-[#f5f7f2] text-[#172018]">
            <Sidebar />

            {/* Mobile sidebar */}

            {sidebarOpen && (
                <>
                    <div
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    />

                    <Sidebar mobile />
                </>
            )}

            {/* MAIN */}

            <main className="lg:ml-[250px]">
                {/* Header */}

                <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f5f7f2]/90 px-5 py-4 backdrop-blur-xl sm:px-8 lg:px-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/5 bg-white shadow-sm lg:hidden"
                            >
                                <Menu size={20} />
                            </button>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:text-xs">
                                    Admin / Management
                                </p>

                                <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
                                    Customers
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchCustomers(true)}
                                disabled={refreshing}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/5 bg-white shadow-sm transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto sm:px-4"
                            >
                                <RefreshCw
                                    size={16}
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                <span className="ml-2 hidden text-sm font-medium sm:block">
                                    Refresh
                                </span>
                            </button>

                            <button
                                onClick={() =>
                                    navigate("/admin/dashboard")
                                }
                                className="hidden items-center gap-2 rounded-xl border border-black/5 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-gray-50 sm:flex"
                            >
                                <LayoutDashboard size={16} />
                                Dashboard
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-5 sm:p-8 lg:p-10">
                    {/* HERO */}

                    <section className="relative mb-7 overflow-hidden rounded-[30px] bg-[#173b2a] p-7 text-white shadow-xl shadow-[#173b2a]/10 sm:p-9">
                        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#40916c]/20" />

                        <div className="absolute -bottom-32 right-32 h-64 w-64 rounded-full border border-white/5" />

                        <div className="absolute right-8 top-8 opacity-[0.07]">
                            <Users size={150} strokeWidth={1} />
                        </div>

                        <div className="relative">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-green-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-300 shadow-[0_0_8px_rgba(134,239,172,0.9)]" />
                                CUSTOMER DIRECTORY
                            </div>

                            <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
                                <div>
                                    <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                                        Manage your customers.
                                    </h2>

                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                                        Monitor customer accounts, manage
                                        platform access and keep your
                                        marketplace community healthy.
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    <div className="min-w-[82px] rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                                        <Users
                                            size={16}
                                            className="mb-2 text-white/50"
                                        />

                                        <p className="text-[11px] text-white/45">
                                            Total
                                        </p>

                                        <p className="mt-1 text-2xl font-bold">
                                            {totalCustomers}
                                        </p>
                                    </div>

                                    <div className="min-w-[82px] rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                                        <UserCheck
                                            size={16}
                                            className="mb-2 text-green-300"
                                        />

                                        <p className="text-[11px] text-white/45">
                                            Active
                                        </p>

                                        <p className="mt-1 text-2xl font-bold">
                                            {activeCustomers}
                                        </p>
                                    </div>

                                    <div className="min-w-[82px] rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                                        <UserX
                                            size={16}
                                            className="mb-2 text-red-300"
                                        />

                                        <p className="text-[11px] text-white/45">
                                            Blocked
                                        </p>

                                        <p className="mt-1 text-2xl font-bold">
                                            {blockedCustomers}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SEARCH + FILTER */}

                    <section className="mb-6 rounded-[24px] border border-black/5 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                            <div className="relative flex-1">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search name, email, phone or address..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-10 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#2d6a4f] focus:bg-white focus:ring-4 focus:ring-[#2d6a4f]/5"
                                />

                                {search && (
                                    <button
                                        onClick={() =>
                                            setSearch("")
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2 overflow-x-auto">
                                {[
                                    {
                                        value: "all",
                                        label: "All",
                                        count: totalCustomers,
                                    },
                                    {
                                        value: "active",
                                        label: "Active",
                                        count: activeCustomers,
                                    },
                                    {
                                        value: "blocked",
                                        label: "Blocked",
                                        count: blockedCustomers,
                                    },
                                ].map((item) => (
                                    <button
                                        key={item.value}
                                        onClick={() =>
                                            setFilter(item.value)
                                        }
                                        className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                            filter === item.value
                                                ? "bg-[#173b2a] text-white shadow-sm"
                                                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                        }`}
                                    >
                                        {item.label}

                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                                                filter === item.value
                                                    ? "bg-white/15 text-white"
                                                    : "bg-white text-gray-400"
                                            }`}
                                        >
                                            {item.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="shrink-0 rounded-xl bg-[#f5f7f2] px-5 py-3.5 text-sm text-gray-500">
                                Showing{" "}
                                <span className="font-bold text-[#173b2a]">
                                    {filteredCustomers.length}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-[#173b2a]">
                                    {customers.length}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* ERROR */}

                    {error && (
                        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                            <AlertCircle
                                size={18}
                                className="shrink-0"
                            />

                            <span className="flex-1">{error}</span>

                            <button
                                onClick={() => fetchCustomers()}
                                className="font-semibold underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* CUSTOMER TABLE */}

                    <section className="overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-sm">
                        {loading ? (
                            <div className="min-h-[450px] p-6">
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
                                    <div className="h-9 w-24 animate-pulse rounded-xl bg-gray-100" />
                                </div>

                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5, 6].map(
                                        (item) => (
                                            <div
                                                key={item}
                                                className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4"
                                            >
                                                <div className="h-11 w-11 animate-pulse rounded-2xl bg-gray-100" />

                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
                                                    <div className="h-2.5 w-24 animate-pulse rounded bg-gray-100" />
                                                </div>

                                                <div className="hidden h-8 w-24 animate-pulse rounded bg-gray-100 sm:block" />
                                                <div className="hidden h-8 w-20 animate-pulse rounded bg-gray-100 md:block" />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="flex min-h-[450px] items-center justify-center p-6">
                                <div className="text-center">
                                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f0f4ef] text-[#285c42]">
                                        <Users size={34} />
                                    </div>

                                    <h3 className="text-xl font-bold">
                                        No customers found
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                                        {search
                                            ? "Try searching with a different keyword."
                                            : filter !== "all"
                                            ? `There are no ${filter} customers.`
                                            : "No customer accounts have been registered yet."}
                                    </p>

                                    {(search || filter !== "all") && (
                                        <button
                                            onClick={() => {
                                                setSearch("");
                                                setFilter("all");
                                            }}
                                            className="mt-5 rounded-xl bg-[#173b2a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245238]"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* DESKTOP TABLE */}

                                <div className="hidden overflow-x-auto lg:block">
                                    <table className="w-full min-w-[1050px]">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/70">
                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Customer
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Contact
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Address
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Joined
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Status
                                                </th>

                                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredCustomers.map(
                                                (customer) => (
                                                    <tr
                                                        key={
                                                            customer._id
                                                        }
                                                        className="border-b border-gray-100 transition last:border-0 hover:bg-[#fafcf9]"
                                                    >
                                                        {/* CUSTOMER */}

                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e5f0e8] text-sm font-bold text-[#285c42]">
                                                                    {getInitials(
                                                                        customer.name
                                                                    )}

                                                                    <span
                                                                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                                                                            customer.isBlocked
                                                                                ? "bg-red-500"
                                                                                : "bg-green-500"
                                                                        }`}
                                                                    />
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <p className="truncate font-semibold text-gray-900">
                                                                        {
                                                                            customer.name
                                                                        }
                                                                    </p>

                                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                                        Customer
                                                                        account
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* CONTACT */}

                                                        <td className="px-6 py-5">
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                                    <Mail
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-gray-400"
                                                                    />

                                                                    <span>
                                                                        {customer.email ||
                                                                            "No email"}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                                    <Phone
                                                                        size={
                                                                            13
                                                                        }
                                                                    />

                                                                    <span>
                                                                        {customer.phone ||
                                                                            "No phone"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* ADDRESS */}

                                                        <td className="max-w-[250px] px-6 py-5">
                                                            <div className="flex items-start gap-2">
                                                                <MapPin
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="mt-0.5 shrink-0 text-gray-400"
                                                                />

                                                                <p className="truncate text-sm text-gray-600">
                                                                    {customer.address ||
                                                                        "No address added"}
                                                                </p>
                                                            </div>
                                                        </td>

                                                        {/* JOINED */}

                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <CalendarDays
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="text-gray-400"
                                                                />

                                                                {formatDate(
                                                                    customer.createdAt
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* STATUS */}

                                                        <td className="px-6 py-5">
                                                            {customer.isBlocked ? (
                                                                <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                                    Blocked
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                                    Active
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* ACTIONS */}

                                                        <td className="px-6 py-5">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    disabled={
                                                                        actionLoading ===
                                                                        customer._id
                                                                    }
                                                                    onClick={() =>
                                                                        handleToggleBlock(
                                                                            customer
                                                                        )
                                                                    }
                                                                    title={
                                                                        customer.isBlocked
                                                                            ? "Unblock customer"
                                                                            : "Block customer"
                                                                    }
                                                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                                        customer.isBlocked
                                                                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                                                                            : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                                                    }`}
                                                                >
                                                                    {actionLoading ===
                                                                    customer._id ? (
                                                                        <RefreshCw
                                                                            size={
                                                                                13
                                                                            }
                                                                            className="animate-spin"
                                                                        />
                                                                    ) : customer.isBlocked ? (
                                                                        <ShieldCheck
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <ShieldOff
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    )}

                                                                    {customer.isBlocked
                                                                        ? "Unblock"
                                                                        : "Block"}
                                                                </button>

                                                                <button
                                                                    disabled={
                                                                        actionLoading ===
                                                                        customer._id
                                                                    }
                                                                    onClick={() =>
                                                                        setDeleteTarget(
                                                                            customer
                                                                        )
                                                                    }
                                                                    title="Delete customer"
                                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* MOBILE / TABLET CARDS */}

                                <div className="divide-y divide-gray-100 lg:hidden">
                                    {filteredCustomers.map(
                                        (customer) => (
                                            <div
                                                key={customer._id}
                                                className="p-5 sm:p-6"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5f0e8] font-bold text-[#285c42]">
                                                        {getInitials(
                                                            customer.name
                                                        )}

                                                        <span
                                                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                                                                customer.isBlocked
                                                                    ? "bg-red-500"
                                                                    : "bg-green-500"
                                                            }`}
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-col justify-between gap-2 sm:flex-row">
                                                            <div>
                                                                <h3 className="font-semibold text-gray-900">
                                                                    {
                                                                        customer.name
                                                                    }
                                                                </h3>

                                                                <p className="mt-0.5 text-xs text-gray-400">
                                                                    Customer
                                                                    account
                                                                </p>
                                                            </div>

                                                            {customer.isBlocked ? (
                                                                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                                    Blocked
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Mail
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="shrink-0 text-gray-400"
                                                                />

                                                                <span className="truncate">
                                                                    {customer.email ||
                                                                        "No email"}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Phone
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="shrink-0 text-gray-400"
                                                                />

                                                                {customer.phone ||
                                                                    "No phone"}
                                                            </div>

                                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                                <MapPin
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="mt-0.5 shrink-0 text-gray-400"
                                                                />

                                                                <span>
                                                                    {customer.address ||
                                                                        "No address added"}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <CalendarDays
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="shrink-0 text-gray-400"
                                                                />

                                                                {formatDate(
                                                                    customer.createdAt
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
                                                            <button
                                                                disabled={
                                                                    actionLoading ===
                                                                    customer._id
                                                                }
                                                                onClick={() =>
                                                                    handleToggleBlock(
                                                                        customer
                                                                    )
                                                                }
                                                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 ${
                                                                    customer.isBlocked
                                                                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                                                                        : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                                                }`}
                                                            >
                                                                {actionLoading ===
                                                                customer._id ? (
                                                                    <RefreshCw
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="animate-spin"
                                                                    />
                                                                ) : customer.isBlocked ? (
                                                                    <ShieldCheck
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <ShieldOff
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                )}

                                                                {customer.isBlocked
                                                                    ? "Unblock Customer"
                                                                    : "Block Customer"}
                                                            </button>

                                                            <button
                                                                disabled={
                                                                    actionLoading ===
                                                                    customer._id
                                                                }
                                                                onClick={() =>
                                                                    setDeleteTarget(
                                                                        customer
                                                                    )
                                                                }
                                                                className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                                            >
                                                                <Trash2
                                                                    size={
                                                                        14
                                                                    }
                                                                />

                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>

            {/* DELETE CONFIRMATION MODAL */}

            {deleteTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
                        <div className="p-6 sm:p-7">
                            <div className="flex items-start justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                    <Trash2 size={22} />
                                </div>

                                <button
                                    onClick={() =>
                                        setDeleteTarget(null)
                                    }
                                    disabled={Boolean(
                                        actionLoading
                                    )}
                                    className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                >
                                    <X size={19} />
                                </button>
                            </div>

                            <h3 className="mt-5 text-xl font-bold text-gray-900">
                                Delete customer?
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                You are about to permanently delete{" "}
                                <span className="font-semibold text-gray-800">
                                    {deleteTarget.name}
                                </span>
                                . This action cannot be undone.
                            </p>

                            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-[#285c42] shadow-sm">
                                        {getInitials(
                                            deleteTarget.name
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900">
                                            {deleteTarget.name}
                                        </p>

                                        <p className="truncate text-xs text-gray-500">
                                            {deleteTarget.email ||
                                                "No email"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() =>
                                        setDeleteTarget(null)
                                    }
                                    disabled={Boolean(
                                        actionLoading
                                    )}
                                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleDelete}
                                    disabled={Boolean(
                                        actionLoading
                                    )}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {actionLoading ? (
                                        <>
                                            <RefreshCw
                                                size={16}
                                                className="animate-spin"
                                            />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={16} />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/70 px-6 py-4 text-xs text-gray-400">
                            <CheckCircle2 size={14} />
                            Customer data will be permanently removed.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCustomers;