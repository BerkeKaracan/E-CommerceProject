import { Metadata } from "next";
import ProductClient from "./ProductClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`,
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const response = await fetch(`${apiUrl}/api/products/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return (
      <div className="h-screen flex items-center justify-center font-bold text-red-500">
        Product not found (ID: {id})
      </div>
    );
  }

  const product = await response.json();
  return <ProductClient initialProduct={product} />;
}
