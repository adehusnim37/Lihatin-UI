/**
 * ============================================
 * 🔑 API KEYS QUERY HOOKS
 * ============================================
 *
 * File ini berisi semua hooks untuk fetch & mutasi data API keys.
 * Menggunakan TanStack Query untuk caching & state management.
 *
 * CARA PAKAI:
 *
 * 1. Fetch semua API keys:
 *    const { data, isLoading } = useAPIKeys();
 *
 * 2. Create API key baru:
 *    const mutation = useCreateAPIKey();
 *    mutation.mutate({ name: "My API Key" });
 *
 * 3. Update API key:
 *    const mutation = useUpdateAPIKey();
 *    mutation.mutate({ id: "key_id", data: { name: "Updated" } });
 *
 * 4. Toggle status:
 *    const mutation = useToggleAPIKeyStatus();
 *    mutation.mutate(apiKeyObject);
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAPIKeys,
  getAPIKey,
  createAPIKey,
  updateAPIKey,
  revokeAPIKey,
  activateAPIKey,
  deactivateAPIKey,
  refreshAPIKey,
  getAPIKeyUsage,
  type APIKeyResponse,
  type CreateAPIKeyRequest,
  type UpdateAPIKeyRequest,
  getAPIKeyUsageStats,
} from "@/lib/api/api-keys";
import { stat } from "node:fs";

// ============================================
// QUERY KEYS
// ============================================

/**
 * Query Keys = ID unik untuk menyimpan data di cache.
 *
 * Contoh:
 * - apiKeysKeys.all           = ["api-keys"]
 * - apiKeysKeys.lists()       = ["api-keys", "list"]
 * - apiKeysKeys.detail("id")  = ["api-keys", "detail", "id"]
 */
export const apiKeysKeys = {
  // Base key
  all: ["api-keys"] as const,

  // Untuk list
  lists: () => [...apiKeysKeys.all, "list"] as const,

  // Untuk detail single API key
  details: () => [...apiKeysKeys.all, "detail"] as const,
  detail: (id: string) => [...apiKeysKeys.details(), id] as const,

  // Untuk usage/activity logs
  usage: (id: string, page: number, limit: number) =>
    [...apiKeysKeys.all, "usage", id, { page, limit }] as const,

  stats: () => [...apiKeysKeys.all, "stats"] as const,
};

// ============================================
// FETCH HOOKS (Query)
// ============================================

/**
 * 📋 useAPIKeys - Fetch daftar API keys
 *
 * @returns { data, isLoading, error, refetch }
 *
 * @example
 * const { data, isLoading } = useAPIKeys();
 * const apiKeys = data ?? [];
 */
export function useAPIKeys() {
  return useQuery({
    queryKey: apiKeysKeys.lists(),
    queryFn: async () => {
      const response = await getAPIKeys();

      if (!response.success) {
        throw response;
      }

      return response.data;
    },
  });
}

/**
 * 🔍 useAPIKey - Fetch single API key berdasarkan ID
 *
 * @param id - ID dari API key
 *
 * @example
 * const { data: apiKey } = useAPIKey("key123");
 */
export function useAPIKey(id: string) {
  return useQuery({
    queryKey: apiKeysKeys.detail(id),
    queryFn: async () => {
      const response = await getAPIKey(id);

      if (!response.success) {
        throw response;
      }

      return response.data;
    },
    enabled: !!id, // Hanya fetch jika ID ada
  });
}

/**
 * 📊 useAPIKeyUsage - Fetch usage/activity logs dari API key
 *
 * @param id - ID dari API key
 * @param page - Halaman ke berapa (default: 1)
 * @param limit - Jumlah item per halaman (default: 10)
 * @param enabled - Optional flag to enable/disable query (default: true)
 *
 * @example
 * const { data } = useAPIKeyUsage("key123", 1, 20);
 * const { data } = useAPIKeyUsage("key123", 1, 20, dialogOpen);
 */
export function useAPIKeyUsage(
  id: string,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: apiKeysKeys.usage(id, page, limit),
    queryFn: async () => {
      const response = await getAPIKeyUsage(id, page, limit);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch API key usage");
      }

      return response.data;
    },
    placeholderData: (previousData) => previousData,
    enabled: !!id && enabled,
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
      (msg) => typeof msg === "string",
    );
    if (messages.length > 0) {
      return messages.join("\n");
    }
  }
  return error?.message || "Something went wrong. Please try again.";
};

/**
 * ➕ useCreateAPIKey - Buat API key baru
 *
 * @example
 * const mutation = useCreateAPIKey();
 *
 * mutation.mutate({
 *   name: "Production API Key",
 *   permissions: ["read", "write"],
 *   limit_usage: 1000
 * });
 *
 * // Cek status:
 * mutation.isPending  // lagi proses
 * mutation.isSuccess  // berhasil
 * mutation.isError    // gagal
 */
export function useCreateAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAPIKeyRequest) => {
      const response = await createAPIKey(data);

      if (!response.success) {
        throw response;
      }

      return response.data;
    },
    onSuccess: () => {
      // Refresh list setelah create berhasil
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.lists() });
      toast.success("API key successfully created");
    },
    onError: (error: any) => {
      toast.error("Failed to create API key", {
        description: formatAPIError(error),
      });
    },
  });
}

/**
 * ✏️ useUpdateAPIKey - Update API key
 *
 * @example
 * const mutation = useUpdateAPIKey();
 *
 * mutation.mutate({
 *   id: "key123",
 *   data: {
 *     name: "Updated Name",
 *     limit_usage: 2000
 *   }
 * });
 */
export function useUpdateAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAPIKeyRequest;
    }) => {
      const response = await updateAPIKey(id, data);

      if (!response.success) {
        throw response;
      }

      return response.data;
    },
    onSuccess: (_, variables) => {
      // Refresh list dan detail
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: apiKeysKeys.detail(variables.id),
      });
      toast.success("API key successfully updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update API key", {
        description: formatAPIError(error),
      });
    },
  });
}

/**
 * 🗑️ useRevokeAPIKey - Revoke/delete API key
 *
 * @example
 * const mutation = useRevokeAPIKey();
 * mutation.mutate("key123");
 */
export function useRevokeAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await revokeAPIKey(id);

      if (!response.success) {
        throw response;
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.lists() });
      toast.success("API key successfully revoked");
    },
    onError: (error: any) => {
      toast.error("Failed to revoke API key", {
        description: formatAPIError(error),
      });
    },
  });
}

/**
 * 🔄 useToggleAPIKeyStatus - Toggle active/inactive status
 *
 * Otomatis detect status saat ini dan toggle ke opposite.
 *
 * @example
 * const mutation = useToggleAPIKeyStatus();
 * mutation.mutate(apiKeyObject);
 */
export function useToggleAPIKeyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKey: APIKeyResponse) => {
      if (apiKey.is_active) {
        return deactivateAPIKey(apiKey.id);
      } else {
        return activateAPIKey(apiKey.id);
      }
    },
    onSuccess: (response, apiKey) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: apiKeysKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: apiKeysKeys.detail(apiKey.id),
        });
        toast.success(
          apiKey.is_active ? "API key deactivated" : "API key activated",
        );
      } else {
        toast.error(response.message || "Failed to update API key status");
      }
    },
    onError: () => {
      toast.error("Failed to update API key status");
    },
  });
}

/**
 * 🔁 useRefreshAPIKey - Refresh/regenerate API key secret
 *
 * ⚠️ PERHATIAN: Ini akan generate secret baru dan invalidate yang lama!
 *
 * @example
 * const mutation = useRefreshAPIKey();
 * mutation.mutate("key123");
 */
export function useRefreshAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await refreshAPIKey(id);

      if (!response.success) {
        throw response;
      }

      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.detail(id) });
      toast.success("API key successfully refreshed");
    },
    onError: (error: any) => {
      toast.error("Failed to refresh API key", {
        description: formatAPIError(error),
      });
    },
  });
}

/**
 *
 * StatisticsAPI Hooks : useAPIKeyStats - Fetch API key statistics
 *
 * @returns { data, isLoading, error, refetch }
 *
 * @example
 * const { data, isLoading } = useAPIKeyStats();
 * const stats = data ?? {};
 *
 */
export function useAPIKeyStats() {
  return useQuery({
    queryKey: apiKeysKeys.stats(),
    queryFn: async () => {
      const response = await getAPIKeyUsageStats();

      if (!response.success) {
        throw response;
      }

      return response.data;
    },
  });
}
