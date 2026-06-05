"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className:
                "bg-white text-zinc-950 dark:bg-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl text-sm font-semibold tracking-tight",
              duration: 4000,
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#ffffff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#ffffff",
                },
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
