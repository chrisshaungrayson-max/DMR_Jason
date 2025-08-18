import { describe, it, expect } from 'vitest';
import { validateGoalInput } from '@/store/goals-helpers';

const start = '2025-01-01';

describe('validateGoalInput', () => {
  it('rejects missing end date', () => {
    const res = validateGoalInput({
      goalType: 'calorie_streak',
      startDateISO: start,
      endDateISO: undefined,
      fields: { calStreakDays: '14' },
    });
    expect(res.ok).toBe(false);
  });

  it('rejects end date before start', () => {
    const res = validateGoalInput({
      goalType: 'calorie_streak',
      startDateISO: '2025-01-10',
      endDateISO: '2025-01-01',
      fields: { calStreakDays: '14' },
    });
    expect(res.ok).toBe(false);
  });

  it('validates body fat range 5-45', () => {
    expect(
      validateGoalInput({ goalType: 'body_fat', startDateISO: start, endDateISO: '2025-02-01', fields: { bodyFatTargetPct: '4' } })
        .ok
    ).toBe(false);
    expect(
      validateGoalInput({ goalType: 'body_fat', startDateISO: start, endDateISO: '2025-02-01', fields: { bodyFatTargetPct: '15' } })
        .ok
    ).toBe(true);
  });

  it('validates weight target and returns params', () => {
    const bad = validateGoalInput({
      goalType: 'weight', startDateISO: start, endDateISO: '2025-02-01', fields: { weightTargetKg: '500', weightDirection: 'down' }
    });
    expect(bad.ok).toBe(false);
    const good = validateGoalInput({
      goalType: 'weight', startDateISO: start, endDateISO: '2025-02-01', fields: { weightTargetKg: '80', weightDirection: 'up' }
    });
    expect(good.ok).toBe(true);
    if (good.ok) {
      expect(good.params).toEqual({ targetWeightKg: 80, direction: 'up' });
    }
  });

  it('validates lean mass gain', () => {
    const bad = validateGoalInput({ goalType: 'lean_mass_gain', startDateISO: start, endDateISO: '2025-02-01', fields: { leanGainKg: '0' } });
    expect(bad.ok).toBe(false);
    const good = validateGoalInput({ goalType: 'lean_mass_gain', startDateISO: start, endDateISO: '2025-02-01', fields: { leanGainKg: '2' } });
    expect(good.ok).toBe(true);
  });

  it('validates calorie streak with custom range', () => {
    const badPos = validateGoalInput({
      goalType: 'calorie_streak', startDateISO: start, endDateISO: '2025-02-01', fields: { calStreakDays: '14', calBasis: 'custom', calMin: '-1', calMax: '2000' }
    });
    expect(badPos.ok).toBe(false);
    const badOrder = validateGoalInput({
      goalType: 'calorie_streak', startDateISO: start, endDateISO: '2025-02-01', fields: { calStreakDays: '14', calBasis: 'custom', calMin: '2200', calMax: '2000' }
    });
    expect(badOrder.ok).toBe(false);
    const good = validateGoalInput({
      goalType: 'calorie_streak', startDateISO: start, endDateISO: '2025-02-01', fields: { calStreakDays: '14', calBasis: 'custom', calMin: '1800', calMax: '2200' }
    });
    expect(good.ok).toBe(true);
    if (good.ok) {
      expect(good.params).toEqual({ targetDays: 14, basis: 'custom', minCalories: 1800, maxCalories: 2200 });
    }
  });

  it('validates protein streak grams and days', () => {
    const badG = validateGoalInput({ goalType: 'protein_streak', startDateISO: start, endDateISO: '2025-02-01', fields: { proteinPerDay: '10', proteinDays: '14' } });
    expect(badG.ok).toBe(false);
    const badD = validateGoalInput({ goalType: 'protein_streak', startDateISO: start, endDateISO: '2025-02-01', fields: { proteinPerDay: '140', proteinDays: '0' } });
    expect(badD.ok).toBe(false);
    const good = validateGoalInput({ goalType: 'protein_streak', startDateISO: start, endDateISO: '2025-02-01', fields: { proteinPerDay: '140', proteinDays: '14' } });
    expect(good.ok).toBe(true);
    if (good.ok) {
      expect(good.params).toEqual({ gramsPerDay: 140, targetDays: 14 });
    }
  });
});
