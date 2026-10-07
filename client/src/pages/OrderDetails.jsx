import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    MapPin,
    Package,
    RefreshCw,
    Truck,
    XCircle,
    CreditCard,
    Phone,
    ShoppingBag,
    Leaf
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import API from "../services/api";
import socket from "../services/socket";


const STATUS_STEPS = [
    {
        status: "PLACED",
        label: "Order Placed",
        description: "Your order has been placed successfully.",
        icon: ShoppingBag
    },
    {
        status: "CONFIRMED",
        label: "Confirmed",
        description: "Farmer has confirmed your order.",
        icon: CheckCircle2
    },
    {
        status: "PROCESSING",
        label: "Processing",
        description: "Your products are being prepared.",
        icon: Package
    },
    {
        status: "PACKED",
        label: "Packed",
        description: "Your order has been packed.",
        icon: Package
    },
    {
        status: "OUT_FOR_DELIVERY",
        label: "Out for Delivery",
        description: "Your order is on its way.",
        icon: Truck
    },
    {
        status: "DELIVERED",
        label: "Delivered",
        description: "Your order has been delivered.",
        icon: CheckCircle2
    }
];


const STATUS_ORDER = [
    "PLACED",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "OUT_FOR_DELIVERY",
    "DELIVERED"
];


const getStatusIndex = (status) => {
    return STATUS_ORDER.indexOf(status);
};


const formatStatus = (status = "") => {
    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
};


const formatDate = (date) => {
    if (!date) {
        return "N/A";
    }

    return new Date(date).toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
};


const getStatusHistoryEntry = (
    history = [],
    status
) => {
    return history.find(
        (item) => item.status === status
    );
};


const getImageUrl = (image) => {
    if (!image) {
        return "";
    }

    if (
        typeof image !== "string"
    ) {
        return "";
    }

    // Handles accidentally saved Markdown-style
    // Cloudinary URLs:
    //
    // [https://example.com/image.jpg](https://example.com/image.jpg)

    const markdownMatch = image.match(
        /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/
    );

    if (markdownMatch?.[2]) {
        return markdownMatch[2];
    }

    return image;
};


function OrderDetails() {

    const { id } = useParams();

    const navigate = useNavigate();


    const [order, setOrder] = useState(null);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [cancelling, setCancelling] = useState(false);

    const [error, setError] = useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    const [socketConnected, setSocketConnected] =
        useState(false);


    const token =
        localStorage.getItem("customerToken");


    // ==========================================
    // FETCH ORDER
    // ==========================================

    const fetchOrder = useCallback(
        async (showLoader = true) => {

            try {

                if (showLoader) {
                    setLoading(true);
                }

                setError("");

                const response =
                    await API.get(
                        `/orders/${id}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                if (response.data?.order) {

                    setOrder(
                        response.data.order
                    );
                }

            } catch (error) {

                console.error(
                    "ORDER DETAILS ERROR:",
                    error
                );

                if (
                    error.response?.status ===
                        401 ||
                    error.response?.status ===
                        403
                ) {

                    localStorage.removeItem(
                        "customerToken"
                    );

                    localStorage.removeItem(
                        "customerUser"
                    );

                    navigate("/login");

                    return;
                }

                setError(
                    error.response?.data?.message ||
                    "Unable to load order details."
                );

            } finally {

                if (showLoader) {
                    setLoading(false);
                }
            }

        },
        [id, token, navigate]
    );


    // ==========================================
    // INITIAL ORDER FETCH
    // ==========================================

    useEffect(() => {

        fetchOrder();

    }, [fetchOrder]);


    // ==========================================
    // SOCKET.IO CONNECTION
    // ==========================================

    useEffect(() => {

        if (!id) {
            return;
        }


        const handleConnect = () => {

            console.log(
                "SOCKET CONNECTED:",
                socket.id
            );

            setSocketConnected(true);

            socket.emit(
                "joinOrder",
                id
            );

            console.log(
                "JOINED ORDER ROOM:",
                `order_${id}`
            );
        };


        const handleDisconnect = () => {

            console.log(
                "SOCKET DISCONNECTED"
            );

            setSocketConnected(false);
        };


        const handleConnectError = (
            socketError
        ) => {

            console.error(
                "SOCKET CONNECTION ERROR:",
                socketError.message
            );

            setSocketConnected(false);
        };


        socket.on(
            "connect",
            handleConnect
        );

        socket.on(
            "disconnect",
            handleDisconnect
        );

        socket.on(
            "connect_error",
            handleConnectError
        );


        if (!socket.connected) {
            socket.connect();
        } else {
            handleConnect();
        }


        return () => {

            socket.emit(
                "leaveOrder",
                id
            );

            socket.off(
                "connect",
                handleConnect
            );

            socket.off(
                "disconnect",
                handleDisconnect
            );

            socket.off(
                "connect_error",
                handleConnectError
            );

            socket.disconnect();

        };

    }, [id]);


    // ==========================================
    // REAL-TIME ORDER STATUS UPDATE
    // ==========================================

    useEffect(() => {

        const handleOrderStatusUpdated = (
            updatedOrder
        ) => {

            console.log(
                "REAL-TIME ORDER UPDATE:",
                updatedOrder
            );


            if (!updatedOrder) {
                return;
            }


            // Make sure the received update
            // belongs to the currently opened order.

            const updatedOrderId =
                updatedOrder._id ||
                updatedOrder.id;


            if (
                updatedOrderId &&
                String(updatedOrderId) !==
                    String(id)
            ) {
                return;
            }


            setOrder(
                updatedOrder
            );


            setSuccessMessage(
                `Order status updated to ${formatStatus(
                    updatedOrder.orderStatus
                )}.`
            );


            // Automatically hide the message
            // after a few seconds.

            setTimeout(() => {

                setSuccessMessage("");

            }, 4000);

        };


        socket.on(
            "orderStatusUpdated",
            handleOrderStatusUpdated
        );


        return () => {

            socket.off(
                "orderStatusUpdated",
                handleOrderStatusUpdated
            );

        };

    }, [id]);


    // ==========================================
    // FALLBACK POLLING
    // ==========================================

    useEffect(() => {

        if (!id) {
            return;
        }


        const intervalId =
            setInterval(() => {

                fetchOrder(false);

            }, 5000);


        return () => {

            clearInterval(
                intervalId
            );

        };

    }, [id, fetchOrder]);


    // ==========================================
    // MANUAL REFRESH
    // ==========================================

    const handleRefresh = async () => {

        try {

            setRefreshing(true);

            await fetchOrder(false);

        } finally {

            setRefreshing(false);

        }
    };


    // ==========================================
    // CANCEL ORDER
    // ==========================================

    const cancelOrder = async () => {

        const confirmed =
            window.confirm(
                "Are you sure you want to cancel this order?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setCancelling(true);

            setError("");

            setSuccessMessage("");


            const response =
                await API.put(
                    `/orders/cancel/${id}`,
                    {},
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            if (response.data?.order) {

                setOrder(
                    response.data.order
                );
            }


            setSuccessMessage(
                response.data?.message ||
                "Order cancelled successfully."
            );

        } catch (error) {

            console.error(
                "CANCEL ORDER ERROR:",
                error
            );


            if (
                error.response?.status ===
                    401 ||
                error.response?.status ===
                    403
            ) {

                localStorage.removeItem(
                    "customerToken"
                );

                localStorage.removeItem(
                    "customerUser"
                );

                navigate("/login");

                return;
            }


            setError(
                error.response?.data?.message ||
                "Unable to cancel the order."
            );

        } finally {

            setCancelling(false);

        }
    };


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">

                <div className="text-center">

                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />

                    <p className="text-slate-600 font-medium">
                        Loading order details...
                    </p>

                </div>

            </div>
        );
    }


    // ==========================================
    // ORDER NOT FOUND
    // ==========================================

    if (!order) {

        return (
            <div className="min-h-screen bg-slate-50">

                <header className="bg-white border-b border-slate-200">

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

                        <button
                            onClick={() =>
                                navigate("/orders")
                            }
                            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition"
                        >
                            <ArrowLeft
                                size={18}
                            />

                            Back to Orders
                        </button>

                    </div>

                </header>


                <div className="max-w-3xl mx-auto px-4 py-20 text-center">

                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">

                        <XCircle
                            className="text-red-500"
                            size={40}
                        />

                    </div>


                    <h1 className="text-2xl font-bold text-slate-900 mb-3">
                        Order Not Found
                    </h1>


                    <p className="text-slate-500 mb-8">
                        {error ||
                            "We couldn't find this order."}
                    </p>


                    <button
                        onClick={() =>
                            navigate("/orders")
                        }
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                    >
                        <ArrowLeft
                            size={18}
                        />

                        Back to Orders
                    </button>

                </div>

            </div>
        );
    }


    // ==========================================
    // ORDER DATA
    // ==========================================

    const currentStatus =
        order.orderStatus || "PLACED";


    const currentStatusIndex =
        getStatusIndex(
            currentStatus
        );


    const isCancelled =
        currentStatus ===
        "CANCELLED";


    const canCancel =
        currentStatus ===
            "PLACED" ||
        currentStatus ===
            "CONFIRMED";


    const history =
        order.statusHistory || [];


    const displayOrderNumber =
        order._id
            ? order._id.slice(-8).toUpperCase()
            : "N/A";


    const paymentMethod =
        order.paymentMethod ||
        "COD";


    const paymentStatus =
        order.paymentStatus ||
        "PENDING";


    const subtotal =
        Number(order.subtotal || 0);


    const deliveryFee =
        Number(order.deliveryFee || 0);


    const totalAmount =
        Number(order.totalAmount || 0);


    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="h-18 min-h-[72px] flex items-center justify-between gap-4">

                        <button
                            onClick={() =>
                                navigate("/orders")
                            }
                            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-medium transition"
                        >
                            <ArrowLeft
                                size={18}
                            />

                            <span className="hidden sm:inline">
                                My Orders
                            </span>
                        </button>


                        <div className="flex items-center gap-3">

                            <div className="hidden sm:block text-right">

                                <p className="text-xs text-slate-400">
                                    Order
                                </p>

                                <p className="font-bold text-slate-900">
                                    #{displayOrderNumber}
                                </p>

                            </div>


                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition disabled:opacity-50"
                                title="Refresh order"
                            >
                                <RefreshCw
                                    size={18}
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />
                            </button>


                            <button
                                onClick={() =>
                                    navigate(
                                        "/marketplace"
                                    )
                                }
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                            >
                                Continue Shopping
                            </button>

                        </div>

                    </div>

                </div>

            </header>


            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ================================= */}
                {/* ERROR */}
                {/* ================================= */}

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">

                        <XCircle
                            className="text-red-500 shrink-0 mt-0.5"
                            size={20}
                        />

                        <p className="text-red-700 font-medium">
                            {error}
                        </p>

                    </div>
                )}


                {/* ================================= */}
                {/* SUCCESS / REAL-TIME UPDATE */}
                {/* ================================= */}

                {successMessage && (
                    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-3">

                        <CheckCircle2
                            className="text-emerald-600 shrink-0"
                            size={20}
                        />

                        <p className="text-emerald-700 font-medium">
                            {successMessage}
                        </p>

                    </div>
                )}


                {/* ================================= */}
                {/* LIVE CONNECTION INDICATOR */}
                {/* ================================= */}

                <div className="mb-5 flex items-center justify-end">

                    <div className="flex items-center gap-2 text-xs font-medium">

                        <span
                            className={`w-2 h-2 rounded-full ${
                                socketConnected
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-slate-300"
                            }`}
                        />

                        <span
                            className={
                                socketConnected
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                            }
                        >
                            {socketConnected
                                ? "Live tracking connected"
                                : "Connecting to live tracking..."}
                        </span>

                    </div>

                </div>


                {/* ================================= */}
                {/* HERO STATUS */}
                {/* ================================= */}

                {!isCancelled ? (

                    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white p-6 sm:p-8 lg:p-10 mb-8 shadow-xl shadow-emerald-900/10">

                        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10 blur-2xl" />

                        <div className="absolute -left-20 -bottom-24 w-72 h-72 rounded-full bg-teal-400/10 blur-3xl" />


                        <div className="relative">

                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

                                <div>

                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-sm font-medium mb-5">

                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />

                                        Live Order Tracking

                                    </div>


                                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                                        {formatStatus(
                                            currentStatus
                                        )}
                                    </h1>


                                    <p className="text-emerald-50 max-w-xl text-sm sm:text-base">
                                        {STATUS_STEPS[
                                            currentStatusIndex
                                        ]?.description ||
                                            "Your order is being processed."}
                                    </p>

                                </div>


                                <div className="flex items-center gap-4">

                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">

                                        {(() => {

                                            const CurrentIcon =
                                                STATUS_STEPS[
                                                    currentStatusIndex
                                                ]?.icon ||
                                                Package;

                                            return (
                                                <CurrentIcon
                                                    size={
                                                        36
                                                    }
                                                    strokeWidth={
                                                        1.8
                                                    }
                                                />
                                            );

                                        })()}

                                    </div>

                                </div>

                            </div>

                        </div>

                    </section>

                ) : (

                    <section className="rounded-3xl bg-white border border-red-200 p-6 sm:p-8 lg:p-10 mb-8 shadow-sm">

                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

                            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">

                                <XCircle
                                    size={34}
                                    className="text-red-500"
                                />

                            </div>


                            <div>

                                <p className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-1">
                                    Order Cancelled
                                </p>

                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    This order has been cancelled
                                </h1>

                                <p className="text-slate-500">
                                    The order will no longer be processed or delivered.
                                </p>

                            </div>

                        </div>

                    </section>

                )}


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ================================= */}
                    {/* LEFT CONTENT */}
                    {/* ================================= */}

                    <div className="lg:col-span-2 space-y-8">


                        {/* ================================= */}
                        {/* ORDER TIMELINE */}
                        {/* ================================= */}

                        {!isCancelled && (

                            <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">

                                <div className="flex items-center justify-between mb-8">

                                    <div>

                                        <h2 className="text-xl font-bold text-slate-900">
                                            Order Status
                                        </h2>

                                        <p className="text-sm text-slate-500 mt-1">
                                            Follow your order journey
                                        </p>

                                    </div>


                                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">

                                        <Clock3
                                            size={15}
                                        />

                                        Updated live

                                    </div>

                                </div>


                                <div className="relative">

                                    {STATUS_STEPS.map(
                                        (
                                            step,
                                            index
                                        ) => {

                                            const stepIndex =
                                                index;

                                            const completed =
                                                stepIndex <=
                                                currentStatusIndex;

                                            const active =
                                                step.status ===
                                                currentStatus;


                                            const historyEntry =
                                                getStatusHistoryEntry(
                                                    history,
                                                    step.status
                                                );


                                            const StepIcon =
                                                step.icon;


                                            return (
                                                <div
                                                    key={
                                                        step.status
                                                    }
                                                    className="relative flex gap-4 sm:gap-5 pb-8 last:pb-0"
                                                >

                                                    {index <
                                                        STATUS_STEPS.length -
                                                            1 && (
                                                        <div
                                                            className={`absolute left-[19px] top-10 w-0.5 h-[calc(100%-20px)] ${
                                                                completed &&
                                                                stepIndex <
                                                                    currentStatusIndex
                                                                    ? "bg-emerald-500"
                                                                    : "bg-slate-200"
                                                            }`}
                                                        />
                                                    )}


                                                    <div
                                                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
                                                            completed
                                                                ? "bg-emerald-600 border-emerald-600 text-white"
                                                                : "bg-white border-slate-200 text-slate-400"
                                                        }`}
                                                    >

                                                        <StepIcon
                                                            size={
                                                                18
                                                            }
                                                        />

                                                    </div>


                                                    <div className="min-w-0 flex-1 pt-1">

                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">

                                                            <div>

                                                                <h3
                                                                    className={`font-semibold ${
                                                                        completed
                                                                            ? "text-slate-900"
                                                                            : "text-slate-400"
                                                                    }`}
                                                                >
                                                                    {
                                                                        step.label
                                                                    }

                                                                </h3>


                                                                <p
                                                                    className={`text-sm mt-1 ${
                                                                        completed
                                                                            ? "text-slate-500"
                                                                            : "text-slate-400"
                                                                    }`}
                                                                >
                                                                    {
                                                                        step.description
                                                                    }
                                                                </p>

                                                            </div>


                                                            {historyEntry && (

                                                                <span className="text-xs text-slate-400 sm:text-right shrink-0">

                                                                    {formatDate(
                                                                        historyEntry.updatedAt
                                                                    )}

                                                                </span>

                                                            )}

                                                        </div>


                                                        {active && (

                                                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">

                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />

                                                                Current Status

                                                            </div>

                                                        )}

                                                    </div>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                            </section>

                        )}


                        {/* ================================= */}
                        {/* ORDERED PRODUCTS */}
                        {/* ================================= */}

                        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">

                            <div className="flex items-center justify-between mb-6">

                                <div>

                                    <h2 className="text-xl font-bold text-slate-900">
                                        Ordered Products
                                    </h2>

                                    <p className="text-sm text-slate-500 mt-1">
                                        {order.items?.length ||
                                            0}{" "}
                                        item
                                        {order.items?.length ===
                                        1
                                            ? ""
                                            : "s"}{" "}
                                        in this order
                                    </p>

                                </div>


                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">

                                    <ShoppingBag
                                        size={19}
                                        className="text-emerald-600"
                                    />

                                </div>

                            </div>


                            <div className="divide-y divide-slate-100">

                                {order.items?.map(
                                    (
                                        item,
                                        index
                                    ) => {

                                        const imageUrl =
                                            getImageUrl(
                                                item.image
                                            );


                                        return (
                                            <div
                                                key={
                                                    `${item.product}-${index}`
                                                }
                                                className="py-5 first:pt-0 last:pb-0"
                                            >

                                                <div className="flex gap-4">

                                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">

                                                        {imageUrl ? (

                                                            <img
                                                                src={
                                                                    imageUrl
                                                                }
                                                                alt={
                                                                    item.productName
                                                                }
                                                                className="w-full h-full object-cover"
                                                                onError={(
                                                                    event
                                                                ) => {
                                                                    event.currentTarget.style.display =
                                                                        "none";
                                                                }}
                                                            />

                                                        ) : (

                                                            <div className="w-full h-full flex items-center justify-center">

                                                                <Leaf
                                                                    size={
                                                                        28
                                                                    }
                                                                    className="text-emerald-300"
                                                                />

                                                            </div>

                                                        )}

                                                    </div>


                                                    <div className="flex-1 min-w-0">

                                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">

                                                            <div>

                                                                <h3 className="font-semibold text-slate-900 truncate">
                                                                    {
                                                                        item.productName
                                                                    }
                                                                </h3>

                                                                <p className="text-sm text-slate-500 mt-1">
                                                                    ₹
                                                                    {Number(
                                                                        item.price ||
                                                                            0
                                                                    ).toLocaleString(
                                                                        "en-IN"
                                                                    )}{" "}
                                                                    /{" "}
                                                                    {
                                                                        item.unit
                                                                    }
                                                                </p>

                                                            </div>


                                                            <p className="font-bold text-slate-900">

                                                                ₹
                                                                {Number(
                                                                    item.subtotal ||
                                                                        0
                                                                ).toLocaleString(
                                                                    "en-IN"
                                                                )}

                                                            </p>

                                                        </div>


                                                        <div className="mt-3 flex flex-wrap gap-2">

                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">

                                                                Qty:{" "}
                                                                {
                                                                    item.quantity
                                                                }

                                                            </span>


                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">

                                                                Fresh Farm Product

                                                            </span>

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        </section>


                        {/* ================================= */}
                        {/* DELIVERY DETAILS */}
                        {/* ================================= */}

                        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">

                            <div className="flex items-center gap-3 mb-6">

                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">

                                    <MapPin
                                        size={19}
                                        className="text-emerald-600"
                                    />

                                </div>


                                <div>

                                    <h2 className="text-xl font-bold text-slate-900">
                                        Delivery Details
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Where your order will be delivered
                                    </p>

                                </div>

                            </div>


                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">

                                    <div className="flex items-center gap-2 text-slate-500 mb-2">

                                        <MapPin
                                            size={16}
                                        />

                                        <span className="text-sm font-medium">
                                            Delivery Address
                                        </span>

                                    </div>


                                    <p className="text-slate-900 font-medium leading-relaxed">
                                        {order.deliveryAddress ||
                                            "No address provided"}
                                    </p>

                                </div>


                                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">

                                    <div className="flex items-center gap-2 text-slate-500 mb-2">

                                        <Phone
                                            size={16}
                                        />

                                        <span className="text-sm font-medium">
                                            Contact Number
                                        </span>

                                    </div>


                                    <p className="text-slate-900 font-medium">
                                        {order.phone ||
                                            "No phone number provided"}
                                    </p>

                                </div>

                            </div>

                        </section>

                    </div>


                    {/* ================================= */}
                    {/* RIGHT SIDEBAR */}
                    {/* ================================= */}

                    <div className="space-y-6">


                        {/* ================================= */}
                        {/* LIVE STATUS CARD */}
                        {/* ================================= */}

                        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

                            <div className="flex items-center justify-between mb-5">

                                <div>

                                    <h2 className="font-bold text-slate-900">
                                        Live Status
                                    </h2>

                                    <p className="text-xs text-slate-500 mt-1">
                                        Real-time order updates
                                    </p>

                                </div>


                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        socketConnected
                                            ? "bg-emerald-50"
                                            : "bg-slate-100"
                                    }`}
                                >

                                    <span
                                        className={`w-3 h-3 rounded-full ${
                                            socketConnected
                                                ? "bg-emerald-500 animate-pulse"
                                                : "bg-slate-400"
                                        }`}
                                    />

                                </div>

                            </div>


                            <div
                                className={`rounded-2xl p-4 ${
                                    socketConnected
                                        ? "bg-emerald-50 border border-emerald-100"
                                        : "bg-slate-50 border border-slate-100"
                                }`}
                            >

                                <p
                                    className={`text-sm font-semibold ${
                                        socketConnected
                                            ? "text-emerald-700"
                                            : "text-slate-600"
                                    }`}
                                >
                                    {socketConnected
                                        ? "You're receiving live updates"
                                        : "Connecting to live updates..."}
                                </p>


                                <p className="text-xs text-slate-500 mt-1">
                                    You don't need to refresh this page when the farmer updates your order.
                                </p>

                            </div>

                        </section>


                        {/* ================================= */}
                        {/* PAYMENT SUMMARY */}
                        {/* ================================= */}

                        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

                            <div className="flex items-center gap-3 mb-6">

                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">

                                    <CreditCard
                                        size={19}
                                        className="text-blue-600"
                                    />

                                </div>


                                <div>

                                    <h2 className="font-bold text-slate-900">
                                        Payment Summary
                                    </h2>

                                    <p className="text-xs text-slate-500 mt-1">
                                        Order payment details
                                    </p>

                                </div>

                            </div>


                            <div className="space-y-4">

                                <div className="flex items-center justify-between text-sm">

                                    <span className="text-slate-500">
                                        Subtotal
                                    </span>

                                    <span className="font-medium text-slate-900">
                                        ₹
                                        {subtotal.toLocaleString(
                                            "en-IN"
                                        )}
                                    </span>

                                </div>


                                <div className="flex items-center justify-between text-sm">

                                    <span className="text-slate-500">
                                        Delivery Fee
                                    </span>

                                    <span className="font-medium text-slate-900">

                                        {deliveryFee ===
                                        0
                                            ? "FREE"
                                            : `₹${deliveryFee.toLocaleString(
                                                  "en-IN"
                                              )}`}

                                    </span>

                                </div>


                                <div className="border-t border-slate-100 pt-4 flex items-center justify-between">

                                    <span className="font-bold text-slate-900">
                                        Total
                                    </span>

                                    <span className="text-xl font-bold text-emerald-600">
                                        ₹
                                        {totalAmount.toLocaleString(
                                            "en-IN"
                                        )}
                                    </span>

                                </div>

                            </div>

                        </section>


                        {/* ================================= */}
                        {/* PAYMENT METHOD */}
                        {/* ================================= */}

                        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

                            <h2 className="font-bold text-slate-900 mb-4">
                                Payment Method
                            </h2>


                            <div className="flex items-center justify-between gap-3">

                                <div className="flex items-center gap-3">

                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">

                                        <CreditCard
                                            size={18}
                                            className="text-slate-600"
                                        />

                                    </div>


                                    <div>

                                        <p className="font-semibold text-slate-900">
                                            {paymentMethod ===
                                            "RAZORPAY"
                                                ? "Razorpay"
                                                : "Cash on Delivery"}
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            Payment status
                                        </p>

                                    </div>

                                </div>


                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        paymentStatus ===
                                        "PAID"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : paymentStatus ===
                                              "REFUNDED"
                                            ? "bg-purple-50 text-purple-700"
                                            : paymentStatus ===
                                              "FAILED"
                                            ? "bg-red-50 text-red-700"
                                            : "bg-amber-50 text-amber-700"
                                    }`}
                                >
                                    {paymentStatus}
                                </span>

                            </div>

                        </section>


                        {/* ================================= */}
                        {/* ORDER DATE */}
                        {/* ================================= */}

                        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">

                                    <Clock3
                                        size={18}
                                        className="text-slate-600"
                                    />

                                </div>


                                <div>

                                    <p className="text-xs text-slate-500">
                                        Order Date
                                    </p>

                                    <p className="font-semibold text-slate-900 mt-0.5">
                                        {formatDate(
                                            order.createdAt
                                        )}
                                    </p>

                                </div>

                            </div>

                        </section>


                        {/* ================================= */}
                        {/* CANCEL ORDER */}
                        {/* ================================= */}

                        {canCancel && (

                            <section className="bg-white rounded-3xl border border-red-100 p-6 shadow-sm">

                                <div className="mb-4">

                                    <h2 className="font-bold text-slate-900">
                                        Need to cancel?
                                    </h2>

                                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                        You can cancel this order while it is placed or confirmed.
                                    </p>

                                </div>


                                <button
                                    onClick={
                                        cancelOrder
                                    }
                                    disabled={
                                        cancelling
                                    }
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >

                                    {cancelling ? (

                                        <>
                                            <RefreshCw
                                                size={
                                                    17
                                                }
                                                className="animate-spin"
                                            />

                                            Cancelling...

                                        </>

                                    ) : (

                                        <>
                                            <XCircle
                                                size={
                                                    17
                                                }
                                            />

                                            Cancel Order
                                        </>

                                    )}

                                </button>

                            </section>

                        )}


                        {/* ================================= */}
                        {/* ORDER ID */}
                        {/* ================================= */}

                        <section className="rounded-3xl bg-slate-900 text-white p-6">

                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                                Order ID
                            </p>

                            <p className="text-sm font-mono break-all text-slate-200">
                                {order._id}
                            </p>

                        </section>

                    </div>

                </div>

            </main>

        </div>
    );
}


export default OrderDetails;