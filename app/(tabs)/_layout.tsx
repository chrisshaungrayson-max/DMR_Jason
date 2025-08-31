import { Tabs, useRouter } from "expo-router";
import { LayoutDashboard, Plus, User, Settings, History } from "lucide-react-native";
import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";

import Colors from "@/constants/colors";
import { useUser } from "@/store/user-store";
import FoodLogPopover from "@/app/components/FoodLogPopover";
import TDEEActionModal from "@/app/components/TDEEActionModal";
import type { FoodAnalysisResult } from "@/services/foodAnalysis";

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
        name="log-food"
        options={{
          title: "",
          tabBarIcon: () => (
            <Pressable 
              style={styles.addButtonContainer}
              onPress={() => setShowActionModal(true)}
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
    
    <TDEEActionModal
      visible={showActionModal}
      onClose={() => setShowActionModal(false)}
      onLogFood={() => setShowFoodLog(true)}
      onCalculateTDEE={handleCalculateTDEE}
    />
    
    <FoodLogPopover
      visible={showFoodLog}
      onClose={() => setShowFoodLog(false)}
      onLogFood={handleLogFood}
    />
    </>
  );
}