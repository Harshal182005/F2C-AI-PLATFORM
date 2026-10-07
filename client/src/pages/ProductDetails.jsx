import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Home,
    Leaf,
    Loader2,
    MapPin,
    Minus,
    Package,
    Phone,
    Plus,
    RefreshCw,
    ShieldCheck,
    ShoppingCart,
    Sprout,
    Star,
    User,
    Users,
    X,
} from "lucide-react";

import API from "../services/api";
import { useCart } from "../context/CartContext";

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { refreshCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);

    const [addingToCart, setAddingToCart] = useState(false);
    const [cartMessage, setCartMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const fetchProduct = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await API.get(`/products/${id}`);

           const fetchedProduct = response.data?.product || response.data;

setProduct(fetchedProduct);
            setSelectedImage(0);
            setQuantity(1);
        } catch (error) {
            console.error("Fetch product error:", error);

            setError(
                error.response?.data?.message ||
                    "Unable to load product. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const images = product?.images?.filter(Boolean) || [];

    const availableQuantity = Number(product?.quantity || 0);
    const productPrice = Number(product?.price || 0);

    const totalPrice = productPrice * quantity;

    const increaseQuantity = () => {
        if (quantity < availableQuantity) {
            setQuantity((previous) => previous + 1);
        }
    };

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity((previous) => previous - 1);
        }
    };

    const handleAddToCart = async () => {
        if (!product) return;

        try {
            setAddingToCart(true);
            setCartMessage("");
            setMessageType("");

            const token = localStorage.getItem("customerToken");

            if (!token) {
                setMessageType("error");
                setCartMessage(
                    "Please login as a customer first."
                );

                setTimeout(() => {
                    navigate("/login");
                }, 1200);

                return;
            }

            if (availableQuantity <= 0) {
                setMessageType("error");
                setCartMessage("This product is currently out of stock.");
                return;
            }

            const response = await API.post(
                "/cart/add",
                {
                    productId: product._id,
                    quantity,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            await refreshCart();

            setMessageType("success");
            setCartMessage(
                response.data?.message ||
                    "Product added to your cart successfully."
            );
        } catch (error) {
            console.error("Add to cart error:", error);

            if (error.response?.status === 401) {
                setMessageType("error");
                setCartMessage(
                    "Your session has expired. Please login again."
                );

                localStorage.removeItem("customerToken");
            } else {
                setMessageType("error");
                setCartMessage(
                    error.response?.data?.message ||
                        "Failed to add product to cart."
                );
            }
        } finally {
            setAddingToCart(false);
        }
    };

    const handlePreviousImage = () => {
        if (images.length === 0) return;

        setSelectedImage((previous) =>
            previous === 0 ? images.length - 1 : previous - 1
        );
    };

    const handleNextImage = () => {
        if (images.length === 0) return;

        setSelectedImage((previous) =>
            previous === images.length - 1 ? 0 : previous + 1
        );
    };

    const formatPrice = (price) => {
        return Number(price || 0).toLocaleString("en-IN");
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f6f8f3]">
                <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
                    <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-white">
                                <Sprout size={23} />
                            </div>

                            <div>
                                <p className="text-xl font-black text-gray-900">
                                    F2C
                                </p>

                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-green-600">
                                    Farm to Customer
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-2">
                        <div>
                            <div className="h-[420px] animate-pulse rounded-3xl bg-gray-200 sm:h-[500px]" />

                            <div className="mt-5 flex gap-3">
                                {[1, 2, 3, 4].map((item) => (
                                    <div
                                        key={item}
                                        className="h-20 w-20 animate-pulse rounded-xl bg-gray-200"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6 py-4">
                            <div className="h-8 w-32 animate-pulse rounded-full bg-gray-200" />

                            <div className="h-14 w-4/5 animate-pulse rounded-xl bg-gray-200" />

                            <div className="h-10 w-1/3 animate-pulse rounded-xl bg-gray-200" />

                            <div className="space-y-3">
                                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                                <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
                                <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200" />
                            </div>

                            <div className="h-20 animate-pulse rounded-2xl bg-gray-200" />

                            <div className="h-14 animate-pulse rounded-2xl bg-gray-200" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ============================================================
    // ERROR
    // ============================================================

    if (error || !product) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f6f8f3] px-4">
                <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500">
                        <Package size={34} />
                    </div>

                    <h1 className="mt-6 text-2xl font-black text-gray-900">
                        Product unavailable
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                        {error || "This product could not be found."}
                    </p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={() => fetchProduct()}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                        >
                            <RefreshCw size={17} />
                            Try Again
                        </button>

                        <button
                            onClick={() => navigate("/marketplace")}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
                        >
                            Marketplace
                            <ArrowRight size={17} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isOutOfStock = availableQuantity <= 0;
    const isLowStock =
        availableQuantity > 0 && availableQuantity <= 5;

    return (
        <div className="min-h-screen bg-[#f6f8f3] text-gray-900">
            {/* =====================================================
                NAVBAR
            ====================================================== */}

            <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
                <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* LOGO */}

                    <button
                        onClick={() => navigate("/marketplace")}
                        className="group flex items-center gap-3"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-600/20 transition group-hover:scale-105">
                            <Sprout size={23} />
                        </div>

                        <div className="text-left">
                            <h1 className="text-xl font-black tracking-tight text-gray-900">
                                F2C
                            </h1>

                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-green-600">
                                Farm to Customer
                            </p>
                        </div>
                    </button>

                    {/* DESKTOP ACTIONS */}

                    <div className="hidden items-center gap-3 sm:flex">
                        <button
                            onClick={() =>
                                navigate("/marketplace")
                            }
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-green-50 hover:text-green-700"
                        >
                            <ArrowLeft size={17} />
                            Marketplace
                        </button>

                        <button
                            onClick={() => navigate("/cart")}
                            className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-600"
                        >
                            <ShoppingCart size={17} />
                            Cart
                        </button>
                    </div>

                    {/* MOBILE CART */}

                    <button
                        onClick={() => navigate("/cart")}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-700 transition hover:bg-green-50 hover:text-green-600 sm:hidden"
                    >
                        <ShoppingCart size={20} />
                    </button>
                </div>
            </header>

            {/* =====================================================
                MAIN
            ====================================================== */}

            <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
                {/* BREADCRUMB */}

                <div className="mb-7 flex items-center gap-2 overflow-hidden text-xs font-medium text-gray-400 sm:text-sm">
                    <button
                        onClick={() => navigate("/marketplace")}
                        className="flex shrink-0 items-center gap-1.5 transition hover:text-green-600"
                    >
                        <Home size={14} />
                        Marketplace
                    </button>

                    <span>/</span>

                    <span className="shrink-0">
                        {product.category || "Product"}
                    </span>

                    <span>/</span>

                    <span className="truncate font-semibold text-gray-700">
                        {product.name}
                    </span>
                </div>

                {/* =================================================
                    PRODUCT SECTION
                ================================================== */}

                <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
                    {/* =================================================
                        IMAGE GALLERY
                    ================================================== */}

                    <div>
                        <div className="relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
                            <div className="relative aspect-square max-h-[600px] w-full overflow-hidden bg-gray-100 sm:aspect-[4/3]">
                                {images.length > 0 ? (
                                    <>
                                        <img
                                            src={
                                                images[
                                                    selectedImage
                                                ]
                                            }
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display =
                                                    "none";
                                            }}
                                        />

                                        {/* IMAGE NAVIGATION */}

                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={
                                                        handlePreviousImage
                                                    }
                                                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg backdrop-blur transition hover:bg-white"
                                                    aria-label="Previous image"
                                                >
                                                    <ChevronLeft
                                                        size={20}
                                                    />
                                                </button>

                                                <button
                                                    onClick={
                                                        handleNextImage
                                                    }
                                                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg backdrop-blur transition hover:bg-white"
                                                    aria-label="Next image"
                                                >
                                                    <ChevronRight
                                                        size={20}
                                                    />
                                                </button>
                                            </>
                                        )}

                                        {/* IMAGE COUNTER */}

                                        {images.length > 1 && (
                                            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                                                {selectedImage + 1} /{" "}
                                                {images.length}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-green-50 to-lime-100 text-green-600">
                                        <Sprout size={60} />
                                        <p className="mt-3 text-sm font-semibold">
                                            No image available
                                        </p>
                                    </div>
                                )}

                                {/* ORGANIC */}

                                {product.isOrganic && (
                                    <div className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg">
                                        <Leaf size={14} />
                                        Certified Organic
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* THUMBNAILS */}

                        {images.length > 0 && (
                            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                                {images.map((image, index) => (
                                    <button
                                        key={`${image}-${index}`}
                                        onClick={() =>
                                            setSelectedImage(
                                                index
                                            )
                                        }
                                        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition ${
                                            selectedImage === index
                                                ? "border-green-600 shadow-md"
                                                : "border-transparent hover:border-gray-300"
                                        }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`${product.name} ${
                                                index + 1
                                            }`}
                                            className="h-full w-full object-cover"
                                        />

                                        {selectedImage ===
                                            index && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-green-600/10">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
                                                    <Check
                                                        size={14}
                                                        strokeWidth={
                                                            3
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* TRUST STRIP */}

                        <div className="mt-5 grid grid-cols-3 gap-2">
                            <div className="rounded-2xl border border-gray-100 bg-white p-3 text-center">
                                <Leaf
                                    size={18}
                                    className="mx-auto text-green-600"
                                />

                                <p className="mt-1.5 text-[10px] font-bold text-gray-600 sm:text-xs">
                                    Farm Fresh
                                </p>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-white p-3 text-center">
                                <ShieldCheck
                                    size={18}
                                    className="mx-auto text-green-600"
                                />

                                <p className="mt-1.5 text-[10px] font-bold text-gray-600 sm:text-xs">
                                    Quality
                                </p>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-white p-3 text-center">
                                <Users
                                    size={18}
                                    className="mx-auto text-green-600"
                                />

                                <p className="mt-1.5 text-[10px] font-bold text-gray-600 sm:text-xs">
                                    Direct Farmer
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        PRODUCT INFORMATION
                    ================================================== */}

                    <div className="flex flex-col">
                        {/* CATEGORY */}

                        <div className="flex flex-wrap items-center gap-2">
                            {product.category && (
                                <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-green-700">
                                    {product.category}
                                </span>
                            )}

                            {product.isOrganic && (
                                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
                                    <Leaf size={14} />
                                    Organic
                                </span>
                            )}
                        </div>

                        {/* PRODUCT NAME */}

                        <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-gray-950 sm:text-5xl">
                            {product.name}
                        </h1>

                        {/* RATING */}

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={17}
                                        className="fill-yellow-400 text-yellow-400"
                                    />
                                ))}
                            </div>

                            <span className="text-sm font-bold text-gray-700">
                                4.8
                            </span>

                            <span className="text-sm text-gray-400">
                                (24 reviews)
                            </span>
                        </div>

                        {/* PRICE */}

                        <div className="mt-7 flex items-baseline gap-2">
                            <span className="text-4xl font-black tracking-tight text-green-700">
                                ₹{formatPrice(productPrice)}
                            </span>

                            <span className="text-sm font-medium text-gray-500">
                                / {product.unit || "unit"}
                            </span>
                        </div>

                        {/* DESCRIPTION */}

                        <div className="mt-7">
                            <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-gray-900">
                                About this product
                            </h2>

                            <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
                                {product.description ||
                                    "Fresh quality farm product directly sourced from the farmer."}
                            </p>
                        </div>

                        {/* STOCK */}

                        <div className="mt-7 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                            isOutOfStock
                                                ? "bg-red-50 text-red-500"
                                                : "bg-green-50 text-green-600"
                                        }`}
                                    >
                                        <Package size={19} />
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Stock status
                                        </p>

                                        <p
                                            className={`text-sm font-bold ${
                                                isOutOfStock
                                                    ? "text-red-600"
                                                    : isLowStock
                                                    ? "text-orange-600"
                                                    : "text-green-700"
                                            }`}
                                        >
                                            {isOutOfStock
                                                ? "Out of stock"
                                                : isLowStock
                                                ? `Only ${availableQuantity} ${product.unit || "units"} left`
                                                : "In stock"}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs text-gray-400">
                                        Available
                                    </p>

                                    <p className="text-sm font-black text-gray-900">
                                        {availableQuantity}{" "}
                                        {product.unit || "units"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* QUANTITY */}

                        {!isOutOfStock && (
                            <div className="mt-6">
                                <p className="mb-3 text-sm font-extrabold text-gray-900">
                                    Quantity
                                </p>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white">
                                        <button
                                            onClick={
                                                decreaseQuantity
                                            }
                                            disabled={quantity <= 1}
                                            className="flex h-12 w-12 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <Minus size={17} />
                                        </button>

                                        <div className="flex h-12 w-14 items-center justify-center border-x border-gray-200 text-sm font-black text-gray-900">
                                            {quantity}
                                        </div>

                                        <button
                                            onClick={
                                                increaseQuantity
                                            }
                                            disabled={
                                                quantity >=
                                                availableQuantity
                                            }
                                            className="flex h-12 w-12 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <Plus size={17} />
                                        </button>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">
                                            Total
                                        </p>

                                        <p className="text-xl font-black text-gray-950">
                                            ₹
                                            {formatPrice(
                                                totalPrice
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ADD TO CART */}

                        <button
                            onClick={handleAddToCart}
                            disabled={
                                addingToCart || isOutOfStock
                            }
                            className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-green-600 py-4 text-base font-extrabold text-white shadow-xl shadow-green-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                        >
                            {addingToCart ? (
                                <>
                                    <Loader2
                                        size={20}
                                        className="animate-spin"
                                    />
                                    Adding to cart...
                                </>
                            ) : isOutOfStock ? (
                                <>
                                    <X size={20} />
                                    Out of Stock
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={20} />
                                    Add to Cart
                                </>
                            )}
                        </button>

                        {/* CART MESSAGE */}

                        {cartMessage && (
                            <div
                                className={`mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                                    messageType === "success"
                                        ? "bg-green-50 text-green-700"
                                        : "bg-red-50 text-red-600"
                                }`}
                            >
                                {messageType === "success" ? (
                                    <CheckCircle2 size={17} />
                                ) : (
                                    <X size={17} />
                                )}

                                <span>{cartMessage}</span>
                            </div>
                        )}

                        {/* SECURITY INFO */}

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5">
                                <ShieldCheck
                                    size={19}
                                    className="shrink-0 text-green-600"
                                />

                                <div>
                                    <p className="text-xs font-bold text-gray-800">
                                        Trusted sourcing
                                    </p>

                                    <p className="text-[10px] text-gray-400">
                                        Direct farmer marketplace
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5">
                                <CheckCircle2
                                    size={19}
                                    className="shrink-0 text-green-600"
                                />

                                <div>
                                    <p className="text-xs font-bold text-gray-800">
                                        Fresh products
                                    </p>

                                    <p className="text-[10px] text-gray-400">
                                        Quality-focused sellers
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =================================================
                    FARMER SECTION
                ================================================== */}

                <section className="mt-16">
                    <div className="mb-6">
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-600">
                            Meet your seller
                        </p>

                        <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                            Meet the Farmer
                        </h2>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                        <div className="p-6 sm:p-8">
                            <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
                                {/* FARMER */}

                                <div className="flex items-center gap-4 sm:gap-5">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700 sm:h-20 sm:w-20">
                                        <User size={34} />
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-xl font-black text-gray-900">
                                                {product.farmer
                                                    ?.name ||
                                                    "Local Farmer"}
                                            </h3>

                                            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">
                                                <CheckCircle2
                                                    size={12}
                                                />
                                                Verified
                                            </span>
                                        </div>

                                        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
                                            <Sprout
                                                size={15}
                                                className="text-green-600"
                                            />
                                            Local farm partner
                                        </p>
                                    </div>
                                </div>

                                {/* FARMER DETAILS */}

                                <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2 md:min-w-[420px]">
                                    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                                        <MapPin
                                            size={18}
                                            className="mt-0.5 shrink-0 text-green-600"
                                        />

                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                                Farm Location
                                            </p>

                                            <p className="mt-1 font-semibold text-gray-700">
                                                {product.location ||
                                                    product.farmer
                                                        ?.address ||
                                                    "Local Farm"}
                                            </p>
                                        </div>
                                    </div>

                                    {product.farmer?.phone && (
                                        <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                                            <Phone
                                                size={18}
                                                className="mt-0.5 shrink-0 text-green-600"
                                            />

                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                                    Contact
                                                </p>

                                                <p className="mt-1 font-semibold text-gray-700">
                                                    {
                                                        product
                                                            .farmer
                                                            .phone
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 bg-green-50/50 px-6 py-4 sm:px-8">
                            <div className="flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck
                                        size={15}
                                        className="text-green-600"
                                    />
                                    Your purchase directly supports
                                    local farming.
                                </div>

                                <button
                                    onClick={() =>
                                        navigate("/marketplace")
                                    }
                                    className="flex items-center gap-1 font-bold text-green-700 transition hover:text-green-800"
                                >
                                    Continue shopping
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =================================================
                    BOTTOM CTA
                ================================================== */}

                <section className="mt-12">
                    <div className="relative overflow-hidden rounded-3xl bg-gray-950 px-6 py-8 text-white sm:px-8">
                        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-green-600/20 blur-3xl" />

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-green-400">
                                    <Leaf size={17} />

                                    <span className="text-xs font-extrabold uppercase tracking-[0.15em]">
                                        F2C Marketplace
                                    </span>
                                </div>

                                <h3 className="mt-2 text-xl font-black sm:text-2xl">
                                    Fresh products, directly from
                                    farmers.
                                </h3>
                            </div>

                            <button
                                onClick={() =>
                                    navigate("/marketplace")
                                }
                                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-500"
                            >
                                Explore More
                                <ArrowRight size={17} />
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* =====================================================
                FOOTER
            ====================================================== */}

            <footer className="mt-12 border-t border-gray-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
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

                    <p className="text-xs text-gray-400">
                        Fresh food. Fair prices. Direct from farmers.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default ProductDetails;