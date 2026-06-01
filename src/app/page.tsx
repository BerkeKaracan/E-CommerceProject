"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useContext } from "react";
import AuthModal from "@/components/AuthModal";
import { AuthContext } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import ProductCard from "@/components/ProductCard";
import ColdStartAlert from "@/components/ColdStartAlert";

import {
  SearchIcon,
  MenuIcon,
  CloseIcon,
  MinusIcon,
  PlusIcon,
  FilterIcon,
  SortIcon,
  CheckIcon,
  SignOutIcon,
  UserIcon,
  ErrorIcon,
  EmptyCartIcon,
  RefreshIcon,
} from "@/components/Icons";

interface ApiProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  is_discounted?: number;
  discount_rate?: number;
  original_price?: number;
  sales_count?: number;
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
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<Product[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [sortOption, setSortOption] = useState("Recommended");
  const [priceFilter, setPriceFilter] = useState("All Prices");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [fetchError, setFetchError] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [shopSelections, setShopSelections] = useState<Record<number, number>>(
    {},
  );
  const [cartSelections, setCartSelections] = useState<Record<number, number>>(
    {},
  );
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => console.error("Category fetch error:", err));
  }, []);

  useEffect(() => {
    const fetchCart = () => {
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
          .then((res) => {
            if (!res.ok) throw new Error("API is not replied");
            return res.json();
          })
          .then((data) => {
            if (Array.isArray(data)) {
              const formattedCart = data.map((item: CartItemResponse) => ({
                ...item.product,
                quantity: item.quantity,
              }));
              setCart(formattedCart);
            }
          })
          .catch((err) => {
            console.error("Cart fetching error (Focus):", err);
          });
      } else {
        setCart([]);
      }
    };

    fetchCart();
    window.addEventListener("focus", fetchCart);
    return () => window.removeEventListener("focus", fetchCart);
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Main Fetch Operation with Auto-Retry Logic
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== "All") params.append("category", selectedCategory);
    if (debouncedSearchQuery.trim())
      params.append("search", debouncedSearchQuery.trim());
    if (priceFilter !== "All Prices")
      params.append("price_filter", priceFilter);
    params.append("sort", sortOption);
    params.append("limit", "12");
    params.append("offset", ((page - 1) * 12).toString());

    let isMounted = true;

    const fetchProducts = async (retryCount = 0) => {
      if (page === 1) setFetchError(false);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products?${params.toString()}`,
        );

        if (!res.ok) throw new Error("Network response was not ok");

        const data: ApiProduct[] = await res.json();

        if (!isMounted) return;

        if (!Array.isArray(data)) {
          if (page === 1) setProducts([]);
          setHasMore(false);
          setIsLoading(false);
          return;
        }

        const formattedData: Product[] = data.map((p) => {
          const finalPrice =
            p.is_discounted === 1 && p.discount_rate
              ? p.price * (1 - p.discount_rate / 100)
              : p.price;

          return {
            ...p,
            original_price: p.price,
            price: finalPrice,
            quantity: 1,
          };
        });

        if (page === 1) {
          setProducts(formattedData);
        } else {
          setProducts((prev) => [...prev, ...formattedData]);
        }

        if (data.length < 12) setHasMore(false);
        setIsLoading(false);
        setFetchError(false);
      } catch (err) {
        console.error("Data fetching error:", err);
        if (retryCount < 2) {
          console.log(`Retrying fetch... Attempt ${retryCount + 1}`);
          setTimeout(() => {
            if (isMounted) fetchProducts(retryCount + 1);
          }, 1500);
        } else {
          if (isMounted) {
            setIsLoading(false);
            if (page === 1) setFetchError(true);
          }
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearchQuery, selectedCategory, priceFilter, sortOption, page]);

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

    const previousCart = [...cart];
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

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: product.id, quantity: amount }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.detail || "Server failed to process cart addition",
        );
      }

      setToastMessage(`Added ${amount}x ${product.name} to cart!`);
      setTimeout(() => setToastMessage(null), 2200);
    } catch (error) {
      console.error("Add to cart error:", error);
      setCart(previousCart);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Not enough stock or server error.";
      setToastMessage(errorMessage);
      setTimeout(() => setToastMessage(null), 2200);
    }
  };

  const removeFromCart = async (productId: number, amount: number = 1) => {
    if (!token) return;

    const previousCart = [...cart];
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

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/cart/${productId}?quantity=${amount}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Server failed to process cart removal");
    } catch (error) {
      console.error("Remove from cart error:", error);
      setCart(previousCart);
      setToastMessage("Sync failed. Reverting cart...");
      setTimeout(() => setToastMessage(null), 2200);
    }
  };

  const productsCosts = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shippingCost = cart.length > 0 ? 1.0 : 0;
  const totalCost = productsCosts + shippingCost;
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  const previewResults = products.slice(0, 3);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") setIsSearchFocused(false);
  };

  return (
    <main className="h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col overflow-hidden select-none transition-colors duration-300">
      <ColdStartAlert />
      <h1 className="sr-only">
        Premium Market - High-End E-Commerce & AI Shopping
      </h1>
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
                <MenuIcon className="w-6 h-6 text-spc-grey dark:text-neutral-200" />
              </button>
              <Link
                href="/"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setPage(1);
                  setHasMore(true);
                  setIsLoading(true);
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
              className={`hidden md:block flex-1 w-full px-2 lg:px-8 transition-all duration-500 ease-out ${isSearchFocused ? "max-w-none relative z-50" : "max-w-4xl relative z-10"}`}
            >
              <div className="relative w-full flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus-within:border-btn-green dark:focus-within:border-btn-green focus-within:ring-2 focus-within:ring-btn-green shadow-sm transition-all overflow-hidden h-12">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                    setHasMore(true);
                    setIsLoading(true);
                  }}
                  className="h-full max-w-[120px] lg:max-w-[180px] truncate shrink-0 bg-neutral-50/50 dark:bg-neutral-800 border-none text-sm font-bold text-spc-grey dark:text-neutral-200 outline-none cursor-pointer pl-4 pr-8 focus:ring-0 appearance-none hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors capitalize"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-2"></div>

                <input
                  type="text"
                  placeholder="Search for products, brands and more..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                    setHasMore(true);
                    setIsLoading(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full pl-2 pr-12 bg-transparent text-base text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none select-text cursor-text"
                />
                <button
                  onClick={() => setIsSearchFocused(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 dark:text-neutral-500 hover:text-btn-green transition-colors"
                >
                  <SearchIcon className="h-5 w-5" />
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
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          onClick={() => {
                            setIsSearchFocused(false);
                            setSearchQuery("");
                          }}
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
                                e.preventDefault(); // Prevents the Link from triggering
                                e.stopPropagation(); // Stops the click from reaching the Link
                                addToCart(product, 1);
                                setIsSearchFocused(false);
                                setSearchQuery("");
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-all bg-btn-green text-white text-[10px] font-bold px-3 py-1.5 rounded-md hover:bg-green-600 active:scale-95 translate-x-2 group-hover:translate-x-0 shadow-sm"
                            >
                              + ADD
                            </button>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
                      <SearchIcon className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-3" />
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
                      Press Enter to see results
                    </button>
                  )}
                </div>
              )}
            </div>

            <div
              className={`items-center gap-1.5 sm:gap-4 shrink-0 ${isSearchFocused ? "hidden" : "flex animate-in fade-in duration-300"}`}
            >
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
                    Hi, {user?.name || "User"}
                  </Link>
                  <Link
                    href="/profile"
                    className="cursor-pointer hover:text-btn-green transition-colors sm:hidden w-7 h-7 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center text-[10px] font-black text-spc-grey dark:text-white"
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Link>

                  <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 shrink-0"></div>

                  <button
                    onClick={() => {
                      if (logout) logout();
                      setToastMessage("Logged out successfully!");
                      setTimeout(() => setToastMessage(null), 2200);
                    }}
                    className="text-[10px] sm:text-xs font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider shrink-0 p-1 sm:p-0 flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Sign Out</span>
                    <SignOutIcon className="w-4 h-4 sm:hidden" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors focus:outline-none"
                >
                  <UserIcon className="w-8 h-8 text-spc-grey dark:text-neutral-200" />
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

      <div className="flex-1 max-w-[1440px] mx-auto w-full px-3 md:px-6 lg:px-4 py-6 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-hidden">
        <div
          onScroll={(e) => {
            const bottom =
              e.currentTarget.scrollHeight - e.currentTarget.scrollTop <=
              e.currentTarget.clientHeight + 150;
            if (bottom && hasMore && !isLoading) {
              setIsLoading(true);
              setPage((prev) => prev + 1);
            }
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
                <Link
                  href="/sale"
                  className="inline-block bg-white text-spc-grey px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-btn-green hover:text-white transition-colors shadow-lg active:scale-95 text-center"
                >
                  Shop Now
                </Link>
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                    setHasMore(true);
                    setIsLoading(true);
                  }}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:border-btn-green dark:focus:border-btn-green rounded-xl px-4 py-2.5 text-xs font-bold text-spc-grey dark:text-neutral-200 outline-none transition-all shadow-sm"
                />
                <button
                  onClick={() => setIsSearchFocused(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-focus-within:text-btn-green transition-colors"
                >
                  <SearchIcon className="w-4 h-4" />
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
                    <FilterIcon className="w-4 h-4" />
                    <span>
                      Filter:{" "}
                      {priceFilter === "All Prices" ? "All" : priceFilter}
                    </span>
                  </button>
                  <div
                    className={`absolute right-0 top-full mt-2 w-44 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-xl transition-all p-2 flex flex-col gap-1 ${isFilterOpen ? "opacity-100 visible" : "opacity-0 invisible lg:group-hover/filter:opacity-100 lg:group-hover/filter:visible"}`}
                  >
                    {[
                      "All Prices",
                      "Under $20",
                      "$20 - $50",
                      "Over $50",
                      "Discounted Offers",
                    ].map((pf) => (
                      <button
                        key={pf}
                        onClick={() => {
                          setPriceFilter(pf);
                          setIsFilterOpen(false);
                          setPage(1);
                          setHasMore(true);
                          setIsLoading(true);
                        }}
                        className={`text-left px-3 py-2 text-[10px] font-bold rounded-md transition-colors ${priceFilter === pf ? "bg-btn-green/10 text-btn-green" : "text-spc-grey dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}
                      >
                        {pf}
                      </button>
                    ))}
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
                    <SortIcon className="w-4 h-4" />
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
                          setPage(1);
                          setHasMore(true);
                          setIsLoading(true);
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

          {fetchError ? (
            <div className="w-full flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <ErrorIcon className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-spc-grey dark:text-white uppercase tracking-widest mb-2">
                Connection Lost
              </h3>
              <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-6 text-center max-w-sm">
                We couldn&apos;t load the products from the server. Please check
                your connection and try again.
              </p>
              <button
                onClick={() => {
                  setIsLoading(true);
                  setFetchError(false);
                  setPage(1);
                }}
                className="bg-black dark:bg-neutral-800 hover:bg-btn-green dark:hover:bg-btn-green text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center gap-2"
              >
                <RefreshIcon className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : isLoading && page === 1 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
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
                {products.map((product) => {
                  const currentStep = shopSelections[product.id] || 1;
                  return (
                    <ProductCard key={product.id} product={product}>
                      <div className="flex items-center justify-between w-full mb-3 bg-neutral-100/50 dark:bg-neutral-800 rounded-xl p-1 border border-transparent dark:border-neutral-700 shadow-sm">
                        <button
                          onClick={() =>
                            handleShopSelect(
                              product.id,
                              Math.max(1, currentStep - 1),
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-700 text-neutral-500 hover:text-spc-grey dark:hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest leading-none mb-0.5">
                            Qty
                          </span>
                          <span className="text-sm font-bold text-spc-grey dark:text-white leading-none">
                            {currentStep}
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            handleShopSelect(product.id, currentStep + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-700 text-neutral-500 hover:text-spc-grey dark:hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => addToCart(product, currentStep)}
                        className="w-full bg-btn-green text-white py-2.5 rounded-xl text-sm font-bold hover:brightness-95 transition-all active:scale-95 shadow-sm hover:shadow-md"
                      >
                        Add to Cart +{currentStep}
                      </button>
                    </ProductCard>
                  );
                })}
              </div>

              {hasMore && products.length >= 12 && (
                <div className="w-full flex justify-center mt-12 mb-8">
                  <button
                    onClick={() => {
                      setIsLoading(true);
                      setPage((prev) => prev + 1);
                    }}
                    disabled={isLoading}
                    className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 text-spc-grey dark:text-neutral-200 px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:border-btn-green dark:hover:border-btn-green hover:text-btn-green dark:hover:text-btn-green transition-all active:scale-95 shadow-sm group flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? "Loading..." : "Load More Products"}
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
                  <EmptyCartIcon className="w-12 h-12 opacity-20" />
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
                      <div className="flex flex-col items-center mb-4">
                        {item.is_discounted === 1 ? (
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-neutral-400 line-through decoration-red-500/50">
                              ${item.original_price?.toFixed(2)}
                            </p>
                            <p className="text-lg font-black text-red-500 dark:text-red-400">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-lg font-black text-spc-grey dark:text-white">
                            ${item.price.toFixed(2)}
                          </p>
                        )}
                      </div>

                      <div className="w-full space-y-2 mt-2">
                        <div className="flex items-center justify-between w-full mb-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-1 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                          <button
                            onClick={() =>
                              handleCartSelect(
                                item.id,
                                Math.max(1, currentStep - 1),
                              )
                            }
                            className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-neutral-700 text-neutral-500 hover:text-spc-grey dark:hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <MinusIcon className="w-3 h-3" />
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                              Qty
                            </span>
                            <span className="text-sm font-bold text-spc-grey dark:text-white">
                              {currentStep}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              handleCartSelect(item.id, currentStep + 1)
                            }
                            className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-neutral-700 text-neutral-500 hover:text-spc-grey dark:hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <PlusIcon className="w-3 h-3" />
                          </button>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 dark:bg-emerald-700 text-white px-6 py-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(4,120,87,0.5)] font-bold text-sm animate-in fade-in slide-in-from-bottom-8 flex items-center gap-3 whitespace-nowrap transition-colors">
          <div className="bg-white/20 rounded-full p-1 shrink-0">
            <CheckIcon className="w-4 h-4 text-white" />
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
                <CloseIcon className="w-5 h-5" />
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
                    {user?.name || "User"}
                  </p>
                </Link>
              )}
              {user && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-1">
                    My Account
                  </p>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-3 py-2.5 text-sm font-bold text-spc-grey dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-3">
                      Profile Details
                    </span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-3 py-2.5 text-sm font-bold text-spc-grey dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-3">My Orders</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-3 py-2.5 text-sm font-bold text-spc-grey dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-3">
                      Security & Settings
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (logout) logout();
                      setToastMessage("Logged out successfully!");
                      setTimeout(() => setToastMessage(null), 2200);
                    }}
                    className="text-left px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors flex items-center gap-3 mt-1"
                  >
                    Sign Out
                  </button>
                </div>
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
