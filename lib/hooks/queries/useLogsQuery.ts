"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getShortLinkLogs, LogsResponse } from "@/lib/api/logs";

export function useShortLinkLogs(
  code: string,
  page: number = 1,
  limit: number = 10
) {
  return useQuery<LogsResponse>({
    queryKey: ["short-link-logs", code, page, limit],
    queryFn: () => getShortLinkLogs(code, page, limit),
    placeholderData: keepPreviousData, // Keep old data while fetching new page
    enabled: !!code,
  });
}
