import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    BarChart3,
    Box,
    CheckCircle2,
    ChevronRight,
    CircleAlert,
    Edit3,
    Leaf,
    LogOut,
    Menu,
    Package,
    Plus,
    RefreshCw,
    ShoppingBag,
    Store,
    Trash2,
    UserRound,
    Wheat,
    X,
    XCircle
} from "lucide-react";
import API from "../services/api";

function FarmerDashboard() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [farmer, setFarmer] = useState(null);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [deleteProduct, setDeleteProduct] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("farmerToken");

            if (!token) {
                navigate("/farmer/login");
                return;
            }

            const response = await API.get(
                "/products/farmer/my-products",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setProducts(response.data.products || []);
        } catch (error) {
            console.error("Fetch farmer products error:", error);

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
                "Unable to load your products."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedFarmer = localStorage.getItem("farmerUser");

        if (savedFarmer) {
            try {
                setFarmer(JSON.parse(savedFarmer));
            } catch (error) {
                console.error("Invalid farmer data:", error);
            }
        }

        fetchProducts();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("farmerToken");
        localStorage.removeItem("farmerUser");

        navigate("/farmer/login");
    };

    const handleDelete = async () => {
        if (!deleteProduct) {
            return;
        }

        try {
            setDeleting(true);

            const token = localStorage.getItem("farmerToken");

            await API.delete(
                `/products/${deleteProduct._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setProducts((previousProducts) =>
                previousProducts.filter(
                    (product) =>
                        product._id !== deleteProduct._id
                )
            );

            setDeleteProduct(null);
        } catch (error) {
            console.error("Delete product error:", error);

            alert(
                error.response?.data?.message ||
                "Unable to delete product."
            );
        } finally {
            setDeleting(false);
        }
    };

    const totalProducts = products.length;

    const availableProducts = products.filter(
        (product) =>
            product.isAvailable &&
            Number(product.quantity || 0) > 0
    ).length;

    const outOfStockProducts = products.filter(
        (product) =>
            Number(product.quantity || 0) <= 0
    ).length;

    const totalStock = products.reduce(
        (total, product) =>
            total + Number(product.quantity || 0),
        0
    );

    const organicProducts = products.filter(
        (product) => product.isOrganic
    ).length;

    const lowStockProducts = products.filter((product) => {
        const quantity = Number(product.quantity || 0);

        return quantity > 0 && quantity <= 10;
    }).length;

    const recentProducts = useMemo(() => {
        return [...products]
            .sort(
                (a, b) =>
                    new Date(b.createdAt || 0) -
                    new Date(a.createdAt || 0)
            )
            .slice(0, 6);
    }, [products]);

    return (
        <div className="min-h-screen bg-[#f7faf5] text-gray-900">

            {/* =====================================================
                NAVBAR
            ====================================================== */}

            <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-xl">

                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

                    {/* Logo */}

                    <Link
                        to="/farmer/dashboard"
                        className="group flex items-center gap-3"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-700 text-white shadow-lg shadow-green-700/20 transition duration-300 group-hover:scale-105">
                            <Leaf size={22} strokeWidth={2.5} />
                        </div>

                        <div>
                            <p className="text-lg font-black tracking-tight">
                                F2C
                            </p>

                            <p className="text-[11px] font-medium text-gray-500">
                                Farmer Portal
                            </p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}

                    <div className="hidden items-center gap-3 md:flex">

                        <Link
                            to="/marketplace"
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                        >
                            <Store size={16} />
                            Marketplace
                        </Link>

                        <Link
                            to="/farmer/orders"
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                        >
                            <ShoppingBag size={16} />
                            Orders
                        </Link>

                        <div className="mx-1 h-8 w-px bg-gray-200" />

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-800">
                                {farmer?.name?.charAt(0)?.toUpperCase() ||
                                    "F"}
                            </div>

                            <div className="min-w-0">
                                <p className="max-w-32 truncate text-sm font-bold">
                                    {farmer?.name || "Farmer"}
                                </p>

                                <p className="text-[11px] text-gray-500">
                                    Farmer Account
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>

                    </div>

                    {/* Mobile menu button */}

                    <button
                        type="button"
                        onClick={() =>
                            setMobileMenuOpen(!mobileMenuOpen)
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 md:hidden"
                    >
                        {mobileMenuOpen ? (
                            <X size={20} />
                        ) : (
                            <Menu size={20} />
                        )}
                    </button>

                </div>

                {/* Mobile Navigation */}

                {mobileMenuOpen && (
                    <div className="border-t border-gray-100 bg-white px-5 py-4 md:hidden">

                        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-green-50 p-4">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200 font-bold text-green-800">
                                {farmer?.name?.charAt(0)?.toUpperCase() ||
                                    "F"}
                            </div>

                            <div>
                                <p className="text-sm font-bold">
                                    {farmer?.name || "Farmer"}
                                </p>

                                <p className="text-xs text-gray-500">
                                    Farmer Account
                                </p>
                            </div>

                        </div>

                        <div className="grid gap-2">

                            <Link
                                to="/marketplace"
                                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Store size={18} />
                                Marketplace
                            </Link>

                            <Link
                                to="/farmer/orders"
                                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <ShoppingBag size={18} />
                                Manage Orders
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>

                        </div>

                    </div>
                )}

            </header>

            {/* =====================================================
                MAIN
            ====================================================== */}

            <main className="mx-auto max-w-7xl px-5 py-7 sm:py-10 lg:px-8">

                {/* =================================================
                    HERO
                ================================================== */}

                <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-950 via-green-900 to-green-800 p-7 text-white shadow-[0_20px_60px_-25px_rgba(22,101,52,0.5)] sm:p-10 lg:p-12">

                    <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border border-white/10" />
                    <div className="absolute -right-5 -top-12 h-48 w-48 rounded-full border border-white/10" />

                    <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-green-600/20 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

                        <div className="max-w-2xl">

                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-300/20 bg-green-300/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-green-200">
                                <Wheat size={14} />
                                Farmer Dashboard
                            </div>

                            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                                Good to see you,{" "}
                                {farmer?.name?.split(" ")[0] ||
                                    "Farmer"}
                                <span className="text-green-300">
                                    .
                                </span>
                            </h1>

                            <p className="mt-5 max-w-xl text-sm leading-7 text-green-100/75 sm:text-[15px]">
                                Manage your farm products, keep your
                                inventory healthy and connect directly
                                with customers through F2C.
                            </p>

                            <div className="mt-7 flex flex-wrap gap-3">

                                <Link
                                    to="/farmer/products/add"
                                    className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-extrabold text-green-900 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
                                >
                                    <Plus size={18} />
                                    Add Product
                                    <ArrowRight
                                        size={16}
                                        className="transition group-hover:translate-x-1"
                                    />
                                </Link>

                                <Link
                                    to="/farmer/orders"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/15"
                                >
                                    <Package size={18} />
                                    Manage Orders
                                </Link>

                            </div>

                        </div>

                        {/* Hero summary */}

                        <div className="hidden shrink-0 lg:block">

                            <div className="w-72 rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 backdrop-blur">

                                <div className="mb-5 flex items-center justify-between">

                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-green-200">
                                            Inventory Overview
                                        </p>

                                        <p className="mt-1 text-xs text-green-100/50">
                                            Your current catalogue
                                        </p>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                        <BarChart3 size={19} />
                                    </div>

                                </div>

                                <div className="flex items-end gap-2">

                                    <span className="text-4xl font-black">
                                        {totalProducts}
                                    </span>

                                    <span className="mb-1 text-sm text-green-100/60">
                                        products
                                    </span>

                                </div>

                                <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-green-200">
                                    <CheckCircle2 size={15} />
                                    {availableProducts} currently available
                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    STATS
                ================================================== */}

                <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <StatCard
                        icon={<Package size={21} />}
                        label="Total Products"
                        value={totalProducts}
                        description="Products listed"
                        iconClass="bg-green-50 text-green-700"
                    />

                    <StatCard
                        icon={<CheckCircle2 size={21} />}
                        label="Available"
                        value={availableProducts}
                        description="Ready for customers"
                        iconClass="bg-emerald-50 text-emerald-700"
                    />

                    <StatCard
                        icon={<Box size={21} />}
                        label="Total Stock"
                        value={totalStock}
                        description="Units across products"
                        iconClass="bg-blue-50 text-blue-700"
                    />

                    <StatCard
                        icon={<CircleAlert size={21} />}
                        label="Out of Stock"
                        value={outOfStockProducts}
                        description={
                            outOfStockProducts > 0
                                ? "Needs attention"
                                : "Inventory looks good"
                        }
                        iconClass={
                            outOfStockProducts > 0
                                ? "bg-red-50 text-red-600"
                                : "bg-gray-100 text-gray-500"
                        }
                    />

                </section>

                {/* =================================================
                    INVENTORY INSIGHTS
                ================================================== */}

                <section className="mt-6 grid gap-4 lg:grid-cols-3">

                    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                                <Leaf size={20} />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Organic Products
                                </p>

                                <p className="mt-1 text-xl font-black text-gray-900">
                                    {organicProducts}
                                </p>
                            </div>

                        </div>

                    </div>

                    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                <CircleAlert size={20} />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Low Stock
                                </p>

                                <p className="mt-1 text-xl font-black text-gray-900">
                                    {lowStockProducts}
                                </p>
                            </div>

                        </div>

                    </div>

                    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <TrendingIcon />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Marketplace Status
                                </p>

                                <p className="mt-1 text-sm font-black text-gray-900">
                                    {availableProducts > 0
                                        ? "Products are live"
                                        : "Add products to start selling"}
                                </p>
                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    PRODUCTS HEADER
                ================================================== */}

                <section className="mt-11">

                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                        <div>
                            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-green-700">
                                <Package size={15} />
                                Inventory
                            </div>

                            <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                                My Products
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Manage the products currently listed on
                                your F2C store.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">

                            <button
                                type="button"
                                onClick={fetchProducts}
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={16}
                                    className={
                                        loading
                                            ? "animate-spin"
                                            : ""
                                    }
                                />
                                Refresh
                            </button>

                            <Link
                                to="/farmer/products/add"
                                className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-green-700/15 transition hover:-translate-y-0.5 hover:bg-green-800"
                            >
                                <Plus size={17} />
                                Add Product
                            </Link>

                        </div>

                    </div>

                    {/* =================================================
                        LOADING
                    ================================================== */}

                    {loading && (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                                >

                                    <div className="h-56 animate-pulse bg-gray-200" />

                                    <div className="space-y-4 p-5">

                                        <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />

                                        <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />

                                        <div className="h-14 animate-pulse rounded-2xl bg-gray-100" />

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
                                            <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
                                        </div>

                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                    {/* =================================================
                        ERROR
                    ================================================== */}

                    {!loading && error && (
                        <div className="rounded-[2rem] border border-red-100 bg-white px-6 py-14 text-center shadow-sm">

                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                <CircleAlert size={28} />
                            </div>

                            <h3 className="mt-5 text-xl font-black text-gray-900">
                                Unable to load products
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={fetchProducts}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>

                        </div>
                    )}

                    {/* =================================================
                        EMPTY
                    ================================================== */}

                    {!loading &&
                        !error &&
                        products.length === 0 && (
                            <div className="rounded-[2rem] border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">

                                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-green-50 text-green-700">
                                    <Wheat size={43} strokeWidth={1.5} />
                                </div>

                                <h3 className="mt-6 text-2xl font-black text-gray-900">
                                    Your store is waiting for its
                                    first product
                                </h3>

                                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                                    Add your farm produce and start
                                    reaching customers directly through
                                    the F2C marketplace.
                                </p>

                                <Link
                                    to="/farmer/products/add"
                                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-green-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-green-700/15 transition hover:-translate-y-0.5 hover:bg-green-800"
                                >
                                    <Plus size={18} />
                                    Add Your First Product
                                    <ArrowRight size={16} />
                                </Link>

                            </div>
                        )}

                    {/* =================================================
                        PRODUCT GRID
                    ================================================== */}

                    {!loading &&
                        !error &&
                        products.length > 0 && (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                                {recentProducts.map((product) => {

                                    const quantity = Number(
                                        product.quantity || 0
                                    );

                                    const isOutOfStock =
                                        quantity <= 0;

                                    const isLowStock =
                                        quantity > 0 &&
                                        quantity <= 10;

                                    return (
                                        <article
                                            key={product._id}
                                            className="group overflow-hidden rounded-[1.7rem] border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                                        >

                                            {/* Image */}

                                            <div className="relative h-56 overflow-hidden bg-gray-100">

                                                {product.images?.[0] ? (
                                                    <img
                                                        src={
                                                            product
                                                                .images[0]
                                                        }
                                                        alt={
                                                            product.name
                                                        }
                                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-green-50 text-green-700">
                                                        <Wheat
                                                            size={55}
                                                            strokeWidth={
                                                                1.2
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                {/* Image overlay */}

                                                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

                                                {/* Availability */}

                                                <div className="absolute left-4 top-4">

                                                    {isOutOfStock ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-lg">
                                                            <XCircle
                                                                size={13}
                                                            />
                                                            Out of Stock
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-green-700 shadow-lg backdrop-blur">
                                                            <CheckCircle2
                                                                size={13}
                                                            />
                                                            Available
                                                        </span>
                                                    )}

                                                </div>

                                                {product.isOrganic && (
                                                    <div className="absolute right-4 top-4">

                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-700 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-lg">
                                                            <Leaf
                                                                size={13}
                                                            />
                                                            Organic
                                                        </span>

                                                    </div>
                                                )}

                                            </div>

                                            {/* Content */}

                                            <div className="p-5">

                                                <div className="flex items-start justify-between gap-3">

                                                    <div className="min-w-0">

                                                        <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.15em] text-green-700">
                                                            {product.category ||
                                                                "Farm Produce"}
                                                        </p>

                                                        <h3 className="mt-1 truncate text-lg font-black text-gray-900">
                                                            {product.name}
                                                        </h3>

                                                    </div>

                                                    <div className="shrink-0 text-right">

                                                        <p className="text-lg font-black text-gray-900">
                                                            ₹
                                                            {
                                                                product.price
                                                            }
                                                        </p>

                                                        <p className="text-[11px] font-medium text-gray-400">
                                                            /{" "}
                                                            {
                                                                product.unit
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                                {/* Stock information */}

                                                <div className="mt-5 rounded-2xl bg-gray-50 p-4">

                                                    <div className="flex items-center justify-between">

                                                        <div className="flex items-center gap-2">
                                                            <Box
                                                                size={15}
                                                                className="text-gray-400"
                                                            />

                                                            <span className="text-xs font-semibold text-gray-500">
                                                                Current
                                                                Stock
                                                            </span>
                                                        </div>

                                                        <span
                                                            className={`text-sm font-black ${
                                                                isOutOfStock
                                                                    ? "text-red-600"
                                                                    : isLowStock
                                                                    ? "text-amber-600"
                                                                    : "text-gray-900"
                                                            }`}
                                                        >
                                                            {quantity}{" "}
                                                            {
                                                                product.unit
                                                            }
                                                        </span>

                                                    </div>

                                                    <div className="mt-3 flex items-center gap-2">

                                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                                                            <div
                                                                className={`h-full rounded-full ${
                                                                    isOutOfStock
                                                                        ? "bg-red-500"
                                                                        : isLowStock
                                                                        ? "bg-amber-500"
                                                                        : "bg-green-600"
                                                                }`}
                                                                style={{
                                                                    width:
                                                                        isOutOfStock
                                                                            ? "5%"
                                                                            : isLowStock
                                                                            ? "35%"
                                                                            : "100%"
                                                                }}
                                                            />
                                                        </div>

                                                        {isLowStock &&
                                                            !isOutOfStock && (
                                                                <span className="text-[9px] font-extrabold uppercase text-amber-600">
                                                                    Low
                                                                </span>
                                                            )}

                                                    </div>

                                                </div>

                                                {/* Actions */}

                                                <div className="mt-5 grid grid-cols-2 gap-3">

                                                    <Link
                                                        to={`/farmer/products/edit/${product._id}`}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-xs font-extrabold text-gray-700 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                                                    >
                                                        <Edit3
                                                            size={15}
                                                        />
                                                        Edit
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeleteProduct(
                                                                product
                                                            )
                                                        }
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                                                    >
                                                        <Trash2
                                                            size={15}
                                                        />
                                                        Delete
                                                    </button>

                                                </div>

                                            </div>

                                        </article>
                                    );
                                })}

                            </div>
                        )}

                    {/* More products */}

                    {!loading &&
                        !error &&
                        products.length > 6 && (
                            <div className="mt-6 flex justify-center">

                                <Link
                                    to="/farmer/products"
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                                >
                                    View all {products.length} products
                                    <ChevronRight size={16} />
                                </Link>

                            </div>
                        )}

                </section>

            </main>

            {/* =====================================================
                FOOTER
            ====================================================== */}

            <footer className="border-t border-gray-100 bg-white">

                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-7 text-center sm:flex-row sm:text-left lg:px-8">

                    <div className="flex items-center gap-2">

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
                            <Leaf size={15} />
                        </div>

                        <p className="text-xs font-semibold text-gray-500">
                            F2C Farmer Portal
                        </p>

                    </div>

                    <p className="text-xs text-gray-400">
                        Grow locally. Sell directly. 🌱
                    </p>

                </div>

            </footer>

            {/* =====================================================
                DELETE MODAL
            ====================================================== */}

            {deleteProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-5 backdrop-blur-sm">

                    <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">

                        <div className="p-6 sm:p-7">

                            <div className="flex items-start justify-between">

                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                    <Trash2 size={22} />
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setDeleteProduct(null)
                                    }
                                    disabled={deleting}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                >
                                    <X size={18} />
                                </button>

                            </div>

                            <h3 className="mt-5 text-xl font-black text-gray-900">
                                Delete this product?
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                You're about to permanently delete{" "}
                                <span className="font-bold text-gray-800">
                                    {deleteProduct.name}
                                </span>
                                . This action cannot be undone.
                            </p>

                            <div className="mt-5 rounded-2xl bg-gray-50 p-4">

                                <div className="flex items-center gap-3">

                                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-gray-200">

                                        {deleteProduct.images?.[0] ? (
                                            <img
                                                src={
                                                    deleteProduct.images[0]
                                                }
                                                alt={
                                                    deleteProduct.name
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-green-700">
                                                <Wheat size={20} />
                                            </div>
                                        )}

                                    </div>

                                    <div className="min-w-0">

                                        <p className="truncate text-sm font-bold text-gray-900">
                                            {deleteProduct.name}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            ₹{deleteProduct.price} /{" "}
                                            {deleteProduct.unit}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setDeleteProduct(null)
                                    }
                                    disabled={deleting}
                                    className="rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deleting ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={16} />
                                            Delete Product
                                        </>
                                    )}
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

/* =============================================================
   STAT CARD
============================================================= */

function StatCard({
    icon,
    label,
    value,
    description,
    iconClass
}) {
    return (
        <div className="group rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6">

            <div className="flex items-start justify-between gap-4">

                <div>

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {label}
                    </p>

                    <p className="mt-3 text-3xl font-black tracking-tight text-gray-950">
                        {value}
                    </p>

                </div>

                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
                >
                    {icon}
                </div>

            </div>

            <p className="mt-4 text-[11px] font-medium text-gray-400">
                {description}
            </p>

        </div>
    );
}

/* =============================================================
   SIMPLE TREND ICON
============================================================= */

function TrendingIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="3 17 9 11 13 15 21 7" />
            <polyline points="14 7 21 7 21 14" />
        </svg>
    );
}

export default FarmerDashboard;