import { test } from "node:test";
import assert from "node:assert/strict";
import { differenceInCalendarDays, format } from "date-fns";
import { analyticsRange, dashboardHistory } from "../lib/analytics/dashboard-history";

test("30-day preset includes exactly 30 calendar days, including today", () => {
  const range = analyticsRange(30, new Date(2026, 9, 15, 23, 45));
  assert.equal(differenceInCalendarDays(range.to, range.from) + 1, 30);
  assert.equal(format(range.from, "yyyy-MM-dd"), "2026-09-16");
  assert.equal(format(range.to, "yyyy-MM-dd"), "2026-10-15");
});
test("custom range fills missing days and excludes clicks outside its dates", () => {
  const result = dashboardHistory(
    [
      { date: "2025-12-30", count: 99 },
      { date: "2025-12-31", count: 3 },
      { date: "2026-01-02", count: 7 },
    ],
    new Date(2025, 11, 31),
    new Date(2026, 0, 2),
  );
  assert.deepEqual(
    result.map((row) => row.count),
    [3, 0, 7],
  );
  assert.equal(result.length, 3);
});
test("single-day selection and null API history produce one valid zero point", () => {
  const date = new Date(2026, 9, 15);
  assert.deepEqual(dashboardHistory(null, date, date), [
    { date: "2026-10-15", label: "Oct 15", count: 0 },
  ]);
});
