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

  const [comments, setComments] = useState<
    { id: number; user_name: string; text: string; created_at: string }[]
  >([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (token && product) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (
            data.some(
              (item: { product_id: number }) => item.product_id === product.id,
            )
          )
            setIsSaved(true);
        });
    }
  }, [token, product]);

  const toggleSave = async () => {
    if (!token) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/saved/${product?.id}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (res.ok) {
      const data = await res.json();
      setIsSaved(data.is_saved);
    }
  };

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
        router.push("/");
      });
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error("Comments error:", err));
  }, [id, router]);

  const submitComment = async () => {
    if (!token) return alert("Sign in to comment!");
    if (newComment.length < 3) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: product?.id, text: newComment }),
        },
      );
      if (response.ok) {
        setNewComment("");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}/comments`,
        );
        setComments(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

          {/* Right Side: Details and Purchase */}
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
              <button
                onClick={toggleSave}
                className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl border-2 transition-all duration-300 ${isSaved ? "border-red-500 bg-red-50 text-red-500" : "border-neutral-200 bg-white text-neutral-400 hover:border-red-500 hover:text-red-500"}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isSaved ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={isSaved ? "0" : "2"}
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
              </button>
            </div>

            {product.sales_count && product.sales_count > 0 && (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest bg-orange-50 w-fit px-4 py-2 rounded-lg">
                🔥 Highly Popular: Purchased {product.sales_count} times
              </div>
            )}
          </div>
        </div>
        <div className="mt-16 border-t border-neutral-100 pt-16">
          <h2 className="text-2xl font-black text-spc-grey mb-8 tracking-tighter">
            Customer Reviews ({comments.length})
          </h2>

          {/* Comment Form */}
          {token ? (
            <div className="mb-12 bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                className="w-full text-black bg-neutral-50 border-none rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-btn-green/20 transition-all resize-none min-h-[100px]"
              />
              <button
                onClick={submitComment}
                disabled={isSubmitting || newComment.length < 3}
                className="mt-4 bg-spc-grey text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-btn-green transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          ) : (
            <p className="text-sm font-bold text-neutral-400 mb-10 italic">
              Please sign in to leave a comment.
            </p>
          )}

          {/* Comments List */}
          <div className="flex flex-col gap-6">
            {comments.map((c) => (
              <div
                key={c.id}
                className="bg-white p-6 rounded-2xl border border-neutral-50 shadow-sm"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-black text-sm text-spc-grey">
                    {c.user_name}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {c.text}
                </p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-neutral-400 text-sm font-medium">
                No reviews yet. Be the first!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-btn-green text-white px-6 py-4 rounded-xl shadow-2xl font-bold text-sm animate-in fade-in slide-in-from-bottom-8">
          {toastMessage}
        </div>
      )}
    </main>
  );
}
