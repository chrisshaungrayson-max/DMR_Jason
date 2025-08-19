import { describe, it, expect } from 'vitest';
import { buildTrendSeries, computeWeeklyAverages } from '@/utils/analytics';
import type { DailyNutritionRecord } from '@/types/nutrition';

function rec(date: string, calories: number, protein = 0, carbs = 0, fat = 0): DailyNutritionRecord {
  return {
    date,
    total: { calories, protein, carbs, fat },
    entries: [],
  };
}

describe('analytics utilities', () => {
  it('returns empty arrays for no data', () => {
    const out = computeWeeklyAverages([], 'calories', 4, new Date('2025-08-18T00:00:00Z'));
    expect(out.labels.length).toBe(4);
    expect(out.data.length).toBe(4);
    expect(out.data.every((n) => n === 0)).toBe(true);
  });

  it('computes weekly averages by week start (Mon)', () => {
    const now = new Date('2025-08-18T00:00:00Z'); // Monday
    const records: DailyNutritionRecord[] = [
      rec('2025-08-12', 2000), // Tue prior week
      rec('2025-08-13', 2200), // Wed prior week
      rec('2025-08-18', 2100), // Mon current week
    ];
    const out = computeWeeklyAverages(records, 'calories', 2, now);
    // Two weeks: prior and current
    expect(out.labels.length).toBe(2);
    // Prior week average = (2000+2200)/2 = 2100, current week so far = 2100
    expect(out.data[0]).toBeCloseTo(2100, 5);
    expect(out.data[1]).toBeCloseTo(2100, 5);
  });

  it('builds trend series including target line', () => {
    const now = new Date('2025-08-18T00:00:00Z');
    const records: DailyNutritionRecord[] = [rec('2025-08-18', 2000)];
    const series = buildTrendSeries(records, 'calories', { weeks: 4, target: 2200, now });
    expect(series.labels.length).toBe(4);
    expect(series.data.length).toBe(4);
    expect(series.target).toBe(2200);
  });
});
