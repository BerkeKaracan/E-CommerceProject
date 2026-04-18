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

interface StarIconProps {
  filled: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const StarIcon = ({
  filled,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: StarIconProps) => (
  <svg
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    className={`w-5 h-5 cursor-pointer transition-all ${filled ? "text-[#FFC107] drop-shadow-sm" : "text-neutral-300"}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385c.114.477-.41.856-.84.621L12 17.152a.562.562 0 00-.54 0l-4.793 2.62c-.43.235-.954-.144-.84-.62l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602c-.38-.325-.178-.948.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
);

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [comments, setComments] = useState<
    { id: number; user_name: string; text: string; created_at: string }[]
  >([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSaved, setIsSaved] = useState(false);

  const [rating, setRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);

  const hasReviewed = comments.some(
    (c) => c.user_name === authContext?.user?.name,
  );
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText] = useState("");
  const [editHoveredStar, setEditHoveredStar] = useState(0);

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete your review?")) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (commentId: number) => {
    if (editText.length < 3) return;
    try {
      const payloadText = `${editRating}|${editText}`;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: payloadText }),
        },
      );
      if (res.ok) {
        setEditingCommentId(null);
        // Yorumları tekrar çekip listeyi yenile
        const refreshRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}/comments`,
        );
        setComments(await refreshRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token && product) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (
            Array.isArray(data) &&
            data.some(
              (item: { product_id: number }) => item.product_id === product.id,
            )
          )
            setIsSaved(true);
        });
    }
  }, [token, product]);

  const toggleSave = async () => {
    if (!token) {
      alert("Please sign in to save items!");
      return;
    }

    const previousState = isSaved;
    setIsSaved(!isSaved);

    try {
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
      } else {
        setIsSaved(previousState);
      }
    } catch (error) {
      console.error(error);
      setIsSaved(previousState);
    }
  };

  useEffect(() => {
    if (!id) return;

    // 1. Ürünü Çek
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setIsLoading(false);

        // 2. Benzer Ürünleri Çek (Aynı kategoriden)
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
          .then((r) => r.json())
          .then((allProducts: ApiProduct[]) => {
            const related = allProducts
              .filter((p) => p.category === data.category && p.id !== data.id)
              .slice(0, 4); // Sadece 4 tane al
            setRelatedProducts(
              related.length > 0 ? related : allProducts.slice(0, 4),
            );
          });
      })
      .catch((err) => {
        console.error(err);
        router.push("/");
      });

    // 3. Yorumları Çek
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error("Comments error:", err));
  }, [id, router]);

  const submitComment = async () => {
    if (!token) return alert("Sign in to comment!");
    if (newComment.length < 3) return;
    if (hasReviewed) return alert("You have already reviewed this product.");

    setIsSubmitting(true);
    try {
      const payloadText = `${rating}|${newComment}`;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: product?.id, text: payloadText }),
        },
      );
      if (response.ok) {
        setNewComment("");
        setRating(5);
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
    <main className="min-h-screen bg-neutral-50 flex flex-col select-none pb-20">
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

            {/* YENİ EKLENEN VİTRİN YILDIZLARI */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} filled={true} />
                ))}
              </div>
              <span className="text-xs font-bold text-neutral-400">
                4.9 ({product.sales_count ? product.sales_count * 3 : 124}{" "}
                Reviews)
              </span>
            </div>

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

            {product.sales_count && product.sales_count > 0 ? (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest bg-orange-50 w-fit px-4 py-2 rounded-lg">
                🔥 Highly Popular: Purchased {product.sales_count} times
              </div>
            ) : null}
          </div>
        </div>

        {/* YORUMLAR (REVIEWS) BÖLÜMÜ */}
        <div className="mt-16 border-t border-neutral-100 pt-16">
          <h2 className="text-2xl font-black text-spc-grey mb-8 tracking-tighter">
            Customer Reviews ({comments.length})
          </h2>

          {token ? (
            hasReviewed ? (
              <div className="mb-12 bg-neutral-50 p-6 rounded-3xl border border-neutral-200 text-center">
                <p className="text-sm font-bold text-btn-green uppercase tracking-widest">
                  ✓ You have already reviewed this product
                </p>
              </div>
            ) : (
              <div className="mb-12 bg-white p-6 md:p-8 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    Rate this product
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        filled={star <= (hoveredStar || rating)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="w-full text-black bg-neutral-50 border-none rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-btn-green/20 transition-all resize-none min-h-[100px]"
                />
                <button
                  onClick={submitComment}
                  disabled={isSubmitting || newComment.length < 3}
                  className="self-end bg-spc-grey text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-btn-green transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Posting..." : "Post Review"}
                </button>
              </div>
            )
          ) : (
            <p className="text-sm font-bold text-neutral-400 mb-10 italic">
              Please sign in to leave a review.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comments.map((c) => {
              let commentRating = 5;
              let commentText = c.text;

              const match = c.text.match(/^(\d)\|([\s\S]*)$/);
              if (match) {
                commentRating = parseInt(match[1]);
                commentText = match[2];
              }

              // Müşteri bu yorumun sahibi mi?
              const isOwner = authContext?.user?.name === c.user_name;
              const isEditingThis = editingCommentId === c.id;

              return (
                <div
                  key={c.id}
                  className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative group"
                >
                  {/* Düzenle/Sil Butonları Sadece Sahibine Görünür */}
                  {isOwner && !isEditingThis && (
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingCommentId(c.id);
                          setEditRating(commentRating);
                          setEditText(commentText);
                        }}
                        className="text-neutral-400 hover:text-btn-green p-1 transition-colors"
                        title="Edit Review"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.158 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-neutral-400 hover:text-red-500 p-1 transition-colors"
                        title="Delete Review"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.44.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-black text-base text-spc-grey block mb-1">
                        {c.user_name}
                      </span>
                      <div className="flex">
                        {isEditingThis
                          ? [1, 2, 3, 4, 5].map((star) => (
                              <StarIcon
                                key={star}
                                filled={star <= (editHoveredStar || editRating)}
                                onMouseEnter={() => setEditHoveredStar(star)}
                                onMouseLeave={() => setEditHoveredStar(0)}
                                onClick={() => setEditRating(star)}
                              />
                            ))
                          : [1, 2, 3, 4, 5].map((star) => (
                              <StarIcon
                                key={star}
                                filled={star <= commentRating}
                              />
                            ))}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-50 px-3 py-1.5 rounded-lg mt-1">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {isEditingThis ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-black bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm outline-none focus:border-btn-green transition-all resize-none min-h-[80px]"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="text-[10px] font-bold text-neutral-400 hover:text-spc-grey uppercase px-3 py-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(c.id)}
                          className="text-[10px] font-bold text-white bg-btn-green hover:bg-green-600 rounded px-4 py-1.5 uppercase"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500 leading-relaxed font-medium">
                      {commentText}
                    </p>
                  )}
                </div>
              );
            })}

            {comments.length === 0 && (
              <div className="col-span-full py-10 flex flex-col items-center justify-center bg-white rounded-3xl border border-neutral-100 border-dashed">
                <StarIcon filled={false} />
                <p className="text-neutral-400 text-sm font-bold mt-2 uppercase tracking-widest">
                  No reviews yet. Be the first!
                </p>
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-20 border-t border-neutral-100 pt-16">
            <h2 className="text-2xl font-black text-spc-grey mb-8 tracking-tighter">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relProduct) => (
                <Link
                  href={`/product/${relProduct.id}`}
                  key={relProduct.id}
                  className="bg-white border border-neutral-100/60 rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  <div className="aspect-3/4 w-full bg-neutral-50/80 rounded-xl mb-4 relative overflow-hidden group-hover:bg-neutral-100 transition-colors">
                    <Image
                      src={relProduct.image}
                      alt={relProduct.name}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <p className="text-[10px] text-category-blue font-bold uppercase tracking-widest mb-1.5 text-center truncate">
                    {relProduct.category}
                  </p>
                  <h3 className="text-sm font-bold text-spc-grey mb-2 text-center leading-tight group-hover:text-btn-green transition-colors truncate">
                    {relProduct.name}
                  </h3>
                  <div className="flex justify-center mb-2">
                    <StarIcon filled={true} />
                    <StarIcon filled={true} />
                    <StarIcon filled={true} />
                    <StarIcon filled={true} />
                    <StarIcon filled={true} />
                  </div>
                  <p className="text-base font-black text-spc-grey text-center mt-auto">
                    ${relProduct.price.toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-btn-green text-white px-6 py-4 rounded-xl shadow-2xl font-bold text-sm animate-in fade-in slide-in-from-bottom-8">
          {toastMessage}
        </div>
      )}
    </main>
  );
}
