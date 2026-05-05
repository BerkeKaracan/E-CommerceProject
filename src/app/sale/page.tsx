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

        {/* Clean Product Grid */}
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-neutral-200 dark:border-neutral-800 border-t-spc-grey dark:border-t-white"></div>
          </div>
        ) : saleProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {saleProducts.map((product) => {
              const discountedPrice =
                product.price * (1 - (product.discount_rate || 0) / 100);

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="relative bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5 shadow-sm hover:shadow-xl dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-all duration-500 flex flex-col group"
                >
                  {/* Premium Discount Badge */}
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-[11px] font-black px-3 py-1.5 rounded-lg z-20 shadow-md flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3 h-3"
                    >
                      <path
                        fillRule="evenodd"
                        d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.688.948.991.22.189.546.201.77.04a8.62 8.62 0 002.959-5.35c.041-.274.273-.473.55-.473.166 0 .324.08.42.22.14.21.282.421.425.632.176.259.45.367.744.253A7.08 7.08 0 0113.5 4.938zM14 12a4 4 0 01-4 4c-1.913 0-3.52-1.398-3.91-3.182-.093-.429.44-.656.73-.35a4.004 4.004 0 004.614.394c.31-.19.702.046.685.405A4.002 4.002 0 0014 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {product.discount_rate}%
                  </div>

                  <div className="aspect-square w-full bg-neutral-50 dark:bg-neutral-800 rounded-2xl mb-5 shrink-0 flex items-center justify-center overflow-hidden relative group-hover:bg-neutral-100 dark:group-hover:bg-neutral-700 transition-colors">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>

                  <div className="flex flex-col items-center flex-1">
                    <p className="text-[10px] text-category-blue dark:text-neutral-500 font-bold uppercase tracking-widest mb-1.5 transition-colors">
                      {product.category}
                    </p>
                    <h3 className="text-base font-black text-spc-grey dark:text-neutral-200 mb-4 text-center leading-tight group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* Pricing Section */}
                  <div className="mt-auto flex flex-col items-center pt-4 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-neutral-400 line-through decoration-red-500/50">
                        ${product.price.toFixed(2)}
                      </p>
                      <p className="text-xl font-black text-red-600 dark:text-red-400">
                        ${discountedPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
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
