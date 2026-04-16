"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

interface ApiProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  sales_count?: number;
  description?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        router.push("/"); // Bulunamazsa ana sayfaya şutla
      });
  }, [id, router]);

  const addToCart = async () => {
    if (!token) {
      alert("Please sign in to add items to cart!");
      return;
    }
    if (!product) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: product.id, quantity: quantity }),
      });

      setToastMessage(`Added ${quantity}x ${product.name} to cart!`);
      setTimeout(() => setToastMessage(null), 2200);
    } catch (error) {
      console.error("Cart error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-btn-green"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col select-none">
      {/* Navbar (Geri Dönüş) */}
      <nav className="shrink-0 z-50 w-full shadow-sm border-b border-neutral-200 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 flex items-center h-20">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-400 hover:text-spc-grey transition-colors font-black uppercase text-[10px] tracking-widest"
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
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Go Back
          </button>
        </div>
      </nav>

      <div className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 py-8 lg:py-16">
        <div className="bg-white rounded-4xl shadow-sm border border-neutral-100 overflow-hidden flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/2 bg-neutral-50 relative aspect-square lg:aspect-auto lg:min-h-[600px] flex items-center justify-center p-8 group">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* Sağ Taraf: Detaylar ve Satın Alma */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
            <p className="text-xs font-black text-category-blue uppercase tracking-[0.2em] mb-3">
              {product.category}
            </p>
            <h1 className="text-3xl lg:text-5xl font-black text-spc-grey tracking-tight mb-4">
              {product.name}
            </h1>
            <p className="text-2xl lg:text-4xl font-black text-btn-green mb-6">
              ${product.price.toFixed(2)}
            </p>

            <div className="w-full h-px bg-neutral-100 mb-6"></div>

            <p className="text-sm text-neutral-500 font-medium mb-8 leading-relaxed">
              {product.description ||
                `Experience premium quality with this exclusive ${product.category.toLowerCase()}. Made to order with infinite stock. Guaranteed to elevate your style.`}
            </p>

            <div className="flex items-center gap-4 mb-6">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-neutral-400 hover:text-spc-grey font-black text-xl"
                >
                  -
                </button>
                <span className="text-sm font-black text-spc-grey w-4 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-neutral-400 hover:text-spc-grey font-black text-xl"
                >
                  +
                </button>
              </div>
              <button
                onClick={addToCart}
                className="flex-1 bg-btn-green hover:bg-green-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-sm active:scale-95"
              >
                Add to Cart
              </button>
            </div>

            {product.sales_count && product.sales_count > 0 && (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest bg-orange-50 w-fit px-4 py-2 rounded-lg">
                🔥 Highly Popular: Purchased {product.sales_count} times
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Mesajı */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-btn-green text-white px-6 py-4 rounded-xl shadow-2xl font-bold text-sm animate-in fade-in slide-in-from-bottom-8">
          {toastMessage}
        </div>
      )}
    </main>
  );
}
