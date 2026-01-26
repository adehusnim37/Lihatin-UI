"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Key, Loader2 } from "lucide-react";
import { useState } from "react";
import { APIKeyCard } from "./api-key-card";
import { EditAPIKeyDialog } from "../api-keys/edit-api-key-dialog";
import { DeleteAPIKeyDialog } from "../api-keys/delete-api-key-dialog";
import { RefreshAPIKeyDialog } from "../api-keys/refresh-api-key-dialog";
import { APIKeyUsageDialog } from "../api-keys/api-key-usage-dialog";
import {
  getAPIKeys,
  activateAPIKey,
  deactivateAPIKey,
  APIKeyResponse,
} from "@/lib/api/api-keys";
import { toast } from "sonner";

export function APIKeyList() {
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<APIKeyResponse | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [refreshDialogOpen, setRefreshDialogOpen] = useState(false);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => getAPIKeys(1, 50),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (apiKey: APIKeyResponse) => {
      if (apiKey.is_active) {
        return deactivateAPIKey(apiKey.id);
      } else {
        return activateAPIKey(apiKey.id);
      }
    },
    onSuccess: (response, apiKey) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["api-keys"] });
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

  const handleEdit = (apiKey: APIKeyResponse) => {
    setSelectedKey(apiKey);
    setEditDialogOpen(true);
  };

  const handleDelete = (apiKey: APIKeyResponse) => {
    setSelectedKey(apiKey);
    setDeleteDialogOpen(true);
  };

  const handleRefresh = (apiKey: APIKeyResponse) => {
    setSelectedKey(apiKey);
    setRefreshDialogOpen(true);
  };

  const handleToggleStatus = (apiKey: APIKeyResponse) => {
    toggleStatusMutation.mutate(apiKey);
  };

  const handleViewUsage = (apiKey: APIKeyResponse) => {
    setSelectedKey(apiKey);
    setUsageDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load API keys</p>
      </div>
    );
  }

  const apiKeys: APIKeyResponse[] = Array.isArray(data?.data)
    ? data.data
    : data?.data?.api_keys || [];

  if (apiKeys.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
        <Key className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No API keys yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first API key to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {apiKeys.map((apiKey) => (
          <APIKeyCard
            key={apiKey.id}
            apiKey={apiKey}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
            onToggleStatus={handleToggleStatus}
            onViewUsage={handleViewUsage}
          />
        ))}
      </div>

      {/* Dialogs */}
      {selectedKey && (
        <>
          <EditAPIKeyDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            apiKey={selectedKey}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["api-keys"] });
              setEditDialogOpen(false);
            }}
          />
          <DeleteAPIKeyDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            apiKey={selectedKey}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["api-keys"] });
              setDeleteDialogOpen(false);
            }}
          />
          <RefreshAPIKeyDialog
            open={refreshDialogOpen}
            onOpenChange={setRefreshDialogOpen}
            apiKey={selectedKey}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["api-keys"] });
            }}
          />
          <APIKeyUsageDialog
            open={usageDialogOpen}
            onOpenChange={setUsageDialogOpen}
            apiKey={selectedKey}
          />
        </>
      )}
    </>
  );
}
