import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLinkHistory } from "../lib/analytics/link-history";

test("rolling 24-hour chart preserves clicks in the partial first hour", () => {
  const history = buildLinkHistory(
    [
      { date: "2026-10-14 12:00", count: 5 },
      { date: "2026-10-15 12:00", count: 3 },
    ],
    1,
    new Date(2026, 9, 15, 12, 30),
  );
  assert.equal(history.length, 25);
  assert.equal(history[0].count, 5);
  assert.equal(history.at(-1)?.count, 3);
  assert.equal(
    history.reduce((total, item) => total + item.count, 0),
    8,
  );
});

test("daily chart fills missing dates without importing clicks outside the selected period", () => {
  const history = buildLinkHistory(
    [
      { date: "2026-10-08", count: 10 },
      { date: "2026-10-10", count: 2 },
      { date: "2026-10-15", count: 4 },
    ],
    7,
    new Date(2026, 9, 15, 12, 30),
  );
  assert.equal(history.length, 7);
  assert.equal(history[0].date, "2026-10-09");
  assert.equal(
    history.reduce((total, item) => total + item.count, 0),
    6,
  );
  assert.equal(history[0].count, 0);
});

test("empty API history produces a valid zero timeline", () => {
  const history = buildLinkHistory(null, 7, new Date(2026, 9, 15, 12, 30));
  assert.equal(history.length, 7);
  assert.ok(history.every((item) => item.count === 0));
});
