import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://berkekaracan-portfolio.vercel.app/"),
  title: {
    default: "Premium Market | High-End E-Commerce",
    template: "%s | Premium Market",
  },
  description:
    "Experience premium quality with our exclusive AI-powered market collection.",
  keywords: ["e-commerce", "premium quality", "luxury market", "AI shopping"],
  authors: [{ name: "Berke Karacan" }],
  openGraph: {
    title: "Premium Market",
    description: "Exclusive collection of high-end products.",
    type: "website",
    locale: "en_US",
    siteName: "Premium Market",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Market",
    description: "Exclusive collection of high-end products.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${inter.className} flex flex-col min-h-screen bg-background text-foreground dark:bg-neutral-950 dark:text-white transition-colors duration-300`}
      >
        <Providers>
          <Analytics />
          <SpeedInsights />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
