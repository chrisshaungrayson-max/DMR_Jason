import { describe, it, expect } from 'vitest';
import { buildProteinCompliance, toWeeklyGrid } from '@/utils/streak';
import type { DailyNutritionRecord } from '@/types/nutrition';

function rec(date: string, protein: number): DailyNutritionRecord {
  return {
    date,
    total: { calories: 0, protein, carbs: 0, fat: 0 },
    entries: [],
  };
}

describe('streak utilities', () => {
  it('buildProteinCompliance marks days compliant based on gramsPerDay', () => {
    const now = new Date('2025-08-18T00:00:00Z'); // Monday
    const records: DailyNutritionRecord[] = [
      rec('2025-08-16', 120), // Sat
      rec('2025-08-17', 80),  // Sun
      rec('2025-08-18', 150), // Mon
    ];
    const points = buildProteinCompliance(records, 100, 3, now);
    expect(points.map(p => p.compliant)).toEqual([true, false, true]);
  });

  it('toWeeklyGrid pads first week to start on Monday and groups by 7', () => {
    const points = [
      { dateISO: '2025-08-12', compliant: true },  // Tue
      { dateISO: '2025-08-13', compliant: false }, // Wed
      { dateISO: '2025-08-14', compliant: true },  // Thu
    ];
    const grid = toWeeklyGrid(points);
    expect(grid.length).toBe(1);
    // First two pads for Mon/Tue? For Tue start, firstDow=1 => one pad
    // But our mapping sets Mon=0, so Tue => 1 pad
    expect(grid[0].length).toBe(4); // 1 pad + 3 values
    expect(grid[0][0]).toBeNull();
    expect(grid[0].slice(1)).toEqual([true, false, true]);
  });
});
