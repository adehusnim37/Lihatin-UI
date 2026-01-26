import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/api/shortlinks";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (startDate?: string, endDate?: string) =>
    [...dashboardKeys.all, "stats", { startDate, endDate }] as const,
};

export function useDashboardStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: dashboardKeys.stats(startDate, endDate),
    queryFn: async () => {
      const response = await getDashboardStats(startDate, endDate);
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch dashboard stats");
      }
      return response.data.summary;
    },
    placeholderData: (previousData) => previousData,
  });
}
