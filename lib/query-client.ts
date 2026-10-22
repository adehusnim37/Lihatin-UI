import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data dianggap fresh selama 90 detik
        staleTime: 90 * 1000,
        // Failed requests are retried explicitly by the user.
        retry: false,
        // Refetch saat window focus (bagus untuk real-time data)
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Never replay writes automatically: a lost response may hide a committed write.
        retry: false,
      },
    },
  });
}
