import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { DiscountBadgeIcon } from "@/components/Icons";

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  is_discounted?: number;
  discount_rate?: number;
  original_price?: number;
}

interface ProductCardProps {
  product: Product;
  children?: ReactNode; // Allows injecting custom buttons like "Add to Cart"
}

export default function ProductCard({ product, children }: ProductCardProps) {
  const discountedPrice =
    product.is_discounted === 1 && product.discount_rate
      ? product.price * (1 - product.discount_rate / 100)
      : product.price;

  // Use original_price if it exists, otherwise fallback to standard price
  const originalPrice = product.original_price || product.price;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-100/60 dark:border-neutral-800/60 rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] dark:shadow-none dark:hover:border-neutral-600 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
      {/* Clickable Area (Image & Text) */}
      <Link
        href={`/product/${product.id}`}
        className="w-full flex flex-col items-center flex-1 cursor-pointer group/link"
      >
        <div className="aspect-square md:aspect-3/4 w-full bg-neutral-50/80 dark:bg-neutral-800 rounded-xl mb-4 shrink-0 flex items-center justify-center overflow-hidden relative group-hover:bg-neutral-100 dark:group-hover:bg-neutral-700 transition-colors">
          {product.is_discounted === 1 && product.discount_rate && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md z-20 shadow-md animate-pulse">
              -{product.discount_rate}%
            </div>
          )}
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <p className="text-[10px] text-category-blue dark:text-neutral-400 font-bold uppercase tracking-widest mb-1.5 text-center">
          {product.category}
        </p>
        <h3 className="text-base font-bold text-spc-grey dark:text-neutral-200 mb-3 text-center leading-tight group-hover/link:text-btn-green transition-colors">
          {product.name}
        </h3>
      </Link>

      {/* Pricing & Actions Area */}
      <div className="mt-auto w-full">
        {/* If it has children (Home Page) show normal margin, if no children (Sale Page) show dashed top border */}
        <div
          className={`flex flex-col items-center w-full ${children ? "mb-4" : "pt-4 border-t border-dashed border-neutral-200 dark:border-neutral-800"}`}
        >
          {product.is_discounted === 1 ? (
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-neutral-400 line-through decoration-red-500/50">
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

        {/* Render Add to Cart & Stepper Buttons Here */}
        {children}
      </div>
    </div>
  );
}
