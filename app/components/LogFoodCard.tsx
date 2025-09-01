import React from 'react';
import { StyleSheet, TextInput, Platform, View, Text as RNText } from 'react-native';
import { Box, Heading, Button, ButtonText, Text } from '@gluestack-ui/themed';

export type LogFoodCardProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  selectedDate: Date;
  onOpenDatePicker: () => void;
  isDarkMode: boolean;
  // theme object coming from constants/colors.ts (light/dark token map)
  // keep it as any to avoid type friction
  theme: any;
};

export default function LogFoodCard({
  value,
  onChangeText,
  onSubmit,
  loading,
  selectedDate,
  onOpenDatePicker,
  isDarkMode,
  theme,
}: LogFoodCardProps) {
  return (
    <Box style={[styles.card, { backgroundColor: theme.cardBackground }]}> 
      <Heading size="lg" color="$textLight0" $dark-color="$textDark0" mb="$3">
        Log Your Food
      </Heading>

      {/* Date trigger button */}
      <Button
        variant="outline"
        style={[styles.dateButton, { borderColor: isDarkMode ? theme.border : '#ddd', backgroundColor: Platform.OS === 'ios' ? theme.cardBackground : theme.cardBackground }]}
        onPress={onOpenDatePicker}
        testID="date-picker-button"
      >
        <ButtonText>
          {selectedDate.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </ButtonText>
      </Button>

      {/* Multiline input */}
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
        placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
        value={value}
        onChangeText={onChangeText}
        multiline
        testID="food-entry-input"
      />

      {/* Submit button */}
      <Button
        style={[styles.submitButton, { backgroundColor: theme.tint }]}
        onPress={onSubmit}
        isDisabled={loading}
        testID="log-food-button"
      >
        <View style={styles.submitContent}>
          <RNText style={styles.submitText}>{loading ? 'Analyzing...' : 'Log Food'}</RNText>
        </View>
      </Button>
    </Box>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 8 : 6,
    elevation: 4,
  },
  dateButton: {
    width: '100%',
    marginBottom: 16,
  },
  foodInput: {
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: Platform.OS === 'ios' ? 16 : 12,
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    minHeight: Platform.OS === 'ios' ? 100 : 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 4,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
