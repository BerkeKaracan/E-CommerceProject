"use client";
import { useContext, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";

export default function ProfilePage() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Orders");

  // State for the "All" dropdown menu
  const [isAllOpen, setIsAllOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsAllOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.push("/");
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [user, router]);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-spc-grey"></div>
      </div>
    );
  }

  const allOptions = [
    {
      category: "Sort By",
      items: ["Recent", "Oldest", "Price: High", "Price: Low"],
    },
    {
      category: "Categories",
      items: ["Electronics", "Fashion", "Home", "Sports", "Books"],
    },
    { category: "Status", items: ["Completed", "Pending", "Canceled"] },
  ];

  return (
    <div className="h-screen bg-white p-5 md:p-8 font-sans select-none text-spc-grey overflow-hidden">
      <div className="max-w-[1200px] mx-auto h-full flex flex-col relative">
        {/* Return Button */}
        <Link
          href="/"
          className="flex items-center gap-2 mb-4 w-fit text-neutral-400 hover:text-spc-grey transition-colors group shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="3"
            stroke="currentColor"
            className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest">
            Return Main Page
          </span>
        </Link>

        {/* Header Section */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full border border-neutral-100 bg-neutral-50 flex items-center justify-center text-3xl font-black text-neutral-300 shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-black tracking-tighter leading-tight">
                {user.name}
              </h1>
              <p className="text-xs font-medium text-neutral-400">
                {user.email}
              </p>
            </div>
          </div>

          <div className="text-right hidden md:flex items-center gap-8">
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-300">
                Orders
              </p>
              <p className="text-xl font-black">0</p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-300">
                Points
              </p>
              <p className="text-xl font-black text-btn-green">0</p>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="w-full h-px bg-red-500/10 mb-5 shrink-0" />

        {/* The Segmented Bar */}
        <div className="w-full flex items-stretch border-2 border-neutral-100 rounded-xl shadow-sm h-14 mb-5 bg-white shrink-0 relative">
          {["Orders", "Comments"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 flex items-center justify-center border-r-2 border-neutral-100 font-black text-[10px] uppercase tracking-wider transition-all ${activeTab === tab ? "bg-neutral-50 text-btn-green" : "hover:bg-neutral-50/50"}`}
            >
              {tab}
            </button>
          ))}

          <div className="flex-[3.5] flex items-center border-r-2 border-neutral-100 px-7 bg-white focus-within:bg-neutral-50/30 transition-colors group">
            <input
              type="text"
              placeholder="SEARCH PROPERTY"
              className="w-full h-full outline-none text-[10px] font-black tracking-widest placeholder:text-neutral-300 uppercase bg-transparent"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="4"
              stroke="currentColor"
              className="w-4 h-4 text-neutral-300 group-focus-within:text-btn-green transition-colors"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>

          {["Saved", "Support"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 flex items-center justify-center border-r-2 border-neutral-100 font-black text-[10px] uppercase tracking-wider transition-all ${activeTab === tab ? "bg-neutral-50 text-btn-green" : "hover:bg-neutral-50/50"}`}
            >
              {tab}
            </button>
          ))}

          {/* ALL Selector with Dropdown */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <button
              onClick={() => setIsAllOpen(!isAllOpen)}
              className={`w-full h-full px-5 flex items-center justify-center gap-2 bg-neutral-50 hover:bg-neutral-100 font-black text-[10px] uppercase tracking-wider transition-all ${isAllOpen ? "text-btn-green" : ""}`}
            >
              All
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="4"
                stroke="currentColor"
                className={`w-3 h-3 transition-transform duration-300 ${isAllOpen ? "rotate-180" : ""}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isAllOpen && (
              <div className="absolute top-[calc(100%+10px)] right-0 w-64 bg-white border border-neutral-100 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] overflow-hidden z-110 animate-in fade-in slide-in-from-top-2 duration-200">
                {allOptions.map((group, idx) => (
                  <div
                    key={idx}
                    className="p-4 border-b border-neutral-50 last:border-0"
                  >
                    <p className="text-[9px] font-black text-neutral-300 uppercase tracking-[0.2em] mb-3">
                      {group.category}
                    </p>
                    <div className="flex flex-col gap-2">
                      {group.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => setIsAllOpen(false)}
                          className="text-left text-[11px] font-bold text-spc-grey hover:text-btn-green transition-colors flex items-center justify-between group/item"
                        >
                          {item}
                          <div className="w-1 h-1 rounded-full bg-btn-green opacity-0 group-hover/item:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Maximized Context Area - Now with AI Inside */}
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-neutral-50 rounded-[32px] p-6 bg-neutral-50/10 overflow-hidden relative mb-5">
          <div className="w-16 h-1 bg-neutral-100 mb-6 rounded-full shrink-0" />

          {/* Main Content Placeholder - Moved up slightly for balance */}
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-200">
              {activeTab} Content Area
            </p>
          </div>

          {/* AI Button - Internal, Absolute Positioned, Glowing Black */}
          <button className="absolute bottom-6 right-6 z-10 bg-black hover:bg-neutral-800 text-white px-12 py-4.5 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_15px_60px_-10px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-1 active:scale-95 active:shadow-[0_10px_40px_-10px_rgba(34,197,94,0.4)]">
            AI
          </button>
        </div>
      </div>
    </div>
  );
}
