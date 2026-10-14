"use client";

import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  X,
  LinkIcon,
} from "lucide-react";
import ShortLinkCard, { type ShortLinkData } from "./cards";
import CreateLink from "./create";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLinksUIStore } from "@/lib/stores/useLinksUIStore";
import { cn } from "@/lib/utils";

interface LinksCollectionProps {
  links: ShortLinkData[];
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRefresh: () => void;
  onToggle: (code: string) => Promise<void>;
}

export function LinksCollection({
  links,
  totalCount,
  totalPages,
  isLoading,
  isFetching,
  error,
  onRefresh,
  onToggle,
}: LinksCollectionProps) {
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    orderBy,
    setSortBy,
    setOrderBy,
    page,
    limit,
    setPage,
    view,
    setView,
  } = useLinksUIStore();
  const query = searchQuery.trim().toLowerCase();
  const filtered = links.filter((link) =>
    [link.title, link.short_code, link.original_url].some((value) =>
      value?.toLowerCase().includes(query),
    ),
  );
  const layout =
    view === "cards"
      ? "grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3"
      : "overflow-hidden rounded-xl border @3xl:grid @3xl:grid-cols-[minmax(0,1fr)_max-content_max-content_max-content_max-content] @3xl:gap-x-5";

  return (
    <section
      className="@container mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8"
      aria-labelledby="links-heading"
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 id="links-heading" className="text-2xl font-semibold tracking-tight">
            My Links
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage, share, and track your short links.
          </p>
        </div>
        <CreateLink />
      </header>

      <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="h-11 pl-9 pr-11"
            placeholder="Search this page by name or URL…"
            aria-label="Search links on this page"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 size-11"
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={`${sortBy}:${orderBy}`}
            onValueChange={(value) => {
              const [sort, order] = value.split(":");
              setSortBy(sort);
              setOrderBy(order);
            }}
          >
            <SelectTrigger
              className="h-11 min-w-0 flex-1 gap-2 @3xl:w-48 @3xl:flex-none"
              aria-label="Sort links"
            >
              <ArrowDownUp className="size-4 shrink-0 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at:desc">Newest created</SelectItem>
              <SelectItem value="created_at:asc">Oldest created</SelectItem>
              <SelectItem value="updated_at:desc">Recently updated</SelectItem>
              <SelectItem value="updated_at:asc">Least recently updated</SelectItem>
            </SelectContent>
          </Select>
          <div role="group" aria-label="Link display" className="flex rounded-lg border p-0.5">
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-10 rounded-md"
              aria-label="List view"
              aria-pressed={view === "list"}
              title="List view"
              onClick={() => setView("list")}
            >
              <List className="size-4" />
            </Button>
            <Button
              variant={view === "cards" ? "secondary" : "ghost"}
              size="icon"
              className="size-10 rounded-md"
              aria-label="Card view"
              aria-pressed={view === "cards"}
              title="Card view"
              onClick={() => setView("cards")}
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-muted-foreground"
            aria-label="Refresh links"
            title="Refresh links"
            disabled={isFetching}
            onClick={onRefresh}
          >
            <RefreshCw
              className={cn("size-4", isFetching && "animate-spin motion-reduce:animate-none")}
            />
          </Button>
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-3 text-xs text-muted-foreground"
        aria-live="polite"
      >
        <span>
          {isLoading
            ? "Loading links…"
            : error
              ? "Links unavailable"
              : query
                ? `${filtered.length} of ${links.length} links on this page`
                : `${totalCount.toLocaleString("en-US")} ${totalCount === 1 ? "link" : "links"}`}
        </span>
        {query && <span>Search applies to this page</span>}
      </div>

      <div aria-busy={isLoading || isFetching}>
        {isLoading ? (
          <div className={layout} role="status" aria-label="Loading links">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "space-y-3 p-5",
                  view === "cards"
                    ? "rounded-xl border"
                    : "border-b last:border-b-0 @3xl:col-span-5",
                )}
              >
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center"
          >
            <h2 className="font-semibold">Links couldn’t be loaded</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Please try again to load your links.
            </p>
            <Button variant="outline" onClick={onRefresh} disabled={isFetching}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center">
            <LinkIcon className="size-6 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-semibold">
              {query ? "No matching links on this page" : "Your links will appear here"}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {query
                ? "Try another name or URL, or check the next page."
                : "Create a short link to start sharing and tracking clicks."}
            </p>
            {query ? (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            ) : (
              <CreateLink />
            )}
          </div>
        ) : (
          <div className={layout}>
            {filtered.map((link) => (
              <ShortLinkCard key={link.id} data={link} view={view} onToggle={onToggle} />
            ))}
          </div>
        )}
      </div>

      {!isLoading && !error && totalPages > 0 && (
        <nav
          aria-label="Links pagination"
          className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
        >
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of {totalPages}
            <span className="ml-2">· {limit} per page</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </nav>
      )}
    </section>
  );
}
