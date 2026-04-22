"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useContext } from "react";
import AuthModal from "@/components/AuthModal";
import { AuthContext } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

interface ApiProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface Product extends ApiProduct {
  quantity: number;
}

interface CartItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  product: ApiProduct;
}

export default function Home() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const token = authContext?.token;
  const logout = authContext?.logout;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<Product[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [sortOption, setSortOption] = useState("Recommended");
  const [priceFilter, setPriceFilter] = useState("All Prices");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
      .then((res) => res.json())
      .then((data: ApiProduct[]) => {
        const formattedData: Product[] = data.map((p) => ({
          ...p,
          quantity: 1,
        }));
        setProducts(formattedData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Data fetching error:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const fetchCart = () => {
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => {
            if (Array.isArray(data)) {
              const formattedCart = data.map((item: CartItemResponse) => ({
                ...item.product,
                quantity: item.quantity,
              }));
              setCart(formattedCart);
            } else {
              setCart([]);
            }
          })
          .catch((err) => console.error("Cart fetching error:", err));
      } else {
        setCart([]);
      }
    };

    fetchCart();
    window.addEventListener("focus", fetchCart);
    return () => window.removeEventListener("focus", fetchCart);
  }, [token]);

  const [shopSelections, setShopSelections] = useState<Record<number, number>>(
    {},
  );
  const [cartSelections, setCartSelections] = useState<Record<number, number>>(
    {},
  );
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (visibleCount !== 12) {
      setVisibleCount(12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, priceFilter, sortOption]);

  const handleShopSelect = (productId: number, val: number) => {
    setShopSelections({ ...shopSelections, [productId]: val });
  };

  const handleCartSelect = (productId: number, val: number) => {
    setCartSelections({ ...cartSelections, [productId]: val });
  };

  const addToCart = async (product: Product, amount: number = 1) => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: product.id, quantity: amount }),
      });

      const existingItem = cart.find((item) => item.id === product.id);
      if (existingItem) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + amount }
              : item,
          ),
        );
      } else {
        setCart([...cart, { ...product, quantity: amount }]);
      }
      setToastMessage(`Added ${amount}x ${product.name} to cart!`);
      setTimeout(() => setToastMessage(null), 2200);
    } catch (error) {
      console.error("Add to cart error:", error);
    }
  };

  const removeFromCart = async (productId: number, amount: number = 1) => {
    if (!token) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/${productId}?quantity=${amount}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const existingItem = cart.find((item) => item.id === productId);
      if (existingItem && existingItem.quantity > amount) {
        setCart(
          cart.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity - amount }
              : item,
          ),
        );
      } else {
        setCart(cart.filter((item) => item.id !== productId));
      }
    } catch (error) {
      console.error("Remove from cart error:", error);
    }
  };

  const productsCosts = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shippingCost = cart.length > 0 ? 1.0 : 0;
  const totalCost = productsCosts + shippingCost;
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  const filteredProducts = products
    .filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      const productName = p.name.toLowerCase();
      const productCategory = p.category.toLowerCase();

      const smartKeywords =
        (query.includes("summer") || query.includes("top wear")) &&
        productCategory.includes("clothing")
          ? true
          : (query.includes("tech") || query.includes("gadget")) &&
              productCategory.includes("electronics")
            ? true
            : query.includes("gift") && productCategory.includes("jewelry")
              ? true
              : false;

      const matchesSearch =
        productName.includes(query) ||
        productCategory.includes(query) ||
        smartKeywords;
      const matchesCategory =
        selectedCategory === "All" || p.category === selectedCategory;

      let matchesPrice = true;
      if (priceFilter === "Under $20") matchesPrice = p.price < 20;
      else if (priceFilter === "$20 - $50")
        matchesPrice = p.price >= 20 && p.price <= 50;
      else if (priceFilter === "Over $50") matchesPrice = p.price > 50;

      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      if (sortOption === "Price: Low to High") return a.price - b.price;
      if (sortOption === "Price: High to Low") return b.price - a.price;
      return 0;
    });

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const previewResults = filteredProducts.slice(0, 3);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsSearchFocused(false);
    }
  };

  return (
    <main className="h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col overflow-hidden select-none transition-colors duration-300">
      {isSearchFocused && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsSearchFocused(false)}
        />
      )}
      <nav className="shrink-0 z-40 bg-neutral-50 dark:bg-neutral-950 w-full shadow-sm border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-4 lg:px-4">
          <div className="flex items-center justify-between h-20 gap-2 lg:gap-10">
            <div className="flex items-center gap-2 sm:gap-6 shrink-0">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-6 h-6 text-spc-grey dark:text-neutral-200"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>
              <Link
                href="/"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="text-2xl font-black tracking-tighter text-btn-green"
              >
                market
              </Link>
              <Link
                href="/trends"
                className="hidden md:block text-sm font-bold text-spc-grey dark:text-neutral-300 hover:text-btn-green dark:hover:text-btn-green px-2 py-2 transition-colors duration-200 ml-4 select-none"
              >
                Trends
              </Link>
            </div>

            <div
              className={`hidden md:block flex-1 w-full max-w-4xl px-2 lg:px-8 transition-all duration-300 ${isSearchFocused ? "relative z-50" : "relative z-10"}`}
            >
              <div className="relative w-full flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus-within:border-btn-green dark:focus-within:border-btn-green focus-within:ring-2 focus-within:ring-btn-green shadow-sm transition-all overflow-hidden h-12">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-full max-w-[120px] lg:max-w-[180px] truncate shrink-0 bg-neutral-50/50 dark:bg-neutral-800 border-none text-sm font-bold text-spc-grey dark:text-neutral-200 outline-none cursor-pointer pl-4 pr-8 focus:ring-0 appearance-none hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors capitalize"
                >
                  <option value="All">All Categories</option>
                  {Array.from(new Set(products.map((p) => p.category))).map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ),
                  )}
                </select>

                <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-2"></div>

                <input
                  type="text"
                  placeholder="Search for products, brands and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full pl-2 pr-12 bg-transparent text-base text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none select-text cursor-text"
                />
                <button
                  onClick={() => setIsSearchFocused(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 dark:text-neutral-500 hover:text-btn-green transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </button>
              </div>

              {isSearchFocused && searchQuery.length > 0 && (
                <div className="absolute top-full left-2 lg:left-8 right-2 lg:right-8 mt-2 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden flex flex-col py-3 animate-in fade-in slide-in-from-top-2">
                  <div className="px-5 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800 mb-2">
                    Top Results
                  </div>

                  {previewResults.length > 0 ? (
                    <div className="px-2 space-y-1">
                      {previewResults.map((product) => (
                        <div
                          key={product.id}
                          className="group flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-md shrink-0 relative overflow-hidden shadow-sm">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover object-center"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-spc-grey dark:text-neutral-200 group-hover:text-btn-green transition-colors">
                                {product.name}
                              </span>
                              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-medium mt-0.5">
                                {product.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-spc-grey dark:text-white">
                              ${product.price.toFixed(2)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 1);
                                setIsSearchFocused(false);
                                setSearchQuery("");
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-all bg-btn-green text-white text-[10px] font-bold px-3 py-1.5 rounded-md hover:bg-green-600 active:scale-95 translate-x-2 group-hover:translate-x-0 shadow-sm"
                            >
                              + ADD
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                        />
                      </svg>
                      <p className="text-sm font-bold text-spc-grey dark:text-neutral-200">
                        No results found
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                        Try adjusting your search or filter
                      </p>
                    </div>
                  )}

                  {previewResults.length > 0 && (
                    <button
                      onClick={() => setIsSearchFocused(false)}
                      className="mt-3 mx-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-bold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-spc-grey dark:hover:text-white transition-colors border border-neutral-200 dark:border-neutral-700"
                    >
                      Press Enter to see all {filteredProducts.length} results
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
              <Link
                href="/tracking"
                className="hidden lg:block text-sm font-bold text-spc-grey dark:text-neutral-300 hover:text-btn-green px-2 py-2 transition-colors duration-200 whitespace-nowrap mr-2 select-none"
              >
                Track Order
              </Link>
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-2 sm:gap-3 bg-neutral-100 dark:bg-neutral-800 px-2 sm:px-3 py-1.5 rounded-xl shrink-0 border border-transparent dark:border-neutral-700">
                  <Link
                    href="/profile"
                    className="cursor-pointer hover:text-btn-green transition-colors truncate text-xs sm:text-sm font-bold text-spc-grey dark:text-neutral-200 hidden sm:block"
                  >
                    Hi, {user.name}
                  </Link>
                  <Link
                    href="/profile"
                    className="cursor-pointer hover:text-btn-green transition-colors sm:hidden w-7 h-7 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center text-[10px] font-black text-spc-grey dark:text-white"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Link>

                  <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 shrink-0"></div>

                  <button
                    onClick={() => {
                      if (logout) logout();
                      setToastMessage("Logged out successfully!");
                      setTimeout(() => setToastMessage(null), 2200);
                    }}
                    className="text-[10px] sm:text-xs font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider shrink-0 p-1 sm:p-0"
                  >
                    <span className="hidden sm:inline">Sign Out</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      className="w-4 h-4 sm:hidden"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors focus:outline-none"
                  onClick={() => setIsAuthOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-8 h-8 text-spc-grey dark:text-neutral-200"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              )}

              <Link
                href="/checkout"
                className="flex items-end p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors focus:outline-none group"
              >
                <div className="relative shrink-0">
                  <Image
                    src="/cart.svg"
                    alt="Cart"
                    width={32}
                    height={32}
                    className="w-8 h-8 dark:invert"
                  />
                </div>
                <span className="font-bold text-spc-grey dark:text-neutral-200 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-1 -ml-3.5 z-10 text-xs sm:text-sm leading-none transition-colors">
                  My Cart {totalItems}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-[1440px] mx-auto w-full px-6 sm:px-4 lg:px-4 py-6 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-hidden">
        <div
          onScroll={(e) => {
            const bottom =
              e.currentTarget.scrollHeight - e.currentTarget.scrollTop <=
              e.currentTarget.clientHeight + 150;
            if (bottom && visibleCount < filteredProducts.length)
              setVisibleCount((prev) => prev + 12);
          }}
          className="flex-1 h-full overflow-y-auto pr-2 pb-20 lg:pb-4 transform-gpu will-change-scroll [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {searchQuery.trim().length === 0 && selectedCategory === "All" && (
            <div className="relative w-full aspect-video md:aspect-21/9 rounded-3xl overflow-hidden mb-8 shrink-0 flex items-center group cursor-pointer shadow-sm border border-transparent dark:border-neutral-800">
              <Image
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop"
                alt="Summer Collection 2026"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-r from-neutral-900/90 via-neutral-900/50 to-transparent"></div>
              <div className="relative z-10 px-6 md:px-12 max-w-lg">
                <span className="inline-block py-1 px-3 rounded-full bg-btn-green/20 text-btn-green text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border border-btn-green/30">
                  Limited Time Offer
                </span>
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-2 tracking-tight">
                  2026 Exclusive <br className="hidden md:block" /> Collection
                </h2>
                <p className="text-neutral-300 text-xs md:text-sm mb-6 font-medium max-w-xs">
                  Discover the new season with up to 50% off on selected premium
                  items. Elevate your style.
                </p>
                <button className="bg-white text-spc-grey px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-btn-green hover:text-white transition-colors shadow-lg active:scale-95">
                  Shop Now
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end mb-6 mt-2">
            <h2 className="text-lg md:text-xl font-black text-spc-grey dark:text-neutral-100 hidden md:block">
              {searchQuery.trim().length > 0
                ? `Results for "${searchQuery}"`
                : selectedCategory === "All"
                  ? "Featured Products"
                  : `${selectedCategory} Collection`}
            </h2>

            <div className="flex flex-col md:flex-row items-end md:items-center gap-3 w-full md:w-auto">
              <div className="w-full md:hidden relative group">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:border-btn-green dark:focus:border-btn-green rounded-xl px-4 py-2.5 text-xs font-bold text-spc-grey dark:text-neutral-200 outline-none transition-all shadow-sm"
                />
                <button
                  onClick={() => setIsSearchFocused(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-focus-within:text-btn-green transition-colors"
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
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative group/filter z-40">
                  <button
                    onClick={() => {
                      setIsFilterOpen(!isFilterOpen);
                      setIsSortOpen(false);
                    }}
                    className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-btn-green dark:hover:border-btn-green px-4 py-2 rounded-xl text-[10px] md:text-xs font-black text-spc-grey dark:text-neutral-200 uppercase tracking-widest transition-all shadow-sm active:scale-95"
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
                        d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
                      />
                    </svg>
                    <span>
                      Filter:{" "}
                      {priceFilter === "All Prices" ? "All" : priceFilter}
                    </span>
                  </button>
                  <div
                    className={`absolute right-0 top-full mt-2 w-44 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-xl transition-all p-2 flex flex-col gap-1 ${isFilterOpen ? "opacity-100 visible" : "opacity-0 invisible lg:group-hover/filter:opacity-100 lg:group-hover/filter:visible"}`}
                  >
                    {["All Prices", "Under $20", "$20 - $50", "Over $50"].map(
                      (pf) => (
                        <button
                          key={pf}
                          onClick={() => {
                            setPriceFilter(pf);
                            setIsFilterOpen(false);
                          }}
                          className={`text-left px-3 py-2 text-[10px] font-bold rounded-md transition-colors ${priceFilter === pf ? "bg-btn-green/10 text-btn-green" : "text-spc-grey dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}
                        >
                          {pf}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="relative group/sort z-40">
                  <button
                    onClick={() => {
                      setIsSortOpen(!isSortOpen);
                      setIsFilterOpen(false);
                    }}
                    className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-btn-green dark:hover:border-btn-green px-4 py-2 rounded-xl text-[10px] md:text-xs font-black text-spc-grey dark:text-neutral-200 uppercase tracking-widest transition-all shadow-sm active:scale-95"
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
                        d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                      />
                    </svg>
                    Sort
                  </button>
                  <div
                    className={`absolute right-0 top-full mt-2 w-44 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-xl transition-all p-2 flex flex-col gap-1 ${isSortOpen ? "opacity-100 visible" : "opacity-0 invisible lg:group-hover/sort:opacity-100 lg:group-hover/sort:visible"}`}
                  >
                    {[
                      "Recommended",
                      "Price: Low to High",
                      "Price: High to Low",
                    ].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortOption(opt);
                          setIsSortOpen(false);
                        }}
                        className={`text-left px-3 py-2 text-[10px] font-bold rounded-md transition-colors ${sortOption === opt ? "bg-btn-green/10 text-btn-green" : "text-spc-grey dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, n) => (
                <div
                  key={n}
                  className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 flex flex-col h-[350px] animate-pulse"
                >
                  <div className="w-full h-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-4"></div>
                  <div className="w-1/3 h-3 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded mb-3"></div>
                  <div className="w-3/4 h-5 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded mb-4"></div>
                  <div className="mt-auto w-full space-y-3">
                    <div className="w-1/4 h-6 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded"></div>
                    <div className="w-full h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedProducts.map((product, index) => {
                  const currentStep = shopSelections[product.id] || 1;
                  return (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-neutral-900 border border-neutral-100/60 dark:border-neutral-800/60 rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] dark:shadow-none dark:hover:border-neutral-600 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group"
                    >
                      <Link
                        href={`/product/${product.id}`}
                        className="w-full flex flex-col items-center flex-1 cursor-pointer group/link"
                      >
                        <div className="aspect-3/4 w-full bg-neutral-50/80 dark:bg-neutral-800 rounded-xl mb-4 shrink-0 flex items-center justify-center overflow-hidden relative group-hover:bg-neutral-100 dark:group-hover:bg-neutral-700 transition-colors">
                          <Image
                            src={product.image}
                            alt={product.name}
                            priority={index < 8}
                            fill
                            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <p className="text-[10px] text-category-blue dark:text-neutral-400 font-bold uppercase tracking-widest mb-1.5 text-center">
                          {product.category}
                        </p>
                        <h3 className="text-base font-bold text-spc-grey dark:text-neutral-200 mb-3 text-center leading-tight group-hover/link:text-btn-green transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="mt-auto w-full">
                        <p className="text-lg font-black text-spc-grey dark:text-white mb-4 text-center">
                          ${product.price.toFixed(2)}
                        </p>
                        <div className="relative w-full mb-3 group/qty">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest pointer-events-none">
                            Qty
                          </span>
                          <select
                            value={currentStep}
                            onChange={(e) =>
                              handleShopSelect(
                                product.id,
                                parseInt(e.target.value),
                              )
                            }
                            className="w-full bg-neutral-100/50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-none text-sm font-bold text-spc-grey dark:text-neutral-200 rounded-xl py-2.5 pl-14 pr-8 outline-none focus:ring-2 focus:ring-btn-green/30 transition-all cursor-pointer appearance-none"
                          >
                            {[1, 2, 3, 4, 5].map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 dark:text-neutral-500 group-hover/qty:text-spc-grey dark:group-hover/qty:text-neutral-300 transition-colors">
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
                                d="m19.5 8.25-7.5 7.5-7.5-7.5"
                              />
                            </svg>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(product, currentStep)}
                          className="w-full bg-btn-green text-white py-2.5 rounded-xl text-sm font-bold hover:brightness-95 transition-all active:scale-95 shadow-sm hover:shadow-md"
                        >
                          Add to Cart +{currentStep}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {visibleCount < filteredProducts.length && (
                <div className="w-full flex justify-center mt-12 mb-8">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 text-spc-grey dark:text-neutral-200 px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:border-btn-green dark:hover:border-btn-green hover:text-btn-green dark:hover:text-btn-green transition-all active:scale-95 shadow-sm group flex items-center gap-2"
                  >
                    Load More Products
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                      stroke="currentColor"
                      className="w-4 h-4 group-hover:translate-y-0.5 transition-transform"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="hidden lg:flex w-full lg:w-[340px] shrink-0 flex-col gap-6 h-full pb-6 lg:pb-0">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm flex-1 flex flex-col overflow-hidden transition-colors duration-300">
            <h2 className="text-neutral-400 dark:text-neutral-500 font-bold text-center mb-4 shrink-0 tracking-wide text-sm uppercase">
              Cart Preview
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 transform-gpu will-change-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 space-y-2 py-20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-12 h-12 opacity-20"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">
                    Your cart is empty
                  </p>
                </div>
              ) : (
                cart.map((item, index) => {
                  const currentStep = cartSelections[item.id] || 1;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center border-b border-neutral-100 dark:border-neutral-800 pb-6 last:border-0 last:pb-0 group"
                    >
                      <Link
                        href={`/product/${item.id}`}
                        className="w-32 h-40 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-4 shrink-0 relative overflow-hidden block"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform"
                        />
                      </Link>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase mb-1 text-center">
                        {item.category}
                      </p>
                      <Link
                        href={`/product/${item.id}`}
                        className="hover:text-btn-green transition-colors"
                      >
                        <h3 className="text-sm font-semibold text-spc-grey dark:text-neutral-200 mb-2 text-center">
                          {item.name}{" "}
                          <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">
                            x{item.quantity}
                          </span>
                        </h3>
                      </Link>
                      <p className="text-lg font-black text-spc-grey dark:text-white mb-4 text-center">
                        ${item.price.toFixed(2)}
                      </p>

                      <div className="w-full space-y-2 mt-2">
                        <div className="relative w-full mb-3 group/qty">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest pointer-events-none">
                            Qty
                          </span>
                          <select
                            value={currentStep}
                            onChange={(e) =>
                              handleCartSelect(
                                item.id,
                                parseInt(e.target.value),
                              )
                            }
                            className="w-full bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-sm font-black text-spc-grey dark:text-neutral-200 rounded-lg py-2.5 pl-12 pr-8 outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all cursor-pointer appearance-none shadow-sm"
                          >
                            {[1, 2, 3, 4, 5].map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 dark:text-neutral-500 group-hover:text-spc-grey dark:group-hover:text-neutral-300 transition-colors">
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
                                d="m19.5 8.25-7.5 7.5-7.5-7.5"
                              />
                            </svg>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(item, currentStep)}
                          className="w-full bg-btn-green text-white py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors"
                        >
                          Add to Cart +{currentStep}
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id, currentStep)}
                          className="w-full bg-[#EF4444] text-white py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
                        >
                          Delete -{currentStep}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm shrink-0 transition-colors duration-300">
            <h2 className="text-xl font-black text-spc-grey dark:text-white mb-5">
              Summary
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm font-medium text-neutral-500 dark:text-neutral-400">
                <span>Products Cost</span>
                <span className="text-spc-grey dark:text-white">
                  ${productsCosts.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium text-neutral-500 dark:text-neutral-400">
                <span>Shipping Cost</span>
                <span className="text-spc-grey dark:text-white">
                  ${shippingCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-black text-spc-grey dark:text-white pt-4 border-t border-dashed border-neutral-300 dark:border-neutral-700 mt-2">
                <span>Total Cost</span> <span>${totalCost.toFixed(2)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="w-full bg-[#FFC107] text-spc-grey py-3.5 rounded-lg font-black hover:opacity-90 transition-transform active:scale-95 shadow-sm text-sm uppercase tracking-wide flex justify-center"
            >
              Go to Checkout
            </Link>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-btn-green text-white px-6 py-4 rounded-xl shadow-2xl font-bold text-sm animate-in fade-in slide-in-from-bottom-8 flex items-center gap-3 whitespace-nowrap">
          <div className="bg-white/20 rounded-full p-1 shrink-0">
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
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>
          {toastMessage}
        </div>
      )}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-[85%] max-w-[320px] bg-white dark:bg-neutral-950 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 z-50">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-2xl font-black tracking-tighter text-btn-green">
                market
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-spc-grey dark:text-neutral-200 transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-5 px-5 flex flex-col gap-8">
              {!user ? (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAuthOpen(true);
                  }}
                  className="w-full bg-black dark:bg-neutral-800 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors"
                >
                  Sign In / Register
                </button>
              ) : (
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 block group hover:border-btn-green dark:hover:border-btn-green transition-colors"
                >
                  <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">
                    Welcome back
                  </p>
                  <p className="text-base font-black text-spc-grey dark:text-neutral-200 group-hover:text-btn-green dark:group-hover:text-btn-green transition-colors">
                    {user.name}
                  </p>
                </Link>
              )}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-1">
                  Main Menu
                </p>
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-bold text-spc-grey dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/trends"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-bold text-spc-grey dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors flex items-center justify-between"
                >
                  Trending Now{" "}
                  <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
                    Hot
                  </span>
                </Link>
                <Link
                  href="/tracking"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-bold text-spc-grey dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors"
                >
                  Track Order
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-1">
                  Categories
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setIsMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2.5 text-sm font-bold rounded-lg transition-colors capitalize ${selectedCategory === "All" ? "bg-btn-green/10 text-btn-green" : "text-spc-grey dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"}`}
                >
                  All Products
                </button>
                {Array.from(new Set(products.map((p) => p.category))).map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsMenuOpen(false);
                      }}
                      className={`text-left px-3 py-2.5 text-sm font-bold rounded-lg transition-colors capitalize truncate w-full block ${selectedCategory === cat ? "bg-btn-green/10 text-btn-green" : "text-spc-grey dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"}`}
                    >
                      {cat}
                    </button>
                  ),
                )}
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-spc-grey dark:text-white mb-6 transition-colors">
                  Support
                </h3>
                <ul className="flex flex-col gap-4">
                  <li>
                    <Link
                      href="/support#faq"
                      className="text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-btn-green dark:hover:text-btn-green transition-colors"
                    >
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/support#returns"
                      className="text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-btn-green dark:hover:text-btn-green transition-colors"
                    >
                      Returns & Refunds
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/support#contact"
                      className="text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-btn-green dark:hover:text-btn-green transition-colors"
                    >
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
