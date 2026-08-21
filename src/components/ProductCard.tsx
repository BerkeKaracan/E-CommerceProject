import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import type { ApiProduct } from "@/types/product";

export type Product = ApiProduct;

interface ProductCardProps {
  product: Product;
  children?: ReactNode;
}

export default function ProductCard({ product, children }: ProductCardProps) {
  const hasPrecomputedDiscount =
    product.original_price != null && product.original_price !== product.price;

  const originalPrice = product.original_price ?? product.price;
  const discountedPrice = hasPrecomputedDiscount
    ? product.price
    : product.is_discounted === 1 && product.discount_rate
      ? product.price * (1 - product.discount_rate / 100)
      : product.price;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-100/60 dark:border-neutral-800/60 rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] dark:shadow-none dark:hover:border-neutral-600 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
      <Link
        href={`/product/${product.id}`}
        className="w-full flex flex-col items-center flex-1 cursor-pointer group/link"
      >
        <div className="aspect-square md:aspect-3/4 w-full bg-neutral-50/80 dark:bg-neutral-800 rounded-xl mb-4 shrink-0 flex items-center justify-center overflow-hidden relative group-hover:bg-neutral-100 dark:group-hover:bg-neutral-700 transition-colors">
          {product.is_discounted === 1 && product.discount_rate ? (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-md z-20 shadow-md">
              -{product.discount_rate}%
            </div>
          ) : null}
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <p className="text-xs text-category-blue dark:text-neutral-400 font-bold uppercase tracking-widest mb-1.5 text-center">
          {product.category}
        </p>
        <h3 className="text-base font-bold text-spc-grey dark:text-neutral-200 mb-3 text-center leading-tight group-hover/link:text-btn-green transition-colors line-clamp-2 px-1">
          {product.name}
        </h3>
      </Link>

      <div className="mt-auto w-full">
        <div
          className={`flex flex-col items-center w-full ${children ? "mb-4" : "pt-4 border-t border-dashed border-neutral-200 dark:border-neutral-800"}`}
        >
          {product.is_discounted === 1 ? (
            <div className="flex items-baseline gap-1.5">
              <p className="text-xs font-medium text-neutral-400 line-through decoration-neutral-400">
                ${originalPrice.toFixed(2)}
              </p>
              <p className="text-lg font-black text-red-500 dark:text-red-400">
                ${discountedPrice.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-lg font-black text-spc-grey dark:text-white">
              ${product.price.toFixed(2)}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
