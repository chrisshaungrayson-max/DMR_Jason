import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyRecord, FoodItem } from '@/app/types/nutrition';

const useNutritionStore = () => {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const storedRecords = await AsyncStorage.getItem('nutritionRecords');
        if (storedRecords) {
          setRecords(JSON.parse(storedRecords));
        }
      } catch (error) {
        console.error('Failed to load records from storage', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRecords();
  }, []);

  useEffect(() => {
    const saveRecords = async () => {
      try {
        await AsyncStorage.setItem('nutritionRecords', JSON.stringify(records));
      } catch (error) {
        console.error('Failed to save records to storage', error);
      }
    };
    if (!isLoading) {
      saveRecords();
    }
  }, [records, isLoading]);

  const addRecord = (date: string, foodItems: FoodItem[]) => {
    const totalCalories = foodItems.reduce((sum, item) => sum + item.calories * item.quantity, 0);
    const totalProtein = foodItems.reduce((sum, item) => sum + item.protein * item.quantity, 0);
    const totalCarbs = foodItems.reduce((sum, item) => sum + item.carbs * item.quantity, 0);
    const totalFat = foodItems.reduce((sum, item) => sum + item.fat * item.quantity, 0);

    const newRecord: DailyRecord = {
      id: Date.now().toString(),
      date,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      foodItems,
    };

    setRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.date === date);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newRecord;
        return updated;
      }
      return [newRecord, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  const getRecordByDate = (date: string) => {
    return records.find((record) => record.date === date);
  };

  return {
    records,
    addRecord,
    getRecordByDate,
    isLoading,
  };
};

export const [NutritionContext, useNutrition] = createContextHook(useNutritionStore);

export default useNutritionStore;
