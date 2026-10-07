import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Package,
    Search,
    RefreshCw,
    LayoutDashboard,
    Wheat,
    Users,
    ShoppingCart,
    LogOut,
    X,
    Trash2,
    ShieldCheck,
    ShieldOff,
    CalendarDays,
    UserRound,
    Tag,
    Boxes,
    AlertCircle,
    Menu,
    CheckCircle2,
} from "lucide-react";

import API from "../../services/api";

const AdminProducts = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("ALL");
    const [status, setStatus] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const adminToken = localStorage.getItem("adminToken");

    // ==========================================
    // FETCH PRODUCTS
    // ==========================================

    const fetchProducts = async (isRefresh = false) => {
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

            const response = await API.get("/admin/products", {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            if (response.data.success) {
                setProducts(response.data.products || []);
            } else {
                setError(
                    response.data.message ||
                        "Failed to fetch products"
                );
            }
        } catch (error) {
            console.error(
                "FETCH PRODUCTS ERROR:",
                error
            );

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
                    "Unable to load products"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // ==========================================
    // CATEGORIES
    // ==========================================

    const categories = useMemo(() => {
        const uniqueCategories = [
            ...new Set(
                products
                    .map((product) => product.category)
                    .filter(Boolean)
            ),
        ];

        return uniqueCategories.sort();
    }, [products]);

    // ==========================================
    // FILTER PRODUCTS
    // ==========================================

    const filteredProducts = useMemo(() => {
        const value = search.toLowerCase().trim();

        return products.filter((product) => {
            const matchesSearch =
                !value ||
                product.name
                    ?.toLowerCase()
                    .includes(value) ||
                product.category
                    ?.toLowerCase()
                    .includes(value) ||
                product.farmer?.name
                    ?.toLowerCase()
                    .includes(value) ||
                product.farmer?.email
                    ?.toLowerCase()
                    .includes(value);

            const matchesCategory =
                category === "ALL" ||
                product.category === category;

            const matchesStatus =
                status === "ALL" ||
                (status === "AVAILABLE" &&
                    product.isAvailable) ||
                (status === "UNAVAILABLE" &&
                    !product.isAvailable);

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );
        });
    }, [
        products,
        search,
        category,
        status,
    ]);

    // ==========================================
    // COUNTS
    // ==========================================

    const totalProducts = products.length;

    const availableProducts = products.filter(
        (product) => product.isAvailable
    ).length;

    const unavailableProducts =
        totalProducts - availableProducts;

    const organicProducts = products.filter(
        (product) => product.isOrganic
    ).length;

    // ==========================================
    // TOGGLE AVAILABILITY
    // ==========================================

    const handleToggleAvailability = async (
        product
    ) => {
        try {
            setActionLoading(product._id);

            const response = await API.put(
                `/admin/products/${product._id}/toggle-availability`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                }
            );

            if (response.data.success) {
                setProducts((previous) =>
                    previous.map((item) =>
                        item._id === product._id
                            ? {
                                  ...item,
                                  isAvailable:
                                      response.data
                                          .product
                                          .isAvailable,
                              }
                            : item
                    )
                );
            } else {
                alert(
                    response.data.message ||
                        "Failed to update product"
                );
            }
        } catch (error) {
            console.error(
                "TOGGLE PRODUCT ERROR:",
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

            alert(
                error.response?.data?.message ||
                    "Failed to update product"
            );
        } finally {
            setActionLoading("");
        }
    };

    // ==========================================
    // DELETE PRODUCT
    // ==========================================

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        try {
            setActionLoading(deleteTarget._id);

            const response = await API.delete(
                `/admin/products/${deleteTarget._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                }
            );

            if (response.data.success) {
                setProducts((previous) =>
                    previous.filter(
                        (item) =>
                            item._id !==
                            deleteTarget._id
                    )
                );

                setDeleteTarget(null);
            } else {
                alert(
                    response.data.message ||
                        "Failed to delete product"
                );
            }
        } catch (error) {
            console.error(
                "DELETE PRODUCT ERROR:",
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

            alert(
                error.response?.data?.message ||
                    "Failed to delete product"
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

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const getInitials = (name) => {
        if (!name) {
            return "PR";
        }

        return name
            .trim()
            .split(/\s+/)
            .map((word) => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    const getProductImage = (product) => {
        if (
            Array.isArray(product.images) &&
            product.images.length > 0
        ) {
            return product.images[0];
        }

        return null;
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
            {/* LOGO */}

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
                        onClick={() =>
                            setSidebarOpen(false)
                        }
                        className="ml-auto rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* NAVIGATION */}

            <nav className="flex-1 px-4">
                <p className="mb-3 px-4 pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Overview
                </p>

                <button
                    onClick={() => {
                        navigate(
                            "/admin/dashboard"
                        );
                        setSidebarOpen(false);
                    }}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                    <LayoutDashboard
                        size={18}
                    />
                    Dashboard
                </button>

                <p className="mb-3 px-4 pt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Management
                </p>

                <button
                    onClick={() => {
                        navigate(
                            "/admin/farmers"
                        );
                        setSidebarOpen(false);
                    }}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                    <Wheat size={18} />
                    Farmers
                </button>

                <button
                    onClick={() => {
                        navigate(
                            "/admin/customers"
                        );
                        setSidebarOpen(false);
                    }}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                    <Users size={18} />
                    Customers
                </button>

                <button
                    onClick={() => {
                        navigate(
                            "/admin/products"
                        );
                        setSidebarOpen(false);
                    }}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
                >
                    <Package size={18} />

                    Products

                    <span className="ml-auto h-2 w-2 rounded-full bg-green-300 shadow-[0_0_10px_rgba(134,239,172,0.8)]" />
                </button>

                <button
                    onClick={() => {
                        navigate(
                            "/admin/orders"
                        );
                        setSidebarOpen(false);
                    }}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                    <ShoppingCart
                        size={18}
                    />
                    Orders
                </button>
            </nav>

            {/* LOGOUT */}

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
            {/* DESKTOP SIDEBAR */}

            <Sidebar />

            {/* MOBILE SIDEBAR */}

            {sidebarOpen && (
                <>
                    <div
                        onClick={() =>
                            setSidebarOpen(false)
                        }
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    />

                    <Sidebar mobile />
                </>
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
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/5 bg-white shadow-sm lg:hidden"
                            >
                                <Menu size={20} />
                            </button>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:text-xs">
                                    Admin / Management
                                </p>

                                <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
                                    Products
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    fetchProducts(
                                        true
                                    )
                                }
                                disabled={
                                    refreshing
                                }
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
                                    navigate(
                                        "/admin/dashboard"
                                    )
                                }
                                className="hidden items-center gap-2 rounded-xl border border-black/5 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-gray-50 sm:flex"
                            >
                                <LayoutDashboard
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
                        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#40916c]/20" />

                        <div className="absolute -bottom-32 right-32 h-64 w-64 rounded-full border border-white/5" />

                        <div className="absolute right-8 top-8 opacity-[0.07]">
                            <Package
                                size={160}
                                strokeWidth={1}
                            />
                        </div>

                        <div className="relative">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-green-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-300 shadow-[0_0_8px_rgba(134,239,172,0.9)]" />

                                MARKETPLACE CATALOG
                            </div>

                            <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
                                <div>
                                    <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                                        Manage marketplace
                                        products.
                                    </h2>

                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                                        Review products added by
                                        farmers, control
                                        availability and maintain
                                        a healthy marketplace
                                        catalog.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                                        <Package
                                            size={16}
                                            className="mb-2 text-white/50"
                                        />

                                        <p className="text-[11px] text-white/45">
                                            Total
                                        </p>

                                        <p className="mt-1 text-2xl font-bold">
                                            {totalProducts}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                                        <CheckCircle2
                                            size={16}
                                            className="mb-2 text-green-300"
                                        />

                                        <p className="text-[11px] text-white/45">
                                            Available
                                        </p>

                                        <p className="mt-1 text-2xl font-bold">
                                            {
                                                availableProducts
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                                        <ShieldOff
                                            size={16}
                                            className="mb-2 text-orange-300"
                                        />

                                        <p className="text-[11px] text-white/45">
                                            Disabled
                                        </p>

                                        <p className="mt-1 text-2xl font-bold">
                                            {
                                                unavailableProducts
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                                        <Tag
                                            size={16}
                                            className="mb-2 text-emerald-300"
                                        />

                                        <p className="text-[11px] text-white/45">
                                            Organic
                                        </p>

                                        <p className="mt-1 text-2xl font-bold">
                                            {
                                                organicProducts
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FILTER BAR */}

                    <section className="mb-6 rounded-[24px] border border-black/5 bg-white p-4 shadow-sm">
                        <div className="grid gap-3 md:grid-cols-[1fr_190px_180px_auto]">
                            {/* SEARCH */}

                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search product, category or farmer..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-10 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#2d6a4f] focus:bg-white focus:ring-4 focus:ring-[#2d6a4f]/5"
                                />

                                {search && (
                                    <button
                                        onClick={() =>
                                            setSearch(
                                                ""
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* CATEGORY */}

                            <select
                                value={category}
                                onChange={(e) =>
                                    setCategory(
                                        e.target.value
                                    )
                                }
                                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#2d6a4f] focus:bg-white focus:ring-4 focus:ring-[#2d6a4f]/5"
                            >
                                <option value="ALL">
                                    All Categories
                                </option>

                                {categories.map(
                                    (item) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {item}
                                        </option>
                                    )
                                )}
                            </select>

                            {/* STATUS */}

                            <select
                                value={status}
                                onChange={(e) =>
                                    setStatus(
                                        e.target.value
                                    )
                                }
                                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#2d6a4f] focus:bg-white focus:ring-4 focus:ring-[#2d6a4f]/5"
                            >
                                <option value="ALL">
                                    All Status
                                </option>

                                <option value="AVAILABLE">
                                    Available
                                </option>

                                <option value="UNAVAILABLE">
                                    Disabled
                                </option>
                            </select>

                            {/* RESULTS */}

                            <div className="flex items-center justify-center rounded-xl bg-[#f5f7f2] px-5 py-3.5 text-sm text-gray-500 md:justify-start">
                                <span>
                                    Showing{" "}
                                    <span className="font-bold text-[#173b2a]">
                                        {
                                            filteredProducts.length
                                        }
                                    </span>{" "}
                                    /{" "}
                                    <span className="font-bold text-[#173b2a]">
                                        {
                                            products.length
                                        }
                                    </span>
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

                            <span className="flex-1">
                                {error}
                            </span>

                            <button
                                onClick={() =>
                                    fetchProducts()
                                }
                                className="font-semibold underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* PRODUCTS */}

                    <section className="overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-sm">
                        {loading ? (
                            <div className="min-h-[450px] p-6">
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="h-5 w-36 animate-pulse rounded bg-gray-100" />

                                    <div className="h-9 w-24 animate-pulse rounded-xl bg-gray-100" />
                                </div>

                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5, 6].map(
                                        (item) => (
                                            <div
                                                key={item}
                                                className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4"
                                            >
                                                <div className="h-14 w-14 animate-pulse rounded-2xl bg-gray-100" />

                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 w-44 animate-pulse rounded bg-gray-100" />

                                                    <div className="h-2.5 w-28 animate-pulse rounded bg-gray-100" />
                                                </div>

                                                <div className="hidden h-8 w-24 animate-pulse rounded bg-gray-100 md:block" />

                                                <div className="hidden h-8 w-20 animate-pulse rounded bg-gray-100 lg:block" />

                                                <div className="hidden h-8 w-24 animate-pulse rounded bg-gray-100 xl:block" />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex min-h-[450px] items-center justify-center p-6">
                                <div className="text-center">
                                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f0f4ef] text-[#285c42]">
                                        <Package size={36} />
                                    </div>

                                    <h3 className="text-xl font-bold">
                                        No products found
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                                        {search ||
                                        category !==
                                            "ALL" ||
                                        status !== "ALL"
                                            ? "Try changing your search or filters."
                                            : "No products have been added to the marketplace yet."}
                                    </p>

                                    {(search ||
                                        category !==
                                            "ALL" ||
                                        status !==
                                            "ALL") && (
                                        <button
                                            onClick={() => {
                                                setSearch(
                                                    ""
                                                );
                                                setCategory(
                                                    "ALL"
                                                );
                                                setStatus(
                                                    "ALL"
                                                );
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
                                    <table className="w-full min-w-[1150px]">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/70">
                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Product
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Farmer
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Category
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Price
                                                </th>

                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                    Stock
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
                                            {filteredProducts.map(
                                                (
                                                    product
                                                ) => {
                                                    const image =
                                                        getProductImage(
                                                            product
                                                        );

                                                    return (
                                                        <tr
                                                            key={
                                                                product._id
                                                            }
                                                            className="border-b border-gray-100 transition last:border-0 hover:bg-[#fafcf9]"
                                                        >
                                                            {/* PRODUCT */}

                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-4">
                                                                    {image ? (
                                                                        <img
                                                                            src={
                                                                                image
                                                                            }
                                                                            alt={
                                                                                product.name
                                                                            }
                                                                            className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e8efe9] text-[#285c42]">
                                                                            <Package
                                                                                size={
                                                                                    23
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <div className="min-w-0">
                                                                        <p className="max-w-[220px] truncate font-semibold text-gray-900">
                                                                            {
                                                                                product.name
                                                                            }
                                                                        </p>

                                                                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                                                            <CalendarDays
                                                                                size={
                                                                                    12
                                                                                }
                                                                            />

                                                                            Added{" "}
                                                                            {formatDate(
                                                                                product.createdAt
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* FARMER */}

                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5f0e8] text-xs font-bold text-[#285c42]">
                                                                        {getInitials(
                                                                            product
                                                                                .farmer
                                                                                ?.name
                                                                        )}
                                                                    </div>

                                                                    <div className="min-w-0">
                                                                        <p className="max-w-[150px] truncate text-sm font-semibold text-gray-800">
                                                                            {product
                                                                                .farmer
                                                                                ?.name ||
                                                                                "Unknown"}
                                                                        </p>

                                                                        <p className="mt-0.5 max-w-[160px] truncate text-xs text-gray-400">
                                                                            {product
                                                                                .farmer
                                                                                ?.email ||
                                                                                "No email"}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* CATEGORY */}

                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-wrap gap-2">
                                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f4ef] px-3 py-1.5 text-xs font-semibold text-[#285c42]">
                                                                        <Tag
                                                                            size={
                                                                                12
                                                                            }
                                                                        />

                                                                        {
                                                                            product.category
                                                                        }
                                                                    </span>

                                                                    {product.isOrganic && (
                                                                        <span className="rounded-full bg-green-50 px-2.5 py-1.5 text-[10px] font-bold tracking-wide text-green-700">
                                                                            ORGANIC
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* PRICE */}

                                                            <td className="px-6 py-5">
                                                                <p className="font-bold text-gray-900">
                                                                    ₹
                                                                    {
                                                                        product.price
                                                                    }
                                                                </p>

                                                                <p className="mt-0.5 text-xs text-gray-400">
                                                                    per{" "}
                                                                    {
                                                                        product.unit
                                                                    }
                                                                </p>
                                                            </td>

                                                            {/* STOCK */}

                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-2">
                                                                    <Boxes
                                                                        size={
                                                                            15
                                                                        }
                                                                        className="text-gray-400"
                                                                    />

                                                                    <div>
                                                                        <p className="text-sm font-semibold text-gray-700">
                                                                            {
                                                                                product.quantity
                                                                            }{" "}
                                                                            {
                                                                                product.unit
                                                                            }
                                                                        </p>

                                                                        {Number(
                                                                            product.quantity
                                                                        ) <=
                                                                            0 && (
                                                                            <p className="mt-0.5 text-[10px] font-semibold text-red-500">
                                                                                Out
                                                                                of
                                                                                stock
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* STATUS */}

                                                            <td className="px-6 py-5">
                                                                {product.isAvailable ? (
                                                                    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                                                                        Available
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />

                                                                        Disabled
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* ACTIONS */}

                                                            <td className="px-6 py-5">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        disabled={
                                                                            actionLoading ===
                                                                            product._id
                                                                        }
                                                                        onClick={() =>
                                                                            handleToggleAvailability(
                                                                                product
                                                                            )
                                                                        }
                                                                        title={
                                                                            product.isAvailable
                                                                                ? "Disable product"
                                                                                : "Enable product"
                                                                        }
                                                                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                                            product.isAvailable
                                                                                ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                                                                : "bg-green-50 text-green-700 hover:bg-green-100"
                                                                        }`}
                                                                    >
                                                                        {actionLoading ===
                                                                        product._id ? (
                                                                            <RefreshCw
                                                                                size={
                                                                                    13
                                                                                }
                                                                                className="animate-spin"
                                                                            />
                                                                        ) : product.isAvailable ? (
                                                                            <ShieldOff
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            <ShieldCheck
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />
                                                                        )}

                                                                        {product.isAvailable
                                                                            ? "Disable"
                                                                            : "Enable"}
                                                                    </button>

                                                                    <button
                                                                        disabled={
                                                                            actionLoading ===
                                                                            product._id
                                                                        }
                                                                        onClick={() =>
                                                                            setDeleteTarget(
                                                                                product
                                                                            )
                                                                        }
                                                                        title="Delete product"
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
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* MOBILE / TABLET CARDS */}

                                <div className="divide-y divide-gray-100 lg:hidden">
                                    {filteredProducts.map(
                                        (
                                            product
                                        ) => {
                                            const image =
                                                getProductImage(
                                                    product
                                                );

                                            return (
                                                <div
                                                    key={
                                                        product._id
                                                    }
                                                    className="p-5 sm:p-6"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        {image ? (
                                                            <img
                                                                src={
                                                                    image
                                                                }
                                                                alt={
                                                                    product.name
                                                                }
                                                                className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm"
                                                            />
                                                        ) : (
                                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e8efe9] text-[#285c42]">
                                                                <Package
                                                                    size={
                                                                        26
                                                                    }
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-col justify-between gap-2 sm:flex-row">
                                                                <div>
                                                                    <h3 className="truncate font-semibold text-gray-900">
                                                                        {
                                                                            product.name
                                                                        }
                                                                    </h3>

                                                                    <p className="mt-1 text-xs text-gray-400">
                                                                        Added{" "}
                                                                        {formatDate(
                                                                            product.createdAt
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                {product.isAvailable ? (
                                                                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                                                                        Available
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />

                                                                        Disabled
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <UserRound
                                                                        size={
                                                                            15
                                                                        }
                                                                        className="shrink-0 text-gray-400"
                                                                    />

                                                                    <span className="truncate">
                                                                        {product
                                                                            .farmer
                                                                            ?.name ||
                                                                            "Unknown farmer"}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Tag
                                                                        size={
                                                                            15
                                                                        }
                                                                        className="shrink-0 text-gray-400"
                                                                    />

                                                                    <span>
                                                                        {
                                                                            product.category
                                                                        }
                                                                    </span>

                                                                    {product.isOrganic && (
                                                                        <span className="rounded-full bg-green-50 px-2 py-1 text-[9px] font-bold text-green-700">
                                                                            ORGANIC
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <span className="font-bold text-gray-900">
                                                                        ₹
                                                                        {
                                                                            product.price
                                                                        }
                                                                    </span>

                                                                    <span className="text-xs text-gray-400">
                                                                        /
                                                                        {
                                                                            product.unit
                                                                        }
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Boxes
                                                                        size={
                                                                            15
                                                                        }
                                                                        className="text-gray-400"
                                                                    />

                                                                    {
                                                                        product.quantity
                                                                    }{" "}
                                                                    {
                                                                        product.unit
                                                                    }
                                                                </div>
                                                            </div>

                                                            <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
                                                                <button
                                                                    disabled={
                                                                        actionLoading ===
                                                                        product._id
                                                                    }
                                                                    onClick={() =>
                                                                        handleToggleAvailability(
                                                                            product
                                                                        )
                                                                    }
                                                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 ${
                                                                        product.isAvailable
                                                                            ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                                                            : "bg-green-50 text-green-700 hover:bg-green-100"
                                                                    }`}
                                                                >
                                                                    {actionLoading ===
                                                                    product._id ? (
                                                                        <RefreshCw
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="animate-spin"
                                                                        />
                                                                    ) : product.isAvailable ? (
                                                                        <ShieldOff
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <ShieldCheck
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    )}

                                                                    {product.isAvailable
                                                                        ? "Disable"
                                                                        : "Enable"}
                                                                </button>

                                                                <button
                                                                    disabled={
                                                                        actionLoading ===
                                                                        product._id
                                                                    }
                                                                    onClick={() =>
                                                                        setDeleteTarget(
                                                                            product
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
                                            );
                                        }
                                    )}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>

            {/* DELETE MODAL */}

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
                                        setDeleteTarget(
                                            null
                                        )
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
                                Delete product?
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                You are about to permanently
                                delete{" "}
                                <span className="font-semibold text-gray-800">
                                    {
                                        deleteTarget.name
                                    }
                                </span>
                                . This action cannot be
                                undone.
                            </p>

                            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                                <div className="flex items-center gap-3">
                                    {getProductImage(
                                        deleteTarget
                                    ) ? (
                                        <img
                                            src={getProductImage(
                                                deleteTarget
                                            )}
                                            alt={
                                                deleteTarget.name
                                            }
                                            className="h-12 w-12 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#285c42] shadow-sm">
                                            <Package
                                                size={22}
                                            />
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900">
                                            {
                                                deleteTarget.name
                                            }
                                        </p>

                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {
                                                deleteTarget.category
                                            }{" "}
                                            • ₹
                                            {
                                                deleteTarget.price
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() =>
                                        setDeleteTarget(
                                            null
                                        )
                                    }
                                    disabled={Boolean(
                                        actionLoading
                                    )}
                                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={
                                        handleDelete
                                    }
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
                                            <Trash2
                                                size={16}
                                            />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/70 px-6 py-4 text-xs text-gray-400">
                            <CheckCircle2
                                size={14}
                            />
                            Product will be permanently
                            removed from the catalog.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;