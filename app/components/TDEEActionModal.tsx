import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Actionsheet, 
  ActionsheetBackdrop, 
  ActionsheetContent, 
  ActionsheetDragIndicator, 
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  Text
} from '@gluestack-ui/themed';
import { Calculator, Utensils } from 'lucide-react-native';
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

  const styles = StyleSheet.create({
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
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
      color: theme.lightText,
      lineHeight: 20,
    },
    headerText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitleText: {
      fontSize: 14,
      color: theme.lightText,
      textAlign: 'center',
      marginBottom: 16,
    },
  });

  return (
    <Actionsheet isOpen={visible} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={{ backgroundColor: theme.background }}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        
        <Text style={styles.headerText}>What would you like to do?</Text>
        <Text style={styles.subtitleText}>Choose an action to continue</Text>
        
        <ActionsheetItem
          onPress={() => {
            onLogFood();
            onClose();
          }}
        >
          <View style={styles.actionItem}>
            <View style={styles.iconContainer}>
              <Utensils size={24} color={theme.tint} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Log Food</Text>
              <Text style={styles.actionDescription}>
                Track what you've eaten and get nutritional analysis
              </Text>
            </View>
          </View>
        </ActionsheetItem>

        <ActionsheetItem
          onPress={() => {
            onCalculateTDEE();
            onClose();
          }}
        >
          <View style={styles.actionItem}>
            <View style={styles.iconContainer}>
              <Calculator size={24} color={theme.tint} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Calculate TDEE</Text>
              <Text style={styles.actionDescription}>
                Get personalized calorie and macro recommendations
              </Text>
            </View>
          </View>
        </ActionsheetItem>
      </ActionsheetContent>
    </Actionsheet>
  );
}
