"use client";
import { useContext, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

interface UserStats {
  id: number;
  email: string;
  name: string;
  order_count: number;
  joined_at: string;
}

interface SavedItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  product_price: number;
  saved_at: string;
}

interface UserComment {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  text: string;
  created_at: string;
}

interface ApiOrder {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
}

interface ChatMessage {
  id: number;
  sender: "user" | "ai";
  text: string;
}

interface StarIconProps {
  filled: boolean;
}

const StarIcon = ({ filled }: StarIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    className={`w-4 h-4 shrink-0 transition-all ${filled ? "text-[#FFC107] drop-shadow-sm" : "text-neutral-300 dark:text-neutral-700"}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385c.114.477-.41.856-.84.621L12 17.152a.562.562 0 00-.54 0l-4.793 2.62c-.43.235-.954-.144-.84-.62l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602c-.38-.325-.178-.948.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
);

export default function ProfilePage() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const token = authContext?.token;
  const logout = authContext?.logout;
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "ai",
      text: "Hello! I am your personal virtual assistant. I can help you choose a gift, navigate the store, or just chat. How can I help you today?",
    },
  ]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("ai_chat_history");
    if (savedHistory) {
      try {
        setChatHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ai_chat_history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  const [myComments, setMyComments] = useState<UserComment[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  const [orderFilter, setOrderFilter] = useState("All");
  const [orderSort, setOrderSort] = useState("Newest First");

  const [profileSearch, setProfileSearch] = useState("");

  const startEditing = () => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setIsEditing(true);
      setUpdateError(null);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) return;
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authContext?.token}`,
          },
          body: JSON.stringify({ name: editName, email: editEmail }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setUpdateError(data.detail || "Update failed.");
        setIsUpdating(false);
        return;
      }
      authContext?.updateUser(data);
      setIsEditing(false);
    } catch (err) {
      setUpdateError("Server error.");
    } finally {
      setIsUpdating(false);
    }
  };

  const [activeTab, setActiveTab] = useState("Orders");
  const [isAllOpen, setIsAllOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);

  const toggleOrderExpand = (id: number) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const rawPoints = Math.floor(
    orders.reduce((total, order) => total + order.total_amount, 0) / 10,
  );
  const earnedPoints = redeemedCode ? rawPoints - 50 : rawPoints;

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

  const processedOrders = [...orders]
    .filter((o) => orderFilter === "All" || o.status === orderFilter)
    .sort((a, b) => {
      if (orderSort === "Newest First")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (orderSort === "Oldest First")
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      if (orderSort === "Price: High to Low")
        return b.total_amount - a.total_amount;
      if (orderSort === "Price: Low to High")
        return a.total_amount - b.total_amount;
      return 0;
    });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.push("/");
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [user, router]);

  useEffect(() => {
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data: UserStats) => setStats(data))
      .catch((err) => {
        if (err.message === "Unauthorized") {
          authContext?.logout();
          router.push("/");
        }
      });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(console.error);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setMyComments(data);
      })
      .catch(console.error);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me/saved`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setSavedItems(data);
      })
      .catch(console.error);
  }, [token, router]);

  useEffect(() => {
    if (isAiOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isAiOpen]);

  const handleSendAiMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!aiInput.trim()) return;

    const userMessage = aiInput.trim();
    const newUserMsg: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: userMessage,
    };

    setChatHistory((prev) => [...prev, newUserMsg]);
    setAiInput("");
    setIsAiTyping(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            history: chatHistory.map((m) => ({
              sender: m.sender,
              text: m.text,
            })),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Connection with AI lost.");
      }

      const data = await response.json();

      const newAiMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: data.response,
      };
      setChatHistory((prev) => [...prev, newAiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: "I cannot connect to the server right now, Commander. Please try again later.",
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-neutral-950 transition-colors duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-neutral-200 dark:border-neutral-800 border-t-btn-green dark:border-t-btn-green"></div>
      </div>
    );
  }

  const profileMenuOptions = [
    {
      category: "Account Settings",
      items: ["Personal Information", "Delivery Addresses", "Payment Methods"],
    },
    {
      category: "Security & Privacy",
      items: ["Change Password", "Two-Factor Authentication"],
    },
    {
      category: "Preferences",
      items: ["Notification Settings", "Language & Region"],
    },
  ];

  const filteredMenuOptions = profileMenuOptions
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.toLowerCase().includes(profileSearch.toLowerCase().trim()),
      ),
    }))
    .filter((group) => group.items.length > 0);
  return (
    <div className="fixed inset-0 bg-white dark:bg-neutral-950 p-4 md:p-8 font-sans select-none text-spc-grey dark:text-neutral-200 overflow-hidden flex flex-col transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto w-full h-full flex flex-col relative">
        {/* Top Section: Return and Sign Out */}
        <div className="flex items-center justify-between mb-3 md:mb-4 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 w-fit text-neutral-400 hover:text-spc-grey dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors group"
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

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={logout}
              className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Header Section */}
        <div className="flex items-center justify-between mb-4 md:mb-5 shrink-0">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-2xl md:text-3xl font-black text-neutral-300 dark:text-neutral-600 shadow-sm shrink-0 transition-colors">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-lg md:text-xl font-black bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-spc-grey dark:text-white rounded-lg px-3 py-1 outline-none focus:border-btn-green dark:focus:border-btn-green transition-colors"
                />
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="text-[10px] md:text-xs font-medium text-spc-grey dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1 outline-none focus:border-btn-green dark:focus:border-btn-green transition-colors"
                />
                {updateError && (
                  <p className="text-[9px] text-red-500 font-bold">
                    {updateError}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    className="text-[9px] md:text-[10px] bg-btn-green hover:bg-green-600 text-white px-4 py-1.5 rounded-md font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-[9px] md:text-[10px] bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-spc-grey dark:text-neutral-300 px-4 py-1.5 rounded-md font-black uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5 overflow-hidden group relative pr-8">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-black text-spc-grey dark:text-white tracking-tighter leading-tight truncate">
                    {user.name}
                  </h1>
                  <button
                    onClick={startEditing}
                    className="text-neutral-300 dark:text-neutral-600 hover:text-btn-green dark:hover:text-btn-green transition-all hover:scale-110 shrink-0"
                    title="Edit Profile"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] md:text-xs font-medium text-neutral-400 dark:text-neutral-500 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end">
            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-neutral-300 dark:text-neutral-600">
              Points
            </p>
            <p className="text-lg md:text-xl font-black text-btn-green animate-in zoom-in duration-500">
              {earnedPoints > 0 ? earnedPoints : 0}
            </p>
            {earnedPoints >= 50 && !redeemedCode && (
              <button
                onClick={() => setRedeemedCode("LOYALTY5")}
                className="mt-1 bg-btn-green text-white text-[9px] font-black px-2 py-1 rounded-md hover:bg-green-600 transition-colors uppercase tracking-widest shadow-sm active:scale-95"
              >
                Get $5 Code
              </button>
            )}
            {redeemedCode && (
              <div
                onClick={() => {
                  navigator.clipboard.writeText(redeemedCode);
                  setToastMessage("Promo Code Copied: " + redeemedCode);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="mt-1 flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[10px] font-black text-spc-grey dark:text-white px-2 py-1.5 rounded-md uppercase tracking-widest cursor-pointer hover:border-btn-green dark:hover:border-btn-green transition-colors"
                title="Click to copy"
              >
                {redeemedCode}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="w-3 h-3 text-neutral-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Separator Line */}
        <div className="w-full h-px bg-red-500/10 dark:bg-neutral-800 mb-4 md:mb-5 shrink-0 transition-colors" />

        {/* The Segmented Bar */}
        <div className="w-full flex items-stretch border-2 border-neutral-100 dark:border-neutral-800 rounded-xl shadow-sm h-12 md:h-14 mb-4 md:mb-5 bg-white dark:bg-neutral-900 shrink-0 relative overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-0.5 md:pb-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full transition-colors">
          {["Orders", "Comments"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[90px] md:min-w-0 snap-start px-3 flex items-center justify-center border-r-2 border-neutral-100 dark:border-neutral-800 font-black text-[9px] md:text-[10px] uppercase tracking-wider transition-all ${tab === "Orders" ? "rounded-l-[9px]" : ""} ${activeTab === tab ? "bg-neutral-50 dark:bg-neutral-800 text-btn-green" : "text-spc-grey dark:text-neutral-400 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50"}`}
            >
              {tab}
            </button>
          ))}

          <div className="flex-[3.5] min-w-[180px] md:min-w-0 snap-start flex items-center border-r-2 border-neutral-100 dark:border-neutral-800 px-4 md:px-7 bg-white dark:bg-neutral-900 focus-within:bg-neutral-50/30 dark:focus-within:bg-neutral-800/50 transition-colors group">
            <input
              type="text"
              value={profileSearch}
              onChange={(e) => {
                setProfileSearch(e.target.value);
                if (e.target.value.trim().length > 0) setIsAllOpen(true);
              }}
              placeholder="SEARCH SETTINGS & MENUS..."
              className="w-full h-full outline-none text-[9px] md:text-[10px] font-black tracking-widest placeholder:text-neutral-300 dark:placeholder:text-neutral-600 text-spc-grey dark:text-neutral-200 uppercase bg-transparent"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="4"
              stroke="currentColor"
              className="w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-300 dark:text-neutral-600 group-focus-within:text-btn-green dark:group-focus-within:text-btn-green transition-colors shrink-0 ml-2"
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
              className={`flex-1 min-w-[80px] md:min-w-0 snap-start px-3 flex items-center justify-center border-r-2 border-neutral-100 dark:border-neutral-800 font-black text-[9px] md:text-[10px] uppercase tracking-wider transition-all ${activeTab === tab ? "bg-neutral-50 dark:bg-neutral-800 text-btn-green" : "text-spc-grey dark:text-neutral-400 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50"}`}
            >
              {tab}
            </button>
          ))}

          {/* ALL Selector */}
          <div
            className="flex-1 min-w-[90px] md:min-w-0 snap-start relative"
            ref={dropdownRef}
          >
            <button
              onClick={() => setIsAllOpen(!isAllOpen)}
              className={`w-full h-full px-4 md:px-5 flex items-center justify-center gap-2 rounded-r-[9px] bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 font-black text-[9px] md:text-[10px] uppercase tracking-wider transition-all ${isAllOpen ? "text-btn-green" : "text-spc-grey dark:text-neutral-300"}`}
            >
              All
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="4"
                stroke="currentColor"
                className={`w-2.5 h-2.5 md:w-3 md:h-3 transition-transform duration-300 ${isAllOpen ? "rotate-180 text-btn-green" : "text-spc-grey dark:text-neutral-400"}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {isAllOpen && (
              <div className="hidden md:block absolute top-[calc(100%+10px)] right-0 w-64 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] dark:shadow-none overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {filteredMenuOptions.length > 0 ? (
                  filteredMenuOptions.map((group, idx) => (
                    <div
                      key={idx}
                      className="p-4 border-b border-neutral-50 dark:border-neutral-800 last:border-0"
                    >
                      <p className="text-[9px] font-black text-neutral-300 dark:text-neutral-500 uppercase tracking-[0.2em] mb-3">
                        {group.category}
                      </p>
                      <div className="flex flex-col gap-2">
                        {group.items.map((item) => (
                          <button
                            key={item}
                            onClick={() => setIsAllOpen(false)}
                            className="text-left text-[11px] font-bold text-spc-grey dark:text-neutral-300 hover:text-btn-green dark:hover:text-btn-green transition-colors flex items-center justify-between group/item"
                          >
                            {item}
                            <div className="w-1 h-1 rounded-full bg-btn-green opacity-0 group-hover/item:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    No Settings Found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Maximized Context Area */}
        <div className="flex-1 flex flex-col items-center border-2 border-neutral-50 dark:border-neutral-800/50 rounded-[24px] md:rounded-[32px] p-4 md:p-6 bg-neutral-50/10 dark:bg-neutral-900/50 overflow-hidden relative mb-2 md:mb-5 transition-colors">
          <div className="w-12 md:w-16 h-1 bg-neutral-100 dark:bg-neutral-800 mb-4 md:mb-6 rounded-full shrink-0" />

          {isAiOpen ? (
            <div className="absolute inset-0 z-20 bg-white dark:bg-neutral-900 m-4 rounded-2xl md:rounded-3xl shadow-lg border border-neutral-100 dark:border-neutral-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Chat Header */}
              <div className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-[10px]">
                    AI
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-spc-grey dark:text-white">
                      Market Assistant
                    </h3>
                    <p className="text-[9px] font-bold text-btn-green">
                      Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const defaultMsg = [
                        {
                          id: 1,
                          sender: "ai" as const,
                          text: "Hello! I am your personal virtual assistant. I can help you choose a gift, navigate the store, or just chat. How can I help you today?",
                        },
                      ];
                      setChatHistory(defaultMsg);
                      localStorage.setItem(
                        "ai_chat_history",
                        JSON.stringify(defaultMsg),
                      );
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Clear History"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsAiOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 dark:text-neutral-500 hover:text-spc-grey dark:hover:text-white transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-neutral-50/30 dark:bg-neutral-950/50">
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[70%] p-3 md:p-4 rounded-2xl text-sm font-medium select-text cursor-text ${msg.sender === "user" ? "bg-btn-green text-white rounded-tr-sm" : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-spc-grey dark:text-neutral-200 rounded-tl-sm shadow-sm"}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex w-full justify-start">
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form
                onSubmit={handleSendAiMessage}
                className="p-3 md:p-4 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Need help? Ask me anything..."
                  className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-xs md:text-sm text-spc-grey dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none focus:border-btn-green dark:focus:border-btn-green transition-colors"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || isAiTyping}
                  className="bg-black dark:bg-neutral-700 hover:bg-neutral-800 dark:hover:bg-neutral-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white w-12 h-12 flex items-center justify-center rounded-xl transition-colors shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    className="w-5 h-5 ml-0.5 text-white dark:text-neutral-200"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                    />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 w-full flex flex-col items-center overflow-y-auto relative">
              {activeTab === "Orders" ? (
                <div className="w-full max-w-3xl flex flex-col">
                  <div className="w-full flex justify-between items-center mb-4 mt-1 px-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                      Your Orders
                    </h2>

                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="relative group/filter z-50">
                        <button className="flex items-center gap-1.5 md:gap-2 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider text-spc-grey dark:text-neutral-200 shadow-sm hover:border-btn-green dark:hover:border-btn-green transition-all">
                          <span>Filter: {orderFilter}</span>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-xl opacity-0 invisible group-hover/filter:opacity-100 group-hover/filter:visible transition-all p-2 flex flex-col gap-1">
                          <p className="text-[8px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest px-2 mb-1">
                            Status
                          </p>
                          {["All", "Completed", "Pending", "Canceled"].map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() => setOrderFilter(status)}
                                className={`text-left px-2 py-1.5 text-[10px] font-bold rounded-md transition-colors ${orderFilter === status ? "bg-btn-green/10 text-btn-green" : "text-spc-grey dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}
                              >
                                {status}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      <div className="relative group/sort z-40">
                        <button className="flex items-center gap-1.5 md:gap-2 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider text-spc-grey dark:text-neutral-200 shadow-sm hover:border-btn-green dark:hover:border-btn-green transition-all">
                          Sort
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-xl opacity-0 invisible group-hover/sort:opacity-100 group-hover/sort:visible transition-all p-2 flex flex-col gap-1">
                          {[
                            "Newest First",
                            "Oldest First",
                            "Price: High to Low",
                            "Price: Low to High",
                          ].map((sortOp) => (
                            <button
                              key={sortOp}
                              onClick={() => setOrderSort(sortOp)}
                              className={`text-left px-2 py-1.5 text-[10px] font-bold rounded-md transition-colors ${orderSort === sortOp ? "bg-btn-green/10 text-btn-green" : "text-spc-grey dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}
                            >
                              {sortOp}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {processedOrders.length > 0 ? (
                    <div className="flex flex-col gap-3 pb-20 px-2">
                      {processedOrders.map((order) => {
                        const isExpanded = expandedOrderId === order.id;

                        return (
                          <div
                            key={order.id}
                            className="flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-all group w-full overflow-hidden"
                          >
                            <div
                              onClick={() => toggleOrderExpand(order.id)}
                              className="flex items-center justify-between p-4 md:p-5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                            >
                              <div className="flex items-center gap-4 md:gap-6">
                                <div className="px-3 md:px-4 h-12 md:h-14 bg-neutral-50 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-sm md:text-base font-black text-neutral-400 dark:text-neutral-500 group-hover:text-btn-green dark:group-hover:text-btn-green transition-colors whitespace-nowrap">
                                  Order ID: #{order.id}
                                </div>
                                <div className="text-left">
                                  <p className="text-[9px] md:text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-0.5">
                                    {new Date(
                                      order.created_at,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs md:text-sm font-black text-spc-grey dark:text-white">
                                      {order.status}
                                    </p>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth="3"
                                      stroke="currentColor"
                                      className={`w-3 h-3 text-neutral-400 transition-transform duration-300 ${isExpanded ? "rotate-180 text-btn-green" : ""}`}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-base md:text-lg font-black text-btn-green">
                                  ${order.total_amount.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
                            >
                              <div className="p-4 md:p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col gap-4">
                                <div>
                                  <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                                    Items in your order
                                  </h4>
                                  <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-100 dark:border-neutral-700">
                                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-md flex items-center justify-center text-xl shrink-0">
                                      🛍️
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-bold text-spc-grey dark:text-neutral-200">
                                        Premium Market Products
                                      </p>
                                      <p className="text-[10px] font-medium text-neutral-500">
                                        Qty: Multiple items included
                                      </p>
                                    </div>
                                    <p className="text-xs font-black text-spc-grey dark:text-white">
                                      ${order.total_amount.toFixed(2)}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  <div className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-100 dark:border-neutral-700">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                                      Shipping Address
                                    </h4>
                                    <p className="text-[10px] md:text-xs font-medium text-spc-grey dark:text-neutral-300 leading-relaxed truncate">
                                      {user?.name || "Customer"}
                                      <br />
                                      123 Commerce St, Suite 100
                                      <br />
                                      Istanbul, Turkey 34000
                                    </p>
                                  </div>
                                  <div className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-100 dark:border-neutral-700">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                                      Payment Method
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="w-6 h-4 bg-neutral-200 dark:bg-neutral-600 rounded flex items-center justify-center text-[6px] font-black text-neutral-600 dark:text-neutral-300">
                                        VISA
                                      </div>
                                      <p className="text-[10px] md:text-xs font-medium text-spc-grey dark:text-neutral-300">
                                        •••• 4242
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 flex justify-end">
                                  <Link
                                    href="/tracking"
                                    className="bg-black dark:bg-neutral-700 hover:bg-neutral-800 dark:hover:bg-neutral-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm"
                                  >
                                    Track Package
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
                                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                                      />
                                    </svg>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center mt-10">
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300 dark:text-neutral-700 text-center">
                        No Orders Found
                      </p>
                    </div>
                  )}
                </div>
              ) : activeTab === "Comments" ? (
                <div className="w-full max-w-3xl flex flex-col">
                  <div className="w-full flex justify-between items-center mb-4 mt-1 px-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                      Your Reviews
                    </h2>
                  </div>

                  {myComments.length > 0 ? (
                    <div className="flex flex-col gap-3 pb-20 px-2">
                      {myComments.map((comment) => {
                        let commentRating = 5;
                        let commentText = comment.text;

                        const match = comment.text.match(/^(\d)\|([\s\S]*)$/);
                        if (match) {
                          commentRating = parseInt(match[1]);
                          commentText = match[2];
                        }

                        return (
                          <div
                            key={comment.id}
                            className="flex flex-col md:flex-row gap-4 bg-white dark:bg-neutral-900 p-4 md:p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-btn-green dark:hover:border-btn-green transition-all group w-full"
                          >
                            <Link
                              href={`/product/${comment.product_id}`}
                              className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-xl relative overflow-hidden shrink-0 border border-neutral-100 dark:border-neutral-700"
                            >
                              <Image
                                src={comment.product_image}
                                alt={comment.product_name}
                                fill
                                className="object-cover"
                              />
                            </Link>
                            <div className="flex-1 text-left flex flex-col justify-center">
                              <div className="flex items-start justify-between gap-2">
                                <Link
                                  href={`/product/${comment.product_id}`}
                                  className="text-xs md:text-sm font-black text-spc-grey dark:text-neutral-200 hover:text-btn-green dark:hover:text-btn-green transition-colors leading-tight"
                                >
                                  {comment.product_name}
                                </Link>
                                <div className="flex shrink-0">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <StarIcon
                                      key={star}
                                      filled={star <= commentRating}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[9px] md:text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 mt-0.5">
                                {new Date(
                                  comment.created_at,
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed italic">
                                {commentText}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center mt-10">
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300 dark:text-neutral-700 text-center">
                        No Reviews Yet
                      </p>
                    </div>
                  )}
                </div>
              ) : activeTab === "Saved" ? (
                <div className="w-full max-w-3xl flex flex-col">
                  <div className="w-full flex justify-between items-center mb-4 mt-1 px-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                      Saved Items
                    </h2>
                  </div>
                  {savedItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-20 px-2">
                      {savedItems.map((item) => (
                        <Link
                          href={`/product/${item.product_id}`}
                          key={item.id}
                          className="bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-red-400 dark:hover:border-red-400 transition-all group flex flex-col"
                        >
                          <div className="aspect-square w-full bg-neutral-50 dark:bg-neutral-800 rounded-xl relative overflow-hidden mb-3">
                            <Image
                              src={item.product_image}
                              alt={item.product_name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <h3 className="text-xs font-black text-spc-grey dark:text-neutral-200 truncate">
                            {item.product_name}
                          </h3>
                          <p className="text-sm font-black text-btn-green mt-1">
                            ${item.product_price.toFixed(2)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center mt-10">
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300 dark:text-neutral-700 text-center">
                        No Saved Items
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-200 dark:text-neutral-700 text-center">
                    {activeTab} Content Area
                  </p>
                </div>
              )}
            </div>
          )}
          {!isAiOpen && (
            <button
              onClick={() => setIsAiOpen(true)}
              className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10 bg-black dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white px-8 py-3.5 md:px-12 md:py-4.5 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest shadow-[0_15px_60px_-10px_rgba(0,0,0,0.6)] dark:shadow-none border border-transparent dark:border-neutral-700 transition-all hover:-translate-y-1 active:scale-95"
            >
              AI
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Menu - Mobile Bottom Sheet */}
      {isAllOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsAllOpen(false)}
          />
          <div className="relative bg-white dark:bg-neutral-950 w-full rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-8">
            <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto mb-6" />
            <div className="max-h-[60vh] overflow-y-auto">
              {profileMenuOptions.map((group, idx) => (
                <div key={idx} className="mb-6 last:mb-0">
                  <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-4">
                    {group.category}
                  </p>
                  <div className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <button
                        key={item}
                        onClick={() => setIsAllOpen(false)}
                        className="text-left text-sm font-bold text-spc-grey dark:text-neutral-300 hover:text-btn-green dark:hover:text-btn-green transition-colors flex items-center justify-between"
                      >
                        {item}
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-btn-green text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-2xl animate-in slide-in-from-bottom-4 duration-300 z-50 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
