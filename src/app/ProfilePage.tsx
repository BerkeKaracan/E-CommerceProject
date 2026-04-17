"use client";
import { useContext, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";

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

  const [myComments, setMyComments] = useState<UserComment[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  const [orderFilter, setOrderFilter] = useState("All");
  const [orderSort, setOrderSort] = useState("Newest First");

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-spc-grey"></div>
      </div>
    );
  }

  const profileMenuOptions = [
    {
      category: "My Account",
      items: [
        "Personal Information",
        "Addresses",
        "Payment Methods",
        "Security Settings",
      ],
    },
    {
      category: "My Shopping",
      items: [
        "All Orders",
        "Returns & Cancellations",
        "My Reviews",
        "Wishlists",
      ],
    },
    {
      category: "Preferences",
      items: ["Notifications", "App Settings", "Help Center"],
    },
  ];

  return (
    <div className="fixed inset-0 bg-white p-4 md:p-8 font-sans select-none text-spc-grey overflow-hidden flex flex-col">
      <div className="max-w-[1200px] mx-auto w-full h-full flex flex-col relative">
        {/* Top Section: Return and Sign Out */}
        <div className="flex items-center justify-between mb-3 md:mb-4 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 w-fit text-neutral-400 hover:text-spc-grey transition-colors group"
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

          <button
            onClick={logout}
            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Header Section */}
        <div className="flex items-center justify-between mb-4 md:mb-5 shrink-0">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-neutral-100 bg-neutral-50 flex items-center justify-center text-2xl md:text-3xl font-black text-neutral-300 shadow-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-lg md:text-xl font-black bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1 outline-none focus:border-btn-green transition-colors"
                />
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="text-[10px] md:text-xs font-medium text-spc-grey bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1 outline-none focus:border-btn-green transition-colors"
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
                    className="text-[9px] md:text-[10px] bg-neutral-200 hover:bg-neutral-300 text-spc-grey px-4 py-1.5 rounded-md font-black uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5 overflow-hidden group relative pr-8">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-black tracking-tighter leading-tight truncate">
                    {user.name}
                  </h1>
                  <button
                    onClick={startEditing}
                    className="text-neutral-300 hover:text-btn-green transition-all hover:scale-110 shrink-0"
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
                <p className="text-[10px] md:text-xs font-medium text-neutral-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>

          <div className="text-right flex items-center gap-4 md:gap-8 shrink-0">
            <div className="flex flex-col items-end">
              <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-neutral-300">
                Orders
              </p>
              <p className="text-lg md:text-xl font-black">
                {orders.length > 0 ? orders.length : stats?.order_count || 0}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-neutral-300">
                Points
              </p>
              <p className="text-lg md:text-xl font-black text-btn-green">0</p>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="w-full h-px bg-red-500/10 mb-4 md:mb-5 shrink-0" />

        {/* The Segmented Bar */}
        <div className="w-full flex items-stretch border-2 border-neutral-100 rounded-xl shadow-sm h-12 md:h-14 mb-4 md:mb-5 bg-white shrink-0 relative overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-0.5 md:pb-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {["Orders", "Comments"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[90px] md:min-w-0 snap-start px-3 flex items-center justify-center border-r-2 border-neutral-100 font-black text-[9px] md:text-[10px] uppercase tracking-wider transition-all ${tab === "Orders" ? "rounded-l-[9px]" : ""} ${activeTab === tab ? "bg-neutral-50 text-btn-green" : "hover:bg-neutral-50/50"}`}
            >
              {tab}
            </button>
          ))}

          <div className="flex-[3.5] min-w-[180px] md:min-w-0 snap-start flex items-center border-r-2 border-neutral-100 px-4 md:px-7 bg-white focus-within:bg-neutral-50/30 transition-colors group">
            <input
              type="text"
              placeholder="SEARCH PROPERTY"
              className="w-full h-full outline-none text-[9px] md:text-[10px] font-black tracking-widest placeholder:text-neutral-300 uppercase bg-transparent"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="4"
              stroke="currentColor"
              className="w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-300 group-focus-within:text-btn-green transition-colors shrink-0 ml-2"
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
              className={`flex-1 min-w-[80px] md:min-w-0 snap-start px-3 flex items-center justify-center border-r-2 border-neutral-100 font-black text-[9px] md:text-[10px] uppercase tracking-wider transition-all ${activeTab === tab ? "bg-neutral-50 text-btn-green" : "hover:bg-neutral-50/50"}`}
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
              className={`w-full h-full px-4 md:px-5 flex items-center justify-center gap-2 rounded-r-[9px] bg-neutral-50 hover:bg-neutral-100 font-black text-[9px] md:text-[10px] uppercase tracking-wider transition-all ${isAllOpen ? "text-btn-green" : ""}`}
            >
              All
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="4"
                stroke="currentColor"
                className={`w-2.5 h-2.5 md:w-3 md:h-3 transition-transform duration-300 ${isAllOpen ? "rotate-180" : ""}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {isAllOpen && (
              <div className="hidden md:block absolute top-[calc(100%+10px)] right-0 w-64 bg-white border border-neutral-100 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] overflow-hidden z-110 animate-in fade-in slide-in-from-top-2 duration-200">
                {profileMenuOptions.map((group, idx) => (
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

        {/* Maximized Context Area */}
        <div className="flex-1 flex flex-col items-center border-2 border-neutral-50 rounded-[24px] md:rounded-[32px] p-4 md:p-6 bg-neutral-50/10 overflow-hidden relative mb-2 md:mb-5">
          <div className="w-12 md:w-16 h-1 bg-neutral-100 mb-4 md:mb-6 rounded-full shrink-0" />

          {isAiOpen ? (
            <div className="absolute inset-0 z-20 bg-white m-4 rounded-2xl md:rounded-3xl shadow-lg border border-neutral-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Chat Header */}
              <div className="bg-neutral-50 border-b border-neutral-100 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-[10px]">
                    AI
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest">
                      Market Assistant
                    </h3>
                    <p className="text-[9px] font-bold text-btn-green">
                      Online
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-spc-grey transition-colors"
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

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-neutral-50/30">
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[70%] p-3 md:p-4 rounded-2xl text-sm font-medium ${msg.sender === "user" ? "bg-btn-green text-white rounded-tr-sm" : "bg-white border border-neutral-200 text-spc-grey rounded-tl-sm shadow-sm"}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex w-full justify-start">
                    <div className="bg-white border border-neutral-200 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form
                onSubmit={handleSendAiMessage}
                className="p-3 md:p-4 bg-white border-t border-neutral-100 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Need help? Ask me anything..."
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs md:text-sm outline-none focus:border-btn-green transition-colors"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || isAiTyping}
                  className="bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white w-12 h-12 flex items-center justify-center rounded-xl transition-colors shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    className="w-5 h-5 ml-0.5"
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
                  <div className="w-full flex justify-between items-center mb-4 mt-1 px-2 border-b border-neutral-100 pb-4">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-neutral-400">
                      Your Orders
                    </h2>

                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="relative group/filter z-50">
                        <button className="flex items-center gap-1.5 md:gap-2 bg-white border border-neutral-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider text-spc-grey shadow-sm hover:border-btn-green transition-all">
                          <span>Filter: {orderFilter}</span>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-neutral-100 rounded-xl shadow-xl opacity-0 invisible group-hover/filter:opacity-100 group-hover/filter:visible transition-all p-2 flex flex-col gap-1">
                          <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest px-2 mb-1">
                            Status
                          </p>
                          {["All", "Completed", "Pending", "Canceled"].map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() => setOrderFilter(status)}
                                className={`text-left px-2 py-1.5 text-[10px] font-bold rounded-md transition-colors ${orderFilter === status ? "bg-btn-green/10 text-btn-green" : "text-spc-grey hover:bg-neutral-50"}`}
                              >
                                {status}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      <div className="relative group/sort z-40">
                        <button className="flex items-center gap-1.5 md:gap-2 bg-white border border-neutral-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider text-spc-grey shadow-sm hover:border-btn-green transition-all">
                          Sort
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-neutral-100 rounded-xl shadow-xl opacity-0 invisible group-hover/sort:opacity-100 group-hover/sort:visible transition-all p-2 flex flex-col gap-1">
                          {[
                            "Newest First",
                            "Oldest First",
                            "Price: High to Low",
                            "Price: Low to High",
                          ].map((sortOp) => (
                            <button
                              key={sortOp}
                              onClick={() => setOrderSort(sortOp)}
                              className={`text-left px-2 py-1.5 text-[10px] font-bold rounded-md transition-colors ${orderSort === sortOp ? "bg-btn-green/10 text-btn-green" : "text-spc-grey hover:bg-neutral-50"}`}
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
                      {processedOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between bg-white p-4 md:p-5 rounded-2xl border border-neutral-100 shadow-sm hover:border-btn-green transition-all group w-full"
                        >
                          <div className="flex items-center gap-4 md:gap-6">
                            <div className="px-3 md:px-4 h-12 md:h-14 bg-neutral-50 rounded-xl flex items-center justify-center text-sm md:text-base font-black text-neutral-400 group-hover:text-btn-green transition-colors whitespace-nowrap">
                              Order ID: #{order.id}
                            </div>
                            <div className="text-left">
                              <p className="text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">
                                {new Date(order.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                              <p className="text-xs md:text-sm font-black text-spc-grey">
                                {order.status}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base md:text-lg font-black text-btn-green">
                              ${order.total_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center mt-10">
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300 text-center">
                        No Orders Found
                      </p>
                    </div>
                  )}
                </div>
              ) : activeTab === "Comments" ? (
                <div className="w-full max-w-3xl flex flex-col">
                  <div className="w-full flex justify-between items-center mb-4 mt-1 px-2 border-b border-neutral-100 pb-4">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-neutral-400">
                      Your Reviews
                    </h2>
                  </div>

                  {myComments.length > 0 ? (
                    <div className="flex flex-col gap-3 pb-20 px-2">
                      {myComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex flex-col md:flex-row gap-4 bg-white p-4 md:p-5 rounded-2xl border border-neutral-100 shadow-sm hover:border-btn-green transition-all group w-full"
                        >
                          <Link
                            href={`/product/${comment.product_id}`}
                            className="w-16 h-16 bg-neutral-50 rounded-xl relative overflow-hidden shrink-0 border border-neutral-100"
                          >
                            <Image
                              src={comment.product_image}
                              alt={comment.product_name}
                              fill
                              className="object-cover"
                            />
                          </Link>
                          <div className="flex-1 text-left">
                            <Link
                              href={`/product/${comment.product_id}`}
                              className="text-xs md:text-sm font-black text-spc-grey hover:text-btn-green transition-colors leading-tight"
                            >
                              {comment.product_name}
                            </Link>
                            <p className="text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 mt-0.5">
                              {new Date(
                                comment.created_at,
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-xs md:text-sm font-medium text-neutral-500 leading-relaxed italic">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center mt-10">
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300 text-center">
                        No Reviews Yet
                      </p>
                    </div>
                  )}
                </div>
              ) : activeTab === "Saved" ? (
                <div className="w-full max-w-3xl flex flex-col">
                  <div className="w-full flex justify-between items-center mb-4 mt-1 px-2 border-b border-neutral-100 pb-4">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-neutral-400">
                      Saved Items
                    </h2>
                  </div>
                  {savedItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-20 px-2">
                      {savedItems.map((item) => (
                        <Link
                          href={`/product/${item.product_id}`}
                          key={item.id}
                          className="bg-white p-3 rounded-2xl border border-neutral-100 shadow-sm hover:border-red-400 transition-all group flex flex-col"
                        >
                          <div className="aspect-square w-full bg-neutral-50 rounded-xl relative overflow-hidden mb-3">
                            <Image
                              src={item.product_image}
                              alt={item.product_name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <h3 className="text-xs font-black text-spc-grey truncate">
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
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300 text-center">
                        No Saved Items
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-200 text-center">
                    {activeTab} Content Area
                  </p>
                </div>
              )}
            </div>
          )}
          {!isAiOpen && (
            <button
              onClick={() => setIsAiOpen(true)}
              className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10 bg-black hover:bg-neutral-800 text-white px-8 py-3.5 md:px-12 md:py-4.5 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest shadow-[0_15px_60px_-10px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-1 active:scale-95 active:shadow-[0_10px_40px_-10px_rgba(34,197,94,0.4)]"
            >
              AI
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Menu - Mobile Bottom Sheet */}
      {isAllOpen && (
        <div className="md:hidden fixed inset-0 z-120 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsAllOpen(false)}
          />
          <div className="relative bg-white w-full rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-8">
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6" />
            <div className="max-h-[60vh] overflow-y-auto">
              {profileMenuOptions.map((group, idx) => (
                <div key={idx} className="mb-6 last:mb-0">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">
                    {group.category}
                  </p>
                  <div className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <button
                        key={item}
                        onClick={() => setIsAllOpen(false)}
                        className="text-left text-sm font-bold text-spc-grey hover:text-btn-green transition-colors flex items-center justify-between"
                      >
                        {item}
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
