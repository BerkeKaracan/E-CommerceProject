"use client";

import Image from "next/image";
import Link from "next/link";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import AuthModal from "@/components/AuthModal";
import { UserIcon } from "@/components/Icons";

interface NavbarProps {
  showSignIn?: boolean;
}

export default function Navbar({ showSignIn = true }: NavbarProps) {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <nav className="shrink-0 z-50 bg-neutral-50 dark:bg-neutral-950 w-full shadow-sm border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                aria-label="Back to shop"
                className="p-2 -ml-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="w-5 h-5 text-spc-grey dark:text-neutral-300 group-hover:-translate-x-1 transition-transform"
                  aria-hidden
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

            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              {user ? (
                <Link
                  href="/profile"
                  className="text-sm font-bold text-spc-grey dark:text-neutral-300 hover:text-btn-green dark:hover:text-btn-green transition-colors truncate max-w-[140px]"
                >
                  Hi, {user.name}
                </Link>
              ) : (
                showSignIn && (
                  <button
                    type="button"
                    onClick={() => setIsAuthOpen(true)}
                    aria-label="Sign in"
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                  >
                    <UserIcon className="w-7 h-7 text-spc-grey dark:text-neutral-200" />
                  </button>
                )
              )}
              <Link
                href="/checkout"
                aria-label="Open cart"
                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
              >
                <Image
                  src="/cart.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="w-7 h-7 dark:invert"
                />
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
