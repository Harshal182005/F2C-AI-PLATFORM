import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    Leaf,
    LogOut,
    MapPin,
    Menu,
    Package,
    Search,
    ShoppingCart,
    Sparkles,
    Sprout,
    User,
    Users,
    X,
    RefreshCw,
    SlidersHorizontal,
} from "lucide-react";

import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Marketplace() {
    const navigate = useNavigate();

    const { cartCount } = useCart();
    const { user, logout } = useAuth();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const categories = [
        "All",
        "Vegetables",
        "Fruits",
        "Grains",
        "Pulses",
        "Dairy",
        "Spices",
        "Oil Seeds",
        "Organic",
        "Flowers",
        "Other",
    ];

    const fetchProducts = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const params = {};

            if (search.trim()) {
                params.search = search.trim();
            }

            /*
             * Organic is handled on the frontend because the backend
             * product API uses category filtering.
             */
            if (
                selectedCategory !== "All" &&
                selectedCategory !== "Organic"
            ) {
                params.category = selectedCategory;
            }

            const response = await API.get("/products", {
                params,
            });

            let fetchedProducts = response.data?.products || [];

            if (selectedCategory === "Organic") {
                fetchedProducts = fetchedProducts.filter(
                    (product) => product.isOrganic
                );
            }

            setProducts(fetchedProducts);
        } catch (error) {
            console.error("Fetch products error:", error);

            if (error.response?.status === 401) {
                setError("Your session has expired. Please sign in again.");
            } else {
                setError(
                    error.response?.data?.message ||
                        "Unable to load products. Please try again."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    const handleLogout = () => {
        logout();
        setMobileMenuOpen(false);
        navigate("/login");
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedCategory("All");
    };

    const productStats = useMemo(() => {
        const organic = products.filter(
            (product) => product.isOrganic
        ).length;

        const availableStock = products.reduce(
            (total, product) =>
                total + Number(product.quantity || 0),
            0
        );

        return {
            total: products.length,
            organic,
            availableStock,
        };
    }, [products]);

    return (
        <div className="min-h-screen bg-[#f6f8f3] text-gray-900">
            {/* =====================================================
                NAVBAR
            ====================================================== */}

            <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-[76px] items-center justify-between">
                        {/* LOGO */}

                        <button
                            onClick={() => navigate("/marketplace")}
                            className="group flex items-center gap-3"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-600/20 transition duration-300 group-hover:scale-105 group-hover:rotate-2">
                                <Sprout size={23} strokeWidth={2.4} />
                            </div>

                            <div className="text-left">
                                <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                                    F2C
                                </h1>

                                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-green-600">
                                    Farm to Customer
                                </p>
                            </div>
                        </button>

                        {/* DESKTOP NAVIGATION */}

                        <div className="hidden items-center gap-8 md:flex">
                            <button
                                onClick={() => navigate("/marketplace")}
                                className="relative text-sm font-bold text-green-600"
                            >
                                Marketplace

                                <span className="absolute -bottom-[25px] left-0 h-0.5 w-full rounded-full bg-green-600" />
                            </button>

                            <button
                                onClick={() => navigate("/orders")}
                                className="text-sm font-semibold text-gray-600 transition hover:text-green-600"
                            >
                                My Orders
                            </button>

                            <button
                                onClick={() => navigate("/profile")}
                                className="text-sm font-semibold text-gray-600 transition hover:text-green-600"
                            >
                                Profile
                            </button>
                        </div>

                        {/* RIGHT SIDE */}

                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* CART */}

                            <button
                                onClick={() => navigate("/cart")}
                                className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-700 transition hover:bg-green-50 hover:text-green-600"
                                aria-label="Shopping cart"
                            >
                                <ShoppingCart size={20} />

                                {cartCount > 0 && (
                                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-green-600 px-1 text-[10px] font-bold text-white">
                                        {cartCount > 99
                                            ? "99+"
                                            : cartCount}
                                    </span>
                                )}
                            </button>

                            {/* USER */}

                            {user ? (
                                <div className="relative hidden sm:block">
                                    <details className="group">
                                        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 ring-2 ring-white">
                                                {user.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || "U"}
                                            </div>

                                            <div className="hidden text-left lg:block">
                                                <p className="max-w-28 truncate text-sm font-bold text-gray-900">
                                                    {user.name}
                                                </p>

                                                <p className="text-[11px] text-gray-500">
                                                    Customer
                                                </p>
                                            </div>

                                            <ChevronDown
                                                size={15}
                                                className="text-gray-400 transition group-open:rotate-180"
                                            />
                                        </summary>

                                        <div className="absolute right-0 top-full w-60 pt-3">
                                            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl shadow-gray-900/10">
                                                <div className="mb-1 border-b border-gray-100 px-3 py-3">
                                                    <p className="truncate text-sm font-bold text-gray-900">
                                                        {user.name}
                                                    </p>

                                                    <p className="mt-0.5 truncate text-xs text-gray-500">
                                                        {user.email}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            "/profile"
                                                        )
                                                    }
                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                                                >
                                                    <User size={17} />
                                                    My Profile
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            "/orders"
                                                        )
                                                    }
                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-green-600"
                                                >
                                                    <Package size={17} />
                                                    My Orders
                                                </button>

                                                <button
                                                    onClick={handleLogout}
                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                                >
                                                    <LogOut size={17} />
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate("/login")}
                                    className="hidden rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700 sm:block"
                                >
                                    Sign In
                                </button>
                            )}

                            {/* MOBILE MENU */}

                            <button
                                onClick={() =>
                                    setMobileMenuOpen(
                                        !mobileMenuOpen
                                    )
                                }
                                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-700 transition hover:bg-green-50 hover:text-green-600 md:hidden"
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? (
                                    <X size={21} />
                                ) : (
                                    <Menu size={21} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* MOBILE MENU */}

                    {mobileMenuOpen && (
                        <div className="border-t border-gray-100 py-4 md:hidden">
                            <div className="space-y-1">
                                <button
                                    onClick={() => {
                                        navigate("/marketplace");
                                        setMobileMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl bg-green-50 px-4 py-3 text-left text-sm font-bold text-green-700"
                                >
                                    <ShoppingCart size={18} />
                                    Marketplace
                                </button>

                                <button
                                    onClick={() => {
                                        navigate("/orders");
                                        setMobileMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    <Package size={18} />
                                    My Orders
                                </button>

                                <button
                                    onClick={() => {
                                        navigate("/profile");
                                        setMobileMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    <User size={18} />
                                    Profile
                                </button>

                                {!user && (
                                    <button
                                        onClick={() => {
                                            navigate("/login");
                                            setMobileMenuOpen(false);
                                        }}
                                        className="mt-2 flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white"
                                    >
                                        Sign In
                                    </button>
                                )}

                                {user && (
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut size={18} />
                                        Logout
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* =====================================================
                HERO
            ====================================================== */}

            <section className="relative overflow-hidden">
                {/* Background decoration */}

                <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-green-200/40 blur-3xl" />

                <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-lime-200/30 blur-3xl" />

                <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-20">
                    <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
                        {/* HERO CONTENT */}

                        <div>
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
                                <Sparkles
                                    size={16}
                                    className="fill-green-200"
                                />
                                Fresh from local farms
                            </div>

                            <h2 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                                Good food{" "}
                                <span className="block text-green-600">
                                    starts at the farm.
                                </span>
                            </h2>

                            <p className="mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
                                Discover fresh, quality products
                                directly from local farmers. Better
                                prices for farmers, fresher food for
                                you.
                            </p>

                            {/* SEARCH */}

                            <form
                                onSubmit={handleSearch}
                                className="mt-8 max-w-2xl"
                            >
                                <div className="flex flex-col gap-3 rounded-2xl bg-white p-2 shadow-xl shadow-gray-900/5 ring-1 ring-gray-200 sm:flex-row">
                                    <div className="relative flex-1">
                                        <Search
                                            size={20}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Search vegetables, fruits, grains..."
                                            className="w-full rounded-xl border-0 bg-transparent py-3.5 pl-11 pr-10 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
                                        />

                                        {search && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSearch("")
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-green-600"
                                    >
                                        Search
                                        <ArrowRight size={17} />
                                    </button>
                                </div>
                            </form>

                            {/* TRUST POINTS */}

                            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2
                                        size={17}
                                        className="text-green-600"
                                    />
                                    Direct from farmers
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2
                                        size={17}
                                        className="text-green-600"
                                    />
                                    Fresh & quality checked
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2
                                        size={17}
                                        className="text-green-600"
                                    />
                                    Fair prices
                                </div>
                            </div>
                        </div>

                        {/* HERO VISUAL */}

                        <div className="relative hidden lg:flex lg:justify-center">
                            <div className="relative h-[430px] w-[430px]">
                                <div className="absolute inset-8 rounded-full bg-green-100" />

                                <div className="absolute inset-16 rounded-full bg-green-200/60" />

                                <div className="absolute inset-24 rounded-full bg-green-300/50" />

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex h-64 w-64 items-center justify-center rounded-full bg-white text-8xl shadow-2xl shadow-green-900/10">
                                        🥕
                                    </div>
                                </div>

                                {/* Freshness card */}

                                <div className="absolute right-2 top-8 rounded-2xl border border-white bg-white/95 px-5 py-4 shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                                            <Leaf size={20} />
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-medium text-gray-500">
                                                Freshness
                                            </p>

                                            <p className="text-sm font-extrabold text-green-600">
                                                Farm Fresh
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Farmer card */}

                                <div className="absolute bottom-10 left-0 rounded-2xl border border-white bg-white/95 px-5 py-4 shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                                            <Users size={20} />
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-medium text-gray-500">
                                                Direct from
                                            </p>

                                            <p className="text-sm font-extrabold text-gray-900">
                                                Local Farmers
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Organic badge */}

                                <div className="absolute bottom-24 right-4 flex items-center gap-2 rounded-full bg-gray-950 px-4 py-2.5 text-xs font-bold text-white shadow-xl">
                                    <Sprout size={15} />
                                    Organic options
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                QUICK STATS
            ====================================================== */}

            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm sm:grid-cols-3">
                    <div className="border-b border-r border-gray-100 p-5 sm:border-b-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                                <Package size={19} />
                            </div>

                            <div>
                                <p className="text-2xl font-black text-gray-900">
                                    {loading
                                        ? "—"
                                        : productStats.total}
                                </p>

                                <p className="text-xs font-medium text-gray-500">
                                    Products available
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-gray-100 p-5 sm:border-b-0 sm:border-r">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-50 text-lime-600">
                                <Leaf size={19} />
                            </div>

                            <div>
                                <p className="text-2xl font-black text-gray-900">
                                    {loading
                                        ? "—"
                                        : productStats.organic}
                                </p>

                                <p className="text-xs font-medium text-gray-500">
                                    Organic products
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-2 p-5 sm:col-span-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Sprout size={19} />
                            </div>

                            <div>
                                <p className="text-2xl font-black text-gray-900">
                                    {loading
                                        ? "—"
                                        : productStats.availableStock}
                                </p>

                                <p className="text-xs font-medium text-gray-500">
                                    Total stock available
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                CATEGORY SECTION
            ====================================================== */}

            <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
                <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                        <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-green-600">
                            Explore
                        </p>

                        <h3 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                            Shop by category
                        </h3>
                    </div>

                    <div className="hidden items-center gap-2 text-xs font-semibold text-gray-400 sm:flex">
                        <SlidersHorizontal size={15} />
                        Filter products
                    </div>
                </div>

                <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
                    {categories.map((category) => {
                        const isActive =
                            selectedCategory === category;

                        return (
                            <button
                                key={category}
                                onClick={() =>
                                    handleCategoryChange(category)
                                }
                                className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                                    isActive
                                        ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                                        : "border border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                                }`}
                            >
                                {category === "Organic" && (
                                    <Leaf size={15} />
                                )}

                                {category}

                                {isActive && category !== "All" && (
                                    <CheckCircle2 size={14} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* =====================================================
                PRODUCTS
            ====================================================== */}

            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-green-600">
                            Marketplace
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-3xl font-black tracking-tight text-gray-950">
                                Fresh products
                            </h3>

                            {selectedCategory !== "All" && (
                                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                                    {selectedCategory}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!loading &&
                            (search ||
                                selectedCategory !== "All") && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs font-bold text-gray-500 transition hover:text-green-600"
                                >
                                    Clear filters
                                </button>
                            )}

                        <button
                            onClick={() => fetchProducts(true)}
                            disabled={refreshing}
                            className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-bold text-gray-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                size={15}
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

                        <p className="text-sm font-semibold text-gray-400">
                            {products.length}{" "}
                            {products.length === 1
                                ? "product"
                                : "products"}
                        </p>
                    </div>
                </div>

                {/* LOADING */}

                {loading && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                                >
                                    <div className="h-56 animate-pulse bg-gray-200" />

                                    <div className="space-y-4 p-5">
                                        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />

                                        <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />

                                        <div className="h-8 w-1/2 animate-pulse rounded bg-gray-200" />

                                        <div className="h-11 w-full animate-pulse rounded-xl bg-gray-200" />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* ERROR */}

                {!loading && error && (
                    <div className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
                            ⚠️
                        </div>

                        <h3 className="mt-5 text-xl font-black text-gray-900">
                            Something went wrong
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                            {error}
                        </p>

                        <button
                            onClick={() => fetchProducts()}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
                        >
                            <RefreshCw size={17} />
                            Try Again
                        </button>
                    </div>
                )}

                {/* EMPTY */}

                {!loading &&
                    !error &&
                    products.length === 0 && (
                        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-green-600">
                                <Package size={36} />
                            </div>

                            <h3 className="mt-6 text-2xl font-black text-gray-900">
                                No products found
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                                We couldn't find products matching
                                your current search or category.
                            </p>

                            <button
                                onClick={clearFilters}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
                            >
                                View all products
                                <ArrowRight size={17} />
                            </button>
                        </div>
                    )}

                {/* PRODUCT GRID */}

                {!loading &&
                    !error &&
                    products.length > 0 && (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {products.map((product) => (
                                <article
                                    key={product._id}
                                    className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gray-900/10"
                                >
                                    {/* IMAGE */}

                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/product/${product._id}`
                                            )
                                        }
                                        className="relative block h-56 w-full overflow-hidden bg-gray-100 text-left"
                                    >
                                        {product.images?.length >
                                        0 ? (
                                            <img
                                                src={
                                                    product
                                                        .images[0]
                                                }
                                                alt={product.name}
                                                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                                                onError={(
                                                    e
                                                ) => {
                                                    e.currentTarget.style.display =
                                                        "none";
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-50 to-lime-100 text-6xl">
                                                🌾
                                            </div>
                                        )}

                                        {/* Gradient */}

                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition group-hover:opacity-100" />

                                        {/* ORGANIC */}

                                        {product.isOrganic && (
                                            <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-lg">
                                                <Leaf size={13} />
                                                Organic
                                            </span>
                                        )}

                                        {/* IMAGE COUNT */}

                                        {product.images?.length >
                                            1 && (
                                            <span className="absolute right-4 top-4 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                                                +
                                                {product.images
                                                    .length -
                                                    1}{" "}
                                                photos
                                            </span>
                                        )}
                                    </button>

                                    {/* CONTENT */}

                                    <div className="p-5">
                                        {/* CATEGORY + TITLE */}

                                        <div>
                                            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-green-600">
                                                {product.category ||
                                                    "Fresh Produce"}
                                            </p>

                                            <h4
                                                title={
                                                    product.name
                                                }
                                                className="mt-1.5 line-clamp-1 text-lg font-black text-gray-950"
                                            >
                                                {product.name}
                                            </h4>
                                        </div>

                                        {/* DESCRIPTION */}

                                        {product.description && (
                                            <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-gray-500">
                                                {
                                                    product.description
                                                }
                                            </p>
                                        )}

                                        {/* FARMER */}

                                        <div className="mt-4 flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                                                <Users
                                                    size={17}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-medium text-gray-400">
                                                    Sold by
                                                </p>

                                                <p className="truncate text-xs font-bold text-gray-700">
                                                    {product.farmer
                                                        ?.name ||
                                                        "Local Farmer"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* LOCATION */}

                                        {product.location && (
                                            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                                                <MapPin
                                                    size={14}
                                                    className="shrink-0 text-green-600"
                                                />

                                                <span className="truncate">
                                                    {
                                                        product.location
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        {/* PRICE */}

                                        <div className="mt-5 flex items-end justify-between gap-3">
                                            <div>
                                                <div className="flex items-baseline">
                                                    <span className="text-2xl font-black tracking-tight text-gray-950">
                                                        ₹
                                                        {Number(
                                                            product.price ||
                                                                0
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </span>

                                                    <span className="ml-1 text-xs font-medium text-gray-500">
                                                        /{" "}
                                                        {product.unit ||
                                                            "unit"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[10px] font-medium text-gray-400">
                                                    Available
                                                </p>

                                                <p className="text-xs font-bold text-gray-700">
                                                    {Number(
                                                        product.quantity ||
                                                            0
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}{" "}
                                                    {product.unit ||
                                                        "units"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* VIEW BUTTON */}

                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/product/${product._id}`
                                                )
                                            }
                                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 py-3 text-sm font-bold text-white transition duration-300 hover:bg-green-600"
                                        >
                                            View Product
                                            <ArrowRight
                                                size={16}
                                                className="transition-transform group-hover:translate-x-0.5"
                                            />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
            </section>

            {/* =====================================================
                CTA
            ====================================================== */}

            <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl bg-gray-950 px-6 py-10 text-white sm:px-10 sm:py-12">
                    <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-green-600/20 blur-3xl" />

                    <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-3 flex items-center gap-2 text-green-400">
                                <Sprout size={18} />

                                <span className="text-xs font-extrabold uppercase tracking-[0.16em]">
                                    Better food ecosystem
                                </span>
                            </div>

                            <h3 className="text-2xl font-black tracking-tight sm:text-3xl">
                                Support farmers.
                                <span className="block text-green-400">
                                    Eat fresher.
                                </span>
                            </h3>

                            <p className="mt-3 text-sm leading-6 text-gray-400">
                                Every purchase helps create a more
                                direct and transparent connection
                                between farmers and customers.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setSelectedCategory("All");
                                setSearch("");
                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                });
                            }}
                            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-green-500"
                        >
                            Explore Marketplace
                            <ArrowRight size={17} />
                        </button>
                    </div>
                </div>
            </section>

            {/* =====================================================
                FOOTER
            ====================================================== */}

            <footer className="border-t border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white">
                                <Sprout size={20} />
                            </div>

                            <div>
                                <p className="font-black text-gray-900">
                                    F2C
                                </p>

                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Farm to Customer
                                </p>
                            </div>
                        </div>

                        <p className="text-center text-xs text-gray-500 sm:text-right">
                            Fresh food. Fair prices. Direct from
                            farmers.
                        </p>
                    </div>

                    <div className="mt-8 border-t border-gray-100 pt-6 text-center">
                        <p className="text-xs text-gray-400">
                            © {new Date().getFullYear()} F2C
                            Platform. Connecting farms with
                            customers.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Marketplace;