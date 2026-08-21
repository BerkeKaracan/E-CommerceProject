import { Metadata } from "next";
import ProductClient from "./ProductClient";
import { getServerApiUrl } from "@/lib/api";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(
      `${getServerApiUrl()}/api/products/${id}`,
      { cache: "no-store" },
    );

    if (!response.ok) return { title: "Product Not Found" };

    const product = await response.json();

    return {
      title: product.name,
      description:
        product.description || `Buy ${product.name} from our collection.`,
      openGraph: {
        title: product.name,
        description: product.description,
        images: [{ url: product.image }],
      },
    };
  } catch (error) {
    return { title: "E-Commerce Project" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  const apiUrl = getServerApiUrl();

  const response = await fetch(`${apiUrl}/api/products/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-neutral-50 dark:bg-neutral-950 px-6 text-center">
        <h1 className="text-xl font-black text-spc-grey dark:text-white uppercase tracking-widest">
          Product not found
        </h1>
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          We couldn&apos;t find a product with ID {id}.
        </p>
        <a
          href="/"
          className="bg-btn-green text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-95 transition-all"
        >
          Back to shop
        </a>
      </div>
    );
  }

  const product = await response.json();
  return <ProductClient initialProduct={product} />;
}
