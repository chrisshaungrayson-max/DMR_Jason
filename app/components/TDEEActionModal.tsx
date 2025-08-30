import React from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Calculator, Utensils, X } from 'lucide-react-native';
import { useUser } from '@/store/user-store';
import Colors from '@/constants/colors';

type TDEEActionModalProps = {
  visible: boolean;
  onClose: () => void;
  onLogFood: () => void;
  onCalculateTDEE: () => void;
};

export default function TDEEActionModal({ 
  visible, 
  onClose, 
  onLogFood, 
  onCalculateTDEE 
}: TDEEActionModalProps) {
  const { colorScheme } = useUser();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;

  if (!visible) return null;

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
    modal: {
      width: '85%',
      maxWidth: 350,
      backgroundColor: theme.background,
      borderRadius: 20,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
    },
    closeButton: {
      padding: 8,
      margin: -8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.placeholder,
      marginBottom: 24,
      textAlign: 'center',
    },
    actionsContainer: {
      gap: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionButtonPressed: {
      backgroundColor: theme.tint + '10',
      borderColor: theme.tint,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.tint + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    actionContent: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    actionDescription: {
      fontSize: 14,
      color: theme.placeholder,
      lineHeight: 20,
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <Pressable 
            style={styles.backgroundPressable} 
            onPress={onClose}
          />
          <View 
            style={styles.modal}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.header}>
              <Text style={styles.title}>What would you like to do?</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={24} color={theme.text} />
              </Pressable>
            </View>
            
            <Text style={styles.subtitle}>
              Choose an action to continue
            </Text>

            <View style={styles.actionsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed
                ]}
                onPress={() => {
                  onLogFood();
                  onClose();
                }}
              >
                <View style={styles.iconContainer}>
                  <Utensils size={24} color={theme.tint} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Log Food</Text>
                  <Text style={styles.actionDescription}>
                    Track what you've eaten and get nutritional analysis
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed
                ]}
                onPress={() => {
                  onCalculateTDEE();
                  onClose();
                }}
              >
                <View style={styles.iconContainer}>
                  <Calculator size={24} color={theme.tint} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Calculate TDEE</Text>
                  <Text style={styles.actionDescription}>
                    Get personalized calorie and macro recommendations
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
