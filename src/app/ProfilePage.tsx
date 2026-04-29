"use client";
import { useContext, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { QRCodeSVG } from "qrcode.react";

interface UserStats {
  id: number;
  email: string;
  name: string;
  order_count: number;
  joined_at: string;
  points: number;
  is_2fa_enabled?: number;
}

interface RewardCode {
  id: number;
  code: string;
  discount_amount: number;
}

interface RewardData {
  points: number;
  active_codes: RewardCode[];
}

interface SavedItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  product_price: number;
  saved_at: string;
}

interface ApiAddress {
  id: number;
  title: string;
  full_address: string;
  is_default: number;
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

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [twoFaSetup, setTwoFaSetup] = useState<{
    secret: string;
    uri: string;
  } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [isVerifying2Fa, setIsVerifying2Fa] = useState(false);

  const [rewardData, setRewardData] = useState<RewardData | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);

  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: "",
    full_address: "",
    is_default: 0,
  });

  const isSearchFocusedRef = useRef(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);

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

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/addresses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(addressForm),
        },
      );
      if (res.ok) {
        setToastMessage("📍 Address successfully saved!");
        setTimeout(() => setToastMessage(null), 3000);
        setIsAddressFormOpen(false);
        setAddressForm({ title: "", full_address: "", is_default: 0 });
        const updated = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/addresses`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setAddresses(await updated.json());
      }
    } catch (err) {
      setToastMessage("❌ Failed to save address.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/addresses/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setToastMessage("🗑️ Address deleted.");
        setTimeout(() => setToastMessage(null), 3000);
        setAddresses(addresses.filter((a) => a.id !== id));
      }
    } catch (err) {}
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
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Element;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !target.closest("#mobile-bottom-sheet") &&
        !target.closest("#profile-search-container")
      ) {
        setIsAllOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAddresses(data);
      })
      .catch(console.error);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/rewards`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setRewardData(data);
      })
      .catch(console.error);
  }, [token, router]);

  const handleExchangePoints = async (
    pointsToSpend: number,
    discountAmount: number,
  ) => {
    if (!rewardData || rewardData.points < pointsToSpend) return;
    setIsExchanging(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/exchange-points`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            points: pointsToSpend,
            discount: discountAmount,
          }),
        },
      );
      const data = await res.json();

      if (res.ok) {
        setToastMessage("🎉 Reward claimed successfully!");
        setRewardData((prev) =>
          prev
            ? {
                points: prev.points - pointsToSpend,
                active_codes: [
                  ...prev.active_codes,
                  {
                    id: Date.now(),
                    code: data.code,
                    discount_amount: discountAmount,
                  },
                ],
              }
            : prev,
        );
      } else {
        setToastMessage("❌ " + (data.detail || "Failed to exchange points."));
      }
    } catch (err) {
      setToastMessage("❌ Server connection error!");
    } finally {
      setIsExchanging(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };
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
    <div className="w-full min-h-screen bg-white dark:bg-neutral-950 p-4 md:p-8 font-sans select-none text-spc-grey dark:text-neutral-200 flex flex-col transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto w-full flex-1 flex flex-col relative">
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
                <div className="flex flex-col">
                  <h1 className="text-2xl md:text-4xl font-black text-spc-grey dark:text-white uppercase tracking-tighter leading-none mb-2">
                    {stats?.name || "Loading..."}
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-yellow-400/10 dark:bg-yellow-400/5 px-3 py-1 rounded-lg border border-yellow-400/20 shadow-sm">
                      <span className="text-[11px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">
                        {stats?.points ?? 0} PTS
                      </span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      Premium Rewards Member
                    </span>
                  </div>
                </div>
                <p className="text-[10px] md:text-xs font-medium text-neutral-400 dark:text-neutral-500 truncate">
                  {user.email}
                </p>
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

          <div
            id="profile-search-container"
            className="flex-[3.5] min-w-[180px] md:min-w-0 snap-start flex items-center border-r-2 relative z-[1000] border-neutral-100 dark:border-neutral-800 px-4 md:px-7 bg-white dark:bg-neutral-900 focus-within:bg-neutral-50/30 dark:focus-within:bg-neutral-800/50 transition-colors group"
          >
            <input
              id="profile-search-input"
              type="text"
              value={profileSearch}
              onChange={(e) => {
                setProfileSearch(e.target.value);
                if (e.target.value.trim().length > 0) setIsAllOpen(true);
              }}
              onFocus={() => {
                isSearchFocusedRef.current = true;
              }}
              onBlur={() => {
                setTimeout(() => {
                  isSearchFocusedRef.current = false;
                }, 300);
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

          {["Saved", "Rewards", "Support"].map((tab) => (
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
              <div className="hidden md:block absolute top-[calc(100%+10px)] right-0 w-64 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] dark:shadow-none overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
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
                            onClick={() => {
                              setIsAllOpen(false);
                              setActiveTab(item);
                            }}
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
        <div className="flex-1 flex flex-col items-center border-2 border-neutral-50 dark:border-neutral-800/50 rounded-[24px] md:rounded-[32px] p-4 md:p-6 bg-neutral-50/10 dark:bg-neutral-900/50 relative mb-2 md:mb-5 transition-colors min-h-[60vh]">
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
            <div className="flex-1 w-full flex flex-col items-center relative">
              {activeTab === "Orders" ? (
                <div className="w-full max-w-3xl flex flex-col">
                  <div className="w-full flex justify-between items-center mb-4 mt-1 px-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                      Your Orders
                    </h2>

                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="relative group/filter z-30">
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
                      <div className="relative group/sort z-20">
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
                              <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
                                <div className="px-2 md:px-4 h-12 md:h-14 bg-neutral-50 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-xs md:text-base font-black text-neutral-400 dark:text-neutral-500 group-hover:text-btn-green dark:group-hover:text-btn-green transition-colors shrink-0">
                                  #{order.id}
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                  <p className="text-[9px] md:text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-0.5 truncate">
                                    {new Date(
                                      order.created_at,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                  <div className="flex items-center gap-1 md:gap-2">
                                    <p className="text-xs md:text-sm font-black text-spc-grey dark:text-white truncate">
                                      {order.status}
                                    </p>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth="3"
                                      stroke="currentColor"
                                      className={`w-3 h-3 shrink-0 text-neutral-400 transition-transform duration-300 ${isExpanded ? "rotate-180 text-btn-green" : ""}`}
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
                              <div className="text-right shrink-0 max-w-[35%] pl-2">
                                <p
                                  className="text-sm md:text-lg font-black text-btn-green truncate"
                                  title={`$${order.total_amount.toFixed(2)}`}
                                >
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
              ) : activeTab === "Rewards" ? (
                <div className="flex-1 w-full max-w-3xl flex flex-col mt-4 md:mt-6 animate-in fade-in zoom-in-95 duration-300 px-2 pb-20">
                  {/* Header Info */}
                  <div className="flex items-center justify-between mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-linear-to-tr from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg text-lg text-white">
                        💎
                      </div>
                      <div>
                        <h2 className="text-sm md:text-base font-black text-spc-grey dark:text-white uppercase tracking-wider">
                          Premium Rewards
                        </h2>
                        <p className="text-[10px] font-bold text-neutral-400">
                          Collect points and claim legendary discounts!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Balance Card */}
                  <div className="relative overflow-hidden bg-linear-to-br from-neutral-900 to-black dark:from-black dark:to-neutral-900 border border-neutral-800 rounded-[2rem] p-6 shadow-2xl mb-8 group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>

                    <div className="relative z-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">
                          Current Balance
                        </p>
                        <div className="flex items-baseline justify-center md:justify-start gap-2">
                          <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-300 to-yellow-500 drop-shadow-sm">
                            {rewardData?.points || 0}
                          </span>
                          <span className="text-sm font-bold text-yellow-500/80 uppercase tracking-widest">
                            PTS
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reward Options (Tiers) */}
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">
                    Exchange Points
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Option 1: Basic */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center">
                      <p className="text-sm font-black text-spc-grey dark:text-white uppercase mb-1">
                        $10 Discount
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 mb-4">
                        Minimum tier
                      </p>
                      <button
                        onClick={() => handleExchangePoints(100, 10)}
                        disabled={
                          isExchanging || (rewardData?.points ?? 0) < 100
                        }
                        className="w-full mt-auto bg-neutral-100 dark:bg-neutral-800 text-spc-grey dark:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all disabled:opacity-50"
                      >
                        100 PTS
                      </button>
                    </div>

                    {/* Option 2: Standard (Highlighted) */}
                    <div className="bg-white dark:bg-neutral-900 border-2 border-yellow-400 dark:border-yellow-500 rounded-2xl p-5 shadow-md flex flex-col items-center text-center relative transform md:-translate-y-2">
                      <span className="absolute -top-3 bg-yellow-400 dark:bg-yellow-500 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        Most Popular
                      </span>
                      <p className="text-sm font-black text-spc-grey dark:text-white uppercase mb-1">
                        $50 Discount
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 mb-4">
                        Standard tier
                      </p>
                      <button
                        onClick={() => handleExchangePoints(500, 50)}
                        disabled={
                          isExchanging || (rewardData?.points ?? 0) < 500
                        }
                        className="w-full mt-auto bg-linear-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-sm disabled:opacity-50 disabled:grayscale"
                      >
                        500 PTS
                      </button>
                    </div>

                    {/* Option 3: Premium */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center">
                      <p className="text-sm font-black text-spc-grey dark:text-white uppercase mb-1">
                        $120 Discount
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 mb-4">
                        Legendary tier
                      </p>
                      <button
                        onClick={() => handleExchangePoints(1000, 120)}
                        disabled={
                          isExchanging || (rewardData?.points ?? 0) < 1000
                        }
                        className="w-full mt-auto bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all disabled:opacity-50"
                      >
                        1000 PTS
                      </button>
                    </div>
                  </div>

                  {/* Active Codes Section */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">
                      Your Available Codes
                    </h3>
                    {rewardData?.active_codes &&
                    rewardData.active_codes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rewardData.active_codes.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:border-btn-green dark:hover:border-btn-green transition-colors"
                          >
                            <div>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                                ${item.discount_amount} Off
                              </p>
                              <p className="text-sm font-black text-spc-grey dark:text-white tracking-widest">
                                {item.code}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.code);
                                setToastMessage("Copied: " + item.code);
                                setTimeout(() => setToastMessage(null), 3000);
                              }}
                              className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center hover:bg-btn-green/10 text-neutral-400 hover:text-btn-green transition-colors"
                              title="Copy Code"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-2xl">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          No active codes available.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "Support" ? (
                <div className="flex-1 w-full max-w-3xl flex flex-col items-center justify-center gap-4 mt-16 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center text-2xl mb-2 shadow-sm border border-neutral-100 dark:border-neutral-700">
                    🎧
                  </div>
                  <h3 className="text-lg font-black text-spc-grey dark:text-white uppercase tracking-widest">
                    How can we help?
                  </h3>
                  <p className="text-xs font-bold text-neutral-400 text-center max-w-xs">
                    Access our full Help Center, FAQ, and contact forms from our
                    dedicated support portal.
                  </p>
                  <Link
                    href="/support"
                    className="mt-4 bg-btn-green text-white px-8 py-3.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-colors shadow-sm active:scale-95"
                  >
                    Open Help Center
                  </Link>
                </div>
              ) : activeTab === "Personal Information" ? (
                <div className="flex-1 w-full max-w-3xl flex flex-col mt-4 md:mt-6 animate-in fade-in zoom-in-95 duration-300 px-2 pb-20">
                  <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-700 text-lg">
                      👤
                    </div>
                    <div>
                      <h2 className="text-sm md:text-base font-black text-spc-grey dark:text-white uppercase tracking-wider">
                        Personal Information
                      </h2>
                      <p className="text-[10px] font-bold text-neutral-400">
                        Manage your basic profile details
                      </p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block mb-2">
                          Full Name
                        </label>
                        <div className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-spc-grey dark:text-white cursor-not-allowed">
                          {user?.name}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block mb-2">
                          Email Address
                        </label>
                        <div className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-spc-grey dark:text-white cursor-not-allowed">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6 mt-4">
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-4">
                        To securely edit your details, use the edit icon next to
                        your name at the top of your profile dashboard.
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab("Orders");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="bg-black dark:bg-neutral-800 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-btn-green dark:hover:bg-btn-green transition-all active:scale-95"
                      >
                        Go to top to Edit
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === "Delivery Addresses" ? (
                <div className="flex-1 w-full max-w-3xl flex flex-col mt-4 md:mt-6 animate-in fade-in zoom-in-95 duration-300 px-2 pb-20">
                  <div className="flex items-center justify-between mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-700 text-lg">
                        📍
                      </div>
                      <div>
                        <h2 className="text-sm md:text-base font-black text-spc-grey dark:text-white uppercase tracking-wider">
                          Delivery Addresses
                        </h2>
                        <p className="text-[10px] font-bold text-neutral-400">
                          Manage where your orders are sent
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAddressFormOpen(!isAddressFormOpen)}
                      className={`${isAddressFormOpen ? "bg-neutral-200 text-spc-grey dark:bg-neutral-800 dark:text-white" : "bg-btn-green text-white"} px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:opacity-80 transition-all active:scale-95`}
                    >
                      {isAddressFormOpen ? "Cancel" : "+ Add New"}
                    </button>
                  </div>

                  {isAddressFormOpen && (
                    <form
                      onSubmit={handleSaveAddress}
                      className="mb-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2"
                    >
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
                            Address Title (e.g. Home, Office)
                          </label>
                          <input
                            required
                            value={addressForm.title}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                title: e.target.value,
                              })
                            }
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-spc-grey dark:text-white outline-none focus:border-btn-green transition-colors"
                            placeholder="Home"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
                            Full Address
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={addressForm.full_address}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                full_address: e.target.value,
                              })
                            }
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-spc-grey dark:text-white outline-none focus:border-btn-green transition-colors"
                            placeholder="123 Premium Market St..."
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="is_default"
                            checked={addressForm.is_default === 1}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                is_default: e.target.checked ? 1 : 0,
                              })
                            }
                            className="w-4 h-4 accent-btn-green rounded cursor-pointer"
                          />
                          <label
                            htmlFor="is_default"
                            className="text-xs font-bold text-spc-grey dark:text-neutral-300 cursor-pointer"
                          >
                            Set as Default Address
                          </label>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="bg-black dark:bg-neutral-800 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-btn-green transition-all active:scale-95"
                      >
                        Save Address
                      </button>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length > 0
                      ? addresses.map((addr) => (
                          <div
                            key={addr.id}
                            className={`bg-white dark:bg-neutral-900 border-2 rounded-2xl p-5 shadow-sm relative group transition-all ${addr.is_default ? "border-btn-green" : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"}`}
                          >
                            {addr.is_default === 1 && (
                              <span className="absolute top-4 right-4 bg-btn-green/20 text-btn-green text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                                Default
                              </span>
                            )}
                            <h3 className="text-xs font-black uppercase tracking-widest text-spc-grey dark:text-white mb-2">
                              {addr.title}
                            </h3>
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4 whitespace-pre-line">
                              {user?.name}
                              <br />
                              {addr.full_address}
                            </p>
                            <div className="flex items-center gap-3 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      : !isAddressFormOpen && (
                          <div className="col-span-full py-10 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                              No addresses saved yet.
                            </p>
                          </div>
                        )}
                  </div>
                </div>
              ) : activeTab === "Payment Methods" ? (
                <div className="flex-1 w-full max-w-3xl flex flex-col mt-4 md:mt-6 animate-in fade-in zoom-in-95 duration-300 px-2 pb-20">
                  <div className="flex items-center justify-between mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-700 text-lg">
                        💳
                      </div>
                      <div>
                        <h2 className="text-sm md:text-base font-black text-spc-grey dark:text-white uppercase tracking-wider">
                          Payment Methods
                        </h2>
                        <p className="text-[10px] font-bold text-neutral-400">
                          Manage your saved credit cards and billing options
                        </p>
                      </div>
                    </div>
                    <button className="bg-btn-green text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-green-600 transition-colors active:scale-95">
                      + Add Card
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Primary Card (Mastercard) */}
                    <div className="relative overflow-hidden bg-spc-grey dark:bg-black border-2 border-btn-green rounded-2xl p-6 shadow-lg hover:-translate-y-1 transition-transform cursor-pointer group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-btn-green/20 rounded-full -ml-8 -mb-8 blur-xl pointer-events-none"></div>

                      <div className="relative z-10 flex justify-between items-start mb-8">
                        <span className="bg-btn-green text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                          Default
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-7 h-7 rounded-full bg-red-500 opacity-80 mix-blend-screen"></div>
                          <div className="w-7 h-7 rounded-full bg-yellow-500 opacity-80 mix-blend-screen -ml-4"></div>
                        </div>
                      </div>

                      <div className="relative z-10 mb-6">
                        <p className="text-white font-mono text-lg md:text-xl tracking-[0.2em] opacity-90 drop-shadow-sm">
                          •••• •••• •••• 4242
                        </p>
                      </div>

                      <div className="relative z-10 flex justify-between items-end">
                        <div>
                          <p className="text-[8px] text-neutral-400 uppercase tracking-widest mb-1">
                            Cardholder Name
                          </p>
                          <p className="text-sm text-white font-bold uppercase tracking-wider truncate max-w-[120px]">
                            {user?.name || "Customer"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-neutral-400 uppercase tracking-widest mb-1">
                            Expires
                          </p>
                          <p className="text-sm text-white font-bold tracking-wider">
                            12/28
                          </p>
                        </div>
                      </div>

                      {/* Hover Actions (Glassmorphism) */}
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                        <button className="bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors shadow-sm">
                          Edit
                        </button>
                        <button className="bg-[#EF4444] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors shadow-sm">
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Secondary Card (Visa) */}
                    <div className="relative overflow-hidden bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm hover:-translate-y-1 transition-transform cursor-pointer group">
                      <div className="relative z-10 flex justify-between items-start mb-8">
                        <div className="w-6 h-4 bg-transparent"></div>{" "}
                        {/* Placeholder for alignment */}
                        <div className="text-xl font-black text-blue-800 dark:text-blue-400 italic tracking-tighter">
                          VISA
                        </div>
                      </div>

                      <div className="relative z-10 mb-6">
                        <p className="text-spc-grey dark:text-neutral-300 font-mono text-lg md:text-xl tracking-[0.2em] opacity-90 drop-shadow-sm">
                          •••• •••• •••• 5555
                        </p>
                      </div>

                      <div className="relative z-10 flex justify-between items-end">
                        <div>
                          <p className="text-[8px] text-neutral-500 uppercase tracking-widest mb-1">
                            Cardholder Name
                          </p>
                          <p className="text-sm text-spc-grey dark:text-white font-bold uppercase tracking-wider truncate max-w-[120px]">
                            {user?.name || "Customer"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-neutral-500 uppercase tracking-widest mb-1">
                            Expires
                          </p>
                          <p className="text-sm text-spc-grey dark:text-white font-bold tracking-wider">
                            04/26
                          </p>
                        </div>
                      </div>

                      {/* Hover Actions (Glassmorphism) */}
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 z-20">
                        <button className="bg-spc-grey dark:bg-white text-white dark:text-black w-32 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-90 transition-colors shadow-sm">
                          Make Default
                        </button>
                        <button className="bg-[#EF4444] text-white w-32 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors shadow-sm">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === "Change Password" ? (
                <div className="flex-1 w-full max-w-3xl flex flex-col mt-4 md:mt-6 animate-in fade-in zoom-in-95 duration-300 px-2 pb-20">
                  <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-700 text-lg">
                      🔒
                    </div>
                    <div>
                      <h2 className="text-sm md:text-base font-black text-spc-grey dark:text-white uppercase tracking-wider">
                        Change Password
                      </h2>
                      <p className="text-[10px] font-bold text-neutral-400">
                        Ensure your account uses a strong, secure password
                      </p>
                    </div>
                  </div>

                  {/* GERÇEK VE İŞLEVLİ ŞİFRE FORMU */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (newPassword !== confirmPassword) {
                        setToastMessage("❌ Passwords do not match!");
                        setTimeout(() => setToastMessage(null), 3000);
                        return;
                      }
                      setIsPasswordChanging(true);
                      try {
                        const res = await fetch(
                          `${process.env.NEXT_PUBLIC_API_URL}/api/change-password`,
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              current_password: currentPassword,
                              new_password: newPassword,
                            }),
                          },
                        );
                        const data = await res.json();
                        if (res.ok) {
                          setToastMessage("🔒 " + data.message);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        } else {
                          setToastMessage(
                            "❌ " + (data.detail || "Failed to update."),
                          );
                        }
                      } catch (err) {
                        setToastMessage("❌ Server Error!");
                      } finally {
                        setIsPasswordChanging(false);
                        setTimeout(() => setToastMessage(null), 3000);
                      }
                    }}
                    className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-5 max-w-xl"
                  >
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-spc-grey dark:text-white outline-none focus:border-btn-green transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-spc-grey dark:text-white outline-none focus:border-btn-green transition-colors"
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-spc-grey dark:text-white outline-none focus:border-btn-green transition-colors"
                        placeholder="Must match new password"
                      />
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isPasswordChanging}
                        className="w-full md:w-auto bg-black dark:bg-neutral-800 text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-btn-green transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isPasswordChanging ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : activeTab === "Two-Factor Authentication" ? (
                <div className="flex-1 w-full max-w-3xl flex flex-col mt-4 md:mt-6 animate-in fade-in zoom-in-95 duration-300 px-2 pb-20">
                  <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-700 text-lg">
                      🛡️
                    </div>
                    <div>
                      <h2 className="text-sm md:text-base font-black text-spc-grey dark:text-white uppercase tracking-wider">
                        Two-Factor Authentication
                      </h2>
                      <p className="text-[10px] font-bold text-neutral-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>

                  {stats?.is_2fa_enabled === 1 ? (
                    <div className="bg-btn-green/10 border-2 border-btn-green rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-btn-green text-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg">
                        ✓
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-widest text-btn-green mb-2">
                        2FA is Enabled
                      </h3>
                      <p className="text-xs font-bold text-spc-grey dark:text-neutral-300">
                        Your account is fully protected by Google Authenticator.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start transition-all">
                      <div className="flex-1 space-y-4 text-center md:text-left">
                        <h3 className="text-sm font-black uppercase tracking-widest text-spc-grey dark:text-white">
                          Authenticator App
                        </h3>
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          {!twoFaSetup
                            ? "Use Google Authenticator or Authy to generate a one-time code. Click below to reveal your secure QR Code."
                            : "Scan the QR code with your Authenticator app, then enter the 6-digit code below to verify."}
                        </p>

                        {!twoFaSetup ? (
                          <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                            <button
                              onClick={async () => {
                                const res = await fetch(
                                  `${process.env.NEXT_PUBLIC_API_URL}/api/2fa/setup`,
                                  {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  },
                                );
                                const data = await res.json();
                                if (res.ok && data.uri) {
                                  setTwoFaSetup(data);
                                } else {
                                  setToastMessage(
                                    "❌ " +
                                      (data.detail ||
                                        "2FA is already enabled or server error."),
                                  );
                                  setTimeout(() => setToastMessage(null), 3000);
                                }
                              }}
                              className="bg-black dark:bg-neutral-800 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-btn-green transition-colors active:scale-95"
                            >
                              Generate QR Code
                            </button>
                          </div>
                        ) : (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              setIsVerifying2Fa(true);
                              try {
                                const res = await fetch(
                                  `${process.env.NEXT_PUBLIC_API_URL}/api/2fa/verify`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      code: twoFaCode,
                                      secret: twoFaSetup.secret,
                                    }),
                                  },
                                );
                                if (res.ok) {
                                  setStats({ ...stats!, is_2fa_enabled: 1 });
                                  setTwoFaSetup(null);
                                  setToastMessage(
                                    "🛡️ 2FA Successfully Enabled!",
                                  );
                                } else {
                                  setToastMessage("❌ Invalid 6-digit code!");
                                }
                              } catch (err) {
                              } finally {
                                setIsVerifying2Fa(false);
                                setTimeout(() => setToastMessage(null), 3000);
                              }
                            }}
                            className="flex items-center gap-2 mt-4"
                          >
                            <input
                              type="text"
                              maxLength={6}
                              required
                              value={twoFaCode}
                              onChange={(e) =>
                                setTwoFaCode(e.target.value.replace(/\D/g, ""))
                              }
                              placeholder="000000"
                              className="w-32 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-center text-lg font-black tracking-[0.3em] text-spc-grey dark:text-white outline-none focus:border-btn-green transition-colors"
                            />
                            <button
                              type="submit"
                              disabled={isVerifying2Fa || twoFaCode.length < 6}
                              className="bg-btn-green text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              Verify
                            </button>
                          </form>
                        )}
                      </div>

                      <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center p-4 shadow-xl border-4 border-neutral-100">
                        {!twoFaSetup ? (
                          <div className="text-center opacity-40">
                            <p className="text-4xl mb-2">📱</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-black">
                              Hidden
                            </p>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-white flex items-center justify-center">
                            {(console.log("QR URI:", twoFaSetup?.uri), null)}
                            <QRCodeSVG
                              value={
                                twoFaSetup?.uri ||
                                "https://premiummarket.com/error"
                              }
                              size={160}
                              level="M"
                              bgColor="#FFFFFF"
                              fgColor="#000000"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SMS Recovery Section */}
                  <div className="mt-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-sm border border-neutral-100 dark:border-neutral-700">
                        💬
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-spc-grey dark:text-white mb-0.5">
                          SMS Recovery
                        </p>
                        <p className="text-[9px] font-bold text-neutral-400">
                          Receive backup codes via text message
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setToastMessage(
                          "📱 SMS Recovery setup interface opened.",
                        );
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className="text-[10px] font-black text-btn-green uppercase tracking-widest hover:underline"
                    >
                      Setup
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 w-full max-w-3xl flex flex-col mt-4 md:mt-8 animate-in fade-in zoom-in-95 duration-300 px-2 pb-20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-700 text-lg">
                      ⚙️
                    </div>
                    <div>
                      <h2 className="text-sm md:text-base font-black text-spc-grey dark:text-white uppercase tracking-wider">
                        {activeTab}
                      </h2>
                      <p className="text-[10px] font-bold text-neutral-400">
                        Settings module configuration
                      </p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-8 md:p-12 shadow-sm flex flex-col items-center justify-center text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.827M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                      />
                    </svg>
                    <h3 className="text-sm font-black text-spc-grey dark:text-white uppercase tracking-widest mb-2">
                      Module in Development
                    </h3>
                    <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 max-w-sm mb-6 leading-relaxed">
                      The <b>{activeTab}</b> panel is currently being structured
                      by our engineering team. It will be available in the
                      upcoming v2.0 update.
                    </p>
                    <button
                      onClick={() => setActiveTab("Orders")}
                      className="bg-neutral-100 dark:bg-neutral-800 hover:bg-btn-green dark:hover:bg-btn-green hover:text-white text-spc-grey dark:text-neutral-300 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm active:scale-95"
                    >
                      Return to Orders
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {!isAiOpen && (
            <button
              onClick={() => setIsAiOpen(true)}
              className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 bg-black dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white px-8 py-3.5 md:px-12 md:py-4.5 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest shadow-[0_15px_60px_-10px_rgba(0,0,0,0.6)] dark:shadow-none border border-transparent dark:border-neutral-700 transition-all hover:-translate-y-1 active:scale-95"
            >
              AI
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Menu - Mobile Bottom Sheet */}
      {isAllOpen && (
        <div
          id="mobile-bottom-sheet"
          className="md:hidden fixed inset-0 z-999 flex flex-col justify-end"
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => {
              if (isSearchFocusedRef.current) {
                document.getElementById("profile-search-input")?.blur();
              } else {
                setIsAllOpen(false);
              }
            }}
          />
          <div className="relative bg-white dark:bg-neutral-950 w-full rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-8">
            <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto mb-6" />
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredMenuOptions.length > 0 ? (
                filteredMenuOptions.map((group, idx) => (
                  <div key={idx} className="mb-6 last:mb-0">
                    <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-4">
                      {group.category}
                    </p>
                    <div className="flex flex-col gap-3">
                      {group.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            setIsAllOpen(false);
                            setActiveTab(item);
                          }}
                          className="text-left text-sm font-bold text-spc-grey dark:text-neutral-300 hover:text-btn-green dark:hover:text-btn-green transition-colors flex items-center justify-between"
                        >
                          {item}
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-xs font-black text-neutral-400 uppercase tracking-[0.3em]">
                  No Results Found
                </div>
              )}
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
