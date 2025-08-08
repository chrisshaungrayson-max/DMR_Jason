import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { format, addYears, subYears, isSameDay } from 'date-fns';

interface CustomDatePickerProps {
  visible: boolean;
  date: Date;
  onDateChange: (date: Date) => void;
  onClose: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  visible,
  date,
  onDateChange,
  onClose,
  minimumDate = subYears(new Date(), 1),
  maximumDate = addYears(new Date(), 1),
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(date);
  const [days, setDays] = useState<number[]>([]);
  const [months, setMonths] = useState<{value: number, label: string}[]>([]);
  const [years, setYears] = useState<number[]>([]);

  // Initialize date options
  useEffect(() => {
    if (visible) {
      setSelectedDate(date);
      
      // Generate years (1 year before and after current year)
      const yearsList = [];
      const currentYear = new Date().getFullYear();
      for (let i = currentYear - 1; i <= currentYear + 1; i++) {
        yearsList.push(i);
      }
      setYears(yearsList);

      // Generate months
      const monthsList = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: format(new Date(2000, i, 1), 'MMMM')
      }));
      setMonths(monthsList);
    }
  }, [visible, date]);

  // Update days when month or year changes
  useEffect(() => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1; // 1-12
      const daysInMonth = new Date(year, month, 0).getDate();
      
      const daysList = [];
      for (let i = 1; i <= daysInMonth; i++) {
        daysList.push(i);
      }
      setDays(daysList);
    }
  }, [selectedDate]);

  const handleDayChange = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(selectedDate);
    // Handle case where current day doesn't exist in new month (e.g., Jan 31 -> Feb)
    const daysInMonth = new Date(newDate.getFullYear(), month + 1, 0).getDate();
    const day = Math.min(newDate.getDate(), daysInMonth);
    
    newDate.setMonth(month);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(selectedDate);
    // Handle leap year case for Feb 29
    if (newDate.getMonth() === 1 && newDate.getDate() === 29) {
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      if (!isLeapYear) {
        newDate.setDate(28);
      }
    }
    newDate.setFullYear(year);
    setSelectedDate(newDate);
  };

  const handleDone = () => {
    onDateChange(selectedDate);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Date</Text>
          </View>
          
          <View style={styles.pickerContainer}>
            {/* Month Picker */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedDate.getMonth()}
                onValueChange={handleMonthChange}
                style={styles.picker}
                dropdownIconColor="#000"
              >
                {months.map((month) => (
                  <Picker.Item 
                    key={month.value} 
                    label={month.label} 
                    value={month.value} 
                  />
                ))}
              </Picker>
            </View>

            {/* Day Picker */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedDate.getDate()}
                onValueChange={handleDayChange}
                style={styles.picker}
                dropdownIconColor="#000"
              >
                {days.map((day) => (
                  <Picker.Item key={day} label={day.toString()} value={day} />
                ))}
              </Picker>
            </View>

            {/* Year Picker */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedDate.getFullYear()}
                onValueChange={handleYearChange}
                style={styles.picker}
                dropdownIconColor="#000"
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={year.toString()} value={year} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 150,
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomDatePicker;
