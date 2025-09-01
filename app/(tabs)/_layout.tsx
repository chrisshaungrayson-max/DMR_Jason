import { Tabs, useRouter } from "expo-router";
import { LayoutDashboard, User, Settings, History } from "lucide-react-native";
import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";

import Colors from "@/constants/colors";
import { useUser } from "@/store/user-store";
import LogFoodOverlayModal from "@/app/components/LogFoodOverlayModal";
import TDEEActionModal from "@/app/components/TDEEActionModal";
import FloatingActionButton from "@/app/components/FloatingActionButton";
import type { FoodAnalysisResult } from "@/services/foodAnalysis";

export default function TabLayout() {
  const router = useRouter();
  const { colorScheme } = useUser();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  
  const [showActionModal, setShowActionModal] = useState(false);
  const [showFoodLog, setShowFoodLog] = useState(false);
  
  const handleLogFood = async (food: string, date: Date, nutritionInfo?: FoodAnalysisResult) => {
    try {
      if (!nutritionInfo) {
        Alert.alert('Error', 'Could not analyze food. The analysis service may be down.');
        return;
      }

      router.push({
        pathname: '/results',
        params: {
          macros: JSON.stringify(nutritionInfo),
          date: date.toISOString(),
          foodList: food,
        },
      });
    } catch (err) {
      console.error('Error processing food entry from modal:', err);
      Alert.alert('Error', 'Failed to analyze food entry. Please try again.');
    }
  };

  const handleCalculateTDEE = () => {
    // Navigate to TDEE calculator input screen
    router.push('/tdee-input');
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
    
    <FloatingActionButton
      onPress={() => setShowActionModal(true)}
      visible={true}
    />
    
    <TDEEActionModal
      visible={showActionModal}
      onClose={() => setShowActionModal(false)}
      onLogFood={() => setShowFoodLog(true)}
      onCalculateTDEE={handleCalculateTDEE}
    />
    
    <LogFoodOverlayModal
      visible={showFoodLog}
      onClose={() => setShowFoodLog(false)}
      onLogFood={handleLogFood}
    />
    </>
  );
}