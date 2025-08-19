import { describe, it, expect, vi } from 'vitest';
import { computeAvgDailyMacros, buildIdealComparison } from '@/utils/idealComparison';
import type { DailyNutritionRecord } from '@/types/nutrition';
import type { UserInfo } from '@/types/user';

function rec(date: string, totals: { calories: number; protein: number; carbs: number; fat: number }): DailyNutritionRecord {
  return { date, total: totals, entries: [] } as any;
}

describe('ideal comparison utils', () => {
  it('computeAvgDailyMacros averages only within window and only counted days', () => {
    const now = new Date('2025-08-18T00:00:00Z');
    const records: DailyNutritionRecord[] = [
      rec('2025-08-10', { calories: 1000, protein: 50, carbs: 100, fat: 30 }), // outside 7-day window
      rec('2025-08-16', { calories: 2400, protein: 160, carbs: 220, fat: 70 }),
      rec('2025-08-18', { calories: 2000, protein: 140, carbs: 180, fat: 60 }),
    ];
    const out = computeAvgDailyMacros(records, 3, now);
    // Window covers 16,17,18; only 16 and 18 exist
    expect(out.daysCounted).toBe(2);
    expect(out.calories).toBe((2400 + 2000) / 2);
    expect(out.grams.protein).toBe((160 + 140) / 2);
  });

  it('buildIdealComparison returns deltas vs ideal', () => {
    const now = new Date('2025-08-18T00:00:00Z');
    const user: UserInfo = {
      name: 'T', age: '30', sex: 'male', height: "5'10\"", weight: '180', email: 'x@example.com', date: '2025-01-01', useMetricUnits: false, activityLevel: 'moderate'
    };

    // Simplify test by spying on ideal macros function if needed; here we just use actual calc
    const records: DailyNutritionRecord[] = [
      rec('2025-08-18', { calories: 2000, protein: 140, carbs: 180, fat: 60 }),
      rec('2025-08-17', { calories: 2200, protein: 150, carbs: 190, fat: 70 }),
      rec('2025-08-16', { calories: 2100, protein: 145, carbs: 185, fat: 65 }),
    ];

    const cmp = buildIdealComparison(user, records, 3, now);
    expect(cmp.daysCounted).toBe(3);
    expect(typeof cmp.idealCalories).toBe('number');
    expect(typeof cmp.idealGrams.protein).toBe('number');
    expect(typeof cmp.deltaCalories).toBe('number');
  });
});
