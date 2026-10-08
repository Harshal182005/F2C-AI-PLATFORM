import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Upload,
    X,
    Image as ImageIcon,
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Package,
    MapPin,
    IndianRupee,
    Leaf,
    Boxes,
    ChevronDown,
    WandSparkles
} from "lucide-react";

import API from "../../services/api";

// ==========================================
// CONSTANTS
// ==========================================

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

const FarmerAddProduct = () => {
    const navigate = useNavigate();

    // ==========================================
    // FORM STATE
    // ==========================================

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        description: "",
        price: "",
        quantity: "",
        unit: "kg",
        location: "",
        isOrganic: false
    });

    // ==========================================
    // IMAGE STATE
    // ==========================================

    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    // ==========================================
    // AI STATE
    // ==========================================

    const [generatingDescription, setGeneratingDescription] =
        useState(false);

    // ==========================================
    // SUBMIT STATE
    // ==========================================

    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

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

        setFormData((previous) => ({
            ...previous,
            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));

        setErrorMessage("");
        setSuccessMessage("");
    };

    // ==========================================
    // IMAGE SELECTION
    // ==========================================

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);

        if (!files.length) {
            return;
        }

        setErrorMessage("");
        setSuccessMessage("");

        const remainingSlots =
            MAX_IMAGES - selectedImages.length;

        if (remainingSlots <= 0) {
            setErrorMessage(
                `You can upload a maximum of ${MAX_IMAGES} images.`
            );

            e.target.value = "";
            return;
        }

        const filesToAdd =
            files.slice(0, remainingSlots);

        for (const file of filesToAdd) {
            if (!file.type.startsWith("image/")) {
                setErrorMessage(
                    "Only image files are allowed."
                );

                e.target.value = "";
                return;
            }

            if (file.size > MAX_IMAGE_SIZE) {
                setErrorMessage(
                    "Each image must be smaller than 5MB."
                );

                e.target.value = "";
                return;
            }
        }

        setSelectedImages((previous) => [
            ...previous,
            ...filesToAdd
        ]);

        const previews = filesToAdd.map((file) =>
            URL.createObjectURL(file)
        );

        setImagePreviews((previous) => [
            ...previous,
            ...previews
        ]);

        e.target.value = "";
    };

    // ==========================================
    // REMOVE IMAGE
    // ==========================================

    const removeImage = (index) => {
        setSelectedImages((previous) =>
            previous.filter(
                (_, imageIndex) =>
                    imageIndex !== index
            )
        );

        setImagePreviews((previous) => {
            const previewToRemove = previous[index];

            if (previewToRemove) {
                URL.revokeObjectURL(
                    previewToRemove
                );
            }

            return previous.filter(
                (_, imageIndex) =>
                    imageIndex !== index
            );
        });

        setErrorMessage("");
    };

    // ==========================================
    // VALIDATION
    // ==========================================

    const validateForm = () => {
        if (!formData.name.trim()) {
            return "Please enter the product name.";
        }

        if (!formData.category) {
            return "Please select a category.";
        }

        if (
            !formData.price ||
            Number(formData.price) <= 0
        ) {
            return "Please enter a valid price.";
        }

        if (
            !formData.quantity ||
            Number(formData.quantity) <= 0
        ) {
            return "Please enter a valid quantity.";
        }

        if (!formData.unit) {
            return "Please select a unit.";
        }

        if (!formData.location.trim()) {
            return "Please enter the farm location.";
        }

        if (!formData.description.trim()) {
            return "Please add a description or generate one using AI.";
        }

        return null;
    };

    // ==========================================
    // AI PRODUCT DESCRIPTION
    // ==========================================

    const handleGenerateDescription = async () => {
        setErrorMessage("");
        setSuccessMessage("");

        if (!formData.name.trim()) {
            setErrorMessage(
                "Please enter the product name first."
            );

            return;
        }

        setGeneratingDescription(true);

        try {
            const token =
                localStorage.getItem(
                    "farmerToken"
                );

            if (!token) {
                throw new Error(
                    "Farmer session not found. Please login again."
                );
            }

            const response = await API.post(
                "/ai/product-description",
                {
                    name: formData.name.trim(),
                    category: formData.category,
                    location:
                        formData.location.trim(),
                    isOrganic:
                        formData.isOrganic
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Failed to generate description."
                );
            }

            const generatedDescription =
                response.data?.description?.trim();

            if (!generatedDescription) {
                throw new Error(
                    "AI returned an empty description."
                );
            }

            setFormData((previous) => ({
                ...previous,
                description:
                    generatedDescription
            }));

            setSuccessMessage(
                "AI description generated successfully. You can edit it before publishing."
            );
        } catch (error) {
            console.error(
                "AI DESCRIPTION ERROR:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                error.message ||
                "Failed to generate AI description."
            );
        } finally {
            setGeneratingDescription(false);
        }
    };

    // ==========================================
    // SUBMIT PRODUCT
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        const validationError =
            validateForm();

        if (validationError) {
            setErrorMessage(
                validationError
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            return;
        }

        setSubmitting(true);

        try {
            const token =
                localStorage.getItem(
                    "farmerToken"
                );

            if (!token) {
                throw new Error(
                    "Farmer session not found. Please login again."
                );
            }

            // ==================================
            // CREATE MULTIPART FORM DATA
            // ==================================

            const data = new FormData();

            data.append(
                "name",
                formData.name.trim()
            );

            data.append(
                "category",
                formData.category
            );

            data.append(
                "description",
                formData.description.trim()
            );

            data.append(
                "price",
                String(Number(formData.price))
            );

            data.append(
                "quantity",
                String(Number(formData.quantity))
            );

            data.append(
                "unit",
                formData.unit
            );

            data.append(
                "location",
                formData.location.trim()
            );

            data.append(
                "isOrganic",
                String(formData.isOrganic)
            );

            data.append(
                "isAvailable",
                "true"
            );

            // ==================================
            // ADD IMAGE FILES
            // ==================================

            for (const image of selectedImages) {
                data.append(
                    "images",
                    image
                );
            }

            // ==================================
            // CREATE PRODUCT
            // ==================================

            const response = await API.post(
                "/products",
                data,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Failed to create product."
                );
            }

            setSuccessMessage(
                "Product published successfully!"
            );

            // Release preview URLs
            imagePreviews.forEach((preview) => {
                URL.revokeObjectURL(preview);
            });

            setTimeout(() => {
                navigate(
                    "/farmer/dashboard"
                );
            }, 1200);

        } catch (error) {
            console.error(
                "ADD PRODUCT ERROR:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                error.message ||
                "Failed to publish product."
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } finally {
            setSubmitting(false);
            setUploadingImages(false);
        }
    };

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
                        className="group flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white transition group-hover:border-emerald-200 group-hover:bg-emerald-50">
                            <ArrowLeft size={18} />
                        </span>

                        <span className="hidden sm:block">
                            Back to Dashboard
                        </span>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-xs font-medium text-slate-400">
                                Farmer Portal
                            </p>

                            <p className="text-sm font-bold text-slate-800">
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

                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                            <Sparkles size={14} />
                            Smart Product Listing
                        </div>

                        <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                            Add a new product
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                            Showcase your farm-fresh products
                            directly to customers. Create a
                            professional product description
                            with AI in seconds.
                        </p>

                    </div>
                </section>

                {/* ==================================
                    ALERTS
                ================================== */}

                {errorMessage && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        <AlertCircle
                            className="mt-0.5 shrink-0"
                            size={20}
                        />

                        <div>
                            <p className="font-bold">
                                Something went wrong
                            </p>

                            <p className="mt-1 text-sm">
                                {errorMessage}
                            </p>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                        <CheckCircle2
                            className="mt-0.5 shrink-0"
                            size={20}
                        />

                        <div>
                            <p className="font-bold">
                                Success
                            </p>

                            <p className="mt-1 text-sm">
                                {successMessage}
                            </p>
                        </div>
                    </div>
                )}

                {/* ==================================
                    FORM
                ================================== */}

                <form
                    onSubmit={handleSubmit}
                    className="grid gap-8 lg:grid-cols-[1fr_340px]"
                >

                    {/* ==================================
                        LEFT COLUMN
                    ================================== */}

                    <div className="space-y-8">

                        {/* PRODUCT INFORMATION */}

                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

                            <div className="mb-7 flex items-start gap-4">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                    <Package size={21} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-slate-900">
                                        Product information
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Tell customers what you're selling.
                                    </p>
                                </div>

                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">

                                {/* PRODUCT NAME */}

                                <div className="sm:col-span-2">

                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Product name
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Fresh Organic Tomatoes"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
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
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
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

                                {/* LOCATION */}

                                <div>

                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Farm location
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
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder="e.g. Nashik, Maharashtra"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                        />

                                    </div>
                                </div>

                            </div>
                        </section>

                        {/* PRICING */}

                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

                            <div className="mb-7 flex items-start gap-4">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                    <IndianRupee size={21} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-slate-900">
                                        Pricing & inventory
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Set your selling price and available stock.
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
                                            name="price"
                                            min="0"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                        />

                                    </div>

                                    <p className="mt-2 text-xs text-slate-400">
                                        Price per selected unit
                                    </p>

                                </div>

                                {/* QUANTITY */}

                                <div>

                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Available quantity
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">

                                        <input
                                            type="number"
                                            name="quantity"
                                            min="0"
                                            step="0.01"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                                        />

                                        <select
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleChange}
                                            className="border-l border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
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

                                    </div>
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
                                            Mark this product as organically grown.
                                        </p>
                                    </div>

                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData(
                                            (previous) => ({
                                                ...previous,
                                                isOrganic:
                                                    !previous.isOrganic
                                            })
                                        )
                                    }
                                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                                        formData.isOrganic
                                            ? "bg-emerald-600"
                                            : "bg-slate-300"
                                    }`}
                                >
                                    <span
                                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                                            formData.isOrganic
                                                ? "left-6"
                                                : "left-1"
                                        }`}
                                    />
                                </button>

                            </div>
                        </section>

                        {/* DESCRIPTION + AI */}

                        <section className="rounded-3xl border border-violet-200 bg-white p-5 shadow-sm sm:p-7">

                            <div className="mb-6 flex items-start gap-4">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                                    <WandSparkles size={21} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-slate-900">
                                        Product description
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Write your own description or let AI create one for you.
                                    </p>
                                </div>

                            </div>

                            <div className="mb-5 overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-emerald-50">

                                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">

                                    <div className="flex items-start gap-3">

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                                            <Sparkles size={19} />
                                        </div>

                                        <div>
                                            <p className="text-sm font-black text-slate-900">
                                                Generate description with AI
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                AI will create a customer-friendly description from your product details.
                                            </p>
                                        </div>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            handleGenerateDescription
                                        }
                                        disabled={
                                            generatingDescription ||
                                            submitting ||
                                            !formData.name.trim()
                                        }
                                        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                    >

                                        {generatingDescription ? (
                                            <>
                                                <Loader2
                                                    size={18}
                                                    className="animate-spin"
                                                />

                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />

                                                Generate with AI
                                            </>
                                        )}

                                    </button>

                                </div>

                                {!formData.name.trim() && (
                                    <div className="border-t border-violet-100 bg-violet-50/70 px-5 py-3 text-xs font-medium text-violet-700">
                                        Enter a product name above to enable AI generation.
                                    </div>
                                )}

                            </div>

                            <div>

                                <div className="mb-2 flex items-center justify-between">

                                    <label className="text-sm font-bold text-slate-700">
                                        Description
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    {formData.description && (
                                        <span className="text-xs font-medium text-emerald-600">
                                            Editable
                                        </span>
                                    )}

                                </div>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={8}
                                    placeholder="Describe freshness, quality, harvesting, farming practices, and other useful details..."
                                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                                />

                                <div className="mt-2 flex items-center justify-between">

                                    <p className="text-xs text-slate-400">
                                        You can edit the AI-generated text before publishing.
                                    </p>

                                    <p className="text-xs font-medium text-slate-400">
                                        {formData.description.length} characters
                                    </p>

                                </div>

                            </div>

                        </section>

                        {/* IMAGE UPLOAD */}

                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

                            <div className="mb-7 flex items-start gap-4">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                    <ImageIcon size={21} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-slate-900">
                                        Product images
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Upload clear images of your product.
                                    </p>
                                </div>

                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">

                                {imagePreviews.map(
                                    (preview, index) => (
                                        <div
                                            key={`${preview}-${index}`}
                                            className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                                        >

                                            <img
                                                src={preview}
                                                alt={`Product ${index + 1}`}
                                                className="h-full w-full object-cover"
                                            />

                                            {index === 0 && (
                                                <span className="absolute bottom-2 left-2 rounded-lg bg-black/65 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
                                                    Cover
                                                </span>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeImage(
                                                        index
                                                    )
                                                }
                                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                                            >
                                                <X size={15} />
                                            </button>

                                        </div>
                                    )
                                )}

                                {selectedImages.length <
                                    MAX_IMAGES && (
                                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-emerald-400 hover:bg-emerald-50">

                                        <Upload
                                            size={22}
                                            className="mb-2 text-slate-400"
                                        />

                                        <span className="text-xs font-bold text-slate-600">
                                            Add image
                                        </span>

                                        <span className="mt-1 text-[10px] text-slate-400">
                                            Max 5MB
                                        </span>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={
                                                handleImageSelect
                                            }
                                            className="hidden"
                                        />

                                    </label>
                                )}

                            </div>

                            <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400">

                                <ImageIcon
                                    size={14}
                                    className="mt-0.5 shrink-0"
                                />

                                <span>
                                    Upload up to 5 images.
                                    The first image will
                                    become the product cover.
                                </span>

                            </div>

                        </section>

                    </div>

                    {/* ==================================
                        RIGHT COLUMN
                    ================================== */}

                    <aside className="lg:sticky lg:top-24 lg:h-fit">

                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                            {/* PREVIEW HEADER */}

                            <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-6">

                                <div className="mb-2 flex items-center gap-2 text-emerald-700">
                                    <Boxes size={18} />

                                    <span className="text-xs font-black uppercase tracking-wider">
                                        Listing Preview
                                    </span>
                                </div>

                                <h3 className="text-xl font-black text-slate-900">
                                    {formData.name ||
                                        "Your Product"}
                                </h3>

                            </div>

                            {/* PREVIEW */}

                            <div className="p-6">

                                <div className="mb-5 aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">

                                    {imagePreviews[0] ? (
                                        <img
                                            src={
                                                imagePreviews[0]
                                            }
                                            alt="Product preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center text-slate-300">

                                            <ImageIcon
                                                size={42}
                                                strokeWidth={1.4}
                                            />

                                            <p className="mt-3 text-xs font-semibold">
                                                Product image
                                            </p>

                                        </div>
                                    )}

                                </div>

                                <div className="space-y-4">

                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-slate-500">
                                            Category
                                        </span>

                                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                            {formData.category ||
                                                "Not selected"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">

                                        <span className="text-sm text-slate-500">
                                            Price
                                        </span>

                                        <span className="text-lg font-black text-emerald-700">
                                            ₹
                                            {formData.price
                                                ? Number(
                                                      formData.price
                                                  ).toLocaleString(
                                                      "en-IN"
                                                  )
                                                : "0"}

                                            <span className="ml-1 text-xs font-medium text-slate-400">
                                                / {formData.unit}
                                            </span>
                                        </span>

                                    </div>

                                    <div className="flex items-center justify-between gap-3">

                                        <span className="text-sm text-slate-500">
                                            Stock
                                        </span>

                                        <span className="text-sm font-bold text-slate-800">
                                            {formData.quantity ||
                                                "0"}{" "}
                                            {formData.unit}
                                        </span>

                                    </div>

                                    <div className="flex items-center justify-between gap-3">

                                        <span className="text-sm text-slate-500">
                                            Location
                                        </span>

                                        <span className="max-w-[180px] truncate text-right text-sm font-semibold text-slate-800">
                                            {formData.location ||
                                                "Not added"}
                                        </span>

                                    </div>

                                    {formData.isOrganic && (
                                        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700">

                                            <Leaf size={15} />

                                            Organic product

                                        </div>
                                    )}

                                    {formData.description && (
                                        <div className="rounded-xl bg-slate-50 p-3">

                                            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                Description
                                            </p>

                                            <p className="line-clamp-4 text-xs leading-5 text-slate-600">
                                                {
                                                    formData.description
                                                }
                                            </p>

                                        </div>
                                    )}

                                </div>

                            </div>

                            {/* PUBLISH */}

                            <div className="border-t border-slate-100 p-5">

                                <button
                                    type="submit"
                                    disabled={
                                        submitting ||
                                        uploadingImages ||
                                        generatingDescription
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >

                                    {submitting ||
                                    uploadingImages ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />

                                            Publishing product...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2
                                                size={18}
                                            />

                                            Publish Product
                                        </>
                                    )}

                                </button>

                                <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                                    Your product will become
                                    available to customers after
                                    successful publishing.
                                </p>

                            </div>

                        </div>

                    </aside>

                </form>
            </main>
        </div>
    );
};

export default FarmerAddProduct;