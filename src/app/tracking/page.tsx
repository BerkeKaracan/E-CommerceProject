"use client";
import Image from "next/image";
import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import { getPublicApiUrl } from "@/lib/api";

interface OrderItem {
  name: string;
  image: string;
  quantity: number;
  price: number;
}

interface TrackedOrder {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

export default function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setIsLoading(true);
    setError(null);
    setOrder(null);

    if (!token) {
      setError("Please sign in to track your orders.");
      setIsAuthOpen(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${getPublicApiUrl()}/api/track/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Order not found or invalid ID.");
      }
      const data = await response.json();
      setOrder(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 lg:py-20 flex flex-col">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold text-spc-grey dark:text-white tracking-tight mb-3">
            Track Your Order
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Enter your Order ID below to see real-time logistics updates.
          </p>
        </div>

        {/* Search Box */}
        <form
          onSubmit={handleTrack}
          className="flex items-center w-full bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:border-btn-green/50 dark:hover:border-btn-green/50 focus-within:border-btn-green dark:focus-within:border-btn-green transition-all mb-8 p-1 md:p-1.5"
        >
          <div className="pl-4 md:pl-6 text-neutral-300 dark:text-neutral-600 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="w-5 h-5 md:w-6 md:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>
          <input
            type="number"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. 104"
            className="flex-1 w-full min-w-0 bg-transparent px-3 md:px-4 py-3 md:py-5 outline-none font-semibold text-spc-grey dark:text-white text-base md:text-lg placeholder:font-medium placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
          />
          <button
            type="submit"
            disabled={isLoading || !orderId.trim()}
            className="bg-spc-grey dark:bg-neutral-800 hover:bg-btn-green disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white px-5 md:px-8 py-3 md:py-3.5 rounded-full font-semibold uppercase tracking-[0.14em] text-[10px] md:text-xs transition-colors shrink-0"
          >
            {isLoading ? "Loading..." : "Track"}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/50 p-6 rounded-2xl text-center font-bold animate-in zoom-in-95 transition-colors">
            <p>{error}</p>
            {!token && (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="mt-4 bg-btn-green text-white px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-[0.14em]"
              >
                Sign in
              </button>
            )}
          </div>
        )}

        {/* Order Result (Logistics Timeline) */}
        {order && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-6 border-b border-neutral-100 dark:border-neutral-800 gap-4 transition-colors">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500 mb-1">
                  Order Number
                </p>
                <p className="text-2xl font-semibold text-spc-grey dark:text-white">
                  #{order.id}
                </p>
              </div>
              <div className="md:text-right">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500 mb-1">
                  Order Date
                </p>
                <p className="text-sm font-bold text-spc-grey dark:text-neutral-200 transition-colors">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Status timeline */}
            <div className="relative flex flex-col gap-8 ml-4 md:ml-8">
              <div className="absolute top-2 bottom-2 left-[11px] w-1 bg-neutral-100 dark:bg-neutral-800 rounded-full -z-10 transition-colors"></div>
              {(() => {
                const status = (order.status || "").toLowerCase();
                let current = 0;
                if (
                  status.includes("prepar") ||
                  status.includes("process") ||
                  status.includes("pack")
                )
                  current = 1;
                if (
                  status.includes("ship") ||
                  status.includes("out") ||
                  status.includes("transit")
                )
                  current = 2;
                if (status.includes("deliver") || status.includes("complete"))
                  current = 3;

                const steps = [
                  {
                    title: "Order Placed",
                    desc: "We received your order.",
                  },
                  {
                    title: "Preparing for Shipment",
                    desc: "Your order is being packed in our warehouse.",
                  },
                  {
                    title: "Out for Delivery",
                    desc: "Your package is on the way.",
                  },
                  {
                    title: "Delivered",
                    desc: "The order has been delivered.",
                  },
                ];

                return steps.map((step, index) => {
                  const done = index < current || current === 3;
                  const active = index === current && current < 3;
                  return (
                    <div
                      key={step.title}
                      className={`flex gap-6 items-start ${done ? "opacity-70" : active ? "" : "opacity-30"}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-4 border-white dark:border-neutral-900 transition-colors ${
                          active
                            ? "bg-btn-green shadow-[0_0_0_4px_rgba(16,185,129,0.2)]"
                            : done
                              ? "bg-neutral-400 dark:bg-neutral-600"
                              : "bg-neutral-200 dark:bg-neutral-700"
                        }`}
                      >
                        {active ? (
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        ) : done ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-3 h-3 text-white"
                            aria-hidden
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : null}
                      </div>
                      <div>
                        <h4
                          className={`font-semibold ${active ? "text-btn-green" : "text-spc-grey dark:text-neutral-200"}`}
                        >
                          {step.title}
                        </h4>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mt-1 transition-colors">
                          {active
                            ? `Current status: ${order.status}`
                            : step.desc}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="mt-10 pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <h4 className="font-semibold text-xs uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500 mb-4">
                Items in this Order
              </h4>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1 shrink-0 overflow-hidden transition-colors">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-spc-grey dark:text-neutral-200 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-tight">
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-spc-grey dark:text-neutral-200">
                      ${(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 -mx-6 md:-mx-10 px-6 md:px-10 py-6 rounded-b-3xl transition-colors">
              <span className="font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest text-xs transition-colors">
                Total Paid
              </span>
              <span className="font-black text-2xl text-spc-grey dark:text-white transition-colors">
                ${order.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}
