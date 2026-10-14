import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns";
import type { ClickHistoryItem } from "@/lib/api/shortlinks";

export function analyticsRange(days: number, end = new Date()) {
  const to = startOfDay(end);
  return { from: subDays(to, days - 1), to };
}

export function dashboardHistory(
  source: ClickHistoryItem[] | null | undefined,
  from: Date,
  to: Date,
) {
  const counts = new Map((source ?? []).map((item) => [item.date, item.count]));
  return eachDayOfInterval({ start: startOfDay(from), end: startOfDay(to) }).map((date) => {
    const key = format(date, "yyyy-MM-dd");
    return { date: key, label: format(date, "MMM d"), count: counts.get(key) ?? 0 };
  });
}
