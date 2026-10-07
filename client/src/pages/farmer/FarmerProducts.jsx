import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    ArrowLeft,
    ArrowUpRight,
    Boxes,
    CheckCircle2,
    ChevronDown,
    Edit3,
    Filter,
    Leaf,
    Package,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    X,
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


const getImageUrl = (product) => {
    const images = Array.isArray(product?.images)
        ? product.images
        : [];

    const image = images.find(
        (item) =>
            typeof item === "string" &&
            item.trim()
    );

    return image || null;
};


// ======================================================
// COMPONENT
// ======================================================

const FarmerProducts = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("ALL");
    const [availability, setAvailability] = useState("ALL");
    const [organic, setOrganic] = useState("ALL");

    const [deleteProduct, setDeleteProduct] = useState(null);
    const [deleting, setDeleting] = useState(false);


    // ==================================================
    // FETCH PRODUCTS
    // ==================================================

    const fetchProducts = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token =
                localStorage.getItem("farmerToken");

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

            const data =
                response.data?.products ||
                response.data ||
                [];

            setProducts(
                Array.isArray(data) ? data : []
            );

        } catch (err) {
            console.error(
                "FARMER PRODUCTS ERROR:",
                err
            );

            if (
                err.response?.status === 401 ||
                err.response?.status === 403
            ) {
                localStorage.removeItem(
                    "farmerToken"
                );

                localStorage.removeItem(
                    "farmerUser"
                );

                navigate("/farmer/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                    "Failed to load your products."
            );

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    useEffect(() => {
        fetchProducts();
    }, []);


    // ==================================================
    // CATEGORIES
    // ==================================================

    const categories = useMemo(() => {
        const values = products
            .map((product) => product.category)
            .filter(Boolean);

        return [
            "ALL",
            ...Array.from(
                new Set(values)
            ).sort()
        ];
    }, [products]);


    // ==================================================
    // FILTER PRODUCTS
    // ==================================================

    const filteredProducts = useMemo(() => {
        const query =
            search.trim().toLowerCase();

        return products.filter((product) => {

            const matchesSearch =
                !query ||
                product.name
                    ?.toLowerCase()
                    .includes(query) ||
                product.category
                    ?.toLowerCase()
                    .includes(query) ||
                product.location
                    ?.toLowerCase()
                    .includes(query);

            const matchesCategory =
                category === "ALL" ||
                product.category === category;

            const matchesAvailability =
                availability === "ALL" ||
                (availability === "AVAILABLE"
                    ? product.isAvailable
                    : !product.isAvailable);

            const matchesOrganic =
                organic === "ALL" ||
                (organic === "ORGANIC"
                    ? product.isOrganic
                    : !product.isOrganic);

            return (
                matchesSearch &&
                matchesCategory &&
                matchesAvailability &&
                matchesOrganic
            );
        });
    }, [
        products,
        search,
        category,
        availability,
        organic
    ]);


    // ==================================================
    // STATS
    // ==================================================

    const stats = useMemo(() => {

        const total = products.length;

        const available = products.filter(
            (product) => product.isAvailable
        ).length;

        const organicCount = products.filter(
            (product) => product.isOrganic
        ).length;

        const outOfStock = products.filter(
            (product) =>
                Number(product.quantity) <= 0
        ).length;

        return {
            total,
            available,
            organicCount,
            outOfStock
        };

    }, [products]);


    // ==================================================
    // DELETE
    // ==================================================

    const handleDelete = async () => {
        if (!deleteProduct) {
            return;
        }

        try {
            setDeleting(true);

            const token =
                localStorage.getItem(
                    "farmerToken"
                );

            await API.delete(
                `/products/${deleteProduct._id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setProducts((previous) =>
                previous.filter(
                    (product) =>
                        product._id !==
                        deleteProduct._id
                )
            );

            setDeleteProduct(null);

        } catch (err) {
            console.error(
                "DELETE PRODUCT ERROR:",
                err
            );

            if (
                err.response?.status === 401 ||
                err.response?.status === 403
            ) {
                localStorage.removeItem(
                    "farmerToken"
                );

                localStorage.removeItem(
                    "farmerUser"
                );

                navigate("/farmer/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                    "Failed to delete product."
            );

            setDeleteProduct(null);

        } finally {
            setDeleting(false);
        }
    };


    // ==================================================
    // CLEAR FILTERS
    // ==================================================

    const clearFilters = () => {
        setSearch("");
        setCategory("ALL");
        setAvailability("ALL");
        setOrganic("ALL");
    };


    const hasFilters =
        search.trim() ||
        category !== "ALL" ||
        availability !== "ALL" ||
        organic !== "ALL";


    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">

                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                    <div className="animate-pulse">

                        <div className="h-4 w-32 rounded bg-slate-200" />

                        <div className="mt-5 h-10 w-80 rounded-xl bg-slate-200" />

                        <div className="mt-3 h-5 w-[500px] max-w-full rounded bg-slate-200" />

                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                            {[1, 2, 3, 4].map(
                                (item) => (
                                    <div
                                        key={item}
                                        className="h-32 rounded-3xl bg-slate-200"
                                    />
                                )
                            )}

                        </div>

                        <div className="mt-6 h-20 rounded-3xl bg-slate-200" />

                        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                            {[1, 2, 3, 4, 5, 6].map(
                                (item) => (
                                    <div
                                        key={item}
                                        className="h-[390px] rounded-3xl bg-slate-200"
                                    />
                                )
                            )}

                        </div>

                    </div>

                </div>

            </div>
        );
    }


    // ==================================================
    // ERROR
    // ==================================================

    if (error && products.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50">

                <div className="mx-auto flex min-h-[75vh] max-w-xl items-center justify-center px-4">

                    <div className="w-full rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">

                            <Package size={30} />

                        </div>

                        <h2 className="mt-5 text-2xl font-black text-slate-900">
                            Unable to load products
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                fetchProducts()
                            }
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>

                    </div>

                </div>

            </div>
        );
    }


    // ==================================================
    // UI
    // ==================================================

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ==========================================
                HEADER
            ========================================== */}

            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">

                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

                    <div className="flex min-w-0 items-center gap-3">

                        <Link
                            to="/farmer/dashboard"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            title="Back to dashboard"
                        >
                            <ArrowLeft size={18} />
                        </Link>

                        <div className="min-w-0">

                            <p className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 sm:block">
                                F2C Farmer Center
                            </p>

                            <h1 className="truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                                My Products
                            </h1>

                        </div>

                    </div>


                    <div className="flex shrink-0 items-center gap-2">

                        <button
                            type="button"
                            onClick={() =>
                                fetchProducts(true)
                            }
                            disabled={refreshing}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5"
                            title="Refresh"
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            <span className="ml-2 hidden text-sm font-semibold sm:inline">
                                Refresh
                            </span>

                        </button>


                        <Link
                            to="/farmer/products/add"
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
                        >
                            <Plus size={17} />
                            <span className="hidden sm:inline">
                                Add Product
                            </span>
                            <span className="sm:hidden">
                                Add
                            </span>
                        </Link>

                    </div>

                </div>

            </header>


            <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">

                {/* ==========================================
                    HERO
                ========================================== */}

                <section className="relative mb-6 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8">

                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />

                    <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

                    <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">

                        <div className="max-w-2xl">

                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur">

                                <Boxes size={14} />

                                Product Inventory

                            </div>

                            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                                Manage your marketplace products.
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
                                Keep your listings updated,
                                monitor availability and manage
                                what customers can buy from your farm.
                            </p>

                        </div>


                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">

                                <p className="text-xs text-slate-400">
                                    Products
                                </p>

                                <p className="mt-1 text-2xl font-black">
                                    {formatNumber(stats.total)}
                                </p>

                            </div>


                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">

                                <p className="text-xs text-slate-400">
                                    Available
                                </p>

                                <p className="mt-1 text-2xl font-black text-emerald-300">
                                    {formatNumber(
                                        stats.available
                                    )}
                                </p>

                            </div>


                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">

                                <p className="text-xs text-slate-400">
                                    Organic
                                </p>

                                <p className="mt-1 text-2xl font-black text-lime-300">
                                    {formatNumber(
                                        stats.organicCount
                                    )}
                                </p>

                            </div>


                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">

                                <p className="text-xs text-slate-400">
                                    Out of Stock
                                </p>

                                <p className="mt-1 text-2xl font-black text-orange-300">
                                    {formatNumber(
                                        stats.outOfStock
                                    )}
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ==========================================
                    ERROR ALERT
                ========================================== */}

                {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-700">

                        <XCircle
                            size={19}
                            className="mt-0.5 shrink-0"
                        />

                        <div className="flex-1">
                            <p className="font-semibold">
                                Something went wrong
                            </p>

                            <p className="mt-0.5 text-xs text-red-600">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setError("")
                            }
                            className="text-red-500 hover:text-red-700"
                        >
                            <X size={17} />
                        </button>

                    </div>
                )}


                {/* ==========================================
                    FILTER BAR
                ========================================== */}

                <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

                    <div className="flex flex-col gap-4">

                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

                            {/* Search */}

                            <div className="relative flex-1">

                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search by product, category or location..."
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                                />

                            </div>


                            {/* Filters */}

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[570px]">

                                <div className="relative">

                                    <Filter
                                        size={15}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <select
                                        value={category}
                                        onChange={(event) =>
                                            setCategory(
                                                event.target.value
                                            )
                                        }
                                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                                    >
                                        {categories.map(
                                            (item) => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item ===
                                                    "ALL"
                                                        ? "All Categories"
                                                        : item}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <ChevronDown
                                        size={15}
                                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                </div>


                                <div className="relative">

                                    <select
                                        value={
                                            availability
                                        }
                                        onChange={(event) =>
                                            setAvailability(
                                                event.target.value
                                            )
                                        }
                                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                                    >
                                        <option value="ALL">
                                            All Availability
                                        </option>

                                        <option value="AVAILABLE">
                                            Available
                                        </option>

                                        <option value="UNAVAILABLE">
                                            Unavailable
                                        </option>
                                    </select>

                                    <ChevronDown
                                        size={15}
                                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                </div>


                                <div className="relative">

                                    <select
                                        value={organic}
                                        onChange={(event) =>
                                            setOrganic(
                                                event.target.value
                                            )
                                        }
                                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                                    >
                                        <option value="ALL">
                                            All Products
                                        </option>

                                        <option value="ORGANIC">
                                            Organic
                                        </option>

                                        <option value="NON_ORGANIC">
                                            Non-Organic
                                        </option>
                                    </select>

                                    <ChevronDown
                                        size={15}
                                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                </div>

                            </div>

                        </div>


                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">

                            <p className="text-sm text-slate-500">

                                Showing{" "}

                                <span className="font-bold text-slate-900">
                                    {formatNumber(
                                        filteredProducts.length
                                    )}
                                </span>{" "}

                                of{" "}

                                <span className="font-bold text-slate-900">
                                    {formatNumber(
                                        products.length
                                    )}
                                </span>{" "}

                                products

                            </p>


                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                                >
                                    <X size={15} />
                                    Clear filters
                                </button>
                            )}

                        </div>

                    </div>

                </section>


                {/* ==========================================
                    PRODUCTS
                ========================================== */}

                {filteredProducts.length > 0 ? (

                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                        {filteredProducts.map(
                            (product) => {

                                const image =
                                    getImageUrl(
                                        product
                                    );

                                const quantity =
                                    Number(
                                        product.quantity
                                    ) || 0;

                                const available =
                                    Boolean(
                                        product.isAvailable
                                    ) &&
                                    quantity > 0;

                                return (
                                    <article
                                        key={
                                            product._id
                                        }
                                        className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                                    >

                                        {/* IMAGE */}

                                        <div className="relative h-56 overflow-hidden bg-slate-100">

                                            {image ? (
                                                <img
                                                    src={
                                                        image
                                                    }
                                                    alt={
                                                        product.name ||
                                                        "Product"
                                                    }
                                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                    onError={(
                                                        event
                                                    ) => {
                                                        event.currentTarget.style.display =
                                                            "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">

                                                    <Package
                                                        size={
                                                            48
                                                        }
                                                        className="text-slate-300"
                                                    />

                                                </div>
                                            )}


                                            {/* Gradient */}

                                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />


                                            {/* Status */}

                                            <div className="absolute left-4 top-4">

                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur ${
                                                        available
                                                            ? "border-emerald-200 bg-white/95 text-emerald-700"
                                                            : "border-red-200 bg-white/95 text-red-600"
                                                    }`}
                                                >

                                                    {available ? (
                                                        <CheckCircle2
                                                            size={
                                                                13
                                                            }
                                                        />
                                                    ) : (
                                                        <XCircle
                                                            size={
                                                                13
                                                            }
                                                        />
                                                    )}

                                                    {available
                                                        ? "Available"
                                                        : "Unavailable"}

                                                </span>

                                            </div>


                                            {/* Organic */}

                                            {product.isOrganic && (
                                                <div className="absolute right-4 top-4">

                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-200 bg-lime-50/95 px-3 py-1.5 text-xs font-bold text-lime-700 shadow-sm">

                                                        <Leaf
                                                            size={
                                                                13
                                                            }
                                                        />

                                                        Organic

                                                    </span>

                                                </div>
                                            )}


                                            {/* Product name */}

                                            <div className="absolute bottom-4 left-4 right-4">

                                                <h3 className="truncate text-lg font-black text-white drop-shadow">
                                                    {product.name ||
                                                        "Unnamed Product"}
                                                </h3>

                                                <p className="mt-0.5 text-xs font-medium text-white/80">
                                                    {product.category ||
                                                        "Other"}
                                                </p>

                                            </div>

                                        </div>


                                        {/* BODY */}

                                        <div className="p-5">

                                            <div className="flex items-end justify-between gap-3">

                                                <div>

                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Price
                                                    </p>

                                                    <p className="mt-1 text-2xl font-black text-slate-900">

                                                        {formatCurrency(
                                                            product.price
                                                        )}

                                                        <span className="ml-1 text-xs font-medium text-slate-400">
                                                            /{" "}
                                                            {product.unit ||
                                                                "unit"}
                                                        </span>

                                                    </p>

                                                </div>


                                                <div className="text-right">

                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Stock
                                                    </p>

                                                    <p
                                                        className={`mt-1 text-sm font-bold ${
                                                            quantity <=
                                                            0
                                                                ? "text-red-600"
                                                                : quantity <=
                                                                    10
                                                                  ? "text-orange-600"
                                                                  : "text-slate-800"
                                                        }`}
                                                    >
                                                        {formatNumber(
                                                            quantity
                                                        )}{" "}
                                                        {product.unit ||
                                                            "units"}
                                                    </p>

                                                </div>

                                            </div>


                                            {/* Location */}

                                            {product.location && (
                                                <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">

                                                    <p className="truncate text-xs font-medium text-slate-500">
                                                        📍{" "}
                                                        {
                                                            product.location
                                                        }
                                                    </p>

                                                </div>
                                            )}


                                            {/* Actions */}

                                            <div className="mt-5 flex gap-2">

                                                <Link
                                                    to={`/farmer/products/edit/${product._id}`}
                                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                >
                                                    <Edit3
                                                        size={
                                                            16
                                                        }
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
                                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                    title="Delete product"
                                                >
                                                    <Trash2
                                                        size={
                                                            17
                                                        }
                                                    />
                                                </button>

                                            </div>

                                        </div>

                                    </article>
                                );
                            }
                        )}

                    </div>

                ) : (

                    /* =====================================
                       EMPTY
                    ===================================== */

                    <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">

                            {hasFilters ? (
                                <Search size={34} />
                            ) : (
                                <Boxes size={34} />
                            )}

                        </div>

                        <h2 className="mt-5 text-xl font-black text-slate-900">

                            {hasFilters
                                ? "No products found"
                                : "Your product catalog is empty"}

                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

                            {hasFilters
                                ? "Try changing your search or filters to find the products you are looking for."
                                : "Add your first product and start selling directly to customers through the F2C marketplace."}

                        </p>


                        <div className="mt-6 flex flex-wrap justify-center gap-3">

                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={
                                        clearFilters
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <X size={16} />
                                    Clear Filters
                                </button>
                            )}

                            {!hasFilters && (
                                <Link
                                    to="/farmer/products/add"
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                                >
                                    <Plus size={17} />
                                    Add Your First Product
                                    <ArrowUpRight
                                        size={16}
                                    />
                                </Link>
                            )}

                        </div>

                    </section>

                )}


                {/* ==========================================
                    FOOTER
                ========================================== */}

                <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 py-6 text-xs text-slate-400 sm:flex-row">

                    <p>
                        F2C Farmer Center • Manage your
                        farm marketplace
                    </p>

                    <Link
                        to="/farmer/dashboard"
                        className="font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                        Back to Dashboard
                    </Link>

                </div>

            </main>


            {/* ==========================================
                DELETE MODAL
            ========================================== */}

            {deleteProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">

                    <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl">

                        <div className="p-6 sm:p-7">

                            <div className="flex items-start justify-between">

                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">

                                    <Trash2 size={22} />

                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setDeleteProduct(
                                            null
                                        )
                                    }
                                    disabled={
                                        deleting
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X size={18} />
                                </button>

                            </div>


                            <h2 className="mt-5 text-xl font-black text-slate-900">
                                Delete product?
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Are you sure you want to
                                permanently remove{" "}
                                <span className="font-bold text-slate-800">
                                    {deleteProduct.name ||
                                        "this product"}
                                </span>{" "}
                                from your marketplace listings?
                            </p>


                            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3">

                                <p className="text-xs leading-5 text-red-700">
                                    This action cannot be
                                    undone. The product will
                                    no longer appear in your
                                    product catalog.
                                </p>

                            </div>


                            <div className="mt-6 flex gap-3">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setDeleteProduct(
                                            null
                                        )
                                    }
                                    disabled={
                                        deleting
                                    }
                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Keep Product
                                </button>


                                <button
                                    type="button"
                                    onClick={
                                        handleDelete
                                    }
                                    disabled={
                                        deleting
                                    }
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >

                                    {deleting ? (
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

                    </div>

                </div>
            )}

        </div>
    );
};


export default FarmerProducts;