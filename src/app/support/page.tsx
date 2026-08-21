"use client";
import Navbar from "@/components/Navbar";
import { HELP_PORTAL_URL } from "@/lib/help";

export default function SupportPage() {
  return (
    <div className="bg-background">
      <Navbar />

      <div className="max-w-xl mx-auto px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400 mb-3">
          Help
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold text-spc-grey dark:text-white tracking-tight">
          Customer Support
        </h1>
        <p className="mt-3 text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
          Questions, returns, and feature requests live on our help board.
        </p>

        <a
          href={HELP_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center bg-spc-grey dark:bg-white text-white dark:text-spc-grey px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-btn-green hover:text-white dark:hover:bg-btn-green dark:hover:text-white transition-colors"
        >
          Open Help Center
        </a>
      </div>
    </div>
  );
}
