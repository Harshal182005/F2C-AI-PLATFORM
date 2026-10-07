import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
    ArrowLeft,
    Package,
    Image as ImageIcon,
    Upload,
    X,
    MapPin,
    IndianRupee,
    Leaf,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Trash2,
    Save,
    Eye,
    EyeOff,
    Boxes,
    ChevronDown
} from "lucide-react";

import API from "../services/api";

// ==========================================
// CONSTANTS
// ==========================================

const CLOUDINARY_CLOUD_NAME =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const categories = [
    "Vegetables",
    "Fruits",
    "Grains",
    "Pulses",
    "Spices",
    "Dairy",
    "Oil Seeds",
    "Flowers",
    "Other"
];

const units = [
    "kg",
    "gram",
    "quintal",
    "ton",
    "liter",
    "dozen",
    "piece"
];

// ==========================================
// COMPONENT
// ==========================================

const FarmerEditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // ==========================================
    // FORM
    // ==========================================

    const [form, setForm] = useState({
        name: "",
        category: "",
        description: "",
        price: "",
        quantity: "",
        unit: "kg",
        location: "",
        isOrganic: false,
        isAvailable: true
    });

    // ==========================================
    // IMAGES
    // ==========================================

    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);

    // ==========================================
    // STATES
    // ==========================================

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const token = localStorage.getItem("farmerToken");

    // ==========================================
    // FETCH PRODUCT
    // ==========================================

    useEffect(() => {
        if (!token) {
            navigate("/farmer/login");
            return;
        }

        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get(`/products/${id}`);

            const product = response.data.product;

            if (!product) {
                throw new Error("Product not found.");
            }

            setForm({
                name: product.name || "",
                category: product.category || "",
                description: product.description || "",
                price: product.price ?? "",
                quantity: product.quantity ?? "",
                unit: product.unit || "kg",
                location: product.location || "",
                isOrganic: product.isOrganic || false,
                isAvailable: product.isAvailable ?? true
            });

            setExistingImages(
                Array.isArray(product.images)
                    ? product.images
                    : []
            );

        } catch (error) {
            console.error("Fetch product error:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem("farmerToken");
                localStorage.removeItem("farmerUser");

                navigate("/farmer/login");
                return;
            }

            if (error.response?.status === 404) {
                setError("Product not found.");
            } else {
                setError(
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to load product."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // FORM CHANGE
    // ==========================================

    const handleChange = (e) => {
        const {
            name,
            value,
            type,
            checked
        } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));

        setError("");
        setSuccess("");
    };

    // ==========================================
    // REMOVE EXISTING IMAGE
    // ==========================================

    const removeExistingImage = (index) => {
        setExistingImages((previous) =>
            previous.filter(
                (_, imageIndex) =>
                    imageIndex !== index
            )
        );

        setError("");
        setSuccess("");
    };

    // ==========================================
    // SELECT NEW IMAGES
    // ==========================================

    const handleImageChange = (e) => {
        const files = Array.from(
            e.target.files || []
        );

        if (!files.length) {
            return;
        }

        setError("");
        setSuccess("");

        const currentTotal =
            existingImages.length +
            newImages.length;

        const remainingSlots =
            MAX_IMAGES - currentTotal;

        if (remainingSlots <= 0) {
            setError(
                `You can have a maximum of ${MAX_IMAGES} images.`
            );

            e.target.value = "";
            return;
        }

        const filesToAdd =
            files.slice(0, remainingSlots);

        for (const file of filesToAdd) {
            if (!file.type.startsWith("image/")) {
                setError(
                    "Only image files are allowed."
                );

                e.target.value = "";
                return;
            }

            if (file.size > MAX_IMAGE_SIZE) {
                setError(
                    "Each image must be smaller than 5MB."
                );

                e.target.value = "";
                return;
            }
        }

        setNewImages((previous) => [
            ...previous,
            ...filesToAdd
        ]);

        e.target.value = "";
    };

    // ==========================================
    // REMOVE NEW IMAGE
    // ==========================================

    const removeNewImage = (index) => {
        setNewImages((previous) =>
            previous.filter(
                (_, imageIndex) =>
                    imageIndex !== index
            )
        );

        setError("");
        setSuccess("");
    };

    // ==========================================
    // NEW IMAGE PREVIEWS
    // ==========================================

    const newImagePreviews = useMemo(() => {
        return newImages.map((image) => ({
            file: image,
            url: URL.createObjectURL(image)
        }));
    }, [newImages]);

    useEffect(() => {
        return () => {
            newImagePreviews.forEach((item) => {
                URL.revokeObjectURL(item.url);
            });
        };
    }, [newImagePreviews]);

    // ==========================================
    // CLOUDINARY UPLOAD
    // ==========================================

    const uploadNewImages = async () => {
        if (!newImages.length) {
            return [];
        }

        if (
            !CLOUDINARY_CLOUD_NAME ||
            !CLOUDINARY_UPLOAD_PRESET
        ) {
            throw new Error(
                "Cloudinary configuration is missing. Check your frontend .env file."
            );
        }

        setUploadingImages(true);

        try {
            const uploadedUrls = [];

            for (const image of newImages) {
                const data = new FormData();

                data.append("file", image);

                data.append(
                    "upload_preset",
                    CLOUDINARY_UPLOAD_PRESET
                );

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                    {
                        method: "POST",
                        body: data
                    }
                );

                const result =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error?.message ||
                        "Failed to upload image."
                    );
                }

                uploadedUrls.push(
                    result.secure_url
                );
            }

            return uploadedUrls;
        } finally {
            setUploadingImages(false);
        }
    };

    // ==========================================
    // VALIDATION
    // ==========================================

    const validateForm = () => {
        if (!form.name.trim()) {
            return "Product name is required.";
        }

        if (!form.category) {
            return "Please select a category.";
        }

        if (
            form.price === "" ||
            Number(form.price) <= 0
        ) {
            return "Please enter a valid price greater than 0.";
        }

        if (
            form.quantity === "" ||
            Number(form.quantity) < 0
        ) {
            return "Please enter a valid quantity.";
        }

        if (!form.unit) {
            return "Please select a unit.";
        }

        if (!form.location.trim()) {
            return "Please enter the farm or pickup location.";
        }

        if (!form.description.trim()) {
            return "Please add a product description.";
        }

        if (
            existingImages.length +
            newImages.length >
            MAX_IMAGES
        ) {
            return `A product can have a maximum of ${MAX_IMAGES} images.`;
        }

        return null;
    };

    // ==========================================
    // SUBMIT
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            return;
        }

        try {
            setSaving(true);

            if (!token) {
                throw new Error(
                    "Farmer session not found. Please login again."
                );
            }

            // ==================================
            // UPLOAD NEW IMAGES
            // ==================================

            const uploadedNewImages =
                await uploadNewImages();

            // ==================================
            // COMBINE EXISTING + NEW IMAGES
            // ==================================

            const finalImages = [
                ...existingImages,
                ...uploadedNewImages
            ];

            // ==================================
            // AVAILABILITY
            // ==================================

            const finalAvailability =
                Number(form.quantity) > 0
                    ? form.isAvailable
                    : false;

            // ==================================
            // UPDATE PRODUCT
            // ==================================

            const response = await API.put(
                `/products/${id}`,
                {
                    name: form.name.trim(),

                    category: form.category,

                    description:
                        form.description.trim(),

                    price:
                        Number(form.price),

                    quantity:
                        Number(form.quantity),

                    unit: form.unit,

                    location:
                        form.location.trim(),

                    isOrganic:
                        form.isOrganic,

                    isAvailable:
                        finalAvailability,

                    images:
                        finalImages
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setSuccess(
                response.data?.message ||
                "Product updated successfully."
            );

            // New images are now part of existing images
            setExistingImages(finalImages);
            setNewImages([]);

            setTimeout(() => {
                navigate("/farmer/dashboard");
            }, 1000);

        } catch (error) {
            console.error(
                "Update product error:",
                error
            );

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
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
                error.response?.data?.message ||
                error.message ||
                "Failed to update product."
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // DELETE PRODUCT
    // ==========================================

    const handleDelete = async () => {
        try {
            setDeleting(true);
            setError("");
            setSuccess("");

            if (!token) {
                throw new Error(
                    "Farmer session not found. Please login again."
                );
            }

            const response =
                await API.delete(
                    `/products/${id}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            setShowDeleteModal(false);

            setSuccess(
                response.data?.message ||
                "Product deleted successfully."
            );

            setTimeout(() => {
                navigate("/farmer/dashboard");
            }, 800);

        } catch (error) {
            console.error(
                "Delete product error:",
                error
            );

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
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
                error.response?.data?.message ||
                error.message ||
                "Failed to delete product."
            );

            setShowDeleteModal(false);
        } finally {
            setDeleting(false);
        }
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f8f2]">

                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                        <div className="h-10 w-56 animate-pulse rounded-xl bg-slate-200" />
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                    <div className="h-52 animate-pulse rounded-3xl bg-emerald-950/10" />

                    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">

                        <div className="space-y-8">
                            <div className="h-72 animate-pulse rounded-3xl bg-white" />
                            <div className="h-64 animate-pulse rounded-3xl bg-white" />
                            <div className="h-48 animate-pulse rounded-3xl bg-white" />
                            <div className="h-80 animate-pulse rounded-3xl bg-white" />
                        </div>

                        <div className="h-[500px] animate-pulse rounded-3xl bg-white" />

                    </div>
                </main>
            </div>
        );
    }

    // ==========================================
    // PRODUCT NOT FOUND
    // ==========================================

    if (error && !form.name) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f5f8f2] px-4">

                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <AlertCircle size={32} />
                    </div>

                    <h1 className="mt-5 text-2xl font-black text-slate-900">
                        Product unavailable
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {error}
                    </p>

                    <Link
                        to="/farmer/dashboard"
                        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                        <ArrowLeft size={17} />
                        Back to Dashboard
                    </Link>

                </div>
            </div>
        );
    }

    // ==========================================
    // TOTAL IMAGES
    // ==========================================

    const totalImages =
        existingImages.length +
        newImages.length;

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="min-h-screen bg-[#f5f8f2]">

            {/* ==================================
                HEADER
            ================================== */}

            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">

                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/farmer/dashboard"
                            )
                        }
                        className="group flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-emerald-700"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition group-hover:border-emerald-200 group-hover:bg-emerald-50">
                            <ArrowLeft size={18} />
                        </span>

                        <span className="hidden sm:block">
                            Back to Dashboard
                        </span>
                    </button>

                    <div className="flex items-center gap-3">

                        <div className="hidden text-right sm:block">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Farmer Portal
                            </p>

                            <p className="text-sm font-black text-slate-800">
                                Product Management
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                            <Package size={20} />
                        </div>

                    </div>

                </div>
            </header>

            {/* ==================================
                MAIN
            ================================== */}

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

                {/* ==================================
                    HERO
                ================================== */}

                <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 p-7 text-white shadow-xl sm:p-10">

                    <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

                    <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />

                    <div className="relative max-w-3xl">

                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                            <Package size={14} />
                            Product Management
                        </div>

                        <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                            Refine your product listing
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                            Keep your product details,
                            pricing, inventory and images
                            accurate so customers always see
                            the latest information.
                        </p>

                    </div>
                </section>

                {/* ==================================
                    ALERTS
                ================================== */}

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">

                        <AlertCircle
                            size={20}
                            className="mt-0.5 shrink-0"
                        />

                        <div>
                            <p className="font-black">
                                Something went wrong
                            </p>

                            <p className="mt-1 text-sm">
                                {error}
                            </p>
                        </div>

                    </div>
                )}

                {success && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">

                        <CheckCircle2
                            size={20}
                            className="mt-0.5 shrink-0"
                        />

                        <div>
                            <p className="font-black">
                                Changes saved
                            </p>

                            <p className="mt-1 text-sm">
                                {success}
                            </p>
                        </div>

                    </div>
                )}

                {/* ==================================
                    FORM
                ================================== */}

                <form onSubmit={handleSubmit}>

                    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

                        {/* ==================================
                            LEFT
                        ================================== */}

                        <div className="space-y-8">

                            {/* ==================================
                                BASIC INFORMATION
                            ================================== */}

                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

                                <div className="mb-7 flex items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                        <Package size={21} />
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                            01
                                        </p>

                                        <h2 className="mt-1 text-xl font-black text-slate-900">
                                            Product information
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Keep the information customers use to understand your product.
                                        </p>
                                    </div>

                                </div>

                                <div className="space-y-5">

                                    {/* NAME */}

                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-slate-700">
                                            Product name
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Fresh Organic Tomatoes"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                        />
                                    </div>

                                    {/* CATEGORY */}

                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-slate-700">
                                            Category
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <div className="relative">

                                            <select
                                                name="category"
                                                value={form.category}
                                                onChange={handleChange}
                                                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                            >
                                                <option value="">
                                                    Select category
                                                </option>

                                                {categories.map(
                                                    (category) => (
                                                        <option
                                                            key={category}
                                                            value={category}
                                                        >
                                                            {category}
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                            <ChevronDown
                                                size={18}
                                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                        </div>
                                    </div>

                                    {/* DESCRIPTION */}

                                    <div>

                                        <div className="mb-2 flex items-center justify-between">

                                            <label className="text-sm font-bold text-slate-700">
                                                Description
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <span className="text-xs text-slate-400">
                                                {form.description.length} characters
                                            </span>

                                        </div>

                                        <textarea
                                            name="description"
                                            value={form.description}
                                            onChange={handleChange}
                                            rows={7}
                                            placeholder="Describe quality, freshness, farming practices and origin..."
                                            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                        />

                                    </div>

                                </div>
                            </section>

                            {/* ==================================
                                PRICING
                            ================================== */}

                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

                                <div className="mb-7 flex items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                        <IndianRupee size={21} />
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600">
                                            02
                                        </p>

                                        <h2 className="mt-1 text-xl font-black text-slate-900">
                                            Pricing & inventory
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Update your current selling price and available stock.
                                        </p>
                                    </div>

                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">

                                    {/* PRICE */}

                                    <div>

                                        <label className="mb-2 block text-sm font-bold text-slate-700">
                                            Price
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <div className="relative">

                                            <IndianRupee
                                                size={17}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                name="price"
                                                value={form.price}
                                                onChange={handleChange}
                                                placeholder="60"
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                            />

                                        </div>

                                        <p className="mt-2 text-xs text-slate-400">
                                            Price per selected unit
                                        </p>

                                    </div>

                                    {/* UNIT */}

                                    <div>

                                        <label className="mb-2 block text-sm font-bold text-slate-700">
                                            Unit
                                        </label>

                                        <div className="relative">

                                            <select
                                                name="unit"
                                                value={form.unit}
                                                onChange={handleChange}
                                                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                            >
                                                {units.map(
                                                    (unit) => (
                                                        <option
                                                            key={unit}
                                                            value={unit}
                                                        >
                                                            {unit}
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                            <ChevronDown
                                                size={18}
                                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                        </div>

                                    </div>

                                    {/* QUANTITY */}

                                    <div className="sm:col-span-2">

                                        <label className="mb-2 block text-sm font-bold text-slate-700">
                                            Available quantity
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            name="quantity"
                                            value={form.quantity}
                                            onChange={handleChange}
                                            placeholder="100"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                        />

                                        <p className="mt-2 text-xs text-slate-400">
                                            Set quantity to 0 when the product is sold out.
                                        </p>

                                    </div>

                                </div>

                                {/* ORGANIC */}

                                <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                                            <Leaf size={19} />
                                        </div>

                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                Organic product
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Show the organic badge to customers.
                                            </p>
                                        </div>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm(
                                                (previous) => ({
                                                    ...previous,
                                                    isOrganic:
                                                        !previous.isOrganic
                                                })
                                            )
                                        }
                                        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                                            form.isOrganic
                                                ? "bg-emerald-600"
                                                : "bg-slate-300"
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                                                form.isOrganic
                                                    ? "left-6"
                                                    : "left-1"
                                            }`}
                                        />
                                    </button>

                                </div>

                            </section>

                            {/* ==================================
                                LOCATION
                            ================================== */}

                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

                                <div className="mb-7 flex items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                        <MapPin size={21} />
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                                            03
                                        </p>

                                        <h2 className="mt-1 text-xl font-black text-slate-900">
                                            Farm details
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Help customers understand where the product comes from.
                                        </p>
                                    </div>

                                </div>

                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Farm / pickup location
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <div className="relative">

                                    <MapPin
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="text"
                                        name="location"
                                        value={form.location}
                                        onChange={handleChange}
                                        placeholder="Nashik, Maharashtra"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                    />

                                </div>

                            </section>

                            {/* ==================================
                                IMAGES
                            ================================== */}

                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

                                <div className="mb-7 flex items-start justify-between gap-4">

                                    <div className="flex items-start gap-4">

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                                            <ImageIcon size={21} />
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-600">
                                                04
                                            </p>

                                            <h2 className="mt-1 text-xl font-black text-slate-900">
                                                Product images
                                            </h2>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Manage the photos customers see.
                                            </p>
                                        </div>

                                    </div>

                                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                                        {totalImages}/{MAX_IMAGES}
                                    </span>

                                </div>

                                {/* EXISTING IMAGES */}

                                {existingImages.length > 0 && (
                                    <div>

                                        <div className="mb-3 flex items-center justify-between">

                                            <p className="text-sm font-black text-slate-800">
                                                Current images
                                            </p>

                                            <p className="text-xs text-slate-400">
                                                First image = cover
                                            </p>

                                        </div>

                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

                                            {existingImages.map(
                                                (image, index) => (
                                                    <div
                                                        key={`${image}-${index}`}
                                                        className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                                                    >

                                                        <img
                                                            src={image}
                                                            alt={`${form.name} ${index + 1}`}
                                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                        />

                                                        {index === 0 && (
                                                            <span className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-black text-white backdrop-blur">
                                                                Cover
                                                            </span>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeExistingImage(
                                                                    index
                                                                )
                                                            }
                                                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                                                            title="Remove image"
                                                        >
                                                            <X size={15} />
                                                        </button>

                                                    </div>
                                                )
                                            )}

                                        </div>
                                    </div>
                                )}

                                {/* NEW IMAGES */}

                                {newImagePreviews.length > 0 && (
                                    <div className="mt-6">

                                        <div className="mb-3 flex items-center gap-2">

                                            <Upload
                                                size={15}
                                                className="text-emerald-600"
                                            />

                                            <p className="text-sm font-black text-slate-800">
                                                New images
                                            </p>

                                        </div>

                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

                                            {newImagePreviews.map(
                                                (item, index) => (
                                                    <div
                                                        key={`${item.file.name}-${index}`}
                                                        className="group relative aspect-square overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50"
                                                    >

                                                        <img
                                                            src={item.url}
                                                            alt={item.file.name}
                                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                        />

                                                        <span className="absolute bottom-2 left-2 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-black text-white">
                                                            New
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeNewImage(
                                                                    index
                                                                )
                                                            }
                                                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                                                        >
                                                            <X size={15} />
                                                        </button>

                                                    </div>
                                                )
                                            )}

                                        </div>

                                    </div>
                                )}

                                {/* ADD IMAGE */}

                                {totalImages < MAX_IMAGES && (
                                    <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-emerald-400 hover:bg-emerald-50">

                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                                            <Upload size={23} />
                                        </div>

                                        <p className="mt-4 text-sm font-black text-slate-800">
                                            Add more images
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            PNG, JPG or WEBP · Max 5MB each
                                        </p>

                                        <p className="mt-2 text-xs font-semibold text-emerald-600">
                                            {MAX_IMAGES - totalImages} slot
                                            {MAX_IMAGES - totalImages !== 1
                                                ? "s"
                                                : ""}{" "}
                                            remaining
                                        </p>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={
                                                handleImageChange
                                            }
                                            className="hidden"
                                        />

                                    </label>
                                )}

                                {/* EMPTY */}

                                {existingImages.length === 0 &&
                                    newImages.length === 0 && (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle
                                                    size={18}
                                                    className="mt-0.5 shrink-0"
                                                />

                                                <div>
                                                    <p className="font-bold">
                                                        No product images
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5">
                                                        Add at least one clear product image to make your listing more attractive to customers.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                            </section>

                        </div>

                        {/* ==================================
                            RIGHT SIDEBAR
                        ================================== */}

                        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">

                            {/* STATUS */}

                            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                                <div className="flex items-start gap-3">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <Eye size={19} />
                                    </div>

                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                                            Visibility
                                        </p>

                                        <h3 className="mt-1 text-lg font-black text-slate-900">
                                            Product status
                                        </h3>
                                    </div>

                                </div>

                                <div className="mt-6 space-y-3">

                                    {/* AVAILABLE */}

                                    <div className="rounded-2xl border border-slate-200 p-4">

                                        <div className="flex items-center justify-between gap-3">

                                            <div className="flex items-center gap-3">

                                                <div
                                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                                        form.isAvailable &&
                                                        Number(form.quantity) > 0
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "bg-slate-100 text-slate-400"
                                                    }`}
                                                >
                                                    {form.isAvailable &&
                                                    Number(form.quantity) >
                                                        0 ? (
                                                        <Eye size={17} />
                                                    ) : (
                                                        <EyeOff size={17} />
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        Available for sale
                                                    </p>

                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        Customers can purchase this product.
                                                    </p>
                                                </div>

                                            </div>

                                            <button
                                                type="button"
                                                disabled={
                                                    Number(form.quantity) === 0
                                                }
                                                onClick={() =>
                                                    setForm(
                                                        (previous) => ({
                                                            ...previous,
                                                            isAvailable:
                                                                !previous.isAvailable
                                                        })
                                                    )
                                                }
                                                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                                                    form.isAvailable &&
                                                    Number(form.quantity) > 0
                                                        ? "bg-emerald-600"
                                                        : "bg-slate-300"
                                                } disabled:cursor-not-allowed disabled:opacity-60`}
                                            >
                                                <span
                                                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                                                        form.isAvailable &&
                                                        Number(form.quantity) >
                                                            0
                                                            ? "left-6"
                                                            : "left-1"
                                                    }`}
                                                />
                                            </button>

                                        </div>

                                    </div>

                                    {/* ORGANIC */}

                                    <div className="rounded-2xl border border-slate-200 p-4">

                                        <div className="flex items-center justify-between gap-3">

                                            <div className="flex items-center gap-3">

                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                                    <Leaf size={17} />
                                                </div>

                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        Organic product
                                                    </p>

                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        Show the organic badge.
                                                    </p>
                                                </div>

                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setForm(
                                                        (previous) => ({
                                                            ...previous,
                                                            isOrganic:
                                                                !previous.isOrganic
                                                        })
                                                    )
                                                }
                                                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                                                    form.isOrganic
                                                        ? "bg-emerald-600"
                                                        : "bg-slate-300"
                                                }`}
                                            >
                                                <span
                                                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                                                        form.isOrganic
                                                            ? "left-6"
                                                            : "left-1"
                                                    }`}
                                                />
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </section>

                            {/* INVENTORY */}

                            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 to-green-700 p-6 text-white shadow-lg">

                                <div className="flex items-center justify-between">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                        <Boxes size={19} />
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                                            Number(form.quantity) > 0
                                                ? "bg-white/15 text-emerald-50"
                                                : "bg-red-500/20 text-red-100"
                                        }`}
                                    >
                                        {Number(form.quantity) > 0
                                            ? "IN STOCK"
                                            : "OUT OF STOCK"}
                                    </span>

                                </div>

                                <p className="mt-6 text-xs font-bold uppercase tracking-wider text-emerald-200">
                                    Available inventory
                                </p>

                                <div className="mt-1 flex items-end gap-2">

                                    <span className="text-4xl font-black">
                                        {form.quantity || 0}
                                    </span>

                                    <span className="mb-1 text-sm font-bold text-emerald-100">
                                        {form.unit}
                                    </span>

                                </div>

                            </section>

                            {/* LIVE PREVIEW */}

                            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-5">

                                    <div className="flex items-center gap-2 text-emerald-700">

                                        <Eye size={17} />

                                        <span className="text-[11px] font-black uppercase tracking-wider">
                                            Listing preview
                                        </span>

                                    </div>

                                    <h3 className="mt-2 truncate text-lg font-black text-slate-900">
                                        {form.name ||
                                            "Your Product"}
                                    </h3>

                                </div>

                                <div className="p-5">

                                    <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">

                                        {existingImages[0] ? (
                                            <img
                                                src={
                                                    existingImages[0]
                                                }
                                                alt="Product preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : newImagePreviews[0] ? (
                                            <img
                                                src={
                                                    newImagePreviews[0]
                                                        .url
                                                }
                                                alt="New product preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center text-slate-300">

                                                <ImageIcon
                                                    size={40}
                                                    strokeWidth={1.4}
                                                />

                                                <p className="mt-3 text-xs font-semibold">
                                                    Product image
                                                </p>

                                            </div>
                                        )}

                                    </div>

                                    <div className="mt-5 space-y-3">

                                        <div className="flex items-center justify-between gap-3">

                                            <span className="text-xs text-slate-500">
                                                Category
                                            </span>

                                            <span className="max-w-[170px] truncate rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                                                {form.category ||
                                                    "Not selected"}
                                            </span>

                                        </div>

                                        <div className="flex items-center justify-between gap-3">

                                            <span className="text-xs text-slate-500">
                                                Price
                                            </span>

                                            <span className="font-black text-emerald-700">
                                                ₹
                                                {form.price
                                                    ? Number(
                                                          form.price
                                                      ).toLocaleString(
                                                          "en-IN"
                                                      )
                                                    : "0"}

                                                <span className="ml-1 text-[10px] font-medium text-slate-400">
                                                    / {form.unit}
                                                </span>
                                            </span>

                                        </div>

                                        <div className="flex items-center justify-between gap-3">

                                            <span className="text-xs text-slate-500">
                                                Stock
                                            </span>

                                            <span className="text-xs font-bold text-slate-800">
                                                {form.quantity ||
                                                    0}{" "}
                                                {form.unit}
                                            </span>

                                        </div>

                                        <div className="flex items-center justify-between gap-3">

                                            <span className="text-xs text-slate-500">
                                                Location
                                            </span>

                                            <span className="max-w-[170px] truncate text-right text-xs font-bold text-slate-800">
                                                {form.location ||
                                                    "Not added"}
                                            </span>

                                        </div>

                                        {form.isOrganic && (
                                            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[11px] font-bold text-emerald-700">

                                                <Leaf size={14} />

                                                Organic product

                                            </div>
                                        )}

                                    </div>

                                </div>

                            </section>

                            {/* ACTIONS */}

                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

                                <button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        deleting ||
                                        uploadingImages
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >

                                    {saving ||
                                    uploadingImages ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />

                                            {uploadingImages
                                                ? "Uploading images..."
                                                : "Saving changes..."}
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />

                                            Save Changes
                                        </>
                                    )}

                                </button>

                                <Link
                                    to="/farmer/dashboard"
                                    className="mt-3 flex w-full items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </Link>

                                <div className="my-5 border-t border-slate-100" />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowDeleteModal(
                                            true
                                        )
                                    }
                                    disabled={
                                        saving ||
                                        deleting
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 px-5 py-3.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Trash2 size={17} />

                                    Delete Product
                                </button>

                            </section>

                        </aside>

                    </div>
                </form>

            </main>

            {/* ==================================
                DELETE MODAL
            ================================== */}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">

                    <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

                        <div className="p-6 sm:p-7">

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                <Trash2 size={22} />
                            </div>

                            <h2 className="mt-5 text-xl font-black text-slate-900">
                                Delete this product?
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                This will permanently remove{" "}
                                <span className="font-bold text-slate-800">
                                    {form.name}
                                </span>{" "}
                                from your product listings. This action cannot
                                be undone.
                            </p>

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowDeleteModal(
                                            false
                                        )
                                    }
                                    disabled={deleting}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Keep Product
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >

                                    {deleting ? (
                                        <>
                                            <Loader2
                                                size={17}
                                                className="animate-spin"
                                            />

                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={17} />

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
};

export default FarmerEditProduct;