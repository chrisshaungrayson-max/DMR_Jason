import { eachDayOfInterval, formatISO, parseISO } from 'date-fns';
import type { DailyNutritionRecord } from '@/types/nutrition';

export type CompliancePoint = { dateISO: string; compliant: boolean };

/**
 * Build a day-by-day compliance array for the last `days` days (oldest -> newest).
 * Currently supports protein-based compliance (>= gramsPerDay).
 */
export function buildProteinCompliance(
  records: DailyNutritionRecord[],
  gramsPerDay: number,
  days: number = 28,
  now: Date = new Date()
): CompliancePoint[] {
  const byDate = new Map<string, DailyNutritionRecord>();
  for (const r of records) {
    if (r?.date) byDate.set(r.date, r);
  }

  const end = now;
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));

  const arr: CompliancePoint[] = [];
  const intervalDays = eachDayOfInterval({ start, end });
  for (const d of intervalDays) {
    const key = formatISO(d, { representation: 'date' });
    const rec = byDate.get(key);
    const protein = rec?.total?.protein ?? 0;
    arr.push({ dateISO: key, compliant: protein >= gramsPerDay });
  }
  return arr;
}

/**
 * Convert a linear daily compliance list (oldest->newest) into weekly rows (Mon..Sun).
 * Pads the first week with leading nulls so all rows have length 7.
 */
export function toWeeklyGrid(points: CompliancePoint[]): (boolean | null)[][] {
  if (points.length === 0) return [];
  // Determine how many leading pad cells are needed so that the last row ends on the last day
  const firstDate = parseISO(points[0].dateISO);
  const firstDow = (firstDate.getDay() + 6) % 7; // Mon=0..Sun=6
  const padded: (boolean | null)[] = Array(firstDow).fill(null).concat(points.map((p) => p.compliant));

  const rows: (boolean | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    rows.push(padded.slice(i, i + 7));
  }
  return rows;
}
