"use client";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import EmptyState from "@/components/EmptyState";
import { getPublicApiUrl, parseApiDetail } from "@/lib/api";
import type { ApiProduct, CartItemResponse } from "@/types/product";

interface CartItem extends ApiProduct {
  quantity: number;
}

export default function CheckoutPage() {
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromos, setAppliedPromos] = useState<
    { code: string; amount: number }[]
  >([]);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const totalDiscount = appliedPromos.reduce((sum, p) => sum + p.amount, 0);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    if (appliedPromos.some((p) => p.code === promoInput.toUpperCase())) {
      setPromoError("This code has already been applied!");
      return;
    }

    setIsApplying(true);
    setPromoError(null);
    try {
      const res = await fetch(
        `${getPublicApiUrl()}/api/promo/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: promoInput }),
        },
      );
      const data = await res.json();

      if (res.ok) {
        setAppliedPromos([
          ...appliedPromos,
          { code: promoInput.toUpperCase(), amount: data.discount_amount },
        ]);
        setPromoInput("");
        toast.success(`$${data.discount_amount} discount added!`);
      } else {
        setPromoError(parseApiDetail(data) || "Invalid code.");
      }
    } catch (err) {
      setPromoError("Server error.");
    } finally {
      setIsApplying(false);
    }
  };

  const productsCosts = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shippingCost = cart.length > 0 ? 1.0 : 0;
  const totalCost = Math.max(0, productsCosts + shippingCost - totalDiscount);

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
      const res = await fetch(`${getPublicApiUrl()}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCart(
          data.map((item: CartItemResponse) => ({
            ...item.product,
            quantity: item.quantity,
          })),
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const increaseQty = async (product: CartItem) => {
    if (!token) return;

    setCart(
      cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );

    try {
      const res = await fetch(`${getPublicApiUrl()}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(parseApiDetail(data) || "Cannot add more items.");
        fetchCart();
      }
    } catch (err) {
      fetchCart();
    }
  };

  const decreaseQty = async (product: CartItem) => {
    if (!token) return;
    if (product.quantity <= 1) return removeItem(product.id, product.quantity);

    setCart(
      cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    );

    try {
      const res = await fetch(
        `${getPublicApiUrl()}/api/cart/${product.id}?quantity=1`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) fetchCart();
    } catch (err) {
      fetchCart();
    }
  };

  const removeItem = async (productId: number, quantity: number) => {
    if (!token) return;
    setCart(cart.filter((item) => item.id !== productId));
    await fetch(
      `${getPublicApiUrl()}/api/cart/${productId}?quantity=${quantity}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvc: "",
  });

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(
        `${getPublicApiUrl()}/api/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            promo_codes: appliedPromos.map((p) => p.code),
          }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Order placed!");
        setTimeout(() => router.push("/profile"), 2000);
      } else {
        toast.error(parseApiDetail(data) || "Checkout failed");
      }
    } catch (err) {
      toast.error("Server Error!");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-neutral-200 dark:border-neutral-800 border-t-btn-green dark:border-t-btn-green"></div>
      </div>
    );
  }

  return (
    <div className="bg-background text-spc-grey dark:text-neutral-200">
      <Navbar />
      <div className="max-w-[1000px] mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8 text-spc-grey dark:text-white">
          Secure Checkout
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-[2] bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500 mb-6">
              Order Summary
            </h2>

            {cart.length === 0 ? (
              <EmptyState
                title="Your cart is empty"
                description="Add a few products from the shop, then come back to check out."
                action={
                  <Link
                    href="/"
                    className="bg-btn-green text-white px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.14em]"
                  >
                    Continue shopping
                  </Link>
                }
              />
            ) : (
              <div className="space-y-6">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="w-20 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg relative overflow-hidden shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-[10px] text-category-blue dark:text-neutral-400 font-bold uppercase tracking-widest truncate">
                        {item.category}
                      </p>
                      <h3 className="text-sm font-bold text-spc-grey dark:text-neutral-200 leading-tight truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-full p-0.5 border border-neutral-200 dark:border-neutral-700">
                          <button
                            onClick={() => decreaseQty(item)}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-neutral-700 transition-all text-spc-grey dark:text-neutral-200 text-sm"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-semibold text-spc-grey dark:text-neutral-200 select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => increaseQty(item)}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-neutral-700 transition-all text-spc-grey dark:text-neutral-200 text-sm"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id, item.quantity)}
                          className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors group"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2.5"
                            stroke="currentColor"
                            className="w-3.5 h-3.5 group-hover:scale-110 transition-transform"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right shrink-0 max-w-[30%]">
                      <p
                        className="text-base md:text-lg font-semibold text-spc-grey dark:text-white truncate"
                        title={`$${(item.price * item.quantity).toFixed(2)}`}
                      >
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 sticky top-8">
              <h2 className="text-lg font-semibold text-spc-grey dark:text-white mb-6">
                Payment Details
              </h2>

              {/* Promo Code Input Area */}
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) =>
                      setPromoInput(e.target.value.toUpperCase())
                    }
                    placeholder="REWARD-XXXXXX"
                    className="flex-1 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-full px-4 py-3 text-sm font-semibold text-spc-grey dark:text-neutral-200 outline-none focus:border-btn-green uppercase tracking-widest"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={
                      isApplying || !promoInput.trim() || cart.length === 0
                    }
                    className="bg-spc-grey dark:bg-neutral-800 hover:bg-neutral-700 text-white disabled:bg-neutral-200 dark:disabled:bg-neutral-800/50 disabled:text-neutral-400 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
                  >
                    {isApplying ? "..." : "Add"}
                  </button>
                </div>
                {promoError && (
                  <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">
                    {promoError}
                  </p>
                )}

                {/* UYGULANAN KODLARIN LİSTESİ (TAG OLARAK GÖRÜNÜR) */}
                {appliedPromos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {appliedPromos.map((promo, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-btn-green/10 border border-btn-green/30 px-3 py-1.5 rounded-lg animate-in zoom-in"
                      >
                        <span className="text-[10px] font-black text-btn-green tracking-widest">
                          {promo.code}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-500">
                          (-${promo.amount})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cost Calculation Area */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm font-bold text-neutral-500 dark:text-neutral-400">
                  <span>Subtotal</span>
                  <span>${productsCosts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-500 dark:text-neutral-400">
                  <span>Shipping</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm font-black text-btn-green animate-in slide-in-from-right-4 duration-300">
                    <span>Total Discount</span>
                    <span>-${totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="w-full h-px bg-neutral-200 dark:bg-neutral-800 my-2" />
                <div className="flex justify-between items-end gap-4 text-xl font-semibold text-spc-grey dark:text-white">
                  <span className="shrink-0">Total</span>
                  <span className="text-btn-green text-right break-all leading-tight max-w-[65%]">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Gamification: Future Points Indicator */}
              <div className="bg-linear-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-xl p-4 flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-2xl drop-shadow-sm">💎</span>
                  <div>
                    <p className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mb-0.5">
                      Premium Rewards
                    </p>
                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                      Points to earn from this order:
                    </p>
                  </div>
                </div>
                <span className="text-lg font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-500 to-orange-500 drop-shadow-sm">
                  +{Math.floor(totalCost / 10)} PTS
                </span>
              </div>
              <div className="mb-6 p-4 bg-btn-green/5 border border-btn-green/20 rounded-2xl flex items-start gap-3">
                <div className="bg-btn-green text-white p-1 rounded-full shrink-0 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3 h-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-[13px] font-bold text-btn-green/80 leading-relaxed">
                  TEST ENVIRONMENT ACTIVE: You can enter any 16-digit number to
                  simulate a transaction. No real charges will occur.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="group/input">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2 block ml-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={cardData.number}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          number: e.target.value
                            .replace(/\D/g, "")
                            .substring(0, 16),
                        })
                      }
                      className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3 text-sm font-bold text-spc-grey dark:text-white outline-none focus:border-btn-green transition-all tracking-widest"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
                      <div className="w-4 h-4 bg-red-500 rounded-full mix-blend-multiply dark:mix-blend-screen"></div>
                      <div className="w-4 h-4 bg-yellow-500 rounded-full mix-blend-multiply dark:mix-blend-screen -ml-2"></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group/input">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2 block ml-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardData.expiry}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          expiry: e.target.value.substring(0, 5),
                        })
                      }
                      className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3 text-sm font-bold text-spc-grey dark:text-white outline-none focus:border-btn-green transition-all"
                    />
                  </div>
                  <div className="group/input">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2 block ml-1">
                      CVC
                    </label>
                    <input
                      type="password"
                      placeholder="***"
                      value={cardData.cvc}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          cvc: e.target.value
                            .replace(/\D/g, "")
                            .substring(0, 3),
                        })
                      }
                      className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3 text-sm font-bold text-spc-grey dark:text-white outline-none focus:border-btn-green transition-all tracking-widest"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={
                  cart.length === 0 ||
                  isProcessing ||
                  cardData.number.length < 16
                }
                className="w-full bg-checkout-amber hover:brightness-95 text-spc-grey py-4 rounded-full font-semibold text-sm uppercase tracking-[0.14em] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  "Complete Test Order"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
