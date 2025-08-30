export interface TDEECalculation {
  // User inputs
  name: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  bodyFatPercentage?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';
  goals: FitnessGoal[];
  
  // Calculated values
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: MacroTargets;
  
  // Metadata
  calculatedAt: string;
  useMetricUnits: boolean;
}

export interface MacroTargets {
  protein: {
    grams: number;
    percentage: number;
  };
  carbs: {
    grams: number;
    percentage: number;
  };
  fat: {
    grams: number;
    percentage: number;
  };
}

export type FitnessGoal = 
  | 'lose_weight'
  | 'lose_body_fat'
  | 'gain_lean_muscle'
  | 'maintain_weight'
  | 'improve_athletic_performance'
  | 'general_health';

export interface ActivityLevelInfo {
  key: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';
  label: string;
  description: string;
  multiplier: number;
}

export interface GoalInfo {
  key: FitnessGoal;
  label: string;
  description: string;
  calorieAdjustment: number; // calories to add/subtract from TDEE
  macroRatios: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface TDEEFormData {
  name: string;
  age: string;
  sex: 'male' | 'female' | 'other' | '';
  height: string;
  weight: string;
  bodyFatPercentage: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';
  goals: FitnessGoal[];
  useMetricUnits: boolean;
}

export interface TDEEResults {
  calculation: TDEECalculation;
  recommendations: {
    title: string;
    description: string;
    targetCalories: number;
    macros: MacroTargets;
  }[];
}

// Constants for activity levels
export const ACTIVITY_LEVELS: ActivityLevelInfo[] = [
  {
    key: 'sedentary',
    label: 'Sedentary',
    description: 'Little/no exercise',
    multiplier: 1.2
  },
  {
    key: 'light',
    label: 'Light Activity',
    description: '1-3 days/week',
    multiplier: 1.375
  },
  {
    key: 'moderate',
    label: 'Moderate Activity',
    description: '3-5 days/week',
    multiplier: 1.55
  },
  {
    key: 'heavy',
    label: 'Heavy Activity',
    description: '6-7 days/week',
    multiplier: 1.725
  },
  {
    key: 'athlete',
    label: 'Athlete-Level',
    description: '2x training/day',
    multiplier: 1.9
  }
];

// Constants for fitness goals
export const FITNESS_GOALS: GoalInfo[] = [
  {
    key: 'lose_weight',
    label: 'Lose Weight',
    description: 'Create caloric deficit for weight loss',
    calorieAdjustment: -500,
    macroRatios: { protein: 40, carbs: 30, fat: 30 }
  },
  {
    key: 'lose_body_fat',
    label: 'Lose Body Fat',
    description: 'Reduce body fat while preserving muscle',
    calorieAdjustment: -400,
    macroRatios: { protein: 40, carbs: 30, fat: 30 }
  },
  {
    key: 'gain_lean_muscle',
    label: 'Gain Lean Muscle',
    description: 'Build muscle with minimal fat gain',
    calorieAdjustment: 400,
    macroRatios: { protein: 30, carbs: 40, fat: 30 }
  },
  {
    key: 'maintain_weight',
    label: 'Maintain Weight',
    description: 'Maintain current weight and composition',
    calorieAdjustment: 0,
    macroRatios: { protein: 25, carbs: 45, fat: 30 }
  },
  {
    key: 'improve_athletic_performance',
    label: 'Improve Athletic Performance',
    description: 'Optimize nutrition for performance',
    calorieAdjustment: 250,
    macroRatios: { protein: 20, carbs: 50, fat: 30 }
  },
  {
    key: 'general_health',
    label: 'General Health',
    description: 'Maintain overall health and wellness',
    calorieAdjustment: 0,
    macroRatios: { protein: 25, carbs: 45, fat: 30 }
  }
];
