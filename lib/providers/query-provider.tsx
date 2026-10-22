"use client";

import { useState } from "react";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: selalu buat QueryClient baru
    return createQueryClient();
  } else {
    // Browser: reuse QueryClient yang sama
    if (!browserQueryClient) browserQueryClient = createQueryClient();
    return browserQueryClient;
  }
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Gunakan state untuk client-side hydration yang benar
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
