import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Orders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("customerToken");

            console.log(
                "CUSTOMER TOKEN:",
                token ? "Present" : "Missing"
            );

            if (!token) {
                navigate("/login");
                return;
            }

            console.log("Fetching customer orders...");

            const response = await API.get(
                "/orders/my-orders",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(
                "ORDERS API RESPONSE:",
                response.data
            );

            const fetchedOrders =
                Array.isArray(response.data?.orders)
                    ? response.data.orders
                    : [];

            console.log(
                "ORDERS:",
                fetchedOrders
            );

            console.log(
                "ABOUT TO SET ORDERS"
            );

            setOrders(fetchedOrders);

            console.log(
                "ORDERS STATE UPDATED"
            );

        } catch (error) {
            console.error(
                "FETCH ORDERS ERROR:",
                error
            );

            console.error(
                "STATUS:",
                error.response?.status
            );

            console.error(
                "DATA:",
                error.response?.data
            );

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
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
                error.message ||
                "Unable to load your orders."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCancel = async (orderId) => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this order?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setCancellingId(orderId);

            const token =
                localStorage.getItem(
                    "customerToken"
                );

            await API.put(
                `/orders/cancel/${orderId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            await fetchOrders();

        } catch (error) {
            console.error(
                "Cancel order error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to cancel the order."
            );

        } finally {
            setCancellingId(null);
        }
    };

    const formatDate = (date) => {
        if (!date) {
            return "Date unavailable";
        }

        const parsedDate = new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "DELIVERED":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";

            case "SHIPPED":
                return "bg-blue-50 text-blue-700 border-blue-200";

            case "OUT_FOR_DELIVERY":
                return "bg-blue-50 text-blue-700 border-blue-200";

            case "PROCESSING":
                return "bg-amber-50 text-amber-700 border-amber-200";

            case "PACKED":
                return "bg-purple-50 text-purple-700 border-purple-200";

            case "CONFIRMED":
                return "bg-indigo-50 text-indigo-700 border-indigo-200";

            case "CANCELLED":
                return "bg-red-50 text-red-700 border-red-200";

            case "PLACED":
                return "bg-gray-50 text-gray-700 border-gray-200";

            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    const getPaymentStyle = (status) => {
        switch (status) {
            case "PAID":
                return "bg-emerald-50 text-emerald-700";

            case "FAILED":
                return "bg-red-50 text-red-700";

            case "REFUNDED":
                return "bg-purple-50 text-purple-700";

            default:
                return "bg-amber-50 text-amber-700";
        }
    };

    /*
     * IMPORTANT DEBUG LOG
     *
     * If this prints:
     *
     * RENDERING ORDERS PAGE 7
     *
     * then API + state are working.
     */
    console.log(
        "RENDERING ORDERS PAGE",
        orders.length
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f7f9f5]">

                <div className="mx-auto max-w-6xl px-5 py-12">

                    <div className="mb-10">

                        <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-200" />

                        <div className="mt-3 h-5 w-72 animate-pulse rounded-lg bg-gray-200" />

                    </div>

                    <div className="space-y-5">

                        {[1, 2, 3].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="animate-pulse rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
                                >

                                    <div className="flex justify-between">

                                        <div>

                                            <div className="h-5 w-40 rounded bg-gray-200" />

                                            <div className="mt-3 h-4 w-28 rounded bg-gray-200" />

                                        </div>

                                        <div className="h-8 w-24 rounded-full bg-gray-200" />

                                    </div>

                                    <div className="mt-8 grid gap-4 sm:grid-cols-4">

                                        <div className="h-16 rounded-xl bg-gray-100" />

                                        <div className="h-16 rounded-xl bg-gray-100" />

                                        <div className="h-16 rounded-xl bg-gray-100" />

                                        <div className="h-16 rounded-xl bg-gray-100" />

                                    </div>

                                </div>
                            )
                        )}

                    </div>

                </div>

            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f7f9f5] px-5 py-20">

                <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
                        ⚠️
                    </div>

                    <h1 className="mt-6 text-2xl font-bold text-gray-900">
                        Something went wrong
                    </h1>

                    <p className="mt-3 text-gray-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={fetchOrders}
                        className="mt-7 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f9f5]">

            {/* HEADER */}

            <header className="border-b border-gray-100 bg-white/90 backdrop-blur">

                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">

                    <Link
                        to="/marketplace"
                        className="flex items-center gap-3"
                    >

                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-700 text-xl text-white shadow-sm">
                            🌱
                        </div>

                        <div>

                            <p className="text-lg font-extrabold tracking-tight text-gray-900">
                                F2C
                            </p>

                            <p className="text-xs text-gray-500">
                                Farmer to Customer
                            </p>

                        </div>

                    </Link>

                    <Link
                        to="/marketplace"
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-green-300 hover:text-green-700"
                    >
                        ← Marketplace
                    </Link>

                </div>

            </header>

            {/* MAIN */}

            <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">

                {/* PAGE HEADING */}

                <div className="mb-10">

                    <div className="flex items-center gap-3">

                        <span className="text-3xl">
                            📦
                        </span>

                        <div>

                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                                My Orders
                            </h1>

                            <p className="mt-1 text-gray-500">
                                Track and manage your recent purchases.
                            </p>

                        </div>

                    </div>

                </div>

                {/* EMPTY */}

                {orders.length === 0 ? (

                    <div className="rounded-[2rem] border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">

                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-green-50 text-5xl">
                            🛒
                        </div>

                        <h2 className="mt-7 text-2xl font-bold text-gray-900">
                            No orders yet
                        </h2>

                        <p className="mx-auto mt-3 max-w-md text-gray-500">
                            You haven't placed any orders yet.
                            Explore fresh products directly from local farmers.
                        </p>

                        <Link
                            to="/marketplace"
                            className="mt-8 inline-flex rounded-xl bg-green-700 px-7 py-3.5 font-bold text-white transition hover:bg-green-800 hover:shadow-lg"
                        >
                            Start Shopping →
                        </Link>

                    </div>

                ) : (

                    <div className="space-y-5">

                        {orders.map(
                            (order, index) => {

                                /*
                                 * SAFE ORDER ID
                                 */

                                const orderId =
                                    order?._id
                                        ? String(
                                            order._id
                                        )
                                        : "";

                                /*
                                 * SAFE ITEMS
                                 */

                                const items =
                                    Array.isArray(
                                        order?.items
                                    )
                                        ? order.items
                                        : [];

                                /*
                                 * TOTAL ITEMS
                                 */

                                const totalItems =
                                    items.reduce(
                                        (
                                            total,
                                            item
                                        ) =>
                                            total +
                                            Number(
                                                item?.quantity ||
                                                0
                                            ),
                                        0
                                    );

                                /*
                                 * CANCEL RULE
                                 */

                                const canCancel =
                                    order?.orderStatus ===
                                        "PLACED" ||
                                    order?.orderStatus ===
                                        "CONFIRMED";

                                /*
                                 * DEBUG
                                 */

                                console.log(
                                    "RENDERING ORDER:",
                                    index,
                                    orderId,
                                    order?.orderStatus
                                );

                                return (
                                    <div
                                        key={
                                            orderId ||
                                            `order-${index}`
                                        }
                                        className="group overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                                    >

                                        {/* TOP */}

                                        <div className="border-b border-gray-100 p-5 sm:p-7">

                                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                                                <div>

                                                    <div className="flex flex-wrap items-center gap-3">

                                                        <span className="text-lg font-bold text-gray-900">

                                                            Order #

                                                            {orderId
                                                                ? orderId
                                                                    .slice(-8)
                                                                    .toUpperCase()
                                                                : "UNKNOWN"}

                                                        </span>

                                                        <span
                                                            className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                                                                order?.orderStatus
                                                            )}`}
                                                        >
                                                            {order?.orderStatus ||
                                                                "UNKNOWN"}
                                                        </span>

                                                    </div>

                                                    <p className="mt-2 text-sm text-gray-500">
                                                        Placed on{" "}
                                                        {formatDate(
                                                            order?.createdAt
                                                        )}
                                                    </p>

                                                </div>

                                                <div className="text-left sm:text-right">

                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                        Total
                                                    </p>

                                                    <p className="mt-1 text-2xl font-extrabold text-gray-900">
                                                        ₹
                                                        {Number(
                                                            order?.totalAmount ||
                                                            0
                                                        ).toFixed(2)}
                                                    </p>

                                                </div>

                                            </div>

                                        </div>

                                        {/* INFORMATION */}

                                        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">

                                            <div className="rounded-2xl bg-gray-50 p-4">

                                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                    Items
                                                </p>

                                                <p className="mt-2 text-lg font-bold text-gray-900">
                                                    {totalItems}
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    {totalItems ===
                                                    1
                                                        ? "product"
                                                        : "products"}
                                                </p>

                                            </div>

                                            <div className="rounded-2xl bg-gray-50 p-4">

                                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                    Subtotal
                                                </p>

                                                <p className="mt-2 text-lg font-bold text-gray-900">
                                                    ₹
                                                    {Number(
                                                        order?.subtotal ||
                                                        0
                                                    ).toFixed(2)}
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    Before delivery
                                                </p>

                                            </div>

                                            <div className="rounded-2xl bg-gray-50 p-4">

                                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                    Payment
                                                </p>

                                                <div className="mt-2 flex flex-wrap items-center gap-2">

                                                    <span className="text-sm font-bold text-gray-900">
                                                        {order?.paymentMethod ||
                                                            "N/A"}
                                                    </span>

                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getPaymentStyle(
                                                            order?.paymentStatus
                                                        )}`}
                                                    >
                                                        {order?.paymentStatus ||
                                                            "PENDING"}
                                                    </span>

                                                </div>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    Payment status
                                                </p>

                                            </div>

                                            <div className="rounded-2xl bg-gray-50 p-4">

                                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                    Delivery
                                                </p>

                                                <p className="mt-2 text-lg font-bold text-gray-900">
                                                    ₹
                                                    {Number(
                                                        order?.deliveryFee ||
                                                        0
                                                    ).toFixed(2)}
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    Delivery charge
                                                </p>

                                            </div>

                                        </div>

                                        {/* PRODUCTS */}

                                        {items.length >
                                            0 && (

                                            <div className="px-5 pb-5 sm:px-7 sm:pb-7">

                                                <div className="flex gap-3 overflow-x-auto pb-1">

                                                    {items
                                                        .slice(
                                                            0,
                                                            4
                                                        )
                                                        .map(
                                                            (
                                                                item,
                                                                itemIndex
                                                            ) => {

                                                                const image =
                                                                    typeof item?.image ===
                                                                    "string"
                                                                        ? item.image
                                                                        : "";

                                                                return (
                                                                    <div
                                                                        key={`${item?.product || "product"}-${itemIndex}`}
                                                                        className="flex min-w-[210px] items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3"
                                                                    >

                                                                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">

                                                                            {image ? (
                                                                                <img
                                                                                    src={
                                                                                        image
                                                                                    }
                                                                                    alt={
                                                                                        item?.productName ||
                                                                                        "Product"
                                                                                    }
                                                                                    className="h-full w-full object-cover"
                                                                                    onError={(
                                                                                        event
                                                                                    ) => {
                                                                                        event.currentTarget.style.display =
                                                                                            "none";
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <div className="flex h-full w-full items-center justify-center text-xl">
                                                                                    🥬
                                                                                </div>
                                                                            )}

                                                                        </div>

                                                                        <div className="min-w-0">

                                                                            <p className="truncate text-sm font-bold text-gray-900">
                                                                                {item?.productName ||
                                                                                    "Product"}
                                                                            </p>

                                                                            <p className="mt-1 text-xs text-gray-500">

                                                                                {item?.quantity ||
                                                                                    0}{" "}

                                                                                {item?.unit ||
                                                                                    ""}

                                                                            </p>

                                                                        </div>

                                                                    </div>
                                                                );
                                                            }
                                                        )}

                                                    {items.length >
                                                        4 && (

                                                        <div className="flex min-w-[100px] items-center justify-center rounded-2xl border border-dashed border-gray-200 px-4 text-sm font-semibold text-gray-500">

                                                            +
                                                            {items.length -
                                                                4}{" "}
                                                            more

                                                        </div>

                                                    )}

                                                </div>

                                            </div>

                                        )}

                                        {/* ACTIONS */}

                                        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">

                                            <p className="text-xs text-gray-500">
                                                {order?.deliveryAddress ||
                                                    "Delivery address unavailable"}
                                            </p>

                                            <div className="flex flex-col gap-2 sm:flex-row">

                                                {canCancel &&
                                                    orderId && (

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCancel(
                                                                    orderId
                                                                )
                                                            }
                                                            disabled={
                                                                cancellingId ===
                                                                orderId
                                                            }
                                                            className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >

                                                            {cancellingId ===
                                                            orderId
                                                                ? "Cancelling..."
                                                                : "Cancel Order"}

                                                        </button>

                                                    )}

                                                {orderId && (

                                                    <Link
                                                        to={`/orders/${orderId}`}
                                                        className="rounded-xl bg-green-700 px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-green-800 hover:shadow-md"
                                                    >
                                                        View Details →
                                                    </Link>

                                                )}

                                            </div>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                )}

            </main>

            {/* FOOTER */}

            <footer className="border-t border-gray-100 bg-white">

                <div className="mx-auto max-w-6xl px-5 py-8 text-center text-sm text-gray-500">

                    © {new Date().getFullYear()} F2C —
                    Fresh from farmers to your doorstep.

                </div>

            </footer>

        </div>
    );
}

export default Orders;