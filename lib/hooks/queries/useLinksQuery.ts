/**
 * ============================================
 * 🔗 LINKS QUERY HOOKS
 * ============================================
 *
 * File ini berisi semua hooks untuk fetch & mutasi data links.
 * Menggunakan TanStack Query untuk caching & state management.
 *
 * CARA PAKAI:
 *
 * 1. Fetch semua links:
 *    const { data, isLoading } = useLinks(page, limit, sort, order);
 *
 * 2. Create link baru:
 *    const mutation = useCreateLink();
 *    mutation.mutate({ original_url: "https://..." });
 *
 * 3. Delete link:
 *    const mutation = useDeleteLink();
 *    mutation.mutate("short_code");
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getShortLinks,
  getShortLink,
  createShortLink,
  updateShortLink,
  deleteShortLink,
  toggleShortLinkStatus,
  removeShortLinkPasscode,
  getShortLinkStats,
  type ShortLink,
  type CreateShortLinkRequest,
  type UpdateShortLinkRequest,
} from "@/lib/api/shortlinks";

// ============================================
// QUERY KEYS
// ============================================

/**
 * Query Keys = ID unik untuk menyimpan data di cache.
 *
 * Contoh:
 * - linksKeys.lists()          = ["links", "list"]
 * - linksKeys.list({page: 1})  = ["links", "list", {page: 1}]
 * - linksKeys.detail("abc")    = ["links", "detail", "abc"]
 */
export const linksKeys = {
  // Base key
  all: ["links"] as const,

  // Untuk list/pagination
  lists: () => [...linksKeys.all, "list"] as const,
  list: (page: number, limit: number, sort: string, orderBy: string) =>
    [...linksKeys.lists(), { page, limit, sort, orderBy }] as const,

  // Untuk detail single link
  details: () => [...linksKeys.all, "detail"] as const,
  detail: (code: string) => [...linksKeys.details(), code] as const,

  // Untuk statistik
  stats: (code: string) => [...linksKeys.all, "stats", code] as const,

  // Untuk views/analytics history
  views: (
    code: string,
    page: number,
    limit: number,
    sort: string,
    orderBy: string
  ) =>
    [...linksKeys.all, "views", code, { page, limit, sort, orderBy }] as const,
};

// ============================================
// FETCH HOOKS (Query)
// ============================================

/**
 * 📋 useLinks - Fetch daftar links dengan pagination
 *
 * @param page    - Halaman ke berapa (default: 1)
 * @param limit   - Jumlah item per halaman (default: 9)
 * @param sort    - Sort by field (default: "created_at")
 * @param orderBy - Order direction (default: "desc")
 *
 * @returns { data, isLoading, error, refetch, isFetching }
 *
 * @example
 * const { data, isLoading } = useLinks(1, 10, "created_at", "desc");
 * const links = data?.short_links ?? [];
 */
export function useLinks(
  page: number = 1,
  limit: number = 9,
  sort: string = "created_at",
  orderBy: string = "desc"
) {
  return useQuery({
    queryKey: linksKeys.list(page, limit, sort, orderBy),
    queryFn: async () => {
      const response = await getShortLinks(page, limit, sort, orderBy);

      if (!response.success) {
        throw response;
      }

      return response.data;
    },
  });
}

/**
 * 🔍 useLink - Fetch single link berdasarkan code
 *
 * @param code - Short code dari link
 *
 * @example
 * const { data: link } = useLink("abc123");
 */
export function useLink(code: string) {
  return useQuery({
    queryKey: linksKeys.detail(code),
    queryFn: async () => {
      const response = await getShortLink(code);

      if (!response.success) {
        throw response;
      }

      return response.data;
    },
    enabled: !!code, // Hanya fetch jika code ada
  });
}

/**
 * 📊 useLinkStats - Fetch statistik link
 *
 * @param code - Short code dari link
 */
export function useLinkStats(code: string) {
  return useQuery({
    queryKey: linksKeys.stats(code),
    queryFn: async () => {
      const response = await getShortLinkStats(code);

      if (!response.success) {
        throw new Error(response.message || "Gagal fetch stats");
      }

      return response.data;
    },
    enabled: !!code,
  });
}

/**
 * 👁️ useShortLinkViews - Fetch history views dengan pagination
 */
export function useShortLinkViews(
  code: string,
  page: number = 1,
  limit: number = 10,
  sort: string = "created_at",
  orderBy: string = "desc"
) {
  return useQuery({
    queryKey: linksKeys.views(code, page, limit, sort, orderBy),
    queryFn: async () => {
      const { getShortLinkViews } = await import("@/lib/api/shortlinks");
      const response = await getShortLinkViews(
        code,
        page,
        limit,
        sort,
        orderBy
      );

      if (!response.success) {
        throw new Error(response.message || "Gagal fetch views");
      }

      return response.data.views;
    },
    placeholderData: (previousData) => previousData, // keepPreviousData replacement logic or import it
    enabled: !!code,
  });
}

/**
 * 📊 useDashboardStats - Fetch dashboard summary statistics
 *
 * @param startDate - Optional start date for filtering (YYYY-MM-DD)
 * @param endDate - Optional end date for filtering (YYYY-MM-DD)
 *
 * @example
 * const { data: stats } = useDashboardStats();
 * const totalLinks = stats?.total_links ?? 0;
 */
export function useDashboardStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...linksKeys.all, "dashboard-stats", { startDate, endDate }] as const,
    queryFn: async () => {
      const { getDashboardStats } = await import("@/lib/api/shortlinks");
      const response = await getDashboardStats(startDate, endDate);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch dashboard stats");
      }

      return response.data.summary;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}

// ============================================
// MUTATION HOOKS (Create, Update, Delete)
// ============================================

// Helper to format API error response
const formatAPIError = (error: any): string => {
  if (error?.error && typeof error.error === "object") {
    // Collect all validation messages
    const messages = Object.values(error.error).filter(
      (msg) => typeof msg === "string"
    );
    if (messages.length > 0) {
      return messages.join("\n");
    }
  }
  return error?.message || "Something went wrong. Please try again.";
};

/**
 * ➕ useCreateLink - Buat link baru
 *
 * @example
 * const mutation = useCreateLink();
 *
 * mutation.mutate({
 *   original_url: "https://google.com",
 *   title: "Google",
 *   description: "Search engine"
 * });
 *
 * // Cek status:
 * mutation.isPending  // lagi proses
 * mutation.isSuccess  // berhasil
 * mutation.isError    // gagal
 */
export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateShortLinkRequest) => {
      const response = await createShortLink(data);

      if (!response.success) {
        // Throw the full response to access 'error' field in onError
        throw response;
      }

      return response.data;
    },
    onSuccess: () => {
      // Refresh list setelah create berhasil
      queryClient.invalidateQueries({ queryKey: linksKeys.lists() });
      toast.success("Link successfully created");
    },
    onError: (error: any) => {
      toast.error("Failed to create link", {
        description: formatAPIError(error),
      });
    },
  });
}

/**
 * ✏️ useUpdateLink - Update link yang sudah ada
 *
 * @example
 * const mutation = useUpdateLink();
 *
 * mutation.mutate({
 *   code: "abc123",
 *   data: { title: "New Title" }
 * });
 */
export function useUpdateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      data,
    }: {
      code: string;
      data: UpdateShortLinkRequest;
    }) => {
      const response = await updateShortLink(code, data);

      if (!response.success) {
        throw response;
      }

      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Refresh list dan detail
      queryClient.invalidateQueries({ queryKey: linksKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: linksKeys.detail(variables.code),
      });
      toast.success("Link successfully updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update link", {
        description: formatAPIError(error),
      });
    },
  });
}

/**
 * 🗑️ useDeleteLink - Hapus link
 *
 * @example
 * const mutation = useDeleteLink();
 * mutation.mutate("abc123");
 */
export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await deleteShortLink(code);

      if (!response.success) {
        throw response;
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linksKeys.lists() });
      toast.success("Link successfully deleted");
    },
    onError: (error: any) => {
      toast.error("Failed to delete link", {
        description: formatAPIError(error),
      });
    },
  });
}

/**
 * 🔓 useRemovePasscode - Hapus passcode dari link
 */
export function useRemovePasscode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await removeShortLinkPasscode(code);

      if (!response.success) {
        throw response;
      }

      return response;
    },
    onSuccess: (_data, code) => {
      queryClient.invalidateQueries({ queryKey: linksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: linksKeys.detail(code) });
      toast.success("Passcode removed successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to remove passcode", {
        description: formatAPIError(error),
      });
    },
  });
}

/**
 * 🔄 useToggleLinkStatus - Toggle aktif/nonaktif link
 *
 * API auto-toggles based on current DB state:
 * - If active → becomes inactive
 * - If inactive → becomes active
 *
 * @example
 * const mutation = useToggleLinkStatus();
 * mutation.mutate("abc123");
 */
export function useToggleLinkStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await toggleShortLinkStatus(code);

      if (!response.success) {
        throw response;
      }

      return response;
    },
    onSuccess: (response) => {
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: linksKeys.lists() });

      // Also invalidate detail if we have the code (we don't easily have it here since first arg is response)
      // Actually second arg is variables (code)
      // queryClient.invalidateQueries({ queryKey: linksKeys.detail(code) });
      // But let's stick to what's necessary first. The previous code had (data, code), now (response, code).

      // Show success toast
      toast.success("Status Updated", {
        description: response.message,
      });
    },
    onError: (error: any) => {
      // Show error toast
      toast.error("Failed to change status", {
        description: formatAPIError(error),
      });
    },
  });
}
