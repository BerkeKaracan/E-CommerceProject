"use client";
import Link from "next/link";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import ProductCard, { Product } from "@/components/ProductCart";

export default function SalePage() {
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/products?price_filter=Discounted+Offers&limit=50`,
    )
      .then((res) => res.json())
      .then((data: Product[]) => {
        if (Array.isArray(data)) {
          setSaleProducts(data);
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
      {/* Premium Navbar */}
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
        {/* Sleek Header Section */}
        <div className="flex flex-col items-center justify-center mb-16 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-3 shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 dark:bg-red-500"></span>
            </span>
            Limited Time Offers
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-spc-grey dark:text-white tracking-tighter text-center transition-colors mb-4">
            Flash Sale
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium text-center max-w-lg transition-colors text-sm md:text-base leading-relaxed">
            Curated premium items at exceptional value. Discover our exclusive
            collection with up to 50% off. Once they are gone, they are gone.
          </p>
        </div>

        {/* Clean Product Grid using the new ProductCard Component */}
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-neutral-200 dark:border-neutral-800 border-t-spc-grey dark:border-t-white"></div>
          </div>
        ) : saleProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {saleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 transition-colors">
            <span className="text-4xl mb-4 grayscale opacity-50">🏷️</span>
            <p className="text-xs font-black uppercase tracking-widest">
              No active sales right now.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
