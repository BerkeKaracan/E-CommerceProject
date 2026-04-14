"use client";
import React, { useState } from "react";
import Image from "next/image";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Temel Doğrulamalar (Validation)
    if (!isLogin && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!isLogin) {
      // --- KAYIT OL (REGISTER) AKIŞI ---
      try {
        const response = await fetch("http://localhost:8000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.detail || "Registration failed. Please try again.");
          return;
        }

        alert("Account created successfully! Now you can sign in. 🚀");
        setIsLogin(true); // Başarılı kayıttan sonra kullanıcıyı Giriş ekranına at
        setPassword(""); // Şifre kutusunu temizle
      } catch (err) {
        console.error("Server Connection Error:", err);
        setError("Cannot connect to the server. Is backend running?");
      }
    } else {
      // --- GİRİŞ YAP (LOGIN) AKIŞI ---
      try {
        const response = await fetch("http://localhost:8000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Giriş yaparken sadece email ve şifre yolluyoruz
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.detail || "Invalid email or password.");
          return;
        }

        // BAŞARILI GİRİŞ!
        // 1. VIP Kartı (Token) ve Kullanıcı bilgilerini tarayıcının hafızasına yaz
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // 2. Kutlamayı yap ve kapıları aç
        alert(`Welcome back, ${data.user.name}! 🦅`);

        onClose(); // Modalı kapat
        setEmail("");
        setPassword("");
      } catch (err) {
        console.error("Server Connection Error:", err);
        setError("Cannot connect to the server. Is backend running?");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 select-none">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-300 min-h-[500px] sm:min-h-[600px]">
        {/* Left Side Showcase */}
        <div className="hidden md:block md:w-1/2 relative bg-neutral-100 group">
          <Image
            src="/necklace.png"
            alt="Premium Collection"
            fill
            priority={true}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-spc-grey/90 via-spc-grey/20 to-transparent flex flex-col justify-end p-10 text-white">
            <h2 className="text-3xl font-black mb-2 tracking-tight">
              Premium Quality.
            </h2>
            <p className="text-sm font-medium opacity-80">
              Sign in to access our exclusive collections.
            </p>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white relative">
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

          <div className="mb-6">
            <h2 className="text-3xl font-black text-spc-grey mb-2 tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-neutral-400 font-medium">
              {isLogin
                ? "Enter your details to access your account."
                : "Join us to unlock exclusive benefits."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-spc-grey uppercase tracking-widest pl-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-spc-grey focus:outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-spc-grey uppercase tracking-widest pl-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-spc-grey focus:outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-spc-grey focus:outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-spc-grey hover:bg-btn-green text-white font-black uppercase tracking-wide text-sm rounded-xl py-3.5 mt-2 transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-neutral-500">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
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
