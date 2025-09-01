import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
} from '@gluestack-ui/themed';

import Colors from '@/constants/colors';
import { useUser } from '@/store/user-store';
import LogFoodCard from '@/app/components/LogFoodCard';
import CustomDatePicker from '@/app/components/CustomDatePicker';
import { analyzeFoodEntry, type FoodAnalysisResult } from '@/services/foodAnalysis';

export type LogFoodOverlayModalProps = {
  visible: boolean;
  onClose: () => void;
  onLogFood: (food: string, date: Date, nutritionInfo?: FoodAnalysisResult) => void;
};

export default function LogFoodOverlayModal({ visible, onClose, onLogFood }: LogFoodOverlayModalProps) {
  const [foodText, setFoodText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { colorScheme } = useUser();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const handleSubmit = async () => {
    const trimmed = foodText.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter some food items.');
      return;
    }

    try {
      setIsAnalyzing(true);
      const result = await analyzeFoodEntry(trimmed);
      if (!result || !result.items || result.items.length === 0) {
        Alert.alert('Error', 'Could not analyze food entry. Please try again.');
        setIsAnalyzing(false);
        return;
      }
      onLogFood(trimmed, selectedDate, result);
      setFoodText('');
      onClose();
    } catch (e) {
      console.error('LogFoodOverlayModal analyze error', e);
      Alert.alert('Error', 'Failed to analyze food entry. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Modal isOpen={visible} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent style={{ backgroundColor: theme.background, width: '90%', maxWidth: 420, borderRadius: 16 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
          <ModalBody>
            <LogFoodCard
              value={foodText}
              onChangeText={setFoodText}
              onSubmit={handleSubmit}
              loading={isAnalyzing}
              selectedDate={selectedDate}
              onOpenDatePicker={() => setShowDatePicker(true)}
              isDarkMode={isDarkMode}
              theme={theme}
            />

            <CustomDatePicker
              visible={showDatePicker}
              date={selectedDate}
              onDateChange={(d) => setSelectedDate(d)}
              onClose={() => setShowDatePicker(false)}
            />
          </ModalBody>
        </KeyboardAvoidingView>
      </ModalContent>
    </Modal>
  );
}
