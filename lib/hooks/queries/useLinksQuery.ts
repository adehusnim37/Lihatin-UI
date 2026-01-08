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
        throw new Error(response.message || "Gagal fetch links");
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
        throw new Error(response.message || "Link tidak ditemukan");
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

// ============================================
// MUTATION HOOKS (Create, Update, Delete)
// ============================================

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
        throw new Error(response.message || "Gagal create link");
      }

      return response.data;
    },
    onSuccess: () => {
      // Refresh list setelah create berhasil
      queryClient.invalidateQueries({ queryKey: linksKeys.lists() });
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
        throw new Error(response.message || "Gagal update link");
      }

      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Refresh list dan detail
      queryClient.invalidateQueries({ queryKey: linksKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: linksKeys.detail(variables.code),
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
        throw new Error(response.message || "Gagal hapus link");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linksKeys.lists() });
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
        throw new Error(response.message || "Gagal toggle status");
      }

      return response.data;
    },
    onSuccess: (data, code) => {
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: linksKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: linksKeys.detail(code),
      });

      // Show success toast
      toast.success("Status Updated", {
        description: `Link is now ${data?.is_active ? "active" : "inactive"}`,
      });
    },
    onError: (error: Error) => {
      // Show error toast
      toast.error("Failed to Change Status", {
        description: error.message || "Something went wrong. Please try again.",
      });
    },
  });
}
