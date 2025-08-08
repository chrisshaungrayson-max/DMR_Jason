import { useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserInfo } from '@/types/user';
import { useColorScheme } from 'react-native';

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

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userProfile');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
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
    colorScheme
  };
});
