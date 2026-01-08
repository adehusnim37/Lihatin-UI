"use client";

import {
  Plus,
  Search,
  Filter,
  Loader2,
  LinkIcon,
  RefreshCw,
} from "lucide-react";

import ShortLinkCard from "@/components/links/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import CreateLink from "@/components/links/create";

// TanStack Query & Zustand
import {
  useLinks,
  useToggleLinkStatus,
} from "@/lib/hooks/queries/useLinksQuery";
import { useLinksUIStore } from "@/lib/stores/useLinksUIStore";

export default function LinksPage() {
  // Zustand store untuk UI state
  const {
    searchQuery,
    sortBy,
    orderBy,
    page,
    limit,
    setSearchQuery,
    setSortBy,
    setOrderBy,
    setPage,
  } = useLinksUIStore();

  // TanStack Query untuk server state
  const { data, isLoading, error, refetch, isFetching } = useLinks(
    page,
    limit,
    sortBy,
    orderBy
  );

  // Toggle mutation
  const toggleMutation = useToggleLinkStatus();

  // Derived state
  const links = data?.short_links ?? [];
  const totalPages = data?.total_pages ?? 0;
  const totalCount = data?.total_count ?? 0;

  // Filter links by search query (client-side)
  const filteredLinks = links.filter(
    (link) =>
      link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.short_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.original_url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
              <p className="text-muted-foreground">
                Manage and track all your shortened links
                {totalCount > 0 && ` • ${totalCount} total`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
              </Button>
              <CreateLink />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="updated_at">Last Updated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={orderBy} onValueChange={setOrderBy}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest</SelectItem>
                  <SelectItem value="asc">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center py-20">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
              <p className="text-destructive text-center">
                {error instanceof Error
                  ? error.message
                  : "Failed to load links"}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
              <div className="bg-muted rounded-full p-4">
                <LinkIcon className="text-muted-foreground h-8 w-8" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">No links found</h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery
                    ? "Try a different search term"
                    : "Create your first short link to get started"}
                </p>
              </div>
              {!searchQuery && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Link
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Links Grid */}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {filteredLinks.map((link) => (
                  <ShortLinkCard
                    key={link.id}
                    data={link}
                    onToggle={async (code) => {
                      await toggleMutation.mutateAsync(code);
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages >= 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrev}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNext}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
