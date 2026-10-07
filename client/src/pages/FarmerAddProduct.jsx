import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function FarmerAddProduct() {
    const navigate = useNavigate();

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

    const [images, setImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const categories = [
        "Vegetables",
        "Fruits",
        "Grains",
        "Pulses",
        "Dairy",
        "Spices",
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

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleOrganicChange = (e) => {
        setFormData((previous) => ({
            ...previous,
            isOrganic: e.target.checked
        }));
    };

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        if (selectedFiles.length === 0) {
            return;
        }

        if (selectedFiles.length > 5) {
            setError("You can upload a maximum of 5 images.");
            return;
        }

        const invalidFile = selectedFiles.find(
            (file) => !file.type.startsWith("image/")
        );

        if (invalidFile) {
            setError("Only image files are allowed.");
            return;
        }

        const tooLarge = selectedFiles.find(
            (file) => file.size > 5 * 1024 * 1024
        );

        if (tooLarge) {
            setError("Each image must be smaller than 5MB.");
            return;
        }

        setError("");

        setImages(selectedFiles);

        const previews = selectedFiles.map((file) =>
            URL.createObjectURL(file)
        );

        setPreviewImages(previews);
    };

    const removeImage = (index) => {
        setImages((previous) =>
            previous.filter((_, imageIndex) => imageIndex !== index)
        );

        setPreviewImages((previous) =>
            previous.filter((_, imageIndex) => imageIndex !== index)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !formData.name ||
            !formData.category ||
            !formData.price ||
            !formData.quantity ||
            !formData.location
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        if (Number(formData.price) < 0) {
            setError("Price cannot be negative.");
            return;
        }

        if (Number(formData.quantity) <= 0) {
            setError("Quantity must be greater than 0.");
            return;
        }

        if (images.length === 0) {
            setError("Please upload at least one product image.");
            return;
        }

        try {
            setLoading(true);

            const token = localStorage.getItem("farmerToken");

            if (!token) {
                navigate("/farmer/login");
                return;
            }

            const data = new FormData();

            data.append("name", formData.name);
            data.append("category", formData.category);
            data.append("description", formData.description);
            data.append("price", formData.price);
            data.append("quantity", formData.quantity);
            data.append("unit", formData.unit);
            data.append("location", formData.location);
            data.append("isOrganic", formData.isOrganic);

            images.forEach((image) => {
                data.append("images", image);
            });

            const response = await API.post(
                "/products",
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setSuccess(
                response.data.message ||
                "Product added successfully."
            );

            setTimeout(() => {
                navigate("/farmer/dashboard");
            }, 1000);

        } catch (error) {
            console.error("Add product error:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("farmerToken");
                localStorage.removeItem("farmerUser");

                navigate("/farmer/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to add product. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f8f2]">

            {/* Navbar */}
            <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-xl">

                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

                    <Link
                        to="/farmer/dashboard"
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-700 text-xl text-white shadow-sm">
                            🌱
                        </div>

                        <div>
                            <p className="text-lg font-extrabold text-gray-900">
                                F2C
                            </p>

                            <p className="text-[11px] font-medium text-gray-500">
                                Farmer Portal
                            </p>
                        </div>
                    </Link>

                    <Link
                        to="/farmer/dashboard"
                        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-green-300 hover:text-green-700"
                    >
                        ← Dashboard
                    </Link>

                </div>

            </header>

            {/* Main */}
            <main className="mx-auto max-w-5xl px-5 py-8 sm:py-12">

                {/* Heading */}
                <div className="mb-8">

                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-700">
                        Farmer Inventory
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        Add New Product
                    </h1>

                    <p className="mt-2 max-w-2xl text-gray-500">
                        List your fresh farm products and make them available
                        to customers across F2C.
                    </p>

                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-xl"
                >

                    {/* Product information */}
                    <div className="border-b border-gray-100 p-6 sm:p-9">

                        <div className="mb-7">

                            <h2 className="text-xl font-extrabold text-gray-900">
                                Product Information
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Tell customers about what you're selling.
                            </p>

                        </div>

                        {error && (
                            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                                ⚠️ {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
                                ✓ {success}
                            </div>
                        )}

                        <div className="grid gap-6 sm:grid-cols-2">

                            {/* Name */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Product Name *
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Fresh Tomatoes"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Category *
                                </label>

                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                                >
                                    <option value="">
                                        Select category
                                    </option>

                                    {categories.map((category) => (
                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div className="sm:col-span-2">

                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="5"
                                    placeholder="Describe the quality, freshness, farming method, etc."
                                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                                />

                            </div>

                            {/* Price */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Price *
                                </label>

                                <div className="relative">

                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        name="price"
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-9 pr-4 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                                    />

                                </div>

                                <p className="mt-2 text-xs text-gray-400">
                                    Price per selected unit
                                </p>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Available Quantity *
                                </label>

                                <input
                                    type="number"
                                    name="quantity"
                                    min="1"
                                    step="0.01"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="e.g. 100"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                                />
                            </div>

                            {/* Unit */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Unit *
                                </label>

                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                                >
                                    {units.map((unit) => (
                                        <option
                                            key={unit}
                                            value={unit}
                                        >
                                            {unit}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Farm Location *
                                </label>

                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Nashik, Maharashtra"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                                />
                            </div>

                        </div>

                        {/* Organic */}
                        <div className="mt-7 rounded-2xl border border-green-100 bg-green-50/70 p-5">

                            <label className="flex cursor-pointer items-start gap-4">

                                <input
                                    type="checkbox"
                                    checked={formData.isOrganic}
                                    onChange={handleOrganicChange}
                                    className="mt-1 h-5 w-5 accent-green-700"
                                />

                                <div>
                                    <p className="font-bold text-gray-900">
                                        🌿 This is an organic product
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Mark this product as organic so
                                        customers can easily identify it.
                                    </p>
                                </div>

                            </label>

                        </div>

                    </div>

                    {/* Images */}
                    <div className="border-b border-gray-100 p-6 sm:p-9">

                        <div className="mb-7">

                            <h2 className="text-xl font-extrabold text-gray-900">
                                Product Images
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Upload up to 5 high-quality images. The first
                                image will be the main product image.
                            </p>

                        </div>

                        {/* Upload */}
                        <label className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center transition hover:border-green-400 hover:bg-green-50">

                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm transition group-hover:scale-105">
                                📷
                            </div>

                            <p className="mt-5 font-bold text-gray-900">
                                Click to upload product images
                            </p>

                            <p className="mt-2 text-sm text-gray-500">
                                PNG, JPG or JPEG · Maximum 5MB each
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                                Up to 5 images
                            </p>

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                            />

                        </label>

                        {/* Previews */}
                        {previewImages.length > 0 && (
                            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">

                                {previewImages.map((image, index) => (
                                    <div
                                        key={image}
                                        className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                                    >

                                        <img
                                            src={image}
                                            alt={`Preview ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />

                                        {index === 0 && (
                                            <span className="absolute left-2 top-2 rounded-full bg-green-700 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                                                MAIN
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                                        >
                                            ×
                                        </button>

                                    </div>
                                ))}

                            </div>
                        )}

                    </div>

                    {/* Submit */}
                    <div className="flex flex-col gap-3 bg-gray-50/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">

                        <div>
                            <p className="text-sm font-bold text-gray-900">
                                Ready to list your product?
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                Your product will become visible on the F2C
                                marketplace.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">

                            <Link
                                to="/farmer/dashboard"
                                className="rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-center text-sm font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl bg-green-700 px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Uploading Product..."
                                    : "Publish Product →"}
                            </button>

                        </div>

                    </div>

                </form>

            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 bg-white">

                <div className="mx-auto max-w-7xl px-5 py-8 text-center text-sm text-gray-500">
                    F2C Farmer Portal · Fresh products, directly from the farm.
                </div>

            </footer>

        </div>
    );
}

export default FarmerAddProduct;