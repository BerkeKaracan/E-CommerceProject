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
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-[1440px] mx-auto w-full px-4 lg:px-8 py-10 flex flex-col">
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="bg-spc-grey dark:bg-white text-white dark:text-spc-grey px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] mb-5">
            Limited Time Offers
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold text-spc-grey dark:text-white tracking-tight text-center mb-3">
            Flash Sale
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-lg text-sm md:text-base leading-relaxed">
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
