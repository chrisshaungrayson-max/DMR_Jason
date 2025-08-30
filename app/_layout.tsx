import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NutritionProvider } from "@/store/nutrition-store";
import { UserContext, useUser } from "@/store/user-store";
import { StatusBar } from "expo-status-bar";
import { FoodsProvider } from "@/store/foods-store";
import { GoalsContext } from "@/store/goals-store";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { colorScheme } = useUser();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="phone-verification" options={{ headerShown: false }} />
        <Stack.Screen name="results" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

function AppProviders() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserContext>
        <GoalsContext>
          <NutritionProvider>
            <FoodsProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </FoodsProvider>
          </NutritionProvider>
        </GoalsContext>
      </UserContext>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  return <AppProviders />;
}