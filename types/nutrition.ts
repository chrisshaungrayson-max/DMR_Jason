export interface NutritionItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionTotal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionEntry {
  date: string;
  // ISO timestamp for when the entry was logged
  timestamp: string;
  // Auto-categorized meal type based on timestamp hour
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodList: string;
  items: NutritionItem[];
  total: NutritionTotal;
}

export interface DailyNutritionRecord {
  date: string;
  total: NutritionTotal;
  entries: NutritionEntry[];
}