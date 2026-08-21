"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";

const faqs = [
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 3-5 business days. Premium members enjoy 1-2 day expedited delivery.",
  },
  {
    q: "What is your return policy?",
    a: "You can return any item within 30 days of purchase. Items must be in their original packaging and unused condition.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes, we ship to over 50 countries. Shipping costs and delivery times vary by location.",
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-14">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400 mb-3">
          Help
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold text-spc-grey dark:text-white tracking-tight">
          Customer Support
        </h1>
        <p className="mt-3 text-neutral-500 dark:text-neutral-400 font-medium">
          Common questions below. A full help center will open from here once
          the external portal is connected.
        </p>

        <section id="faq" className="scroll-mt-8 mt-12">
          <h2 className="text-lg font-semibold text-spc-grey dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <span className="font-semibold text-spc-grey dark:text-neutral-200 pr-4">
                    {faq.q}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section id="returns" className="scroll-mt-8 mt-10">
          <h2 className="text-lg font-semibold text-spc-grey dark:text-white mb-4">
            Returns & Refunds
          </h2>
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              If you are not satisfied with your purchase, you may return the
              item within 30 days in original packaging with proof of purchase.
              Use a trackable shipping service when sending it back.
            </p>
          </div>
        </section>

        <section id="contact" className="scroll-mt-8 mt-10">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-spc-grey dark:text-white mb-2">
              Contact
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Live chat and tickets will move to the help portal. Until that
              link is connected, use the FAQ above.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
