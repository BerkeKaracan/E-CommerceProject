"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { getPublicApiUrl } from "@/lib/api";
import type { ApiProduct } from "@/types/product";

export default function TrendsPage() {
  const [trendingProducts, setTrendingProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [showMore, setShowMore] = useState(false);

  const fetchTrends = () => {
    setIsLoading(true);
    setHasError(false);
    fetch(`${getPublicApiUrl()}/api/analytics/trending`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load trends");
        return res.json();
      })
      .then((data) => {
        if (data.best_sellers) {
          setTrendingProducts(data.best_sellers);
        }
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  return (
    <main className="bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-[1440px] mx-auto w-full px-4 lg:px-8 py-10 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] mb-4">
            Live Analytics
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-spc-grey dark:text-white tracking-tight text-center">
            Trending Now
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-3 text-center max-w-md">
            Our most popular products, ranked by customer orders.
          </p>
        </div>

        {/* Leaderboard (Products) */}
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 dark:border-neutral-800 border-t-btn-green dark:border-t-btn-green"></div>
          </div>
        ) : hasError ? (
          <ErrorState onRetry={fetchTrends} />
        ) : trendingProducts.length > 0 ? (
          <div className="flex flex-col gap-12 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.slice(0, 4).map((product, index) => (
                <div
                  key={product.id}
                  className="relative bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-2xl overflow-hidden flex flex-col group"
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
                    <div className="aspect-3/4 w-full bg-neutral-100 dark:bg-neutral-800 shrink-0 overflow-hidden relative">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    </div>

                    <div className="flex flex-col items-center px-4 pt-4 flex-1">
                      <p className="text-[11px] text-category-blue dark:text-neutral-500 font-medium uppercase tracking-[0.14em] mb-1">
                        {product.category}
                      </p>
                      <h3 className="text-base font-semibold text-spc-grey dark:text-neutral-200 mb-2 text-center leading-snug group-hover:text-btn-green transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                  </Link>
                  <div className="flex flex-col items-center flex-1">
                    <p className="text-base font-semibold text-spc-grey dark:text-white mt-auto">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="mt-3 mb-4 mx-4 w-[calc(100%-2rem)] bg-neutral-50 dark:bg-neutral-800 rounded-full py-2 flex items-center justify-center">
                      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Purchased {product.sales_count || 0} times
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TIER 2: YÜKSELEN YILDIZLAR (5 ile 10 Arası - Kompakt Kartlar) */}
            {trendingProducts.length > 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold text-spc-grey dark:text-white tracking-tight shrink-0">
                    Rising Stars
                  </h2>
                  <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingProducts.slice(4, 10).map((product, idx) => {
                    const rank = idx + 5;
                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-3 md:p-4 flex items-center gap-4 hover:shadow-md dark:hover:border-neutral-700 hover:-translate-y-1 transition-all duration-300 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-btn-green group-hover:text-white transition-colors">
                          #{rank}
                        </div>
                        <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-xl overflow-hidden relative shrink-0">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-[9px] text-category-blue dark:text-neutral-500 font-bold uppercase tracking-widest truncate mb-0.5">
                            {product.category}
                          </p>
                          <h3 className="text-sm font-bold text-spc-grey dark:text-neutral-200 truncate group-hover:text-btn-green transition-colors">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-sm font-black text-spc-grey dark:text-white">
                              ${product.price.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-500/20">
                              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                                {product.sales_count || 0} Sold
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {trendingProducts.length > 10 && (
              <div className="mt-8 flex flex-col items-center">
                {!showMore ? (
                  <button
                    onClick={() => setShowMore(true)}
                    className="bg-spc-grey dark:bg-neutral-800 text-white px-10 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.14em] hover:bg-btn-green transition-colors flex items-center gap-3"
                  >
                    Load More Trends
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                ) : (
                  <div className="w-full flex flex-col gap-3 animate-in fade-in slide-in-from-top-8 duration-700">
                    <div className="flex items-center gap-4 mb-4">
                      <h2 className="text-xl font-semibold text-spc-grey dark:text-white tracking-tight shrink-0">
                        Other Popular Items
                      </h2>
                      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800"></div>
                    </div>

                    {trendingProducts.slice(10).map((product, idx) => {
                      const rank = idx + 11;
                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          className="w-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-3 md:p-4 flex items-center gap-4 md:gap-6 hover:border-btn-green dark:hover:border-btn-green hover:shadow-md transition-all duration-300 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 flex items-center justify-center text-sm font-black shrink-0 group-hover:bg-btn-green group-hover:text-white transition-colors">
                            #{rank}
                          </div>

                          <div className="w-16 h-16 md:w-20 md:h-20 bg-neutral-50 dark:bg-neutral-800 rounded-xl overflow-hidden relative shrink-0 border border-neutral-100 dark:border-neutral-700">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <p className="text-[10px] text-category-blue dark:text-neutral-500 font-bold uppercase tracking-widest truncate mb-0.5">
                                {product.category}
                              </p>
                              <h3 className="text-sm md:text-base font-bold text-spc-grey dark:text-neutral-200 truncate group-hover:text-btn-green transition-colors">
                                {product.name}
                              </h3>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="hidden md:flex items-center gap-1 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-100 dark:border-neutral-700">
                                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                  {product.sales_count || 0} Sold
                                </span>
                              </div>
                              <span className="text-base md:text-lg font-black text-spc-grey dark:text-white w-20 text-right">
                                ${product.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="No trend data"
            description="We don't have enough sales data yet to show trending products."
          />
        )}
      </div>
    </main>
  );
}
