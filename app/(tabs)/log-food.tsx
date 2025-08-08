import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { Plus, Calendar } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useUser } from '@/store/user-store';
import { useNutritionStore } from '@/store/nutrition-store';
import AddEntryModal from '@/app/modal';

export default function LogFoodScreen() {
  const { colorScheme } = useUser();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const { userInfo, dailyRecords } = useNutritionStore();
  const navigation = useNavigation();
  
  // Auto-open the modal when navigating to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setShowAddEntryModal(true);
      }, 100);
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Find entries for the current date
  const currentDateEntries = dailyRecords.find(
    record => record.date === userInfo.date
  )?.entries || [];
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => setShowAddEntryModal(true)}
              style={({ pressed }) => [
                styles.addButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
              testID="add-food-button"
            >
              <Plus size={24} color={theme.tint} />
            </Pressable>
          ),
        }}
      />
      
      <AddEntryModal 
        visible={showAddEntryModal} 
        onClose={() => setShowAddEntryModal(false)} 
      />
      
      <View style={styles.dateContainer}>
        <Calendar size={20} color={theme.text} />
        <Text style={[styles.dateText, { color: theme.text }]}>
          {new Date(userInfo.date + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>
      
      <Text style={[styles.title, { color: theme.text }]}>Food Log</Text>
      
      {currentDateEntries.length > 0 ? (
        <FlatList
          data={currentDateEntries}
          keyExtractor={(item, index) => `entry-${index}`}
          renderItem={({ item }) => (
            <View style={[styles.entryCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.foodName, { color: theme.darkText }]}>{item.foodList}</Text>
              <View style={styles.macrosContainer}>
                <Text style={[styles.macroText, { color: theme.text }]}>Calories: {item.total.calories}</Text>
                <Text style={[styles.macroText, { color: theme.text }]}>Protein: {item.total.protein}g</Text>
                <Text style={[styles.macroText, { color: theme.text }]}>Carbs: {item.total.carbs}g</Text>
                <Text style={[styles.macroText, { color: theme.text }]}>Fat: {item.total.fat}g</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.text }]}>No entries for today</Text>}
        />
      ) : (
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Track your daily nutrition intake here. Tap the + button to add a new food entry.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    marginTop: 40,
  },
  addButton: {
    marginRight: 15,
    padding: 5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  macrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroText: {
    fontSize: 14,
    width: '48%',
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontStyle: 'italic',
  },
});