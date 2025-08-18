import { useState, useEffect, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserInfo } from '@/types/user';
import { useColorScheme } from 'react-native';
import { DEFAULT_MACRO_SPLIT, getIdealMacrosForUser } from '@/lib/idealMacros';
import { getMyProfile, upsertMyProfile, Profile } from '@/services/profile';
import { getMyMacroTargets, upsertMyMacroTargets, MacroTargets } from '@/services/macros';

const defaultUser: UserInfo = {
  name: 'John Doe',
  age: '30',
  sex: 'male',
  height: '5\'10\"',
  weight: '175 lbs',
  email: 'john.doe@example.com',
  date: new Date().toISOString(),
  useMetricUnits: true,
  useDarkMode: false,
};

export const [UserContext, useUser] = createContextHook(() => {
  const systemColorScheme = useColorScheme();
  const [user, setUser] = useState<UserInfo>(defaultUser);
  const [isLoading, setIsLoading] = useState(true);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(systemColorScheme === 'dark' ? 'dark' : 'light');
  const [macroTargets, setMacroTargets] = useState<MacroTargets | null>(null);

  // Global derived: ideal macros based on server macro_targets when available; fallback to TDEE/fallback
  const ideal = useMemo(() => {
    if (macroTargets) {
      // Prefer computing percents from grams if present; else use splits
      const totalKcal = macroTargets.grams_protein * 4 + macroTargets.grams_carbs * 4 + macroTargets.grams_fat * 9;
      const percents = totalKcal > 0
        ? {
            protein: Math.round((macroTargets.grams_protein * 4 / totalKcal) * 100),
            carbs: Math.round((macroTargets.grams_carbs * 4 / totalKcal) * 100),
            fat: Math.round((macroTargets.grams_fat * 9 / totalKcal) * 100),
          }
        : {
            protein: macroTargets.split_protein,
            carbs: macroTargets.split_carbs,
            fat: macroTargets.split_fat,
          };
      return {
        calories: macroTargets.calories_basis,
        grams: {
          protein: macroTargets.grams_protein,
          carbs: macroTargets.grams_carbs,
          fat: macroTargets.grams_fat,
        },
        percents,
      };
    }
    return getIdealMacrosForUser(user, DEFAULT_MACRO_SPLIT);
  }, [user, macroTargets]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load local fallback first for fast UI
        const storedUser = await AsyncStorage.getItem('userProfile');
        if (storedUser) setUser(JSON.parse(storedUser));

        // Try hydrate from Supabase
        const profile = await getMyProfile();
        if (profile) {
          // Map Profile -> UserInfo (light mapping; keep existing fields if missing)
          const mapped: Partial<UserInfo> = {
            name: profile.name ?? user.name,
            sex: (profile.sex as any) ?? user.sex,
            age: profile.age != null ? String(profile.age) : user.age,
            height: profile.height ?? user.height,
            weight: profile.weight ?? user.weight,
            profilePicture: profile.avatar_url ?? user.profilePicture,
            useMetricUnits: profile.use_metric_units ?? user.useMetricUnits,
            useDarkMode: profile.use_dark_mode ?? user.useDarkMode,
          };
          const merged = { ...user, ...mapped };
          setUser(merged);
          await AsyncStorage.setItem('userProfile', JSON.stringify(merged));
        }

        const mt = await getMyMacroTargets();
        if (mt) setMacroTargets(mt);
      } catch (error) {
        console.error('Failed to hydrate from Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  const updateUser = async (updatedUser: Partial<UserInfo>) => {
    try {
      const newUserData = { ...user, ...updatedUser };
      setUser(newUserData);
      await AsyncStorage.setItem('userProfile', JSON.stringify(newUserData));
      // Also attempt to upsert to Supabase profile
      const profileUpdate: Partial<Profile> = {
        name: newUserData.name,
        sex: (newUserData.sex as any) ?? undefined,
        age: newUserData.age ? parseInt(String(newUserData.age), 10) : undefined,
        height: newUserData.height,
        weight: newUserData.weight,
        avatar_url: newUserData.profilePicture,
        use_metric_units: newUserData.useMetricUnits,
        use_dark_mode: newUserData.useDarkMode,
      };
      try {
        await upsertMyProfile(profileUpdate);
      } catch (e) {
        console.warn('Profile upsert failed (will retry later):', e);
      }
      return true;
    } catch (error) {
      console.error('Failed to update user data:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userProfile');
      setUser(defaultUser);
      return true;
    } catch (error) {
      console.error('Failed to logout:', error);
      return false;
    }
  };

  // Update color scheme when user preference changes
  useEffect(() => {
    if (user.useDarkMode !== undefined) {
      setColorScheme(user.useDarkMode ? 'dark' : 'light');
    } else {
      setColorScheme(systemColorScheme === 'dark' ? 'dark' : 'light');
    }
  }, [user.useDarkMode, systemColorScheme]);

  return {
    user,
    updateUser,
    isLoading,
    logout,
    colorScheme,
    ideal, // { calories, grams, percents }
  };
});
