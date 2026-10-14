import {
  eachDayOfInterval,
  eachHourOfInterval,
  format,
  startOfDay,
  subDays,
  subHours,
} from "date-fns";
import type { ClickHistoryItem } from "@/lib/api/shortlinks";

export function buildLinkHistory(
  source: ClickHistoryItem[] | null | undefined,
  days: number,
  end = new Date(),
) {
  const hourly = days === 1;
  const counts = new Map((source ?? []).map((item) => [item.date, item.count]));
  // A rolling 24-hour interval includes partial hours at both ends (25 buckets).
  const dates = hourly
    ? eachHourOfInterval({ start: subHours(end, 24), end })
    : eachDayOfInterval({ start: subDays(startOfDay(end), days - 1), end: startOfDay(end) });
  return dates.map((date) => {
    const key = format(date, hourly ? "yyyy-MM-dd HH:00" : "yyyy-MM-dd");
    return {
      date: key,
      label: format(date, hourly ? "HH:mm" : "MMM d"),
      count: counts.get(key) ?? 0,
    };
  });
}
