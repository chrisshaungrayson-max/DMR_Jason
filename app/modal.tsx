import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  Platform, 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  ScrollView, 
  Pressable, 
  KeyboardAvoidingView,
  Alert,
  Modal,
  TouchableOpacity
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNutritionStore } from '@/store/nutrition-store';

import { X, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type AddEntryModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AddEntryModal({ visible, onClose }: AddEntryModalProps) {
  const { userInfo, addNutritionEntry, setUserInfo } = useNutritionStore();
  const [foodList, setFoodList] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(userInfo.date + 'T12:00:00'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateString, setDateString] = useState('');

  // Format date for display
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    setDateString(selectedDate.toLocaleDateString(undefined, options));
  }, [selectedDate]);

  const handleDateChange = (event: any, date?: Date) => {
    // Only close the date picker when the user explicitly dismisses it or presses 'set'
    if (event.type === 'dismissed' || event.type === 'set') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
    }
  };

  const showDatePickerModal = () => {
    if (Platform.OS === 'ios') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(true);
    }
  };

  const handleClose = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    onClose();
  };

  const handleSave = async () => {
    if (!foodList.trim()) {
      Alert.alert(
        'Empty Entry',
        'Please enter at least one food item.'
      );
      return;
    }

    setIsSubmitting(true);
    
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      console.log('Saving food list:', foodList);
      console.log('User date:', selectedDate.toISOString().split('T')[0]);
      
      // Simple parsing of the food list - in a real app, you'd want to integrate with an API or more sophisticated parsing
      const foods = foodList.split('\n').filter(item => item.trim() !== '');
      foods.forEach(food => {
        // Placeholder values for nutritional data
        addNutritionEntry({
          date: selectedDate.toISOString().split('T')[0],
          foodList: food.trim(),
          items: [{
            name: food.trim(),
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          }],
          total: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          }
        });
      });
      
      Alert.alert(
        'Success',
        `${foods.length} food item(s) saved successfully!`,
        [{ text: 'OK', onPress: () => {
          handleClose();
        } }]
      );
    } catch (error) {
      console.error('Error saving entries:', error);
      Alert.alert(
        'Error',
        'Failed to save entries. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Nutrition Entry</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#000" />
            </Pressable>
          </View>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Date Selector */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: '#666' }]}>Date</Text>
                <Pressable 
                  onPress={showDatePickerModal}
                  style={[styles.dateButton, { backgroundColor: '#fff' }]}
                >
                  <Calendar size={16} color="#666" style={styles.calendarIcon} />
                  <Text style={[styles.dateText, { color: '#666' }]}>
                    {dateString}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <View style={styles.datePickerWrapper}>
                    <View style={styles.datePickerHeader}>
                      <Text style={styles.datePickerTitle}>Select Date</Text>
                      <Pressable 
                        onPress={() => {
                          // Simulate a 'set' event to close the picker properly
                          handleDateChange({ type: 'set' }, selectedDate);
                        }}
                        style={styles.datePickerDoneButton}
                      >
                        <Text style={styles.datePickerDoneText}>Done</Text>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                      style={styles.dateTimePicker}
                    />
                  </View>
                )}
              </View>

              {/* Food List Input */}
              <View style={styles.entriesContainer}>
                <Text style={styles.sectionTitle}>Food Items</Text>
                <Text style={styles.sectionSubtitle}>Enter each food item on a new line</Text>
                <View style={styles.formField}>
                  <TextInput
                    style={[styles.textInput, { height: 200 }]}
                    placeholder="e.g., Grilled Chicken Breast\nBrown Rice\nBroccoli"
                    value={foodList}
                    onChangeText={setFoodList}
                    multiline
                    testID="food-list-input"
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          
          <View style={styles.buttonContainer}>
            <Pressable 
              onPress={handleSave} 
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              disabled={isSubmitting}
            >
              <Text style={[styles.saveButtonText, isSubmitting && styles.saveButtonTextDisabled]}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
          
          <StatusBar style="dark" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#EEE7DF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  datePickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  datePickerDoneButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  datePickerDoneText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  closeButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  calendarIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  dateTimePicker: {
    marginTop: 10,
    height: 120,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  entriesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  formField: {
    marginBottom: 16,
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
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#BBA46E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
});