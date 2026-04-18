"use client";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ApiProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  sales_count: number;
}

export default function AdminPanel() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const token = authContext?.token;
  const router = useRouter();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // SECURITY WALL: Only Admin (testuser) can access
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.push("/");
      } else if (
        user.name !== "testuser" &&
        user.email !== "testuser@gmail.com"
      ) {
        alert(
          "Access Denied: Only administrators can access this command center!",
        );
        router.push("/");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [user, router]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

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

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete product! Backend API error.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-neutral-900 text-white p-6 md:p-12 select-none">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-3xl font-black text-btn-green uppercase tracking-widest">
              Command Center
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Welcome back,{" "}
              <span className="text-white font-bold">{user.name}</span>. All
              inventory is under your control.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Back to Store
            </Link>
            <button
              className="px-6 py-2.5 bg-btn-green hover:bg-green-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-btn-green/20 transition-all active:scale-95 opacity-50 cursor-not-allowed"
              title="Coming Soon"
            >
              + Add Product
            </button>
          </div>
        </header>

        <div className="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-neutral-700 flex justify-between items-center">
            <h2 className="text-lg font-bold">
              Active Inventory ({products.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-neutral-400 uppercase bg-neutral-900/50">
                <tr>
                  <th className="px-6 py-4 font-bold">ID</th>
                  <th className="px-6 py-4 font-bold">Product Name</th>
                  <th className="px-6 py-4 font-bold">Category</th>
                  <th className="px-6 py-4 font-bold">Price</th>
                  <th className="px-6 py-4 font-bold">Sales</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-neutral-500"
                    >
                      Fetching inventory...
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-neutral-700/50 hover:bg-neutral-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-neutral-400">#{p.id}</td>
                      <td className="px-6 py-4 font-bold">{p.name}</td>
                      <td className="px-6 py-4 text-category-blue uppercase text-[10px] tracking-wider font-black">
                        {p.category}
                      </td>
                      <td className="px-6 py-4 font-bold text-btn-green">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-orange-400 font-bold">
                        {p.sales_count || 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded text-[10px] font-black uppercase tracking-widest transition-colors"
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
        </div>
      </div>
    </main>
  );
}
