"use client";
import Image from "next/image";

const products = [
  {
    id: 1,
    name: "T-Shirt Blue Adidas",
    category: "men's clothing",
    price: 49.99,
    image: "/product.png",
  },
  {
    id: 2,
    name: "T-Shirt Blue Adidas",
    category: "men's clothing",
    price: 49.99,
    image: "/product.png",
  },
  {
    id: 3,
    name: "T-Shirt Blue Adidas",
    category: "men's clothing",
    price: 49.99,
    image: "/product.png",
  },
  {
    id: 4,
    name: "T-Shirt Blue Adidas",
    category: "men's clothing",
    price: 49.99,
    image: "/product.png",
  },
  {
    id: 5,
    name: "T-Shirt Blue Adidas",
    category: "men's clothing",
    price: 49.99,
    image: "/product.png",
  },
  {
    id: 6,
    name: "T-Shirt Blue Adidas",
    category: "men's clothing",
    price: 49.99,
    image: "/product.png",
  },
  {
    id: 7,
    name: "T-Shirt Blue Adidas",
    category: "men's clothing",
    price: 49.99,
    image: "/product.png",
  },
  {
    id: 8,
    name: "T-Shirt Blue Adidas",
    category: "men's clothing",
    price: 49.99,
    image: "/product.png",
  },
];

export default function Home() {
  return (
    <main className="h-screen bg-neutral-50 flex flex-col overflow-hidden select-none">
      <nav className="shrink-0 z-50 bg-neutral-50 w-full shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <div className="text-2xl font-black tracking-tighter text-btn-green cursor-pointer select-none">
                market
              </div>
              <a
                href="#"
                className="hidden md:block text-sm font-bold text-spc-grey hover:text-btn-green hover:bg-neutral-100 px-4 py-2 rounded-full transition-all duration-200 ml-2 select-none"
              >
                Trends
              </a>
            </div>

            <div className="hidden md:block flex-1 w-full max-w-4xl px-2 lg:px-8">
              <div className="relative w-full group">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full h-11 pl-4 pr-12 rounded-md bg-white border border-neutral-200 text-base text-neutral-600 placeholder:text-neutral-400 focus:outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all shadow-sm select-text cursor-text"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="absolute right-4 top-3 h-5 w-5 text-neutral-400 group-focus-within:text-btn-green transition-colors cursor-pointer"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <a
                href="#"
                className="hidden lg:block text-sm font-bold text-spc-grey hover:text-btn-green hover:bg-neutral-100 px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap mr-2 select-none"
              >
                Current Orders
              </a>
              <button className="p-2 hover:bg-neutral-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300">
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
                  My Cart
                </span>
              </button>
            </div>
          </div>

          <div className="block md:hidden pb-4">
            <div className="relative w-full group">
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-11 pl-4 pr-12 rounded-md bg-white border border-neutral-200 text-base text-neutral-600 placeholder:text-neutral-400 focus:outline-none focus:border-btn-green focus:ring-1 focus:ring-btn-green transition-all shadow-sm select-text cursor-text"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="absolute right-4 top-3 h-5 w-5 text-neutral-400 group-focus-within:text-btn-green transition-colors cursor-pointer"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-8 overflow-hidden">
        <div className="flex-1 h-full overflow-y-auto pr-2 pb-20 lg:pb-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-neutral-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col h-full group"
              >
                <div className="aspect-3/4 w-full bg-black rounded-lg mb-4 shrink-0 flex items-center justify-center overflow-hidden"></div>

                <div className="flex flex-col items-center flex-1">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-tight mb-1 text-center">
                    {product.category}
                  </p>
                  <h3 className="text-sm font-semibold text-spc-grey mb-2 text-center leading-tight">
                    {product.name}{" "}
                    <span className="text-neutral-400 font-normal">x1</span>
                  </h3>

                  <div className="mt-auto w-full">
                    <p className="text-lg font-black text-spc-grey mb-3 text-center">
                      ${product.price}
                    </p>
                    <button className="w-full bg-btn-green text-white py-2.5 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors active:scale-95">
                      Add to Cart +1
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6 h-full pb-6 lg:pb-0">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex-1 flex flex-col overflow-hidden">
            <h2 className="text-neutral-400 font-bold text-center mb-4 shrink-0 tracking-wide text-sm uppercase">
              Cart Preview
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="flex flex-col items-center border-b border-neutral-100 pb-6 last:border-0 last:pb-0"
                >
                  <div className="w-32 h-40 bg-black rounded-lg mb-4 shrink-0"></div>
                  <p className="text-[10px] text-neutral-500 uppercase mb-1 text-center">
                    men&apos;s clothing
                  </p>
                  <h3 className="text-sm font-semibold text-spc-grey mb-2 text-center">
                    T-Shirt Blue Adidas{" "}
                    <span className="text-neutral-400 font-normal">x1</span>
                  </h3>
                  <p className="text-lg font-black text-spc-grey mb-4 text-center">
                    $49.99
                  </p>

                  <div className="w-full space-y-2">
                    <button className="w-full bg-btn-green text-white py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors">
                      Add to Cart +1
                    </button>
                    <button className="w-full bg-[#EF4444] text-white py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">
                      Delete +1
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm shrink-0">
            <h2 className="text-xl font-black text-spc-grey mb-5">Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm font-medium text-neutral-500">
                <span>Products Cost</span>
                <span className="text-spc-grey">$49.99</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-neutral-500">
                <span>Shipping Cost</span>
                <span className="text-spc-grey">$1.00</span>
              </div>

              <div className="flex justify-between text-lg font-black text-spc-grey pt-4 border-t border-dashed border-neutral-300 mt-2">
                <span>Total Cost</span> <span>$50.99</span>
              </div>
            </div>

            <button className="w-full bg-[#FFC107] text-spc-grey py-3.5 rounded-lg font-black hover:opacity-90 transition-transform active:scale-95 shadow-sm text-sm uppercase tracking-wide">
              Go to Cart
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
