"use client";

import Link from "next/link";
import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

interface TrackedOrder {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
}

export default function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const user = authContext?.user;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setIsLoading(true);
    setError(null);
    setOrder(null);

    if (!token) {
      setError("Please sign in to track your orders.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/track/${orderId}`,
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
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col select-none transition-colors duration-300">
      {/* Navbar */}
      <nav className="shrink-0 z-50 bg-white dark:bg-neutral-950 w-full shadow-sm border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 -ml-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="w-5 h-5 text-spc-grey dark:text-neutral-300 group-hover:-translate-x-1 transition-transform"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
              </Link>
              <Link
                href="/"
                className="text-2xl font-black tracking-tighter text-btn-green"
              >
                market
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              {user && (
                <Link
                  href="/profile"
                  className="text-sm font-bold text-spc-grey dark:text-neutral-300 hover:text-btn-green dark:hover:text-btn-green transition-colors"
                >
                  Hi, {user.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 lg:py-20 flex flex-col">
        <div className="text-center mb-10 animate-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl font-black text-spc-grey dark:text-white tracking-tighter mb-3 transition-colors">
            Track Your Order 📦
          </h1>
          <p className="text-neutral-400 dark:text-neutral-500 font-medium transition-colors">
            Enter your Order ID below to see real-time logistics updates.
          </p>
        </div>

        {/* Search Box */}
        <form
          onSubmit={handleTrack}
          className="flex items-center w-full bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:border-btn-green/50 dark:hover:border-btn-green/50 focus-within:border-btn-green dark:focus-within:border-btn-green transition-all mb-8 p-1"
        >
          <div className="pl-6 text-neutral-300 dark:text-neutral-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="w-6 h-6"
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
            className="flex-1 bg-transparent px-4 py-4 md:py-5 outline-none font-black text-spc-grey dark:text-white text-lg placeholder:font-medium placeholder:text-neutral-300 dark:placeholder:text-neutral-600 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !orderId.trim()}
            className="bg-black dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white dark:text-neutral-200 px-8 py-4 md:py-5 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
          >
            {isLoading ? "Searching..." : "Track"}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/50 p-6 rounded-2xl text-center font-bold animate-in zoom-in-95 transition-colors">
            {error}
          </div>
        )}

        {/* Order Result (Logistics Timeline) */}
        {order && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-6 md:p-10 shadow-lg dark:shadow-none animate-in fade-in slide-in-from-bottom-8 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-6 border-b border-neutral-100 dark:border-neutral-800 gap-4 transition-colors">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1 transition-colors">
                  Order Number
                </p>
                <p className="text-2xl font-black text-spc-grey dark:text-white transition-colors">
                  #{order.id}
                </p>
              </div>
              <div className="md:text-right">
                <p className="text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1 transition-colors">
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

            {/* Simulated Timeline */}
            <div className="relative flex flex-col gap-8 ml-4 md:ml-8">
              {/* Timeline Line */}
              <div className="absolute top-2 bottom-2 left-[11px] w-1 bg-neutral-100 dark:bg-neutral-800 rounded-full -z-10 transition-colors"></div>

              {/* Step 1 */}
              <div className="flex gap-6 items-start opacity-60">
                <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center shrink-0 border-4 border-white dark:border-neutral-900 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3 h-3 text-white"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-black text-spc-grey dark:text-neutral-200 transition-colors">
                    Order Placed
                  </h4>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mt-1 transition-colors">
                    We received your order.
                  </p>
                </div>
              </div>

              {/* Step 2 (Active Step) */}
              <div className="flex gap-6 items-start">
                <div className="w-6 h-6 rounded-full bg-btn-green flex items-center justify-center shrink-0 border-4 border-white dark:border-neutral-900 shadow-[0_0_0_4px_rgba(34,197,94,0.2)] dark:shadow-[0_0_0_4px_rgba(34,197,94,0.1)] transition-colors">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h4 className="font-black text-btn-green transition-colors">
                    Preparing for Shipment
                  </h4>
                  <p className="text-xs text-spc-grey dark:text-neutral-300 font-medium mt-1 transition-colors">
                    Your order is currently {order.status.toLowerCase()} and is
                    being packed in our warehouse.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start opacity-30">
                <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 shrink-0 border-4 border-white dark:border-neutral-900 transition-colors"></div>
                <div>
                  <h4 className="font-black text-spc-grey dark:text-neutral-200 transition-colors">
                    Out for Delivery
                  </h4>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mt-1 transition-colors">
                    Pending carrier update.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 -mx-6 md:-mx-10 -mb-6 md:-mb-10 px-6 md:px-10 py-6 rounded-b-3xl transition-colors">
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
    </main>
  );
}
