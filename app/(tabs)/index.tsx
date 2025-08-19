import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable, Modal, Image, Switch } from 'react-native';
import { useNutritionStore } from '@/store/nutrition-store';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { User, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import AddEntryModal from '@/app/modal';
import DateTimePicker from '@react-native-community/datetimepicker';

import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useUser } from '@/store/user-store';
import { useGoals } from '@/store/goals-store';
import GoalCard from '@/app/components/GoalCard';
import EmptyState from '@/app/components/EmptyState';
import { strings } from '@/utils/strings';

export default function HomePage() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [foodEntry, setFoodEntry] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const { userInfo, setUserInfo, dailyRecords } = useNutritionStore();
  const { colorScheme } = useUser();
  const { topNActive, progressFor, isLoading: goalsLoading, goals } = useGoals();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const router = useRouter();

  // Top N goals to show on homepage
  const visibleGoals = topNActive(3);

  const updateUserInfo = (field: keyof typeof userInfo, value: string | boolean) => {
    setUserInfo({ ...userInfo, [field]: value });
  };



  const handleLogFood = async () => {
    console.log('Log Food clicked', { foodEntry, selectedDate });
    if (!foodEntry.trim()) {
      Alert.alert('Error', 'Please enter some food items.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
  
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a nutrition expert. Analyze the following food items and provide a detailed macronutrient breakdown (calories, protein, carbs, fat) for each item and a total summary. Respond in a structured JSON format like: {"items": [{"name": "item", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}], "total": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}}'
            },
            {
              role: 'user',
              content: `Analyze the macronutrients for: ${foodEntry}`
            }
          ]
        }),
      });
      const data = await response.json();
      console.log('LLM Response:', data);
      // Extract JSON from the response content
      let result;
      try {
        // Try to find JSON content in the response
        const content = data.completion || '';
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
          date: selectedDate.toISOString(),
          foodList: foodEntry
        },
      });
    } catch (error) {
      console.error('Error processing food entry:', error);
      Alert.alert('Error', 'Failed to analyze food entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    // Only close the date picker when the user explicitly dismisses it or presses 'set'
    if (event.type === 'dismissed' || event.type === 'set') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleEditProfile = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setSelectedAge(userInfo.age);
    setShowProfileModal(true);
  };

  const handleImagePicker = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateUserInfo('profilePicture', result.assets[0].uri);
    }
  };

  const generateAgeOptions = () => {
    const ages = [];
    for (let i = 13; i <= 100; i++) {
      ages.push(i.toString());
    }
    return ages;
  };

  const getHeightPlaceholder = () => {
    return userInfo.useMetricUnits ? 'e.g., 175 cm' : 'e.g., 5\'10"';
  };

  const getWeightPlaceholder = () => {
    return userInfo.useMetricUnits ? 'e.g., 70 kg' : 'e.g., 150 lbs';
  };



  const formatDateForDisplay = (dateString: string) => {
    try {
      if (!dateString) return 'Today';
      const date = new Date(dateString + 'T12:00:00');
      if (isNaN(date.getTime())) return 'Today';
      
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      if (isToday) return 'Today';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Today';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = userInfo.name || 'there';
    
    if (hour < 12) {
      return `Good morning, ${name}`;
    } else if (hour < 17) {
      return `Good afternoon, ${name}`;
    } else {
      return `Good evening, ${name}`;
    }
  };

  const getWeeklyStreak = () => {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentEntries = dailyRecords.flatMap(record => record.entries).filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= oneWeekAgo && entryDate <= today;
    });
    
    const uniqueDays = new Set(
      recentEntries.map(entry => entry.date.split('T')[0])
    );
    
    return uniqueDays.size;
  };

  const handleHistoryItemPress = (entry: any) => {
    // Navigate to the Daily Summary modal for the selected date
    // entry.date should be in YYYY-MM-DD format to match dailyRecords keys
    router.push({
      pathname: '/daily-summary',
      params: { date: entry.date },
    });
  };

  // Use daily records directly
  const dailySummaries = dailyRecords
    .map(record => ({
      date: record.date,
      total: record.total,
      entries: record.entries
    }))
    .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://r2-pub.rork.com/attachments/nbnzfjpejlkyi4jjvjdzc' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.logo, { color: theme.text }]}>{getGreeting()}</Text>
          <Pressable 
            style={styles.headerProfile}
            onPress={handleEditProfile}
            testID="header-profile-button"
          >
            {userInfo.profilePicture ? (
              <Image 
                source={{ uri: userInfo.profilePicture }}
                style={styles.headerProfileImage}
              />
            ) : (
              <View style={styles.headerProfilePlaceholder}>
                <Text style={styles.headerProfileInitials}>
                  {userInfo.name ? getInitials(userInfo.name) : 'U'}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Weekly Streak Widget */}
        <View style={styles.streakWidget}>
          <View style={styles.streakContent}>
            <View style={styles.streakIconContainer}>
              <View style={styles.streakIcon}>
                <Text style={styles.streakNumber}>{getWeeklyStreak()}</Text>
              </View>
            </View>
            <View style={styles.streakTextContainer}>
              <Text style={styles.streakTitle}>Weekly Streak</Text>
              <Text style={styles.streakSubtitle}>{getWeeklyStreak()} days logged this week</Text>
            </View>
            <View style={styles.streakProgress}>
              {[...Array(7)].map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.streakDot,
                    index < getWeeklyStreak() && styles.streakDotActive
                  ]} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* Your Goals */}
        <View style={[styles.goalsSection, { backgroundColor: theme.cardBackground }]}>
          <Text style={styles.sectionTitle}>Your Goals</Text>
          {goalsLoading ? (
            <Text style={styles.goalsEmptyText}>Loading goals…</Text>
          ) : visibleGoals.length === 0 ? (
            <EmptyState
              title={strings.empty.goals.title}
              description={strings.empty.goals.description}
              actionLabel={strings.empty.goals.actionLabel}
              onAction={() => router.push('/(tabs)/profile')}
              themeMode={isDarkMode ? 'dark' : 'light'}
              testID="goals-empty"
              actionHint={strings.empty.goals.actionHint}
            />
          ) : (
            <View style={styles.goalsList}>
              {visibleGoals.map((g: any) => (
                <GoalCard key={g.id} goal={g} progress={progressFor(g.id)} />
              ))}
            </View>
          )}
        </View>

        {/* Food Entry Section */}
        <View style={[styles.foodEntryCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={styles.sectionTitle}>Log Your Food</Text>
          <Pressable 
            onPress={() => setShowDatePicker(true)} 
            style={[styles.datePickerButton, { backgroundColor: Platform.OS === 'ios' ? theme.cardBackground : theme.cardBackground, borderColor: '#ddd' }]}
          >
            <Text style={[styles.datePickerText, { color: theme.text }]}>
              {selectedDate.toLocaleDateString(undefined, { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </Pressable>
          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select Date</Text>
                <Pressable 
                  onPress={() => {
                    // Simulate a 'set' event to close the picker properly
                    onDateChange({ type: 'set' }, selectedDate);
                  }}
                  style={styles.datePickerDoneButton}
                >
                  <Text style={[styles.datePickerDoneText, { color: theme.tint }]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                themeVariant={isDarkMode ? 'dark' : 'light'}
                style={styles.dateTimePicker}
                textColor={Platform.OS === 'ios' ? (isDarkMode ? '#fff' : '#000') : undefined}
              />
            </View>
          )}
          <TextInput
            style={[
              styles.foodInput,
              {
                backgroundColor: Platform.OS === 'ios' ? (isDarkMode ? '#1e1e1e' : '#f8f8f8') : (isDarkMode ? '#1e1e1e' : '#fafafa'),
                color: theme.text,
                borderColor: isDarkMode ? theme.border : '#ddd',
              },
            ]}
            placeholder="Enter food items (e.g., 2 eggs, 1 toast)"
            value={foodEntry}
            onChangeText={setFoodEntry}
            multiline
            testID="food-entry-input"
          />
          <Pressable 
            style={({ pressed }) => [
              styles.logFoodButton,
              pressed && Platform.OS === 'ios' && styles.addButtonPressed
            ]}
            onPress={handleLogFood}
            disabled={loading}
            testID="log-food-button"
          >
            <Text style={styles.logFoodButtonText}>{loading ? 'Analyzing...' : 'Log Food'}</Text>
          </Pressable>
        </View>

        {/* Add New Entry Modal */}
        <AddEntryModal 
          visible={showAddEntryModal} 
          onClose={() => setShowAddEntryModal(false)} 
        />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {/* Edit Profile removed as requested */}
          </View>
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>History</Text>
          {dailySummaries.length === 0 ? (
            <Text style={styles.noHistoryText}>No history yet. Log your first entry!</Text>
          ) : (
            <View style={styles.historyTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Date</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Calories</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Protein</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Carbs</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Fat</Text>
              </View>
              {dailySummaries.slice(0, 5).map((summary, index) => (
                <Pressable 
                  key={summary.date} 
                  style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}
                  onPress={() => handleHistoryItemPress(summary)}
                >
                  <Text style={[styles.tableCell, { flex: 2 }]}>{formatDateForDisplay(summary.date)}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{summary.total.calories}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{summary.total.protein}g</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{summary.total.carbs}g</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{summary.total.fat}g</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Pressable 
                  onPress={() => setShowProfileModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.modalButton}>Done</Text>
                </Pressable>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your name"
                    value={userInfo.name}
                    onChangeText={(value) => updateUserInfo('name', value)}
                    testID="name-input"
                  />
                </View>
                
                {/* Profile Picture Section */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Profile Picture</Text>
                  <Pressable 
                    style={styles.profilePictureButton}
                    onPress={handleImagePicker}
                    testID="profile-picture-button"
                  >
                    <View style={styles.profilePictureContainer}>
                      {userInfo.profilePicture ? (
                        <Image 
                          source={{ uri: userInfo.profilePicture }}
                          style={styles.profilePicturePreview}
                        />
                      ) : (
                        <View style={styles.profilePicturePlaceholder}>
                          <Camera size={32} color="#BBA46E" />
                          <Text style={styles.profilePictureText}>Tap to upload</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </View>

                {/* Metric Units Toggle */}
                <View style={styles.formField}>
                  <View style={styles.toggleRow}>
                    <Text style={styles.fieldLabel}>Use Metric Units</Text>
                    <Switch
                      value={userInfo.useMetricUnits}
                      onValueChange={(value) => updateUserInfo('useMetricUnits', value)}
                      trackColor={{ false: '#E0E0E0', true: '#BBA46E' }}
                      thumbColor={userInfo.useMetricUnits ? '#fff' : '#f4f3f4'}
                      testID="metric-toggle"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formFieldHalf}>
                    <Text style={styles.fieldLabel}>Age</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={selectedAge}
                        onValueChange={(value) => {
                          setSelectedAge(value);
                          updateUserInfo('age', value);
                        }}
                        style={styles.picker}
                        testID="age-picker"
                      >
                        <Picker.Item label="Select age" value="" />
                        {generateAgeOptions().map((age) => (
                          <Picker.Item key={age} label={age} value={age} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  
                  <View style={styles.formFieldHalf}>
                    <Text style={styles.fieldLabel}>Sex</Text>
                    <View style={styles.sexSelector}>
                      {['male', 'female', 'other'].map((sex) => (
                        <Pressable
                          key={sex}
                          style={[
                            styles.sexOption,
                            userInfo.sex === sex && styles.sexOptionSelected
                          ]}
                          onPress={() => updateUserInfo('sex', sex as any)}
                        >
                          <Text style={[
                            styles.sexOptionText,
                            userInfo.sex === sex && styles.sexOptionTextSelected
                          ]}>
                            {sex.charAt(0).toUpperCase() + sex.slice(1)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
                
                <View style={styles.formRow}>
                  <View style={styles.formFieldHalf}>
                    <Text style={styles.fieldLabel}>Height</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={getHeightPlaceholder()}
                      value={userInfo.height}
                      onChangeText={(value) => updateUserInfo('height', value)}
                      testID="height-input"
                    />
                  </View>
                  
                  <View style={styles.formFieldHalf}>
                    <Text style={styles.fieldLabel}>Weight</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={getWeightPlaceholder()}
                      value={userInfo.weight}
                      onChangeText={(value) => updateUserInfo('weight', value)}
                      testID="weight-input"
                    />
                  </View>
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Activity Level</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={userInfo.activityLevel || 'sedentary'}
                      onValueChange={(value) => updateUserInfo('activityLevel', value)}
                      style={styles.picker}
                      testID="activity-level-picker"
                    >
                      <Picker.Item label="Sedentary (little/no exercise)" value="sedentary" />
                      <Picker.Item label="Light Activity (1-3 days/week)" value="light" />
                      <Picker.Item label="Moderate Activity (3-5 days/week)" value="moderate" />
                      <Picker.Item label="Heavy Activity (6-7 days/week)" value="heavy" />
                      <Picker.Item label="Athlete-Level (2x training/day)" value="athlete" />
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your email"
                    value={userInfo.email}
                    onChangeText={(value) => updateUserInfo('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    testID="email-input"
                  />
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Phone Number (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter phone number (optional)"
                    value={userInfo.phoneNumber || ''}
                    onChangeText={(value) => updateUserInfo('phoneNumber', value)}
                    keyboardType="phone-pad"
                    testID="phone-input"
                  />
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* History Detail Modal */}
      <Modal
        visible={showHistoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Day Summary - {selectedHistoryEntry && formatDateForDisplay(selectedHistoryEntry.date || '')}</Text>
              <Pressable onPress={() => setShowHistoryModal(false)}>
                <Text style={styles.modalButton}>Close</Text>
              </Pressable>
            </View>
            
            {selectedHistoryEntry && (
              <ScrollView style={styles.historyDetailScroll}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Total for the Day</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryMacro}>Calories: {selectedHistoryEntry.total.calories}</Text>
                    <Text style={styles.summaryMacro}>Protein: {selectedHistoryEntry.total.protein}g</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryMacro}>Carbs: {selectedHistoryEntry.total.carbs}g</Text>
                    <Text style={styles.summaryMacro}>Fat: {selectedHistoryEntry.total.fat}g</Text>
                  </View>
                </View>

                <Text style={styles.entriesTitle}>Entries</Text>
                {selectedHistoryEntry.entries.map((entry: any, index: number) => (
                  <View key={index} style={styles.entryItem}>
                    <Text style={styles.entryFoodList}>{entry.foodList}</Text>
                    <View style={styles.entryMacros}>
                      <Text style={styles.entryMacroText}>Cal: {entry.total.calories}</Text>
                      <Text style={styles.entryMacroText}>P: {entry.total.protein}g</Text>
                      <Text style={styles.entryMacroText}>C: {entry.total.carbs}g</Text>
                      <Text style={styles.entryMacroText}>F: {entry.total.fat}g</Text>
                    </View>
                    <Text style={styles.entryDetailsTitle}>Items:</Text>
                    {entry.items.map((item: any, itemIndex: number) => (
                      <View key={itemIndex} style={styles.itemDetail}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.itemMacros}>
                          <Text style={styles.itemMacroText}>Cal: {item.calories}</Text>
                          <Text style={styles.itemMacroText}>P: {item.protein}g</Text>
                          <Text style={styles.itemMacroText}>C: {item.carbs}g</Text>
                          <Text style={styles.itemMacroText}>F: {item.fat}g</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEE7DF',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 20,
  },
  logoImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
    flex: 1,
  },
  headerProfile: {
    marginLeft: 10,
  },
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerProfilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#BBA46E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfileInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold' as const,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  foodEntryCard: {
    backgroundColor: '#fff',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 8 : 6,
    elevation: 4,
  },
  foodInput: {
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    borderColor: '#ddd',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: Platform.OS === 'ios' ? 16 : 12,
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    backgroundColor: Platform.OS === 'ios' ? '#f8f8f8' : '#fafafa',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    minHeight: Platform.OS === 'ios' ? 100 : 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  logFoodButton: {
    backgroundColor: '#BBA46E',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logFoodButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold' as const,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  datePickerButton: {
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    borderColor: '#ddd',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: Platform.OS === 'ios' ? 16 : 12,
    backgroundColor: Platform.OS === 'ios' ? '#f8f8f8' : '#fafafa',
    marginBottom: 16,
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  addButton: {
    backgroundColor: '#BBA46E',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonPressed: {
    backgroundColor: '#A89660',
    transform: [{ scale: 0.98 }],
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#000',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  goalsSection: {
    backgroundColor: '#fff',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    padding: 16,
    marginBottom: 20,
  },
  goalsList: {
    marginTop: 4,
  },
  goalsEmptyText: {
    color: '#555',
    fontSize: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: '500' as const,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#BBA46E',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  modalScrollView: {
    padding: 20,
    paddingBottom: 40,
  },
  formField: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formFieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  textInput: {
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    borderColor: '#ddd',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: Platform.OS === 'ios' ? 16 : 12,
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    backgroundColor: Platform.OS === 'ios' ? '#f8f8f8' : '#fafafa',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    minHeight: Platform.OS === 'ios' ? 44 : 40,
  },
  sexSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  sexOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sexOptionSelected: {
    backgroundColor: '#BBA46E',
    borderColor: '#BBA46E',
  },
  sexOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500' as const,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  sexOptionTextSelected: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#BBA46E',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profilePictureButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    padding: 20,
  },
  profilePictureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicturePreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profilePicturePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePictureText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: Platform.OS === 'ios' ? '#f8f8f8' : '#fafafa',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    borderColor: '#ddd',
    minHeight: Platform.OS === 'ios' ? 44 : 40,
  },
  picker: {
    height: Platform.OS === 'ios' ? 44 : 40,
    color: '#000',
  },
  historySection: {
    marginTop: 20,
    marginBottom: 40,
  },

  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  datePickerDoneButton: {
    padding: 8,
  },
  datePickerDoneText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dateTimePicker: {
    backgroundColor: '#fff',
  },
  historyTable: {
    backgroundColor: '#fff',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#333',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableRowEven: {
    backgroundColor: 'rgba(187, 164, 110, 0.03)',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  noHistoryText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  historyModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    maxHeight: '50%',
  },
  historyDetailScroll: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#BBA46E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryMacro: {
    fontSize: 14,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  entriesTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  entryItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  entryFoodList: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  entryMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryMacroText: {
    fontSize: 13,
    color: '#555',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  entryDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  itemDetail: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  itemMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemMacroText: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  streakWidget: {
    backgroundColor: '#fff',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 8 : 6,
    elevation: 4,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakIconContainer: {
    marginRight: 16,
  },
  streakIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#BBA46E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#BBA46E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  streakTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#000',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  streakSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  streakProgress: {
    flexDirection: 'row',
    gap: 6,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  streakDotActive: {
    backgroundColor: '#BBA46E',
  },
});
