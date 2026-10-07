import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronRight,
    Leaf,
    Minus,
    Plus,
    RefreshCw,
    ShoppingCart,
    ShieldCheck,
    Trash2,
    Truck,
    X,
    AlertCircle
} from "lucide-react";

import API from "../services/api";

function Cart() {
    const navigate = useNavigate();

    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const [updatingProduct, setUpdatingProduct] = useState(null);
    const [removingProduct, setRemovingProduct] = useState(null);

    const [removeModal, setRemoveModal] = useState(null);

    const token = localStorage.getItem("customerToken");

    // =========================================================
    // AUTH
    // =========================================================

    const handleUnauthorized = () => {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerUser");

        navigate("/login");
    };

    // =========================================================
    // FETCH CART
    // =========================================================

    const fetchCart = async () => {
        const currentToken = localStorage.getItem("customerToken");

        if (!currentToken) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            setPageError("");

            const response = await API.get("/cart", {
                headers: {
                    Authorization: `Bearer ${currentToken}`
                }
            });

            setCart(response.data?.cart || { items: [] });
        } catch (error) {
            console.error("Cart error:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                handleUnauthorized();
                return;
            }

            setPageError(
                error.response?.data?.message ||
                "Unable to load your cart. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    // =========================================================
    // CART ITEMS
    // =========================================================

    const items = cart?.items || [];

    // =========================================================
    // PRICE CALCULATIONS
    // =========================================================

    const subtotal = useMemo(() => {
        return items.reduce((total, item) => {
            const price = Number(item?.product?.price || 0);
            const quantity = Number(item?.quantity || 0);

            return total + price * quantity;
        }, 0);
    }, [items]);

    const deliveryFee =
        subtotal >= 500 || subtotal === 0 ? 0 : 40;

    const total = subtotal + deliveryFee;

    const remainingForFreeDelivery =
        subtotal >= 500 ? 0 : 500 - subtotal;

    // =========================================================
    // UPDATE QUANTITY
    // =========================================================

    const updateQuantity = async (productId, quantity) => {
        if (!token) {
            navigate("/login");
            return;
        }

        if (quantity < 1) {
            return;
        }

        const item = items.find(
            (cartItem) => cartItem?.product?._id === productId
        );

        if (!item) {
            return;
        }

        const availableQuantity = Number(
            item.product?.quantity || 0
        );

        if (quantity > availableQuantity) {
            setPageError(
                `Only ${availableQuantity} ${item.product?.unit || "units"} of ${item.product?.name || "this product"} are available.`
            );
            return;
        }

        try {
            setUpdatingProduct(productId);
            setPageError("");

            const response = await API.put(
                `/cart/update/${productId}`,
                { quantity },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setCart(response.data?.cart || { items: [] });
        } catch (error) {
            console.error("Update quantity error:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                handleUnauthorized();
                return;
            }

            setPageError(
                error.response?.data?.message ||
                "Unable to update quantity."
            );
        } finally {
            setUpdatingProduct(null);
        }
    };

    // =========================================================
    // REMOVE ITEM
    // =========================================================

    const confirmRemove = async () => {
        if (!removeModal) {
            return;
        }

        const productId = removeModal.productId;

        try {
            setRemovingProduct(productId);
            setPageError("");

            const response = await API.delete(
                `/cart/remove/${productId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setCart(response.data?.cart || { items: [] });
            setRemoveModal(null);
        } catch (error) {
            console.error("Remove cart item error:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                handleUnauthorized();
                return;
            }

            setPageError(
                error.response?.data?.message ||
                "Unable to remove this item."
            );
        } finally {
            setRemovingProduct(null);
        }
    };

    // =========================================================
    // CHECKOUT
    // =========================================================

    const handleCheckout = () => {
        if (items.length === 0) {
            return;
        }

        navigate("/checkout");
    };

    // =========================================================
    // LOADING SCREEN
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f6f8f3]">

                <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
                    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                        <Link
                            to="/marketplace"
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 shadow-lg shadow-green-600/20">
                                <Leaf
                                    size={21}
                                    className="text-white"
                                />
                            </div>

                            <div>
                                <p className="text-xl font-extrabold tracking-tight text-gray-900">
                                    F2C
                                </p>

                                <p className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-green-600 sm:block">
                                    Farm to Customer
                                </p>
                            </div>
                        </Link>

                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

                    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

                        <div className="space-y-4">

                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="animate-pulse rounded-3xl border border-gray-100 bg-white p-5"
                                >
                                    <div className="flex gap-5">

                                        <div className="h-28 w-28 rounded-2xl bg-gray-200" />

                                        <div className="flex-1 space-y-4">

                                            <div className="h-4 w-24 rounded bg-gray-200" />

                                            <div className="h-6 w-48 rounded bg-gray-200" />

                                            <div className="h-4 w-32 rounded bg-gray-200" />

                                        </div>

                                    </div>
                                </div>
                            ))}

                        </div>

                        <div className="h-80 animate-pulse rounded-3xl bg-white p-7">
                            <div className="h-6 w-40 rounded bg-gray-200" />
                            <div className="mt-8 space-y-5">
                                <div className="h-4 rounded bg-gray-200" />
                                <div className="h-4 rounded bg-gray-200" />
                                <div className="h-12 rounded-xl bg-gray-200" />
                            </div>
                        </div>

                    </div>

                </main>
            </div>
        );
    }

    // =========================================================
    // ERROR SCREEN
    // =========================================================

    if (pageError && !cart) {
        return (
            <div className="min-h-screen bg-[#f6f8f3]">

                <header className="border-b border-gray-100 bg-white">
                    <div className="mx-auto flex h-20 max-w-7xl items-center px-4 sm:px-6 lg:px-8">

                        <Link
                            to="/marketplace"
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600">
                                <Leaf
                                    size={21}
                                    className="text-white"
                                />
                            </div>

                            <span className="text-xl font-extrabold">
                                F2C
                            </span>
                        </Link>

                    </div>
                </header>

                <main className="flex min-h-[70vh] items-center justify-center px-6">

                    <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                            <AlertCircle
                                size={30}
                                className="text-red-500"
                            />
                        </div>

                        <h1 className="mt-6 text-2xl font-bold text-gray-900">
                            Unable to load cart
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-gray-500">
                            {pageError}
                        </p>

                        <button
                            onClick={fetchCart}
                            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                        >
                            <RefreshCw size={17} />
                            Try Again
                        </button>

                    </div>

                </main>
            </div>
        );
    }

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="min-h-screen bg-[#f6f8f3] text-gray-900">

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">

                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* LOGO */}

                    <Link
                        to="/marketplace"
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 shadow-lg shadow-green-600/20">
                            <Leaf
                                size={21}
                                strokeWidth={2.5}
                                className="text-white"
                            />
                        </div>

                        <div>
                            <p className="text-xl font-extrabold tracking-tight text-gray-900">
                                F2C
                            </p>

                            <p className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-green-600 sm:block">
                                Farm to Customer
                            </p>
                        </div>
                    </Link>

                    {/* BACK */}

                    <Link
                        to="/marketplace"
                        className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-green-50 hover:text-green-700"
                    >
                        <ArrowLeft
                            size={17}
                            className="transition-transform group-hover:-translate-x-1"
                        />

                        <span className="hidden sm:inline">
                            Continue Shopping
                        </span>

                        <span className="sm:hidden">
                            Shopping
                        </span>
                    </Link>

                </div>

            </header>


            {/* ================================================= */}
            {/* MAIN */}
            {/* ================================================= */}

            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

                {/* PAGE INTRO */}

                <div className="mb-8">

                    <div className="flex items-center gap-2 text-sm text-gray-400">

                        <Link
                            to="/marketplace"
                            className="transition hover:text-green-600"
                        >
                            Marketplace
                        </Link>

                        <ChevronRight size={15} />

                        <span className="font-medium text-gray-700">
                            Cart
                        </span>

                    </div>

                    <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                        <div>

                            <div className="flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100">
                                    <ShoppingCart
                                        size={22}
                                        className="text-green-700"
                                    />
                                </div>

                                <div>

                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-600">
                                        Your basket
                                    </p>

                                    <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                                        Shopping Cart
                                    </h1>

                                </div>

                            </div>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                                Fresh products directly from local farmers,
                                delivered to your doorstep.
                            </p>

                        </div>

                        {items.length > 0 && (
                            <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
                                {items.length}{" "}
                                {items.length === 1 ? "item" : "items"}
                            </div>
                        )}

                    </div>

                </div>


                {/* PAGE ERROR */}

                {pageError && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">

                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />

                        <span className="flex-1">
                            {pageError}
                        </span>

                        <button
                            onClick={() => setPageError("")}
                            className="rounded-lg p-1 transition hover:bg-red-100"
                        >
                            <X size={16} />
                        </button>

                    </div>
                )}


                {/* ================================================= */}
                {/* EMPTY CART */}
                {/* ================================================= */}

                {items.length === 0 ? (

                    <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">

                        <div className="relative px-6 py-20 text-center sm:px-10">

                            <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-green-50 blur-3xl" />

                            <div className="relative">

                                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-green-50">
                                    <ShoppingCart
                                        size={40}
                                        strokeWidth={1.7}
                                        className="text-green-600"
                                    />
                                </div>

                                <h2 className="mt-7 text-2xl font-bold text-gray-900 sm:text-3xl">
                                    Your cart is empty
                                </h2>

                                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500 sm:text-base">
                                    Discover fresh vegetables, fruits,
                                    grains and other farm products directly
                                    from local farmers.
                                </p>

                                <Link
                                    to="/marketplace"
                                    className="mt-8 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-green-600/20 transition hover:-translate-y-0.5 hover:bg-green-700"
                                >
                                    Explore Products
                                    <ArrowRight size={18} />
                                </Link>

                            </div>

                        </div>

                        <div className="grid border-t border-gray-100 sm:grid-cols-3">

                            <div className="flex items-center justify-center gap-3 px-5 py-5 text-sm text-gray-600">

                                <Leaf
                                    size={18}
                                    className="text-green-600"
                                />

                                Farm Fresh

                            </div>

                            <div className="flex items-center justify-center gap-3 border-gray-100 px-5 py-5 text-sm text-gray-600 sm:border-x">

                                <Truck
                                    size={18}
                                    className="text-green-600"
                                />

                                Reliable Delivery

                            </div>

                            <div className="flex items-center justify-center gap-3 px-5 py-5 text-sm text-gray-600">

                                <ShieldCheck
                                    size={18}
                                    className="text-green-600"
                                />

                                Secure Checkout

                            </div>

                        </div>

                    </div>

                ) : (

                    /* ================================================= */
                    /* CART WITH ITEMS */
                    /* ================================================= */

                    <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">

                        {/* ================================================= */}
                        {/* CART ITEMS */}
                        {/* ================================================= */}

                        <section className="space-y-4">

                            {items.map((item) => {

                                const product = item?.product;

                                if (!product) {
                                    return null;
                                }

                                const productId = product._id;
                                const itemQuantity = Number(
                                    item.quantity || 1
                                );

                                const availableQuantity = Number(
                                    product.quantity || 0
                                );

                                const itemTotal =
                                    Number(product.price || 0) *
                                    itemQuantity;

                                const isUpdating =
                                    updatingProduct === productId;

                                const isRemoving =
                                    removingProduct === productId;

                                return (
                                    <article
                                        key={productId}
                                        className={`group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 sm:p-5 ${
                                            isRemoving
                                                ? "opacity-50"
                                                : "hover:-translate-y-0.5 hover:shadow-lg"
                                        }`}
                                    >

                                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                                            {/* IMAGE */}

                                            <Link
                                                to={`/product/${productId}`}
                                                className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-28 sm:w-28"
                                            >

                                                {product.images?.length > 0 ? (

                                                    <img
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                    />

                                                ) : (

                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <Leaf
                                                            size={34}
                                                            className="text-green-300"
                                                        />
                                                    </div>

                                                )}

                                                {product.isOrganic && (
                                                    <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-1 text-[10px] font-bold text-white shadow">
                                                        Organic
                                                    </span>
                                                )}

                                            </Link>


                                            {/* PRODUCT INFO */}

                                            <div className="min-w-0 flex-1">

                                                <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                                                    {product.category || "Farm Product"}
                                                </p>

                                                <Link
                                                    to={`/product/${productId}`}
                                                    className="mt-1 block text-lg font-bold text-gray-900 transition hover:text-green-700 sm:text-xl"
                                                >
                                                    {product.name}
                                                </Link>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    Farmer:{" "}
                                                    <span className="font-medium text-gray-700">
                                                        {product.farmer?.name ||
                                                            "Local Farmer"}
                                                    </span>
                                                </p>

                                                <div className="mt-2">

                                                    <span className="text-lg font-extrabold text-gray-900">
                                                        ₹
                                                        {Number(
                                                            product.price || 0
                                                        ).toFixed(2)}
                                                    </span>

                                                    <span className="ml-1 text-xs text-gray-500">
                                                        / {product.unit || "unit"}
                                                    </span>

                                                </div>

                                                {availableQuantity > 0 && (
                                                    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                                                        <Check
                                                            size={13}
                                                            className="text-green-600"
                                                        />
                                                        {availableQuantity}{" "}
                                                        {product.unit || "units"}{" "}
                                                        available
                                                    </p>
                                                )}

                                            </div>


                                            {/* QUANTITY */}

                                            <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end">

                                                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">

                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                productId,
                                                                itemQuantity - 1
                                                            )
                                                        }
                                                        disabled={
                                                            itemQuantity <= 1 ||
                                                            isUpdating
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-30"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus size={16} />
                                                    </button>

                                                    <span className="w-9 text-center text-sm font-bold text-gray-900">
                                                        {isUpdating ? (
                                                            <RefreshCw
                                                                size={15}
                                                                className="mx-auto animate-spin text-green-600"
                                                            />
                                                        ) : (
                                                            itemQuantity
                                                        )}
                                                    </span>

                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                productId,
                                                                itemQuantity + 1
                                                            )
                                                        }
                                                        disabled={
                                                            itemQuantity >=
                                                                availableQuantity ||
                                                            isUpdating
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-30"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus size={16} />
                                                    </button>

                                                </div>

                                                <div className="text-right">

                                                    <p className="text-lg font-black text-gray-900">
                                                        ₹
                                                        {itemTotal.toFixed(2)}
                                                    </p>

                                                    <button
                                                        onClick={() =>
                                                            setRemoveModal({
                                                                productId,
                                                                name: product.name
                                                            })
                                                        }
                                                        disabled={isRemoving}
                                                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 transition hover:text-red-700 disabled:opacity-50"
                                                    >
                                                        <Trash2 size={14} />
                                                        Remove
                                                    </button>

                                                </div>

                                            </div>

                                        </div>

                                    </article>
                                );
                            })}

                        </section>


                        {/* ================================================= */}
                        {/* ORDER SUMMARY */}
                        {/* ================================================= */}

                        <aside className="sticky top-24">

                            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

                                {/* SUMMARY HEADER */}

                                <div className="border-b border-gray-100 p-6">

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-green-600">
                                                Checkout
                                            </p>

                                            <h2 className="mt-1 text-xl font-bold text-gray-900">
                                                Order Summary
                                            </h2>

                                        </div>

                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                                            <ShoppingCart
                                                size={20}
                                                className="text-green-600"
                                            />
                                        </div>

                                    </div>

                                </div>


                                {/* SUMMARY BODY */}

                                <div className="p-6">

                                    <div className="space-y-4 text-sm">

                                        <div className="flex justify-between">

                                            <span className="text-gray-500">
                                                Items
                                            </span>

                                            <span className="font-semibold text-gray-900">
                                                {items.length}
                                            </span>

                                        </div>

                                        <div className="flex justify-between">

                                            <span className="text-gray-500">
                                                Subtotal
                                            </span>

                                            <span className="font-semibold text-gray-900">
                                                ₹{subtotal.toFixed(2)}
                                            </span>

                                        </div>

                                        <div className="flex justify-between">

                                            <span className="flex items-center gap-2 text-gray-500">
                                                <Truck size={15} />
                                                Delivery
                                            </span>

                                            <span
                                                className={`font-semibold ${
                                                    deliveryFee === 0
                                                        ? "text-green-600"
                                                        : "text-gray-900"
                                                }`}
                                            >
                                                {deliveryFee === 0
                                                    ? "FREE"
                                                    : `₹${deliveryFee}`}
                                            </span>

                                        </div>

                                    </div>


                                    {/* FREE DELIVERY PROGRESS */}

                                    <div className="mt-6 rounded-2xl bg-green-50 p-4">

                                        {subtotal >= 500 ? (

                                            <div className="flex items-start gap-3">

                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600">
                                                    <Check
                                                        size={15}
                                                        strokeWidth={3}
                                                        className="text-white"
                                                    />
                                                </div>

                                                <div>

                                                    <p className="text-sm font-bold text-green-800">
                                                        Free delivery unlocked!
                                                    </p>

                                                    <p className="mt-0.5 text-xs leading-5 text-green-700">
                                                        Your order qualifies for
                                                        free delivery.
                                                    </p>

                                                </div>

                                            </div>

                                        ) : (

                                            <div>

                                                <div className="flex items-center justify-between gap-3">

                                                    <p className="text-xs font-semibold text-green-800">
                                                        Add ₹
                                                        {remainingForFreeDelivery.toFixed(
                                                            0
                                                        )}{" "}
                                                        more
                                                    </p>

                                                    <span className="text-[10px] font-bold text-green-700">
                                                        FREE DELIVERY
                                                    </span>

                                                </div>

                                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-green-100">

                                                    <div
                                                        className="h-full rounded-full bg-green-600 transition-all"
                                                        style={{
                                                            width: `${Math.min(
                                                                (subtotal /
                                                                    500) *
                                                                    100,
                                                                100
                                                            )}%`
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                        )}

                                    </div>


                                    {/* TOTAL */}

                                    <div className="mt-6 border-t border-gray-100 pt-5">

                                        <div className="flex items-end justify-between">

                                            <div>

                                                <p className="text-sm text-gray-500">
                                                    Total amount
                                                </p>

                                                <p className="mt-1 text-2xl font-black text-gray-900">
                                                    ₹{total.toFixed(2)}
                                                </p>

                                            </div>

                                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                                                INR
                                            </span>

                                        </div>

                                    </div>


                                    {/* CHECKOUT */}

                                    <button
                                        type="button"
                                        onClick={handleCheckout}
                                        className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 py-4 font-bold text-white shadow-lg shadow-green-600/20 transition-all hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-xl active:translate-y-0"
                                    >
                                        Proceed to Checkout

                                        <ArrowRight
                                            size={18}
                                            className="transition-transform group-hover:translate-x-1"
                                        />
                                    </button>


                                    {/* SECURITY */}

                                    <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-gray-400">

                                        <ShieldCheck size={15} />

                                        Secure checkout powered by F2C

                                    </div>

                                </div>

                            </div>


                            {/* TRUST CARD */}

                            <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">
                                        <Leaf
                                            size={17}
                                            className="text-green-600"
                                        />
                                    </div>

                                    <div>

                                        <p className="text-sm font-semibold text-gray-900">
                                            Supporting local farmers
                                        </p>

                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Your purchase goes directly to
                                            the farming community.
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </aside>

                    </div>

                )}

            </main>


            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            <footer className="mt-10 border-t border-gray-100 bg-white">

                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">

                    <Link
                        to="/marketplace"
                        className="flex items-center gap-2.5"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600">
                            <Leaf
                                size={17}
                                className="text-white"
                            />
                        </div>

                        <div>

                            <p className="font-bold text-gray-900">
                                F2C
                            </p>

                            <p className="text-[10px] text-gray-400">
                                Farm to Customer
                            </p>

                        </div>

                    </Link>

                    <p className="text-center text-xs text-gray-400 sm:text-right">
                        Fresh food. Fair prices. Direct from farmers.
                    </p>

                </div>

            </footer>


            {/* ================================================= */}
            {/* REMOVE CONFIRMATION MODAL */}
            {/* ================================================= */}

            {removeModal && (

                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 px-4 backdrop-blur-sm">

                    <div
                        className="absolute inset-0"
                        onClick={() => {
                            if (!removingProduct) {
                                setRemoveModal(null);
                            }
                        }}
                    />

                    <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">

                        <button
                            onClick={() => setRemoveModal(null)}
                            disabled={!!removingProduct}
                            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>


                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                            <Trash2
                                size={24}
                                className="text-red-500"
                            />
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-gray-900">
                            Remove from cart?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-gray-800">
                                {removeModal.name}
                            </span>{" "}
                            from your cart?
                        </p>


                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                            <button
                                onClick={() => setRemoveModal(null)}
                                disabled={!!removingProduct}
                                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                Keep Item
                            </button>

                            <button
                                onClick={confirmRemove}
                                disabled={!!removingProduct}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {removingProduct ? (
                                    <>
                                        <RefreshCw
                                            size={16}
                                            className="animate-spin"
                                        />
                                        Removing...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Remove Item
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

export default Cart;