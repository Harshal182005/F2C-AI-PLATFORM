import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    Search,
    Users,
    UserCheck,
    UserX,
    Trash2,
    Ban,
    CheckCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const Farmers = () => {
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [deleteId, setDeleteId] = useState(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const fetchFarmers = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("adminToken");

            const { data } = await axios.get(
                `${backendUrl}/api/admin/farmers`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (data.success) {
                setFarmers(data.farmers || []);
            } else {
                toast.error(data.message || "Failed to fetch farmers");
            }
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message || "Failed to load farmers"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFarmers();
    }, []);

    const handleToggleBlock = async (id) => {
        try {
            const token = localStorage.getItem("adminToken");

            const { data } = await axios.put(
                `${backendUrl}/api/admin/farmers/${id}/toggle-block`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (data.success) {
                toast.success(data.message || "Farmer status updated");
                fetchFarmers();
            } else {
                toast.error(data.message || "Failed to update status");
            }
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                    "Failed to update farmer status"
            );
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const token = localStorage.getItem("adminToken");

            const { data } = await axios.delete(
                `${backendUrl}/api/admin/farmers/${deleteId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (data.success) {
                toast.success(data.message || "Farmer deleted successfully");

                setFarmers((prev) =>
                    prev.filter((farmer) => farmer._id !== deleteId)
                );

                setDeleteId(null);
            } else {
                toast.error(data.message || "Failed to delete farmer");
            }
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                    "Failed to delete farmer"
            );
        }
    };

    const filteredFarmers = farmers.filter((farmer) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            farmer.name?.toLowerCase().includes(searchText) ||
            farmer.email?.toLowerCase().includes(searchText) ||
            farmer.phone?.toLowerCase().includes(searchText);

        const isBlocked =
            farmer.isBlocked === true ||
            farmer.blocked === true;

        const matchesFilter =
            filter === "all" ||
            (filter === "active" && !isBlocked) ||
            (filter === "blocked" && isBlocked);

        return matchesSearch && matchesFilter;
    });

    const totalFarmers = farmers.length;

    const blockedFarmers = farmers.filter(
        (farmer) => farmer.isBlocked === true || farmer.blocked === true
    ).length;

    const activeFarmers = totalFarmers - blockedFarmers;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                            <Users className="h-6 w-6 text-emerald-600" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Farmers Management
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage farmers registered on your F2C platform
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={fetchFarmers}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Total Farmers
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-slate-900">
                                {totalFarmers}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Active Farmers
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-slate-900">
                                {activeFarmers}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-3">
                            <UserCheck className="h-5 w-5 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Blocked Farmers
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-slate-900">
                                {blockedFarmers}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-red-50 p-3">
                            <UserX className="h-5 w-5 text-red-600" />
                        </div>
                    </div>
                </div>

            </div>

            {/* Main Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* Toolbar */}
                <div className="border-b border-slate-100 p-4 md:p-5">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        {/* Search */}
                        <div className="relative w-full lg:max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                            <input
                                type="text"
                                placeholder="Search by name, email or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex rounded-xl bg-slate-100 p-1">
                            {[
                                ["all", "All"],
                                ["active", "Active"],
                                ["blocked", "Blocked"],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setFilter(value)}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                        filter === value
                                            ? "bg-white text-emerald-600 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="space-y-4 p-6">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div
                                key={item}
                                className="h-16 animate-pulse rounded-xl bg-slate-100"
                            />
                        ))}
                    </div>
                ) : filteredFarmers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

                        <div className="mb-4 rounded-full bg-slate-100 p-5">
                            <Users className="h-8 w-8 text-slate-400" />
                        </div>

                        <h3 className="text-lg font-semibold text-slate-800">
                            No farmers found
                        </h3>

                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            Try changing your search or filter to find farmers.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Farmer
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Contact
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Location
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredFarmers.map((farmer) => {
                                        const isBlocked =
                                            farmer.isBlocked === true ||
                                            farmer.blocked === true;

                                        return (
                                            <tr
                                                key={farmer._id}
                                                className="border-b border-slate-100 transition hover:bg-slate-50/70"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
                                                            {farmer.name
                                                                ?.charAt(0)
                                                                ?.toUpperCase() || "F"}
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold text-slate-800">
                                                                {farmer.name || "Unknown"}
                                                            </p>

                                                            <p className="text-xs text-slate-400">
                                                                ID: {farmer._id?.slice(-8)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-700">
                                                        {farmer.email || "—"}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {farmer.phone || "No phone"}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {farmer.location ||
                                                        farmer.address?.city ||
                                                        "—"}
                                                </td>

                                                <td className="px-6 py-4">
                                                    {isBlocked ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                            Blocked
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                            Active
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2">

                                                        <button
                                                            onClick={() =>
                                                                handleToggleBlock(
                                                                    farmer._id
                                                                )
                                                            }
                                                            title={
                                                                isBlocked
                                                                    ? "Unblock farmer"
                                                                    : "Block farmer"
                                                            }
                                                            className={`rounded-lg p-2 transition ${
                                                                isBlocked
                                                                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                                    : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                                            }`}
                                                        >
                                                            {isBlocked ? (
                                                                <CheckCircle className="h-4 w-4" />
                                                            ) : (
                                                                <Ban className="h-4 w-4" />
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                setDeleteId(
                                                                    farmer._id
                                                                )
                                                            }
                                                            title="Delete farmer"
                                                            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="space-y-3 p-4 md:hidden">
                            {filteredFarmers.map((farmer) => {
                                const isBlocked =
                                    farmer.isBlocked === true ||
                                    farmer.blocked === true;

                                return (
                                    <div
                                        key={farmer._id}
                                        className="rounded-xl border border-slate-200 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">

                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
                                                    {farmer.name
                                                        ?.charAt(0)
                                                        ?.toUpperCase() || "F"}
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {farmer.name || "Unknown"}
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        {farmer.email || "No email"}
                                                    </p>
                                                </div>
                                            </div>

                                            {isBlocked ? (
                                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                                                    Blocked
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                                                    Active
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Phone
                                                </p>

                                                <p className="text-sm text-slate-600">
                                                    {farmer.phone || "—"}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleToggleBlock(
                                                            farmer._id
                                                        )
                                                    }
                                                    className={`rounded-lg p-2 ${
                                                        isBlocked
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "bg-orange-50 text-orange-600"
                                                    }`}
                                                >
                                                    {isBlocked ? (
                                                        <CheckCircle className="h-4 w-4" />
                                                    ) : (
                                                        <Ban className="h-4 w-4" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        setDeleteId(
                                                            farmer._id
                                                        )
                                                    }
                                                    className="rounded-lg bg-red-50 p-2 text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Footer */}
                {!loading && filteredFarmers.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Showing{" "}
                            <span className="font-semibold text-slate-700">
                                {filteredFarmers.length}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-slate-700">
                                {farmers.length}
                            </span>{" "}
                            farmers
                        </p>

                        <div className="flex gap-2">
                            <button
                                disabled
                                className="rounded-lg border border-slate-200 p-2 text-slate-300"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <button
                                disabled
                                className="rounded-lg border border-slate-200 p-2 text-slate-300"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>

                        <h2 className="mt-4 text-xl font-bold text-slate-900">
                            Delete Farmer?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            This action cannot be undone. The farmer account
                            and associated data may be permanently removed.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDelete}
                                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                                Delete Farmer
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Farmers;