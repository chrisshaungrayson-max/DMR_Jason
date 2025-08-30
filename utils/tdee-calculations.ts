import { TDEECalculation, FitnessGoal, MacroTargets, ACTIVITY_LEVELS, FITNESS_GOALS } from '@/types/tdee';

/**
 * Calculate BMR using Harris-Benedict equation
 * @param sex - 'male' | 'female' | 'other'
 * @param age - age in years
 * @param weight - weight in kg
 * @param height - height in cm
 * @returns BMR in calories per day
 */
export function calculateBMR(
  sex: 'male' | 'female' | 'other',
  age: number,
  weight: number,
  height: number
): number {
  // Harris-Benedict equations (revised)
  if (sex === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else if (sex === 'female') {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  } else {
    // For 'other', use average of male and female formulas
    const maleBMR = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    const femaleBMR = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    return (maleBMR + femaleBMR) / 2;
  }
}

/**
 * Calculate TDEE by applying activity level multiplier to BMR
 * @param bmr - Basal Metabolic Rate
 * @param activityLevel - activity level key
 * @returns TDEE in calories per day
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete'
): number {
  const activityInfo = ACTIVITY_LEVELS.find(level => level.key === activityLevel);
  if (!activityInfo) {
    throw new Error(`Invalid activity level: ${activityLevel}`);
  }
  
  return Math.round(bmr * activityInfo.multiplier);
}

/**
 * Calculate target calories based on TDEE and fitness goals
 * @param tdee - Total Daily Energy Expenditure
 * @param goals - array of selected fitness goals
 * @returns target calories per day
 */
export function calculateTargetCalories(tdee: number, goals: FitnessGoal[]): number {
  if (goals.length === 0) {
    return tdee; // No goals selected, return maintenance calories
  }
  
  if (goals.length === 1) {
    const goalInfo = FITNESS_GOALS.find(g => g.key === goals[0]);
    if (!goalInfo) {
      throw new Error(`Invalid fitness goal: ${goals[0]}`);
    }
    return Math.round(tdee + goalInfo.calorieAdjustment);
  }
  
  // Multiple goals: calculate weighted average of adjustments
  const totalAdjustment = goals.reduce((sum, goal) => {
    const goalInfo = FITNESS_GOALS.find(g => g.key === goal);
    if (!goalInfo) {
      throw new Error(`Invalid fitness goal: ${goal}`);
    }
    return sum + goalInfo.calorieAdjustment;
  }, 0);
  
  const averageAdjustment = totalAdjustment / goals.length;
  return Math.round(tdee + averageAdjustment);
}

/**
 * Calculate macro targets based on target calories and fitness goals
 * @param targetCalories - target calories per day
 * @param goals - array of selected fitness goals
 * @returns macro targets in grams and percentages
 */
export function calculateMacroTargets(targetCalories: number, goals: FitnessGoal[]): MacroTargets {
  let macroRatios = { protein: 25, carbs: 45, fat: 30 }; // Default ratios
  
  if (goals.length === 1) {
    const goalInfo = FITNESS_GOALS.find(g => g.key === goals[0]);
    if (goalInfo) {
      macroRatios = goalInfo.macroRatios;
    }
  } else if (goals.length > 1) {
    // Multiple goals: calculate weighted average of macro ratios
    const totalRatios = goals.reduce((sum, goal) => {
      const goalInfo = FITNESS_GOALS.find(g => g.key === goal);
      if (goalInfo) {
        return {
          protein: sum.protein + goalInfo.macroRatios.protein,
          carbs: sum.carbs + goalInfo.macroRatios.carbs,
          fat: sum.fat + goalInfo.macroRatios.fat
        };
      }
      return sum;
    }, { protein: 0, carbs: 0, fat: 0 });
    
    macroRatios = {
      protein: Math.round(totalRatios.protein / goals.length),
      carbs: Math.round(totalRatios.carbs / goals.length),
      fat: Math.round(totalRatios.fat / goals.length)
    };
  }
  
  // Calculate grams based on calories and ratios
  // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
  const proteinCalories = (targetCalories * macroRatios.protein) / 100;
  const carbsCalories = (targetCalories * macroRatios.carbs) / 100;
  const fatCalories = (targetCalories * macroRatios.fat) / 100;
  
  return {
    protein: {
      grams: Math.round(proteinCalories / 4),
      percentage: macroRatios.protein
    },
    carbs: {
      grams: Math.round(carbsCalories / 4),
      percentage: macroRatios.carbs
    },
    fat: {
      grams: Math.round(fatCalories / 9),
      percentage: macroRatios.fat
    }
  };
}

/**
 * Convert weight from pounds to kilograms
 * @param pounds - weight in pounds
 * @returns weight in kilograms
 */
export function poundsToKg(pounds: number): number {
  return pounds * 0.453592;
}

/**
 * Convert weight from kilograms to pounds
 * @param kg - weight in kilograms
 * @returns weight in pounds
 */
export function kgToPounds(kg: number): number {
  return kg * 2.20462;
}

/**
 * Convert height from feet/inches to centimeters
 * @param feet - feet portion of height
 * @param inches - inches portion of height
 * @returns height in centimeters
 */
export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = (feet * 12) + inches;
  return totalInches * 2.54;
}

/**
 * Convert height from centimeters to feet and inches
 * @param cm - height in centimeters
 * @returns object with feet and inches
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

/**
 * Parse height string in various formats to centimeters
 * @param heightStr - height string (e.g., "5'10\"", "175", "175cm")
 * @param useMetric - whether input is expected to be metric
 * @returns height in centimeters
 */
export function parseHeight(heightStr: string, useMetric: boolean): number {
  const cleaned = heightStr.trim().toLowerCase();
  
  // If metric, expect cm
  if (useMetric) {
    const cmMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*cm?/);
    if (cmMatch) {
      return parseFloat(cmMatch[1]);
    }
    // If just a number, assume cm
    const numMatch = cleaned.match(/^\d+(?:\.\d+)?$/);
    if (numMatch) {
      return parseFloat(cleaned);
    }
  } else {
    // Imperial: look for feet'inches" format
    const feetInchMatch = cleaned.match(/(\d+)['′]\s*(\d+(?:\.\d+)?)[\"″]?/);
    if (feetInchMatch) {
      const feet = parseInt(feetInchMatch[1]);
      const inches = parseFloat(feetInchMatch[2]);
      return feetInchesToCm(feet, inches);
    }
    
    // Just inches
    const inchMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:in|inches?|\"″)?$/);
    if (inchMatch) {
      const inches = parseFloat(inchMatch[1]);
      return inches * 2.54;
    }
  }
  
  throw new Error(`Unable to parse height: ${heightStr}`);
}

/**
 * Parse weight string to kilograms
 * @param weightStr - weight string (e.g., "150", "150lbs", "70kg")
 * @param useMetric - whether input is expected to be metric
 * @returns weight in kilograms
 */
export function parseWeight(weightStr: string, useMetric: boolean): number {
  const cleaned = weightStr.trim().toLowerCase();
  
  // Look for explicit units first
  const kgMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kgMatch) {
    return parseFloat(kgMatch[1]);
  }
  
  const lbMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)/);
  if (lbMatch) {
    return poundsToKg(parseFloat(lbMatch[1]));
  }
  
  // No explicit units, use metric preference
  const numMatch = cleaned.match(/^\d+(?:\.\d+)?$/);
  if (numMatch) {
    const value = parseFloat(cleaned);
    return useMetric ? value : poundsToKg(value);
  }
  
  throw new Error(`Unable to parse weight: ${weightStr}`);
}
