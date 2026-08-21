"use client";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { getPublicApiUrl } from "@/lib/api";

interface ProductFormData {
  name: string;
  category: string;
  price: number | "";
  image: string;
  description: string;
  is_discounted: number;
  discount_rate: number | "";
}

export default function AddProductPage() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const token = authContext?.token;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([
    "Electronics",
    "Clothing",
    "Home",
    "Accessories",
  ]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category: "Electronics",
    price: "",
    image: "",
    description: "",
    is_discounted: 0,
    discount_rate: "",
  });

  // RBAC Security Gate
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.push("/");
      } else if (user.role !== "admin") {
        toast.error("Access Denied: Only administrators can access this area!");
        router.push("/");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user, router]);

  useEffect(() => {
    fetch(`${getPublicApiUrl()}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCategories(data);
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked ? 1 : 0,
        discount_rate: checked ? prev.discount_rate : "", // Reset rate if unchecked
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price) || 0,
        discount_rate: Number(formData.discount_rate) || 0,
      };

      const res = await fetch(
        `${getPublicApiUrl()}/api/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to create product");
      }

      toast.success("Product successfully added to inventory!");
      router.push("/admin");
    } catch {
      toast.error("Error adding product. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Add New <span className="text-emerald-500">Product</span>
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Expand your inventory catalog.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Column: Image Preview (Bento Box) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-[#111111] border border-neutral-800 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[300px]">
              {formData.image ? (
                <Image
                  src={formData.image}
                  alt="Product Preview"
                  fill
                  className="object-contain p-4"
                  unoptimized
                />
              ) : (
                <div className="text-neutral-500 flex flex-col items-center">
                  <svg
                    className="w-16 h-16 mb-4 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="font-medium">Image Preview</p>
                  <p className="text-xs mt-1">
                    Paste a URL to see the image here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Form Inputs (Bento Box) */}
          <div className="lg:col-span-7 bg-[#111111] border border-neutral-800 rounded-xl p-6 md:p-8 shadow-2xl">
            <div className="space-y-6">
              {/* Name & Category Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Product Name
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Premium AI Watch"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Image URL Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Price ($)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="299.99"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Image URL
                  </label>
                  <input
                    required
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  required
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the product details..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                ></textarea>
              </div>

              {/* Discount Section */}
              <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_discounted"
                    name="is_discounted"
                    checked={formData.is_discounted === 1}
                    onChange={handleChange}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="is_discounted"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Apply a discount to this product?
                  </label>
                </div>

                {formData.is_discounted === 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase">
                      Discount Rate (%)
                    </label>
                    <input
                      required={formData.is_discounted === 1}
                      type="number"
                      min="1"
                      max="99"
                      name="discount_rate"
                      value={formData.discount_rate}
                      onChange={handleChange}
                      placeholder="20"
                      className="w-20 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                disabled={isLoading}
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-bold tracking-widest uppercase shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? "Adding Product..." : "Create Product"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
