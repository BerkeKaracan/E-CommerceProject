"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { HELP_PORTAL_URL } from "@/lib/help";

export function HomeFooter() {
  return (
    <footer className="shrink-0 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-neutral-400">
          © 2026 Market · Portfolio Project
        </p>
        <div className="flex items-center gap-5">
          <a
            href={HELP_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-btn-green transition-colors"
          >
            Help Center
          </a>
          <a
            href={HELP_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-btn-green transition-colors"
          >
            Returns & Refunds
          </a>
          <a
            href={HELP_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-btn-green transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");

  if (pathname.startsWith("/admin") || pathname === "/") {
    return null;
  }

  const handleNewsletter = (e: FormEvent) => {
    e.preventDefault();
    toast.success("Newsletter coming soon — this is a portfolio project.");
    setEmail("");
  };

  const handleSocial = () => {
    toast("Social links coming soon.", { icon: "👋" });
  };

  return (
    <footer className="shrink-0 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 pt-16 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              className="text-3xl font-semibold tracking-tight text-btn-green w-fit"
            >
              market
            </Link>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs transition-colors">
              Premium quality products delivered directly to your doorstep.
              Elevate your everyday style with our exclusive collections.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={handleSocial}
                aria-label="X (coming soon)"
                className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-spc-grey dark:text-neutral-400 hover:bg-btn-green dark:hover:bg-btn-green hover:text-white dark:hover:text-white transition-colors"
              >
                <span className="font-bold text-xs">X</span>
              </button>
              <button
                type="button"
                onClick={handleSocial}
                aria-label="Instagram (coming soon)"
                className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-spc-grey dark:text-neutral-400 hover:bg-btn-green dark:hover:bg-btn-green hover:text-white dark:hover:text-white transition-colors"
              >
                <span className="font-bold text-xs">IG</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-spc-grey dark:text-white mb-6">
              Explore
            </h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link
                  href="/"
                  className="text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-btn-green dark:hover:text-btn-green transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/trends"
                  className="text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-btn-green dark:hover:text-btn-green transition-colors"
                >
                  Trending Now
                </Link>
              </li>
              <li>
                <Link
                  href="/tracking"
                  className="text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-btn-green dark:hover:text-btn-green transition-colors"
                >
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-spc-grey dark:text-white mb-6">
              Support
            </h3>
            <ul className="flex flex-col gap-4">
              <li>
                <a
                  href={HELP_PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-btn-green dark:hover:text-btn-green transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href={HELP_PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-btn-green dark:hover:text-btn-green transition-colors"
                >
                  Returns & Refunds
                </a>
              </li>
              <li>
                <a
                  href={HELP_PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-btn-green dark:hover:text-btn-green transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-spc-grey dark:text-white mb-6">
              Stay Updated
            </h3>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2 transition-colors">
              Subscribe to get special offers, free giveaways, and
              once-in-a-lifetime deals.
            </p>
            <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-4 uppercase tracking-widest">
              Coming soon
            </p>
            <form
              onSubmit={handleNewsletter}
              className="flex items-center gap-2"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm flex-1 outline-none focus:border-btn-green dark:focus:border-btn-green text-spc-grey dark:text-white placeholder:text-neutral-400 transition-colors"
              />
              <button
                type="submit"
                aria-label="Subscribe (coming soon)"
                className="bg-black dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white px-4 py-3 rounded-xl font-bold transition-colors active:scale-95 shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="3"
                  stroke="currentColor"
                  className="w-5 h-5"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-neutral-100 dark:border-neutral-800/50 gap-4 transition-colors">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 transition-colors">
              © 2026 Market. All rights reserved.
            </p>
            <p className="text-xs font-black text-red-500/80 dark:text-red-400/80 uppercase tracking-widest flex items-center gap-1.5">
              Portfolio Project — No Real Transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-5 bg-neutral-200 dark:bg-neutral-800 rounded flex items-center justify-center text-[8px] font-black text-neutral-500 dark:text-neutral-400 transition-colors">
              VISA
            </div>
            <div className="w-8 h-5 bg-neutral-200 dark:bg-neutral-800 rounded flex items-center justify-center text-[8px] font-black text-neutral-500 dark:text-neutral-400 transition-colors">
              MC
            </div>
            <div className="w-8 h-5 bg-neutral-200 dark:bg-neutral-800 rounded flex items-center justify-center text-[8px] font-black text-neutral-500 dark:text-neutral-400 transition-colors">
              PP
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
