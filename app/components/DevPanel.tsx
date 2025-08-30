import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/store/user-store';
import { clearNutritionCache } from '@/utils/maintenance';
import { fetchAuthUid, probeRlsProfiles } from '@/utils/diagnostics';

export default function DevPanel() {
  const { colorScheme } = useUser();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const [isClearing, setIsClearing] = useState(false);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [rlsResult, setRlsResult] = useState<string | null>(null);

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Nutrition Cache',
      'This will clear all cached nutrition data from AsyncStorage and optionally from Supabase. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearing(true);
              await clearNutritionCache({ supabaseNamePattern: '*' });
              Alert.alert(
                'Cache Cleared',
                'Cleared AsyncStorage nutrition history and Supabase food entries.'
              );
            } catch (error) {
              Alert.alert('Error', `Failed to clear cache: ${error}`);
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  // Only show in development or when __DEV__ is true
  if (!__DEV__) return null;

  return (
    <View style={[styles.container, { backgroundColor: `${theme.lightGold}22`, borderColor: theme.lightGold }]}>
      <Text style={[styles.title, { color: theme.darkText }]}>Dev Tools</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.tint }]}
        onPress={handleClearCache}
        disabled={isClearing}
      >
        <Text style={[styles.buttonText, { color: theme.background }]}>
          {isClearing ? 'Clearing...' : 'Clear Nutrition Cache'}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.description, { color: theme.lightText }]}>
        Clears stale nutrition data that may cause undercounts
      </Text>

      <View style={{ height: 12 }} />
      <Text style={[styles.title, { color: theme.darkText }]}>Database Diagnostics</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.tint }]}
        onPress={async () => {
          const uid = await fetchAuthUid();
          setAuthUid(uid);
        }}
      >
        <Text style={[styles.buttonText, { color: theme.background }]}>Get auth.uid() from Supabase</Text>
      </TouchableOpacity>
      {authUid !== null && (
        <Text style={{ color: theme.darkText, marginBottom: 8 }}>auth.uid(): {authUid || '(null)'}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.tint }]}
        onPress={async () => {
          const res = await probeRlsProfiles();
          if (res.ok) {
            setRlsResult(`OK. Visible profiles count: ${res.count}`);
          } else {
            setRlsResult(`Error: ${res.error}`);
          }
        }}
      >
        <Text style={[styles.buttonText, { color: theme.background }]}>Probe RLS (profiles)</Text>
      </TouchableOpacity>
      {rlsResult && (
        <Text style={{ color: theme.darkText }}>{rlsResult}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
