import { Tabs, useRouter } from "expo-router";
import { LayoutDashboard, Plus, User, Settings, History } from "lucide-react-native";
import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";

import Colors from "@/constants/colors";
import { useUser } from "@/store/user-store";
import FoodLogPopover from "@/app/components/FoodLogPopover";

export default function TabLayout() {
  const router = useRouter();
  const styles = StyleSheet.create({
    addButtonContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      height: 120,
      width: 120,
      top: -30,
      left: '50%',
      marginLeft: -60, // Half of the width to center it
      zIndex: 10,
    },
    addButton: {
      height: 89.6,
      width: 89.6,
      borderRadius: 56,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
  });
  const { colorScheme } = useUser();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  
  const [showFoodLog, setShowFoodLog] = useState(false);
  
  const handleLogFood = async (food: string, date: Date, nutritionInfo?: any) => {
    try {
      // If the modal already produced nutrition info, construct a results payload
      if (nutritionInfo) {
        const result = {
          items: [
            {
              name: nutritionInfo.food ?? food,
              calories: nutritionInfo.calories ?? 0,
              protein: nutritionInfo.protein ?? 0,
              carbs: nutritionInfo.carbs ?? 0,
              fat: nutritionInfo.fat ?? 0,
            },
          ],
          total: {
            calories: nutritionInfo.calories ?? 0,
            protein: nutritionInfo.protein ?? 0,
            carbs: nutritionInfo.carbs ?? 0,
            fat: nutritionInfo.fat ?? 0,
          },
        } as const;

        router.push({
          pathname: '/results',
          params: {
            macros: JSON.stringify(result),
            date: date.toISOString(),
            foodList: food,
          },
        });
        return;
      }

      // Otherwise, mirror the dashboard "Log Food" workflow using the open LLM endpoint
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content:
                'You are a nutrition expert. Analyze the following food items and provide a detailed macronutrient breakdown (calories, protein, carbs, fat) for each item and a total summary. Respond in a structured JSON format like: {"items": [{"name": "item", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}], "total": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}}',
            },
            {
              role: 'user',
              content: `Analyze the macronutrients for: ${food}`,
            },
          ],
        }),
      });

      const data = await response.json();
      let result: any;
      try {
        const content: string = data.completion || '';
        const jsonMatch = content.match(/{.*}/s);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('Failed to parse response from server');
      }

      router.push({
        pathname: '/results',
        params: {
          macros: JSON.stringify(result),
          date: date.toISOString(),
          foodList: food,
        },
      });
    } catch (err) {
      console.error('Error processing food entry from modal:', err);
      Alert.alert('Error', 'Failed to analyze food entry. Please try again.');
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.tint,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: { 
            backgroundColor: theme.cardBackground,
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
            justifyContent: 'space-between',
            position: 'relative',
          },
          headerStyle: { backgroundColor: theme.cardBackground },
          headerTintColor: theme.darkText,
          headerShown: true,
          tabBarItemStyle: { paddingVertical: 5 },
          tabBarLabelStyle: { fontSize: 12 }
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <History size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log-food"
        options={{
          title: "",
          tabBarIcon: () => (
            <Pressable 
              style={styles.addButtonContainer}
              onPress={() => setShowFoodLog(true)}
            >
              <View style={[styles.addButton, { backgroundColor: theme.tint, shadowColor: theme.tint + '80' }]}>
                <Plus size={32} color="white" />
              </View>
            </Pressable>
          ),
          tabBarItemStyle: { height: 60 }
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
    
    <FoodLogPopover
      visible={showFoodLog}
      onClose={() => setShowFoodLog(false)}
      onLogFood={handleLogFood}
    />
    </>
  );
}