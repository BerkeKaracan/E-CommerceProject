"use client";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface ApiProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface CartItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  product: ApiProduct;
}

interface CartItem extends ApiProduct {
  quantity: number;
}

export default function CheckoutPage() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const token = authContext?.token;
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (authContext === undefined) return;
    if (!token) {
      router.push("/");
    } else {
      fetchCart();
    }
  }, [token, authContext, router]);

  const fetchCart = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/");
          return;
        }
        throw new Error("Sunucu hatası");
      }
      const data: CartItemResponse[] = await res.json();

      if (Array.isArray(data)) {
        const formattedCart = data.map((item) => ({
          ...item.product,
          quantity: item.quantity,
        }));
        setCart(formattedCart);
      }
    } catch (err) {
      console.error("Cart fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const productsCosts = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shippingCost = cart.length > 0 ? 1.0 : 0;
  const totalCost = productsCosts + shippingCost;

  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/checkout`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        alert("Order successfully placed!");
        router.refresh();
        router.push("/profile");
      } else {
        alert("Checkout failed. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-spc-grey"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8 font-sans select-none text-spc-grey">
      <div className="max-w-[1000px] mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 mb-6 w-fit text-neutral-400 hover:text-spc-grey transition-colors group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="3"
            stroke="currentColor"
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">
            Back to Store
          </span>
        </Link>

        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-8">
          Secure Checkout
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-2 bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            <h2 className="text-lg font-black uppercase tracking-widest text-neutral-400 mb-6">
              Order Summary
            </h2>

            {cart.length === 0 ? (
              <p className="text-center text-neutral-400 font-bold py-10">
                Your cart is completely empty.
              </p>
            ) : (
              <div className="space-y-6">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 border-b border-neutral-100 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="w-20 h-24 bg-neutral-100 rounded-lg relative overflow-hidden shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-category-blue font-bold uppercase tracking-widest">
                        {item.category}
                      </p>
                      <h3 className="text-sm font-bold text-spc-grey leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm sticky top-8">
              <h2 className="text-lg font-black text-spc-grey mb-6">
                Payment Details
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm font-bold text-neutral-500">
                  <span>Subtotal</span>
                  <span>${productsCosts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-500">
                  <span>Shipping</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="w-full h-px bg-neutral-200 my-2" />
                <div className="flex justify-between text-xl font-black text-spc-grey">
                  <span>Total</span>
                  <span className="text-btn-green">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-3 mb-8 opacity-50 pointer-events-none">
                <input
                  type="text"
                  placeholder="Card Number"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-sm"
                  disabled
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-sm"
                    disabled
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-sm"
                    disabled
                  />
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
                className="w-full bg-btn-green text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {isProcessing ? "Processing..." : "Complete Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
