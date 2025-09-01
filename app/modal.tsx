import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View, ScrollView, KeyboardAvoidingView, Alert, TouchableOpacity } from 'react-native';
import { Text, Heading, Input, InputField, Pressable, Modal, ModalBackdrop, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, CloseIcon } from '@gluestack-ui/themed';
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
          timestamp: selectedDate.toISOString(),
          mealType: 'snack',
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
    <Modal isOpen={visible} onClose={handleClose}>
      <ModalBackdrop />
      <ModalContent style={styles.modalContent}>
          <ModalHeader>
            <Heading size="lg" color="$textLight0" $dark-color="$textDark0">Add Nutrition Entry</Heading>
            <ModalCloseButton>
              <CloseIcon />
            </ModalCloseButton>
          </ModalHeader>
          
          <ModalBody>
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
                <Text color="$textLight400" $dark-color="$textDark400" fontSize="$sm" fontWeight="$semibold">Date</Text>
                <Pressable 
                  onPress={showDatePickerModal}
                  style={[styles.dateButton, { backgroundColor: '#fff' }]}
                >
                  <Calendar size={16} color="#666" style={styles.calendarIcon} />
                  <Text color="$textLight400" $dark-color="$textDark400" fontSize="$md">
                    {dateString}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <View style={styles.datePickerWrapper}>
                    <View style={styles.datePickerHeader}>
                      <Text color="$textLight0" $dark-color="$textDark0" fontSize="$md" fontWeight="$semibold">Select Date</Text>
                      <Pressable 
                        onPress={() => {
                          // Simulate a 'set' event to close the picker properly
                          handleDateChange({ type: 'set' }, selectedDate);
                        }}
                        style={styles.datePickerDoneButton}
                      >
                        <Text color="$primary500" fontSize="$md" fontWeight="$semibold">Done</Text>
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
                <Heading size="md" color="$textLight0" $dark-color="$textDark0" mb="$1">Food Items</Heading>
                <Text color="$textLight400" $dark-color="$textDark400" fontSize="$sm" mb="$3">Enter each food item on a new line</Text>
                <View style={styles.formField}>
                  <Input
                    variant="outline"
                    size="md"
                    h={200}
                    borderColor="$borderLight300"
                    $dark-borderColor="$borderDark700"
                    backgroundColor="$backgroundLight0"
                    $dark-backgroundColor="$backgroundDark950"
                  >
                    <InputField
                      placeholder="e.g., Grilled Chicken Breast\nBrown Rice\nBroccoli"
                      value={foodList}
                      onChangeText={setFoodList}
                      multiline
                      color="$textLight900"
                      $dark-color="$textDark100"
                      placeholderTextColor="$textLight400"
                      $dark-placeholderTextColor="$textDark400"
                      testID="food-list-input"
                    />
                  </Input>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          </ModalBody>
          
          <ModalFooter>
            <Pressable 
              onPress={handleSave} 
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              disabled={isSubmitting}
            >
              <Text color="$white" fontSize="$md" fontWeight="$semibold">
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </ModalFooter>
          
          <StatusBar style="dark" />
      </ModalContent>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#EEE7DF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
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