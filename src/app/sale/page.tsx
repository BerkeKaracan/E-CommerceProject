"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ProductCard, { Product } from "@/components/ProductCard";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import AddToCartControls from "@/components/AddToCartControls";
import { getPublicApiUrl } from "@/lib/api";

export default function SalePage() {
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchSales = () => {
    setIsLoading(true);
    setHasError(false);
    fetch(
      `${getPublicApiUrl()}/api/products?price_filter=Discounted+Offers&limit=50`,
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load sales");
        return res.json();
      })
      .then((data: Product[]) => {
        setSaleProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setHasError(true);
        setSaleProducts([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col transition-colors duration-300">
      <Navbar />

      <div className="flex-1 max-w-[1440px] mx-auto w-full px-4 lg:px-8 py-10 flex flex-col">
        <div className="flex flex-col items-center justify-center mb-16 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3 shadow-lg">
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

        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : hasError ? (
          <ErrorState onRetry={fetchSales} />
        ) : saleProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {saleProducts.map((product) => (
              <ProductCard key={product.id} product={product}>
                <AddToCartControls product={product} />
              </ProductCard>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No active sales"
            description="There are no discounted offers right now. Check back soon."
          />
        )}
      </div>
    </main>
  );
}
