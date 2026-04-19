"use client";
import React, { useState } from "react";
import Link from "next/link";

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
    <div className="min-h-screen bg-white dark:bg-neutral-950 transition-colors duration-300">
      {/* Header - Genişletildi (max-w-6xl) */}
      <div className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Link
            href="/"
            className="text-btn-green font-black uppercase text-xs tracking-widest hover:opacity-70 transition-opacity flex items-center gap-2 mb-6 w-fit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="w-3 h-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Shop
          </Link>
          <h1 className="text-5xl font-black text-spc-grey dark:text-white tracking-tighter">
            Customer Support
          </h1>
          <p className="mt-4 text-neutral-500 dark:text-neutral-400 font-medium">
            How can we help you today?
          </p>
        </div>
      </div>

      {/* Main Content - Genişletildi ve 12 Sütunlu Izgaraya Geçildi */}
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left Side (FAQ & Returns) - 7 Sütun Kaplar */}
        <div className="lg:col-span-7 space-y-12">
          <section id="faq">
            <h2 className="text-2xl font-black text-spc-grey dark:text-white mb-8 tracking-tight uppercase">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <span className="font-bold text-spc-grey dark:text-neutral-200">
                      {faq.q}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                      stroke="currentColor"
                      className={`w-4 h-4 text-btn-green transition-transform duration-300 ${openFaq === index ? "rotate-180" : ""}`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed animate-in slide-in-from-top-2 duration-300">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section id="returns">
            <h2 className="text-2xl font-black text-spc-grey dark:text-white mb-6 tracking-tight uppercase">
              Returns & Refunds
            </h2>
            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800 transition-colors">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                We stand by the quality of our products. If you are not
                completely satisfied with your purchase, you may return the item
                within 30 days.
                <br />
                <br />
                1. Pack the item securely in its original packaging.
                <br />
                2. Include the original receipt or proof of purchase.
                <br />
                3. Send it to our return center using a trackable shipping
                service.
              </p>
            </div>
          </section>
        </div>

        {/* Right Side (Contact Form) - 5 Sütun Kaplar (Eskisine göre çok daha geniş) */}
        <div id="contact" className="lg:col-span-5">
          <div className="sticky top-12 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-8 sm:p-10 rounded-3xl shadow-xl shadow-neutral-100/50 dark:shadow-none transition-colors">
            <h3 className="text-xl font-black text-spc-grey dark:text-white mb-2 uppercase">
              Contact Us
            </h3>
            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-8">
              Response within 24h
            </p>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest ml-1 transition-colors">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full mt-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-5 py-4 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest ml-1 transition-colors">
                  Message
                </label>
                <textarea
                  rows={5}
                  className="w-full mt-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-5 py-4 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all resize-none"
                  placeholder="How can we help?"
                />
              </div>
              <button className="w-full bg-black dark:bg-neutral-800 text-white font-black uppercase text-xs tracking-widest py-4 rounded-xl hover:bg-btn-green dark:hover:bg-btn-green transition-all shadow-lg active:scale-95 mt-2">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
