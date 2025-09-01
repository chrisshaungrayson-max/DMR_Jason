import { UserInfo } from '@/types/user';

// Default macro split percentages
export const DEFAULT_MACRO_SPLIT = { protein: 30, carbs: 40, fat: 30 } as const;

// Caloric densities (kcal per gram)
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

// Fallback average daily calories by sex
export function getFallbackCaloriesBySex(sex: UserInfo['sex']): number {
  if (sex === 'male') return 2500;
  if (sex === 'female') return 2000;
  return 2250; // 'other' or empty
}

// Compute TDEE using Mifflin–St Jeor and activity level multipliers
export function computeTDEE(user: UserInfo): number {
  const activityMultipliers: Record<NonNullable<UserInfo['activityLevel']>, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    heavy: 1.725,
    athlete: 1.9,
  };
  const activityLevel = user.activityLevel || 'moderate';
  const multiplier = activityMultipliers[activityLevel];

  let heightCm = 0;
  let weightKg = 0;

  if (user.useMetricUnits) {
    heightCm = parseFloat(user.height) || 170;
    weightKg = parseFloat(user.weight) || 70;
  } else {
    const heightMatch = user.height.match(/([0-9]+)'([0-9]+)"?/);
    if (heightMatch) {
      const feet = parseInt(heightMatch[1]);
      const inches = parseInt(heightMatch[2]);
      heightCm = feet * 30.48 + inches * 2.54;
    } else {
      heightCm = 170;
    }
    weightKg = (parseFloat(user.weight) || 160) / 2.205;
  }

  const age = parseInt(user.age) || 30;

  let bmr = 0;
  if (user.sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  return Math.round(bmr * multiplier);
}

export function getIdealCalories(user: UserInfo): number {
  // Prefer computed TDEE; if inputs are missing, computeTDEE still returns a sensible default.
  const tdee = computeTDEE(user);
  // If for some reason tdee is falsy, fallback by sex
  return tdee || getFallbackCaloriesBySex(user.sex);
}

export type MacroSplit = { protein: number; carbs: number; fat: number };
export type MacroGrams = { protein: number; carbs: number; fat: number };

export function splitToGrams(calories: number, split: MacroSplit): MacroGrams {
  const pKcal = (split.protein / 100) * calories;
  const cKcal = (split.carbs / 100) * calories;
  const fKcal = (split.fat / 100) * calories;
  return {
    protein: Math.ceil(pKcal / KCAL_PER_GRAM.protein),
    carbs: Math.ceil(cKcal / KCAL_PER_GRAM.carbs),
    fat: Math.ceil(fKcal / KCAL_PER_GRAM.fat),
  };
}

export function gramsToPercents(grams: MacroGrams): MacroSplit {
  const pKcal = grams.protein * KCAL_PER_GRAM.protein;
  const cKcal = grams.carbs * KCAL_PER_GRAM.carbs;
  const fKcal = grams.fat * KCAL_PER_GRAM.fat;
  const total = pKcal + cKcal + fKcal;
  if (!total) return { ...DEFAULT_MACRO_SPLIT };
  return {
    protein: Math.round((pKcal / total) * 100),
    carbs: Math.round((cKcal / total) * 100),
    fat: Math.max(0, 100 - (Math.round((pKcal / total) * 100) + Math.round((cKcal / total) * 100))),
  };
}

export function getIdealMacrosForUser(user: UserInfo, split: MacroSplit = DEFAULT_MACRO_SPLIT): {
  calories: number;
  grams: MacroGrams;
  percents: MacroSplit;
} {
  const calories = getIdealCalories(user);
  const grams = splitToGrams(calories, split);
  const percents = gramsToPercents(grams);
  return { calories, grams, percents };
}

// ---- Task 3.1: helpers with precedence (Target Calories > TDEE > gender fallback) ----
export type CalorieSource = 'input' | 'tdee' | 'fallback';

export function resolveCalorieTarget(user: UserInfo, targetCalories?: number): { calories: number; source: CalorieSource } {
  if (typeof targetCalories === 'number' && isFinite(targetCalories) && targetCalories > 0) {
    return { calories: Math.round(targetCalories), source: 'input' };
  }
  const tdee = computeTDEE(user);
  if (tdee && isFinite(tdee) && tdee > 0) {
    return { calories: tdee, source: 'tdee' };
  }
  return { calories: getFallbackCaloriesBySex(user.sex), source: 'fallback' };
}

export function getMacroTargetsForUser(
  user: UserInfo,
  options?: { targetCalories?: number; split?: MacroSplit }
): {
  calories: number;
  grams: MacroGrams;
  percents: MacroSplit;
  split: MacroSplit;
  source: CalorieSource;
} {
  const { targetCalories, split = DEFAULT_MACRO_SPLIT } = options ?? {};
  const { calories, source } = resolveCalorieTarget(user, targetCalories);
  const grams = splitToGrams(calories, split);
  const percents = gramsToPercents(grams);
  return { calories, grams, percents, split, source };
}

// Conversions between grams and calories (Task 3.3)
export function gramsToCalories(grams: MacroGrams): number {
  return (
    grams.protein * KCAL_PER_GRAM.protein +
    grams.carbs * KCAL_PER_GRAM.carbs +
    grams.fat * KCAL_PER_GRAM.fat
  );
}

export function caloriesToGrams(calories: number, split: MacroSplit): MacroGrams {
  return splitToGrams(calories, split);
}
