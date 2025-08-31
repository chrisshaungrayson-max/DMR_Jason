import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Keyboard, 
  TouchableWithoutFeedback, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';

const { height } = Dimensions.get('window');
import { Calendar, Plus, X, Check, AlertCircle } from 'lucide-react-native';
import { useUser } from '@/store/user-store';
import Colors from '@/constants/colors';
import { analyzeFoodEntry, formatNutritionalInfo, type FoodAnalysisResult } from '@/services/foodAnalysis';
import CustomDatePicker from './CustomDatePicker';
import { useFoodsStore } from '@/store/foods-store';



type FoodLogPopoverProps = {
  visible: boolean;
  onClose: () => void;
  onLogFood: (food: string, date: Date, nutritionInfo?: FoodAnalysisResult) => void;
};

export default function FoodLogPopover({ visible, onClose, onLogFood }: FoodLogPopoverProps) {
  const [foodText, setFoodText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const { colorScheme } = useUser();
  const { search: searchFoods, save: saveFood } = useFoodsStore();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      // Small delay to ensure the modal is fully visible
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Debounced search for foods catalog suggestions
  useEffect(() => {
    let timer: any;
    if (foodText.trim().length >= 2 && !isAnalyzing) {
      setSearching(true);
      timer = setTimeout(async () => {
        try {
          const res = await searchFoods(foodText.trim());
          setSuggestions(res);
        } catch {
          setSuggestions([]);
        } finally {
          setSearching(false);
        }
      }, 250);
    } else {
      setSuggestions([]);
    }
    return () => clearTimeout(timer);
  }, [foodText, isAnalyzing, searchFoods]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDatePress = () => {
    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    if (!foodText.trim()) return;
    
    setError(null);
    setAnalysisResult(null);
    setIsAnalyzing(true);
    
    try {
      // First, analyze the food entry using the LLM
      const result = await analyzeFoodEntry(foodText);
      setAnalysisResult(result);
      
      // Show the analysis result to the user
      Alert.alert(
        'Nutritional Analysis',
        formatNutritionalInfo(result),
        [
          {
            text: 'Save to My Foods',
            onPress: async () => {
              try {
                const firstItem = result.items && result.items[0];
                if (!firstItem) {
                  Alert.alert('Error', 'No analyzed items to save.');
                  return;
                }
                await saveFood({
                  name: firstItem.name || foodText,
                  calories: firstItem.calories,
                  protein: firstItem.protein,
                  carbs: firstItem.carbs,
                  fat: firstItem.fat,
                  meta: { source: 'analysis' },
                });
                Alert.alert('Saved', 'Food saved to your catalog.');
              } catch (e) {
                console.warn('Save food failed', e);
                Alert.alert('Error', 'Failed to save.');
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setAnalysisResult(null);
              setFoodText('');
            },
          },
          {
            text: 'Log It',
            onPress: () => {
              onLogFood(foodText, selectedDate, result);
              setFoodText('');
              setAnalysisResult(null);
              onClose();
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      setError('Failed to analyze food. Please try again.');
      console.error('Error analyzing food:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!visible) return null;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const renderContent = () => {
    if (isAnalyzing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Analyzing your food entry...
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Log Food</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.text} />
          </Pressable>
        </View>
        
        {/* Date Picker */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Date</Text>
          <Pressable
            onPress={handleDatePress}
            style={[styles.dateButton, { borderColor: theme.border }]}
          >
            <Calendar size={16} color={theme.text} style={styles.calendarIcon} />
            <Text style={[styles.dateText, { color: theme.text }]}>
              {selectedDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </Pressable>

          <CustomDatePicker
            visible={showDatePicker}
            date={selectedDate}
            onDateChange={handleDateChange}
            onClose={() => setShowDatePicker(false)}
          />
        </View>

        {/* Food Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>What did you eat?</Text>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              { 
                backgroundColor: theme.cardBackground,
                color: theme.text,
                borderColor: theme.border
              }
            ]}
            placeholder="e.g., Chicken salad with olive oil"
            placeholderTextColor={theme.placeholder}
            value={foodText}
            onChangeText={(text) => {
              setFoodText(text);
              setError(null);
            }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isAnalyzing}
          />
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#ff6b6b" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={onClose}
            disabled={isAnalyzing}
          >
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.submitButton,
              { 
                backgroundColor: foodText.trim() ? theme.tint : theme.disabled,
                opacity: foodText.trim() ? 1 : 0.7,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }
            ]}
            onPress={handleSubmit}
            disabled={!foodText.trim() || isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="white" style={styles.buttonSpinner} />
            ) : (
              <Check size={18} color="white" style={styles.checkIcon} />
            )}
            <Text style={styles.submitButtonText}>
              {isAnalyzing ? 'Analyzing...' : 'Log Food'}
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  // Define styles in a single StyleSheet.create block
  const styles = StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backgroundPressable: {
      ...StyleSheet.absoluteFillObject,
    },
    popover: {
      width: '90%',
      maxWidth: 400,
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    closeButton: {
      padding: 8,
      margin: -8,
    },
    content: {
      marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 20,
      zIndex: 1,
    },
    label: {
      fontSize: 14,
      marginBottom: 8,
      fontWeight: '500',
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
      backgroundColor: theme.cardBackground,
      color: theme.text,
      borderColor: theme.border,
    },
    suggestionsBox: {
      marginTop: 8,
      borderWidth: 1,
      borderRadius: 8,
      overflow: 'hidden',
    },
    suggestionLoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      gap: 6,
    },
    suggestionLoadingText: {
      fontSize: 12,
    },
    suggestionItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.05)',
    },
    suggestionText: {
      fontSize: 14,
      fontWeight: '600',
    },
    suggestionMeta: {
      fontSize: 12,
      marginTop: 2,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 4,
      borderColor: theme.border,
    },
    calendarIcon: {
      marginRight: 8,
    },
    dateText: {
      fontSize: 16,
      color: theme.text,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      textAlign: 'center',
      color: theme.text,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      padding: 8,
      backgroundColor: '#fff0f0',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ffd6d6',
    },
    errorIcon: {
      marginRight: 6,
    },
    errorText: {
      color: '#ff6b6b',
      fontSize: 14,
      flex: 1,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    cancelButton: {
      flex: 1,
      padding: 15,
      borderRadius: 8,
      borderWidth: 1,
      marginRight: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: theme.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
    submitButton: {
      flex: 2,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.tint,
      opacity: 1,
    },
    submitButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    buttonSpinner: {
      marginRight: 8,
    },
    checkIcon: {
      marginRight: 8,
    },
    datePickerContainer: {
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 1000,
    },
    datePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    datePickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    datePickerDoneButton: {
      padding: 8,
    },
    datePickerDoneText: {
      color: theme.tint,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <Pressable 
            style={styles.backgroundPressable} 
            onPress={onClose}
          />
          <View 
            style={[
              styles.popover, 
              { 
                backgroundColor: theme.background,
                maxHeight: isAnalyzing ? 200 : undefined,
              }
            ]}
            onStartShouldSetResponder={() => true}
          >
            {renderContent()}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
