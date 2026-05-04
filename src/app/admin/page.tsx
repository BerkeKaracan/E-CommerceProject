"use client";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface ApiProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  is_discounted: number;
  discount_rate: number;
}

type TabType = "Products" | "Users" | "Orders" | "Promo Codes" | "Comments";
type SortDirection = "asc" | "desc" | null;

export default function AdminPanel() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const token = authContext?.token;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("Products");
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for sorting interaction logic
  const [sortKey, setSortKey] = useState<keyof ApiProduct | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const tabs: TabType[] = [
    "Products",
    "Users",
    "Orders",
    "Promo Codes",
    "Comments",
  ];

  // RBAC Security Gate
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.push("/");
      } else if (user.role !== "admin") {
        alert(
          "Access Denied: Only administrators can access this command center!",
        );
        router.push("/");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user, router]);

  // Fetch product data from secure admin API
  useEffect(() => {
    if (activeTab === "Products" && token) {
      const fetchProducts = async () => {
        setIsLoading(true);
        try {
          // Changed endpoint to /api/admin/products and added Authorization header
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!res.ok) throw new Error("Failed to fetch admin data");

          const data = await res.json();
          setProducts(data);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProducts();
    }
  }, [activeTab, token]); // Added token to dependency array

  // Handle data sorting based on column keys
  const handleSort = (key: keyof ApiProduct) => {
    let direction: "asc" | "desc" = "asc";
    if (sortKey === key && sortDirection === "asc") {
      direction = "desc";
    }
    setSortKey(key);
    setSortDirection(direction);

    const sorted = [...products].sort((a, b) => {
      const valA = a[key] ?? (typeof a[key] === "string" ? "" : 0);
      const valB = b[key] ?? (typeof b[key] === "string" ? "" : 0);

      if (typeof valA === "string" && typeof valB === "string") {
        return direction === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      const numA = Number(valA);
      const numB = Number(valB);

      return direction === "asc" ? numA - numB : numB - numA;
    });

    setProducts(sorted);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product completely?"))
      return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) setProducts(products.filter((p) => p.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 select-none">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Supabase <span className="text-emerald-500">Dashboard</span>
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Welcome back, {user.name}. Centralized data management.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Exit to Store
            </Link>
            {activeTab === "Products" && (
              <button className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all">
                + Add Product
              </button>
            )}
          </div>
        </header>

        {/* Tab Navigation Area */}
        <div className="flex border-b border-neutral-800 mb-6 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                activeTab === tab
                  ? "text-emerald-400"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Data Grid Section */}
        <div className="bg-[#111111] rounded-xl border border-neutral-800 overflow-hidden shadow-2xl">
          {activeTab === "Products" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-xs text-neutral-400 bg-[#161616] border-b border-neutral-800">
                  <tr>
                    {[
                      { key: "name", label: "Name" },
                      { key: "category", label: "Category" },
                      { key: "price", label: "Price" },
                      {
                        key: "image",
                        label: "Image Preview",
                        disableSort: true,
                      },
                      {
                        key: "description",
                        label: "Description",
                        disableSort: true,
                      },
                      { key: "discount_rate", label: "Discount" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() =>
                          !col.disableSort &&
                          handleSort(col.key as keyof ApiProduct)
                        }
                        className={`px-6 py-4 font-semibold ${!col.disableSort ? "cursor-pointer hover:text-white transition-colors" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          {col.label}
                          {sortKey === col.key && (
                            <span className="text-emerald-500">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-4 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-neutral-500"
                      >
                        Loading database records...
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-neutral-800/30 transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-white">
                          {p.name}
                        </td>
                        <td className="px-6 py-4 text-neutral-400">
                          <span className="px-2.5 py-1 bg-neutral-800 rounded-md text-xs">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-emerald-400 font-medium">
                          ${p.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          {/* Replaced <img> with Next.js <Image> component */}
                          <Image
                            src={p.image}
                            alt={p.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover rounded bg-neutral-800 border border-neutral-700"
                            unoptimized
                          />
                        </td>
                        <td
                          className="px-6 py-4 text-neutral-500 truncate max-w-[200px]"
                          title={p.description}
                        >
                          {p.description || "No description provided"}
                        </td>
                        <td className="px-6 py-4 text-neutral-400">
                          {p.is_discounted ? (
                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded text-xs">
                              %{p.discount_rate}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-red-500 hover:text-red-400 text-xs font-semibold px-3 py-1 rounded hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-neutral-500">
              <svg
                className="w-12 h-12 mb-4 opacity-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <p>
                Database endpoint for{" "}
                <strong className="text-white">{activeTab}</strong> is pending
                implementation.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
