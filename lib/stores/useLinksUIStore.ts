/**
 * UI Store - Zustand
 * 🎨 Client-side state untuk UI interactions
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface LinksUIState {
  // Search & Filter
  searchQuery: string;
  sortBy: string;
  orderBy: string;

  // Pagination
  page: number;
  limit: number;

  // Modal states
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  editingLinkId: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
  setOrderBy: (order: string) => void;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetFilters: () => void;

  // Modal actions
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: (linkId: string) => void;
  closeEditModal: () => void;
}

export const useLinksUIStore = create<LinksUIState>()(
  devtools(
    (set) => ({
      // Initial state
      searchQuery: "",
      sortBy: "created_at",
      orderBy: "desc",
      page: 1,
      limit: 10,
      isCreateModalOpen: false,
      isEditModalOpen: false,
      editingLinkId: null,

      // Actions
      setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),
      setSortBy: (sort) => set({ sortBy: sort, page: 1 }),
      setOrderBy: (order) => set({ orderBy: order, page: 1 }),
      setPage: (page) => set({ page }),
      nextPage: () => set((state) => ({ page: state.page + 1 })),
      prevPage: () => set((state) => ({ page: Math.max(1, state.page - 1) })),
      resetFilters: () =>
        set({
          searchQuery: "",
          sortBy: "created_at",
          orderBy: "desc",
          page: 1,
        }),

      // Modal actions
      openCreateModal: () => set({ isCreateModalOpen: true }),
      closeCreateModal: () => set({ isCreateModalOpen: false }),
      openEditModal: (linkId) =>
        set({ isEditModalOpen: true, editingLinkId: linkId }),
      closeEditModal: () =>
        set({ isEditModalOpen: false, editingLinkId: null }),
    }),
    { name: "links-ui-store" }
  )
);
