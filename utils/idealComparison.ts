import { subDays } from 'date-fns';
import type { DailyNutritionRecord } from '@/types/nutrition';
import type { UserInfo } from '@/types/user';
import { getIdealMacrosForUser } from '@/lib/idealMacros';

export type MacroKey = 'protein' | 'carbs' | 'fat';
export type MacroGrams = { protein: number; carbs: number; fat: number };

export type IdealComparison = {
  idealCalories: number;
  idealGrams: MacroGrams;
  actualAvgCalories: number; // daily average over the window
  actualAvgGrams: MacroGrams; // daily average over the window
  deltaCalories: number; // actual - ideal
  deltaGrams: MacroGrams; // actual - ideal per macro
  daysCounted: number; // how many days had records in the window
};

/**
 * Compute average daily macros over the last `days` days (inclusive), using only
 * days that have a `DailyNutritionRecord`. Returns { calories, grams } averages.
 */
export function computeAvgDailyMacros(
  records: DailyNutritionRecord[],
  days: number = 7,
  now: Date = new Date()
): { calories: number; grams: MacroGrams; daysCounted: number } {
  if (!Array.isArray(records) || records.length === 0) {
    return { calories: 0, grams: { protein: 0, carbs: 0, fat: 0 }, daysCounted: 0 };
  }
  const end = now;
  const start = subDays(end, days - 1);
  // Normalize to YYYY-MM-DD string bounds to avoid timezone issues
  const startISO = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())).toISOString().slice(0, 10);
  const endISO = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())).toISOString().slice(0, 10);

  let cals = 0;
  let p = 0;
  let c = 0;
  let f = 0;
  let counted = 0;

  for (const rec of records) {
    if (!rec?.date) continue;
    const dISO = rec.date; // expected 'YYYY-MM-DD'
    if (typeof dISO !== 'string' || dISO.length < 10) continue;
    if (dISO < startISO || dISO > endISO) continue;
    cals += rec.total.calories ?? 0;
    p += rec.total.protein ?? 0;
    c += rec.total.carbs ?? 0;
    f += rec.total.fat ?? 0;
    counted += 1;
  }

  if (counted === 0) {
    return { calories: 0, grams: { protein: 0, carbs: 0, fat: 0 }, daysCounted: 0 };
  }
  return {
    calories: cals / counted,
    grams: { protein: p / counted, carbs: c / counted, fat: f / counted },
    daysCounted: counted,
  };
}

/**
 * Build comparison between user's ideal macros and actual average over the last week.
 */
export function buildIdealComparison(
  user: UserInfo,
  records: DailyNutritionRecord[],
  days: number = 7,
  now: Date = new Date()
): IdealComparison {
  const ideal = getIdealMacrosForUser(user);
  const actual = computeAvgDailyMacros(records, days, now);

  const deltaCalories = actual.calories - ideal.calories;
  const deltaGrams: MacroGrams = {
    protein: actual.grams.protein - ideal.grams.protein,
    carbs: actual.grams.carbs - ideal.grams.carbs,
    fat: actual.grams.fat - ideal.grams.fat,
  };

  return {
    idealCalories: ideal.calories,
    idealGrams: ideal.grams,
    actualAvgCalories: actual.calories,
    actualAvgGrams: actual.grams,
    deltaCalories,
    deltaGrams,
    daysCounted: actual.daysCounted,
  };
}
