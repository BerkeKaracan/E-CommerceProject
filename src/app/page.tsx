"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<Product[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

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
        console.error("Veri çekme hatası:", err);
        setIsLoading(false);
      });
  }, []);
  useEffect(() => {
    const savedCart = localStorage.getItem("my_cart");
    if (savedCart) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCart(JSON.parse(savedCart) as Product[]);
    }
    setIsCartLoaded(true);
  }, []);

  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem("my_cart", JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);
  const [shopSelections, setShopSelections] = useState<Record<number, number>>(
    {},
  );
  const [cartSelections, setCartSelections] = useState<Record<number, number>>(
    {},
  );

  const handleShopSelect = (productId: number, val: number) => {
    setShopSelections({ ...shopSelections, [productId]: val });
  };

  const handleCartSelect = (productId: number, val: number) => {
    setCartSelections({ ...cartSelections, [productId]: val });
  };

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const addToCart = (product: Product, amount: number = 1) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + amount,
              }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: amount }]);
    }
    setToastMessage(`Added ${amount}x ${product.name} to cart!`);
    setTimeout(() => setToastMessage(null), 2200);
  };
  const productsCosts = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shippingCost = cart.length > 0 ? 1.0 : 0;
  const totalCost = productsCosts + shippingCost;
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const removeFromCart = (productId: number, amount: number = 1) => {
    const existingItem = cart.find((item) => item.id === productId);
    if (existingItem && existingItem?.quantity > amount) {
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
  };
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const previewResults = filteredProducts.slice(0, 3);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsSearchFocused(false);
    }
  };
  return (
    <main className="h-screen bg-neutral-50 flex flex-col overflow-hidden select-none">
      {isSearchFocused && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsSearchFocused(false)} // Boşluğa tıklayınca aramadan çık
        />
      )}
      <nav className="shrink-0 z-50 bg-neutral-50 w-full shadow-sm border-b border-neutral-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-4 lg:px-4">
          <div className="flex items-center justify-between h-20 gap-6 lg:gap-10">
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              <button className="p-2 -ml-2 hover:bg-neutral-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-6 h-6 text-spc-grey"
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
                className="text-2xl font-black tracking-tighter text-btn-green cursor-pointer select-none hover:opacity-80 transition-opacity block"
              >
                market
              </Link>
              <a
                href="#"
                className="hidden md:block text-sm font-bold text-spc-grey hover:text-btn-green px-2 py-2 transition-colors duration-200 ml-4 select-none"
              >
                Trends
              </a>
            </div>

            <div
              className={`hidden md:block flex-1 w-full max-w-4xl px-2 lg:px-8 transition-all duration-300 ${isSearchFocused ? "relative z-50" : "relative z-10"}`}
            >
              <div className="relative w-full flex items-center bg-white border border-neutral-200 rounded-lg focus-within:border-btn-green focus-within:ring-2 focus-within:ring-btn-green shadow-sm transition-all overflow-hidden h-12">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-full bg-neutral-50/50 border-none text-sm font-bold text-spc-grey outline-none cursor-pointer pl-4 pr-8 focus:ring-0 appearance-none hover:bg-neutral-100 transition-colors capitalize"
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

                <div className="w-px h-6 bg-neutral-200 mx-2"></div>

                <input
                  type="text"
                  placeholder="Search for products, brands and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full pl-2 pr-12 bg-transparent text-base text-neutral-800 placeholder:text-neutral-400 focus:outline-none select-text cursor-text"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-btn-green transition-colors">
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
                <div className="absolute top-full left-2 lg:left-8 right-2 lg:right-8 mt-2 bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col py-3 animate-in fade-in slide-in-from-top-2">
                  <div className="px-5 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 mb-2">
                    Top Results
                  </div>

                  {previewResults.length > 0 ? (
                    <div className="px-2 space-y-1">
                      {previewResults.map((product) => (
                        <div
                          key={product.id}
                          className="group flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 cursor-pointer transition-all border border-transparent hover:border-neutral-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neutral-100 rounded-md shrink-0 relative overflow-hidden shadow-sm">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover object-center"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-spc-grey group-hover:text-btn-green transition-colors">
                                {product.name}
                              </span>
                              <span className="text-[10px] text-neutral-400 uppercase font-medium mt-0.5">
                                {product.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-spc-grey">
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
                        className="w-8 h-8 text-neutral-300 mb-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                        />
                      </svg>
                      <p className="text-sm font-bold text-spc-grey">
                        No results found
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Try adjusting your search or filter
                      </p>
                    </div>
                  )}

                  {previewResults.length > 0 && (
                    <button
                      onClick={() => setIsSearchFocused(false)}
                      className="mt-3 mx-4 py-2.5 bg-neutral-50 text-neutral-500 text-xs font-bold rounded-lg hover:bg-neutral-100 hover:text-spc-grey transition-colors border border-neutral-200"
                    >
                      Press Enter to see all {filteredProducts.length} results
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <a
                href="#"
                className="hidden lg:block text-sm font-bold text-spc-grey hover:text-btn-green px-2 py-2 transition-colors duration-200 whitespace-nowrap mr-2 select-none"
              >
                Current Orders
              </a>
              <button className="p-2 hover:bg-neutral-100 rounded-xl transition-colors focus:outline-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-8 h-8 text-spc-grey"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              <button className="flex items-end p-2 hover:bg-neutral-200 rounded-lg transition-colors focus:outline-none group">
                <div className="relative shrink-0">
                  <Image
                    src="/cart.svg"
                    alt="Cart"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                </div>
                <span className="font-bold text-spc-grey group-hover:bg-neutral-200 bg-neutral-50 px-1 -ml-3.5 z-10 text-xs sm:text-sm leading-none">
                  My Cart {totalItems}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-4 lg:px-4 py-6 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-hidden">
        <div className="flex-1 h-full overflow-y-auto pr-2 pb-20 lg:pb-4 transform-gpu will-change-scroll [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const currentStep = shopSelections[product.id] || 1;
              return (
                <div
                  key={product.id}
                  className="bg-white border border-neutral-100/60 rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group"
                >
                  <div className="aspect-3/4 w-full bg-neutral-50/80 rounded-xl mb-4 shrink-0 flex items-center justify-center overflow-hidden relative group-hover:bg-neutral-100 transition-colors">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex flex-col items-center flex-1 mt-1">
                    {/* Madde 3: category-blue eklendi ve daha okunur yapıldı */}
                    <p className="text-[10px] text-category-blue font-bold uppercase tracking-widest mb-1.5 text-center">
                      {product.category}
                    </p>
                    {/* Madde 4: text-sm yerine text-base (1 +=) yapıldı */}
                    <h3 className="text-base font-bold text-spc-grey mb-3 text-center leading-tight">
                      {product.name}
                    </h3>

                    <div className="mt-auto w-full">
                      <p className="text-lg font-black text-spc-grey mb-4 text-center">
                        ${product.price.toFixed(2)}
                      </p>

                      {/* Madde 2: Modernize edilmiş minimalist QTY Kutusu */}
                      <div className="relative w-full mb-3 group/qty">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-neutral-400 uppercase tracking-widest pointer-events-none">
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
                          className="w-full bg-neutral-100/50 hover:bg-neutral-100 border-none text-sm font-bold text-spc-grey rounded-xl py-2.5 pl-14 pr-8 outline-none focus:ring-2 focus:ring-btn-green/30 transition-all cursor-pointer appearance-none"
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 group-hover/qty:text-spc-grey transition-colors">
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
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex w-full lg:w-[340px] shrink-0 flex-col gap-6 h-full pb-6 lg:pb-0">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex-1 flex flex-col overflow-hidden">
            <h2 className="text-neutral-400 font-bold text-center mb-4 shrink-0 tracking-wide text-sm uppercase">
              Cart Preview
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 transform-gpu will-change-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-2 py-20">
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
                      className="flex flex-col items-center border-b border-neutral-100 pb-6 last:border-0 last:pb-0"
                    >
                      <div className="w-32 h-40 bg-neutral-100 rounded-lg mb-4 shrink-0 relative overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover object-center"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-500 uppercase mb-1 text-center">
                        {item.category}
                      </p>
                      <h3 className="text-sm font-semibold text-spc-grey mb-2 text-center">
                        {item.name}
                        <span className="text-neutral-400 font-normal ml-1">
                          x{item.quantity}
                        </span>
                      </h3>
                      <p className="text-lg font-black text-spc-grey mb-4 text-center">
                        ${item.price.toFixed(2)}
                      </p>

                      <div className="w-full space-y-2 mt-2">
                        <div className="relative w-full mb-3 group/qty">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-neutral-400 uppercase tracking-widest pointer-events-none">
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
                            className="w-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-sm font-black text-spc-grey rounded-lg py-2.5 pl-12 pr-8 outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all cursor-pointer appearance-none shadow-sm"
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>

                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 group-hover:text-spc-grey transition-colors">
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

          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm shrink-0">
            <h2 className="text-xl font-black text-spc-grey mb-5">Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm font-medium text-neutral-500">
                <span>Products Cost</span>
                <span className="text-spc-grey">
                  ${productsCosts.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium text-neutral-500">
                <span>Shipping Cost</span>
                <span className="text-spc-grey">
                  ${shippingCost.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-lg font-black text-spc-grey pt-4 border-t border-dashed border-neutral-300 mt-2">
                <span>Total Cost</span> <span>${totalCost.toFixed(2)}</span>
              </div>
            </div>

            <button className="w-full bg-[#FFC107] text-spc-grey py-3.5 rounded-lg font-black hover:opacity-90 transition-transform active:scale-95 shadow-sm text-sm uppercase tracking-wide">
              Go to Cart
            </button>
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
    </main>
  );
}
