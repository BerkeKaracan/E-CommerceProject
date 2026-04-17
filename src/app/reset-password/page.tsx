"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, new_password: password }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setStatus({
          type: "error",
          msg: data.detail || "Something went wrong.",
        });
      } else {
        setStatus({
          type: "success",
          msg: "Password reset successful! Redirecting to home...",
        });
        setTimeout(() => router.push("/"), 3000);
      }
    } catch (err) {
      setStatus({ type: "error", msg: "Connection error. Try again later." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-neutral-100">
        <h1 className="text-3xl font-black text-spc-grey tracking-tighter mb-2">
          New Password
        </h1>
        <p className="text-neutral-400 text-sm font-medium mb-8">
          Secure your account with a new password.
        </p>

        {status.msg && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${status.type === "success" ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}
          >
            {status.msg}
          </div>
        )}

        {token && status.type !== "success" && (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-spc-grey uppercase tracking-widest pl-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-btn-green outline-none transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-spc-grey uppercase tracking-widest pl-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-btn-green outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-spc-grey hover:bg-btn-green text-white font-black uppercase tracking-wide text-sm rounded-xl py-3.5 mt-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-neutral-100 pt-6">
          <Link
            href="/"
            className="text-sm font-bold text-btn-green hover:text-category-blue transition-colors"
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
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
