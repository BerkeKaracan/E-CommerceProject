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
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-none dark:hover:border-neutral-700 transition-shadow duration-300 flex flex-col h-full group">
      <Link
        href={`/product/${product.id}`}
        className="w-full flex flex-col flex-1 cursor-pointer group/link"
      >
        <div className="aspect-3/4 w-full bg-neutral-100 dark:bg-neutral-800 shrink-0 overflow-hidden relative">
          {product.is_discounted === 1 && product.discount_rate ? (
            <div className="absolute top-3 left-3 bg-spc-grey dark:bg-white text-white dark:text-spc-grey text-[11px] font-semibold px-2 py-0.5 rounded-md z-20">
              -{product.discount_rate}%
            </div>
          ) : null}
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
          />
        </div>

        <div className="px-3.5 pt-3.5 pb-1 flex flex-col items-center">
          <p className="text-[11px] text-category-blue dark:text-neutral-500 font-medium uppercase tracking-[0.14em] mb-1 text-center">
            {product.category}
          </p>
          <h3 className="text-[15px] font-semibold text-spc-grey dark:text-neutral-100 text-center leading-snug group-hover/link:text-btn-green transition-colors line-clamp-2">
            {product.name}
          </h3>
        </div>
      </Link>

      <div className="mt-auto w-full px-3.5 pb-3.5 pt-2">
        <div
          className={`flex flex-col items-center w-full ${children ? "mb-3" : "pt-3 border-t border-neutral-100 dark:border-neutral-800"}`}
        >
          {product.is_discounted === 1 ? (
            <div className="flex items-baseline gap-1.5">
              <p className="text-xs font-medium text-neutral-400 line-through">
                ${originalPrice.toFixed(2)}
              </p>
              <p className="text-base font-semibold text-red-600 dark:text-red-400">
                ${discountedPrice.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-base font-semibold text-spc-grey dark:text-white">
              ${product.price.toFixed(2)}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
