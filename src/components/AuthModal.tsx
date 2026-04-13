"use client";
import React, { useState } from "react";
import Image from "next/image";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  // State to switch between Sign In and Create Account screens
  const [isLogin, setIsLogin] = useState(true);

  if (!isOpen) return null;

  return (
    // Main container blurring the background (Z-index high to appear above navbar)
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Invisible overlay that closes the modal on click */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-300 min-h-[500px] sm:min-h-[600px]">
        {/* LEFT SIDE - Premium Showcase (Visible only on md and larger screens) */}
        <div className="hidden md:block md:w-1/2 relative bg-neutral-100 group">
          <Image
            // The path to your bracelet image inside public/images/
            // Ensure the file is named bracelet.png and located correctly.
            src="/public/bracelet.png"
            alt="Premium Collection"
            fill
            priority={true} // Priority loading for above-the-fold content when modal opens
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Subtle dark overlay and brand vision text over the image */}
          <div className="absolute inset-0 bg-linear-to-t from-spc-grey/90 via-spc-grey/20 to-transparent flex flex-col justify-end p-10 text-white">
            <h2 className="text-3xl font-black mb-2 tracking-tight">
              Premium Quality.
            </h2>
            <p className="text-sm font-medium opacity-80">
              Sign in to access our exclusive collections.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - Form Area */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white relative">
          {/* Close (X) Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-spc-grey hover:bg-neutral-50 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Headings */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-spc-grey mb-2 tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-neutral-400 font-medium">
              {isLogin
                ? "Enter your details to access your account."
                : "Join us to unlock exclusive benefits."}
            </p>
          </div>

          {/* Form */}
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Full Name input visible only in Create Account mode */}
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-spc-grey uppercase tracking-widest pl-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-spc-grey focus:outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-spc-grey uppercase tracking-widest pl-1">
                Email
              </label>
              <input
                type="email"
                placeholder="example@mail.com"
                className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-spc-grey focus:outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[11px] font-bold text-spc-grey uppercase tracking-widest">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    className="text-[11px] font-bold text-neutral-400 hover:text-btn-green transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-spc-grey focus:outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all"
              />
            </div>

            {/* Action Button */}
            <button className="w-full bg-spc-grey hover:bg-btn-green text-white font-black uppercase tracking-wide text-sm rounded-xl py-4 mt-2 transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]">
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          {/* Bottom Navigation */}
          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-neutral-500">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-btn-green font-bold hover:text-category-blue transition-colors underline decoration-2 underline-offset-4"
              >
                {isLogin ? "Sign Up Now" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
