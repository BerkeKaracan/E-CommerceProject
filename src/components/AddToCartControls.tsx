"use client";

import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { MinusIcon, PlusIcon } from "@/components/Icons";
import { apiFetch } from "@/lib/api";
import type { ApiProduct } from "@/types/product";

export default function AddToCartControls({ product }: { product: ApiProduct }) {
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const [qty, setQty] = useState(1);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const addToCart = async () => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }

    setIsAdding(true);
    try {
      await apiFetch("/api/cart", {
        method: "POST",
        token,
        body: JSON.stringify({ product_id: product.id, quantity: qty }),
      });
      toast.success(`Added ${qty}x ${product.name} to cart!`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Not enough stock or server error.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between w-full mb-3 bg-neutral-100/50 dark:bg-neutral-800 rounded-xl p-1 border border-transparent dark:border-neutral-700 shadow-sm">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((n) => Math.max(1, n - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-700 text-neutral-500 hover:text-spc-grey dark:hover:text-white transition-all shadow-sm active:scale-95"
        >
          <MinusIcon className="w-4 h-4" aria-hidden />
        </button>
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest leading-none mb-0.5">
            Qty
          </span>
          <span className="text-sm font-bold text-spc-grey dark:text-white leading-none">
            {qty}
          </span>
        </div>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((n) => n + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-700 text-neutral-500 hover:text-spc-grey dark:hover:text-white transition-all shadow-sm active:scale-95"
        >
          <PlusIcon className="w-4 h-4" aria-hidden />
        </button>
      </div>
      <button
        type="button"
        onClick={addToCart}
        disabled={isAdding}
        className="w-full bg-btn-green text-white py-2.5 rounded-xl text-sm font-bold hover:brightness-95 transition-all active:scale-95 shadow-sm hover:shadow-md disabled:opacity-60"
      >
        {isAdding ? "Adding..." : `Add to Cart +${qty}`}
      </button>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
