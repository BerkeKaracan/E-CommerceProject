import { Metadata } from "next";
import ProductClient from "./ProductClient";

interface Props {
  params: { id: string };
}

/**
 * Generates dynamic metadata for SEO based on the specific product data.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/products/${params.id}`,
    );
    const product = await response.json();

    if (!product) return { title: "Product Not Found" };

    return {
      title: product.name,
      description:
        product.description ||
        `Buy ${product.name} from our ${product.category} collection.`,
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

/**
 * Server Component that fetches initial data and renders the Client Component.
 */
export default async function ProductPage({ params }: Props) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/products/${params.id}`,
    {
      cache: "no-store", // Ensure fresh data for each request
    },
  );

  if (!response.ok) return <div>Product not found</div>;

  const product = await response.json();

  return <ProductClient initialProduct={product} />;
}
