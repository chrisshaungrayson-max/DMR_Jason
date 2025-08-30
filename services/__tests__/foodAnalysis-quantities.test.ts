import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock Supabase-dependent module before importing analyzeFoodEntry
vi.mock('@/services/foods', () => {
  return {
    searchFoodsByName: vi.fn(async () => []),
    upsertFood: vi.fn(async (x) => ({ id: 'mock', user_id: 'mock', ...x })),
  };
});

import { analyzeFoodEntry } from '@/services/foodAnalysis';

// These tests validate quantity parsing and fallback estimation multiplication.
// They intentionally rely on fallback estimation (no HF token in CI).

describe('analyzeFoodEntry quantity handling', () => {
  it('handles trailing half portion: "left over shredded chicken horfun (1/2)"', async () => {
    const input = 'left over shredded chicken horfun (1/2)';
    const res = await analyzeFoodEntry(input);
    expect(res.items.length).toBe(1);
    // Name should preserve original input text
    expect(res.items[0].name.toLowerCase()).toContain('chicken horfun');
    expect(res.items[0].name).toContain('(1/2)');
    // Estimate database has full portion horfun ~600 cal; half should be ~300 cal
    expect(res.items[0].calories).toBeGreaterThanOrEqual(280);
    expect(res.items[0].calories).toBeLessThanOrEqual(340);
  });

  it('multiplies pizza slices when using fallback estimate', async () => {
    const input = '2 slices of pizza';
    const res = await analyzeFoodEntry(input);
    expect(res.items.length).toBe(1);
    expect(res.items[0].name.toLowerCase()).toContain('pizza');
    // Per slice ~300 cal; two slices ~600 cal
    expect(res.items[0].calories).toBeGreaterThanOrEqual(560);
    expect(res.items[0].calories).toBeLessThanOrEqual(660);
  });

  it('preserves portion labels exactly as typed for simple items', async () => {
    const input = '1 scoop of protein powder with water';
    const res = await analyzeFoodEntry(input);
    expect(res.items.length).toBe(1);
    expect(res.items[0].name).toBe('1 scoop of protein powder with water');
  });

  it('handles mixed number quantities like "1 1/2 scoops whey"', async () => {
    const input = '1 1/2 scoops whey protein';
    const res = await analyzeFoodEntry(input);
    expect(res.items.length).toBe(1);
    // Name preserved
    expect(res.items[0].name.toLowerCase()).toContain('1 1/2');
    expect(res.items[0].name.toLowerCase()).toContain('whey');
    // Fallback per scoop ~120 kcal (protein powder). 1.5 scoops ~180 kcal.
    expect(res.items[0].calories).toBeGreaterThanOrEqual(150);
    expect(res.items[0].calories).toBeLessThanOrEqual(230);
  });

  it('handles simple fraction quantities like "3/4 cup rice"', async () => {
    const input = '3/4 cup rice';
    const res = await analyzeFoodEntry(input);
    expect(res.items.length).toBe(1);
    // Name preserved
    expect(res.items[0].name.toLowerCase()).toContain('3/4');
    expect(res.items[0].name.toLowerCase()).toContain('rice');
    // Typical 1 cup cooked rice ~200 kcal; 0.75 cup ~150 kcal.
    expect(res.items[0].calories).toBeGreaterThanOrEqual(120);
    expect(res.items[0].calories).toBeLessThanOrEqual(200);
  });
});
