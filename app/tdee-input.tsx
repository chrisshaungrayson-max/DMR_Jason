import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  PanResponder,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calculator } from 'lucide-react-native';
import { useUser } from '@/store/user-store';
import { useNutritionStore } from '@/store/nutrition-store';
import Colors from '@/constants/colors';
import { FitnessGoal, ACTIVITY_LEVELS, FITNESS_GOALS } from '@/types/tdee';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';
import { parseHeight, parseWeight } from '@/utils/tdee-calculations';

export default function TDEEInputScreen() {
  const router = useRouter();
  const { colorScheme } = useUser();
  const { userInfo } = useNutritionStore();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;

  // Form state - pre-populate from user profile
  const [name, setName] = useState(userInfo.name || '');
  const [age, setAge] = useState(userInfo.age?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(userInfo.sex || 'male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('15');
  const sliderWidth = 280;
  const thumbPosition = useRef(new Animated.Value(0)).current;
  
  // Pan responder for slider
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      const newValue = Math.max(0, Math.min(50, (gestureState.moveX / sliderWidth) * 50));
      setBodyFat(Math.round(newValue).toString());
      thumbPosition.setValue((newValue / 50) * sliderWidth);
    },
  });
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(userInfo.activityLevel || 'moderate');
  const [selectedGoals, setSelectedGoals] = useState<FitnessGoal[]>([]);
  const [isMetric, setIsMetric] = useState(true);

  // Pre-populate height and weight from user profile
  useEffect(() => {
    if (userInfo.height) {
      setHeight(userInfo.height);
    }
    
    if (userInfo.weight) {
      setWeight(userInfo.weight);
    }
  }, [userInfo.height, userInfo.weight]);

  const handleGoalToggle = (goal: FitnessGoal) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleCalculate = () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!age || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120) {
      Alert.alert('Error', 'Please enter a valid age (1-120)');
      return;
    }
    if (!height.trim()) {
      Alert.alert('Error', 'Please enter your height');
      return;
    }
    if (!weight.trim()) {
      Alert.alert('Error', 'Please enter your weight');
      return;
    }
    if (bodyFat && (isNaN(Number(bodyFat)) || Number(bodyFat) < 0 || Number(bodyFat) > 50)) {
      Alert.alert('Error', 'Please enter a valid body fat percentage (0-50)');
      return;
    }
    if (selectedGoals.length === 0) {
      Alert.alert('Error', 'Please select at least one fitness goal');
      return;
    }

    try {
      // Parse height and weight
      const parsedHeight = parseHeight(height, isMetric);
      const parsedWeight = parseWeight(weight, isMetric);

      // Navigate to results screen with all the data
      router.push({
        pathname: '/tdee-results',
        params: {
          name,
          age,
          gender,
          height: parsedHeight.toString(),
          weight: parsedWeight.toString(),
          bodyFat: bodyFat || '0',
          activityLevel,
          goals: JSON.stringify(selectedGoals),
          isMetric: isMetric.toString(),
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Please check your height and weight format');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 16,
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      flex: 1,
    },
    scrollContainer: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.cardBackground,
    },
    genderContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    genderButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
    },
    genderButtonSelected: {
      backgroundColor: theme.tint + '15',
      borderColor: theme.tint,
    },
    genderText: {
      fontSize: 16,
      color: theme.text,
    },
    genderTextSelected: {
      color: theme.tint,
      fontWeight: '600',
    },
    activityContainer: {
      gap: 8,
    },
    activityButton: {
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardBackground,
    },
    activityButtonSelected: {
      backgroundColor: theme.tint + '15',
      borderColor: theme.tint,
    },
    activityTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 4,
    },
    activityTitleSelected: {
      color: theme.tint,
      fontWeight: '600',
    },
    activityDescription: {
      fontSize: 14,
      color: theme.placeholder,
    },
    goalsContainer: {
      gap: 8,
    },
    goalButton: {
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardBackground,
    },
    goalButtonSelected: {
      backgroundColor: theme.tint + '15',
      borderColor: theme.tint,
    },
    goalTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 4,
    },
    goalTitleSelected: {
      color: theme.tint,
      fontWeight: '600',
    },
    goalDescription: {
      fontSize: 14,
      color: theme.placeholder,
    },
    unitToggle: {
      flexDirection: 'row',
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
    },
    unitButton: {
      flex: 1,
      padding: 12,
      alignItems: 'center',
      borderRadius: 6,
    },
    unitButtonSelected: {
      backgroundColor: theme.tint,
    },
    unitText: {
      fontSize: 14,
      color: theme.text,
    },
    unitTextSelected: {
      color: 'white',
      fontWeight: '600',
    },
    calculateButton: {
      backgroundColor: theme.tint,
      padding: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
      marginBottom: 32,
    },
    calculateButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
    },
    sliderContainer: {
      marginTop: 8,
    },
    sliderValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.tint,
      textAlign: 'center',
      marginBottom: 12,
    },
    sliderTrack: {
      height: 6,
      backgroundColor: theme.border,
      borderRadius: 3,
      marginHorizontal: 10,
      position: 'relative',
    },
    sliderFill: {
      height: 6,
      backgroundColor: theme.tint,
      borderRadius: 3,
      width: `${(parseFloat(bodyFat) || 15) * 2}%`,
    },
    sliderThumb: {
      width: 20,
      height: 20,
      backgroundColor: theme.tint,
      borderRadius: 10,
      position: 'absolute',
      top: -7,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      marginHorizontal: 10,
    },
    sliderLabel: {
      fontSize: 12,
      color: theme.placeholder,
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>TDEE Calculator</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.textInput}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {(['male', 'female', 'other'] as const).map((g) => (
                <Pressable
                  key={g}
                  style={[
                    styles.genderButton,
                    gender === g && styles.genderButtonSelected
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[
                    styles.genderText,
                    gender === g && styles.genderTextSelected
                  ]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Physical Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Measurements</Text>
          
          <View style={styles.unitToggle}>
            <Pressable
              style={[styles.unitButton, isMetric && styles.unitButtonSelected]}
              onPress={() => setIsMetric(true)}
            >
              <Text style={[styles.unitText, isMetric && styles.unitTextSelected]}>
                Metric
              </Text>
            </Pressable>
            <Pressable
              style={[styles.unitButton, !isMetric && styles.unitButtonSelected]}
              onPress={() => setIsMetric(false)}
            >
              <Text style={[styles.unitText, !isMetric && styles.unitTextSelected]}>
                Imperial
              </Text>
            </Pressable>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Height {isMetric ? '(cm)' : '(e.g., 5\'10" or 70")'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={height}
              onChangeText={setHeight}
              placeholder={isMetric ? "175" : "5'10\""}
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Weight {isMetric ? '(kg)' : '(lbs)'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={weight}
              onChangeText={setWeight}
              placeholder={isMetric ? "70" : "154"}
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Body Fat % (optional)</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{bodyFat || '15'}%</Text>
              <View style={styles.sliderTrack} {...panResponder.panHandlers}>
                <View style={styles.sliderFill} />
                <Animated.View 
                  style={[
                    styles.sliderThumb,
                    {
                      transform: [{
                        translateX: thumbPosition.interpolate({
                          inputRange: [0, sliderWidth],
                          outputRange: [0, sliderWidth - 20],
                          extrapolate: 'clamp',
                        })
                      }]
                    }
                  ]}
                />
              </View>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>0%</Text>
                <Text style={styles.sliderLabel}>50%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Level</Text>
          <View style={styles.activityContainer}>
            {ACTIVITY_LEVELS.map((info) => (
              <Pressable
                key={info.key}
                style={[
                  styles.activityButton,
                  activityLevel === info.key && styles.activityButtonSelected
                ]}
                onPress={() => setActivityLevel(info.key)}
              >
                <Text style={[
                  styles.activityTitle,
                  activityLevel === info.key && styles.activityTitleSelected
                ]}>
                  {info.label}
                </Text>
                <Text style={styles.activityDescription}>
                  {info.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Fitness Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Goals (Select all that apply)</Text>
          <View style={styles.goalsContainer}>
            {FITNESS_GOALS.map((info) => (
              <Pressable
                key={info.key}
                style={[
                  styles.goalButton,
                  selectedGoals.includes(info.key) && styles.goalButtonSelected
                ]}
                onPress={() => handleGoalToggle(info.key)}
              >
                <Text style={[
                  styles.goalTitle,
                  selectedGoals.includes(info.key) && styles.goalTitleSelected
                ]}>
                  {info.label}
                </Text>
                <Text style={styles.goalDescription}>
                  {info.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.calculateButton} onPress={handleCalculate}>
          <Calculator size={24} color="white" />
          <Text style={styles.calculateButtonText}>Calculate TDEE</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
