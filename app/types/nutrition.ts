export interface IFoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
}

export interface IDailyRecord {
  id: string;
  date: string; // ISO date string, e.g., '2025-08-02'
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  foodItems: IFoodItem[];
}

// For backward compatibility
export type FoodItem = IFoodItem;
export type DailyRecord = IDailyRecord;

const NutritionTypes = {
  FoodItem: {} as IFoodItem,
  DailyRecord: {} as IDailyRecord,
};

export default NutritionTypes;
