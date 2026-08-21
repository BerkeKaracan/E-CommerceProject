"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { getPublicApiUrl, parseApiDetail } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{
    type: "error" | "success" | null;
    msg: string | null;
  }>({ type: null, msg: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus({
        type: "error",
        msg: "Invalid reset link. Please request a new one.",
      });
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: "error", msg: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
      setStatus({
        type: "error",
        msg: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${getPublicApiUrl()}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus({
          type: "error",
          msg: parseApiDetail(data) || "Something went wrong.",
        });
      } else {
        setStatus({
          type: "success",
          msg: "Password reset successful! Redirecting to home...",
        });
        setTimeout(() => router.push("/"), 3000);
      }
    } catch {
      setStatus({ type: "error", msg: "Connection error. Try again later." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background flex items-center justify-center p-6 py-16">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl w-full max-w-md border border-neutral-200/80 dark:border-neutral-800">
        <h1 className="text-3xl font-semibold text-spc-grey dark:text-white tracking-tight mb-2">
          New Password
        </h1>
        <p className="text-neutral-400 dark:text-neutral-500 text-sm font-medium mb-8">
          Secure your account with a new password.
        </p>

        {status.msg && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
              status.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/40"
                : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40"
            }`}
          >
            {status.msg}
          </div>
        )}

        {token && status.type !== "success" && (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-spc-grey dark:text-neutral-300 uppercase tracking-widest pl-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-spc-grey dark:text-white focus:border-btn-green outline-none transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-spc-grey dark:text-neutral-300 uppercase tracking-widest pl-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-spc-grey dark:text-white focus:border-btn-green outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-spc-grey hover:bg-btn-green text-white font-semibold uppercase tracking-[0.14em] text-sm rounded-full py-3.5 mt-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-neutral-100 dark:border-neutral-800 pt-6">
          <Link
            href="/"
            className="text-sm font-bold text-btn-green hover:text-category-blue dark:hover:text-white transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-sm font-medium text-neutral-400">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
