import { format, parseISO, startOfWeek } from 'date-fns';
import type { DailyNutritionRecord } from '@/types/nutrition';

export type Metric = 'calories' | 'protein' | 'carbs' | 'fat';

export type WeeklyAverages = {
  labels: string[]; // formatted week labels, e.g., "Aug 12"
  data: number[];   // weekly averages for the metric
};

export type ChartSeries = WeeklyAverages & {
  target?: number;
};

function getMetricValue(metric: Metric, rec: DailyNutritionRecord): number {
  switch (metric) {
    case 'calories':
      return rec.total.calories ?? 0;
    case 'protein':
      return rec.total.protein ?? 0;
    case 'carbs':
      return rec.total.carbs ?? 0;
    case 'fat':
      return rec.total.fat ?? 0;
    default:
      return 0;
  }
}

/**
 * Compute weekly averages for a given metric from a list of daily records.
 * - Weeks start on Monday to align with most fitness calendars.
 * - Returns the most recent `weeks` buckets, oldest -> newest.
 */
export function computeWeeklyAverages(
  records: DailyNutritionRecord[],
  metric: Metric,
  weeks: number = 8,
  now: Date = new Date()
): WeeklyAverages {
  // Group by week start (Mon)
  const weekMap = new Map<string, { sum: number; days: number }>();

  for (const rec of records) {
    if (!rec?.date) continue;
    const d = parseISO(rec.date);
    if (isNaN(d.getTime())) continue;
    const weekStart = startOfWeek(d, { weekStartsOn: 1 });
    const key = weekStart.toISOString();
    const entry = weekMap.get(key) ?? { sum: 0, days: 0 };
    entry.sum += getMetricValue(metric, rec);
    entry.days += 1;
    weekMap.set(key, entry);
  }

  // Determine the last `weeks` week-starts up to current week
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const orderedKeys: Date[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const dt = new Date(currentWeekStart);
    dt.setDate(currentWeekStart.getDate() - i * 7);
    orderedKeys.push(dt);
  }

  const labels: string[] = [];
  const data: number[] = [];

  for (const dt of orderedKeys) {
    const key = dt.toISOString();
    const bucket = weekMap.get(key);
    labels.push(format(dt, 'MMM d'));
    if (!bucket || bucket.days === 0) {
      data.push(0);
    } else {
      data.push(bucket.sum / bucket.days);
    }
  }

  return { labels, data };
}

/**
 * Build chart-ready series for a metric including an optional constant target line.
 */
export function buildTrendSeries(
  records: DailyNutritionRecord[],
  metric: Metric,
  options?: { weeks?: number; target?: number; now?: Date }
): ChartSeries {
  const { weeks = 8, target, now } = options || {};
  const base = computeWeeklyAverages(records, metric, weeks, now);
  return { ...base, target };
}
