import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { useLinksUIStore } from "../lib/stores/useLinksUIStore";

beforeEach(() => {
  useLinksUIStore.setState(useLinksUIStore.getInitialState(), true);
});

test("card pages fill both two-column and three-column grids", () => {
  useLinksUIStore.getState().setView("cards");
  const { limit, page } = useLinksUIStore.getState();
  assert.equal(limit, 12);
  assert.equal(limit % 2, 0);
  assert.equal(limit % 3, 0);
  assert.equal(page, 1);
});

test("switching from the last list page keeps its first item visible", () => {
  // 21 links: list page 3 starts at item 21, which belongs to card page 2.
  useLinksUIStore.getState().setPage(3);
  useLinksUIStore.getState().setView("cards");
  assert.partialDeepStrictEqual(useLinksUIStore.getState(), { view: "cards", limit: 12, page: 2 });
});

test("switching to rows keeps the first card on the destination page", () => {
  useLinksUIStore.getState().setView("cards");
  useLinksUIStore.getState().setPage(2);
  useLinksUIStore.getState().setView("list");
  assert.partialDeepStrictEqual(useLinksUIStore.getState(), { view: "list", limit: 10, page: 2 });
});

test("reselecting a view retains pagination, search, and sorting", () => {
  useLinksUIStore.getState().setSearchQuery("campaign");
  useLinksUIStore.getState().setSortBy("updated_at");
  useLinksUIStore.getState().setOrderBy("asc");
  useLinksUIStore.getState().setPage(4);
  useLinksUIStore.getState().setView("list");
  assert.partialDeepStrictEqual(useLinksUIStore.getState(), {
    page: 4,
    searchQuery: "campaign",
    sortBy: "updated_at",
    orderBy: "asc",
  });
});
