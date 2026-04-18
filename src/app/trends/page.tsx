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
  sales_count?: number; // Sales count from backend
}

export default function TrendsPage() {
  const [trendingProducts, setTrendingProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/trending`)
      .then((res) => res.json())
      .then((data) => {
        if (data.best_sellers) {
          setTrendingProducts(data.best_sellers);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Trending fetch error:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col select-none transition-colors duration-300">
      {/* Simple Navbar - Return */}
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
                  className="text-sm font-bold text-spc-grey dark:text-neutral-300 hover:text-btn-green dark:hover:text-btn-green transition-colors"
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
          <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 border border-transparent dark:border-orange-500/20 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Live Analytics
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-spc-grey dark:text-white tracking-tighter text-center transition-colors">
            Trending Now <span className="text-orange-500">🔥</span>
          </h1>
          <p className="text-neutral-400 dark:text-neutral-500 font-medium mt-3 text-center max-w-md transition-colors">
            Our most popular and highest-selling products, updated in real-time
            based on customer orders.
          </p>
        </div>

        {/* Leaderboard (Products) */}
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-btn-green"></div>
          </div>
        ) : trendingProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.map((product, index) => (
              <div
                key={product.id}
                className="relative bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5 shadow-sm hover:shadow-xl dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-all duration-300 flex flex-col group overflow-hidden"
              >
                <div
                  className={`absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black z-10 shadow-md ${index === 0 ? "bg-yellow-400 text-white dark:text-neutral-900" : index === 1 ? "bg-neutral-300 dark:bg-neutral-600 text-white" : index === 2 ? "bg-orange-300 dark:bg-orange-700 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500"}`}
                >
                  #{index + 1}
                </div>
                <Link
                  href={`/product/${product.id}`}
                  className="flex flex-col items-center flex-1 cursor-pointer group/link w-full"
                >
                  <div className="aspect-square w-full bg-neutral-50 dark:bg-neutral-800 rounded-2xl mb-5 shrink-0 flex items-center justify-center overflow-hidden relative group-hover:bg-neutral-100 dark:group-hover:bg-neutral-700 transition-colors">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover object-center group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>

                  <div className="flex flex-col items-center flex-1">
                    <p className="text-[10px] text-category-blue dark:text-neutral-400 font-bold uppercase tracking-widest mb-1.5 transition-colors">
                      {product.category}
                    </p>
                    <h3 className="text-lg font-black text-spc-grey dark:text-neutral-200 mb-2 text-center leading-tight hover:text-green-400 dark:hover:text-btn-green transition-colors">
                      {product.name}
                    </h3>
                  </div>
                </Link>
                <div className="flex flex-col items-center flex-1">
                  <p className="text-xl font-black text-btn-green mt-auto">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <div className="mt-4 w-full bg-orange-50 dark:bg-orange-900/20 rounded-xl py-2 flex items-center justify-center gap-2 transition-colors border border-transparent dark:border-orange-500/10">
                    <span className="text-orange-500 text-xs">📈</span>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider transition-colors">
                      Purchased {product.sales_count || 0} times
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 transition-colors">
            <span className="text-4xl mb-4">📭</span>
            <p className="text-sm font-bold uppercase tracking-widest">
              No trend data available yet.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
