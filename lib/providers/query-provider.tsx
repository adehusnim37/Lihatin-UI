"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data dianggap fresh selama 1 menit
        staleTime: 60 * 1000,
        // Retry 1x jika gagal
        retry: 1,
        // Refetch saat window focus (bagus untuk real-time data)
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Retry 1x untuk mutations
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: selalu buat QueryClient baru
    return makeQueryClient();
  } else {
    // Browser: reuse QueryClient yang sama
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
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
