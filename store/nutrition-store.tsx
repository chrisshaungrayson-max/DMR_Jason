import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { UserInfo } from '@/types/user';
import { NutritionEntry, DailyNutritionRecord } from '@/types/nutrition';
import { categorizeMealByHour } from '@/utils/datetime';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const [NutritionProvider, useNutritionStore] = createContextHook(() => {
  const [foodItems, setFoodItems] = useState<string[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyNutritionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    age: '',
    sex: '',
    height: '',
    weight: '',
    profilePicture: undefined,
    phoneNumber: '',
    email: '',
    date: new Date().toISOString().split('T')[0], // Default to today's date
    useMetricUnits: true,
    activityLevel: 'sedentary',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const userData = await AsyncStorage.getItem('userInfo');
        if (userData) {
          setUserInfo(JSON.parse(userData));
        }
        const recordsData = await AsyncStorage.getItem('dailyRecords');
        if (recordsData) {
          const parsed: DailyNutritionRecord[] = JSON.parse(recordsData);
          // Normalize legacy entries to include timestamp and mealType
          const normalized = parsed.map((rec) => {
            const newEntries = rec.entries.map((entry) => {
              const hasTimestamp = (entry as any).timestamp;
              const hasMealType = (entry as any).mealType;
              let timestamp = hasTimestamp ? (entry as any).timestamp as string : '';
              if (!timestamp) {
                // Synthesize a midday local timestamp for legacy entries
                try {
                  const [y, m, d] = rec.date.split('-').map((n) => parseInt(n, 10));
                  const dt = new Date(y, (m - 1), d, 12, 0, 0, 0);
                  timestamp = dt.toISOString();
                } catch {
                  timestamp = new Date().toISOString();
                }
              }
              const mealType = hasMealType ? (entry as any).mealType : categorizeMealByHour(timestamp);
              return {
                ...entry,
                timestamp,
                mealType,
              } as NutritionEntry;
            });
            return { ...rec, entries: newEntries } as DailyNutritionRecord;
          });
          setDailyRecords(normalized);
          // Persist normalized structure
          try { await AsyncStorage.setItem('dailyRecords', JSON.stringify(normalized)); } catch {}
        }
      } catch (error) {
        console.error('Failed to load data from storage', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveUserInfo = async () => {
      try {
        await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      } catch (error) {
        console.error('Failed to save user info to storage', error);
      }
    };
    saveUserInfo();
  }, [userInfo]);

  useEffect(() => {
    const saveRecords = async () => {
      try {
        await AsyncStorage.setItem('dailyRecords', JSON.stringify(dailyRecords));
      } catch (error) {
        console.error('Failed to save records to storage', error);
      }
    };
    saveRecords();
  }, [dailyRecords]);

  const addNutritionEntry = (entry: NutritionEntry) => {
    setDailyRecords(prev => {
      const date = entry.date.split('T')[0];
      const existingRecordIndex = prev.findIndex(record => record.date === date);
      if (existingRecordIndex >= 0) {
        const updatedRecords = [...prev];
        updatedRecords[existingRecordIndex].entries.push(entry);
        updatedRecords[existingRecordIndex].total = updatedRecords[existingRecordIndex].entries.reduce(
          (sum, e) => ({
            calories: sum.calories + (e.total?.calories || 0),
            protein: sum.protein + (e.total?.protein || 0),
            carbs: sum.carbs + (e.total?.carbs || 0),
            fat: sum.fat + (e.total?.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        return updatedRecords;
      } else {
        const newRecord: DailyNutritionRecord = {
          date,
          total: {
            calories: entry.total?.calories || 0,
            protein: entry.total?.protein || 0,
            carbs: entry.total?.carbs || 0,
            fat: entry.total?.fat || 0,
          },
          entries: [entry],
        };
        return [...prev, newRecord];
      }
    });
  };

  const clearRecords = () => {
    setDailyRecords([]);
  };

  return {
    foodItems,
    setFoodItems,
    userInfo,
    setUserInfo,
    dailyRecords,
    addNutritionEntry,
    clearRecords,
    isLoading
  };
});