"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

interface ApiProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  is_discounted?: number;
  discount_rate?: number;
}

export default function SalePage() {
  const [saleProducts, setSaleProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
      .then((res) => res.json())
      .then((data: ApiProduct[]) => {
        if (Array.isArray(data)) {
          const discounted = data.filter(
            (p: ApiProduct) => p.is_discounted === 1,
          );
          setSaleProducts(discounted);
        } else {
          console.error("API Error: Expected an array but got:", data);
          setSaleProducts([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Sale fetch error:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col select-none transition-colors duration-300">
      {/* Navbar */}
      <nav className="shrink-0 z-50 bg-neutral-50 dark:bg-neutral-950 w-full shadow-sm border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 -ml-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="w-5 h-5 text-spc-grey dark:text-neutral-300 group-hover:-translate-x-1 transition-transform"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
              </Link>
              <Link
                href="/"
                className="text-2xl font-black tracking-tighter text-btn-green"
              >
                market
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {user && (
                <Link
                  href="/profile"
                  className="text-sm font-bold text-spc-grey dark:text-neutral-300 hover:text-btn-green transition-colors"
                >
                  Hi, {user.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-[1440px] mx-auto w-full px-4 lg:px-8 py-10 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center mb-12 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 border border-transparent dark:border-red-500/20 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Limited Time Offers
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-spc-grey dark:text-white tracking-tighter text-center transition-colors">
            Flash Sale <span className="text-red-500">🔥</span>
          </h1>
          <p className="text-neutral-400 dark:text-neutral-500 font-medium mt-3 text-center max-w-md transition-colors">
            Grab these exclusive deals before they are gone. Up to 50% off on
            premium items.
          </p>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 dark:border-neutral-800 border-t-red-500"></div>
          </div>
        ) : saleProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {saleProducts.map((product) => {
              const discountedPrice =
                product.price * (1 - (product.discount_rate || 0) / 100);
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="relative bg-white dark:bg-neutral-900 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 shadow-sm hover:shadow-[0_8px_30px_-4px_rgba(239,68,68,0.2)] dark:hover:border-red-500/50 hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-md z-20 shadow-md">
                    -{product.discount_rate}%
                  </div>
                  <div className="aspect-square w-full bg-neutral-50 dark:bg-neutral-800 rounded-xl mb-4 shrink-0 flex items-center justify-center overflow-hidden relative group-hover:bg-neutral-100 dark:group-hover:bg-neutral-700 transition-colors">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <p className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase tracking-widest mb-1 text-center">
                    {product.category}
                  </p>
                  <h3 className="text-sm font-bold text-spc-grey dark:text-neutral-200 mb-2 text-center truncate w-full group-hover:text-red-500 transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-auto flex flex-col items-center">
                    <p className="text-xs font-bold text-neutral-400 line-through decoration-red-500/50 mb-0.5">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-lg font-black text-red-500 dark:text-red-400">
                      ${discountedPrice.toFixed(2)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 transition-colors">
            <span className="text-4xl mb-4">🛒</span>
            <p className="text-sm font-bold uppercase tracking-widest">
              No active sales right now.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
