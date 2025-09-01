import React from 'react';
import { View, TouchableOpacity, Platform, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import * as Haptics from 'expo-haptics';

export type SegmentedOption = {
  label: string;
  value: string;
  testID?: string;
};

export type SegmentedTabsProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  activeColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  trackColor?: string;
  borderRadius?: number;
  textStyle?: StyleProp<TextStyle>;
};

export default function SegmentedTabs({
  options,
  value,
  onChange,
  containerStyle,
  activeColor = '#BBA46E',
  activeTextColor = '#FFFFFF',
  inactiveTextColor = '#666666',
  trackColor = '#EFE7DB',
  borderRadius = 12,
  textStyle,
}: SegmentedTabsProps) {
  return (
    <View style={[styles.row, { backgroundColor: trackColor, borderRadius, padding: Platform.OS === 'ios' ? 2 : 4 }, containerStyle]}
      accessibilityRole="tablist"
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            testID={opt.testID}
            onPress={async () => {
              if (Platform.OS === 'ios') {
                await Haptics.selectionAsync();
              }
              onChange(opt.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.item, { borderRadius }, selected && { backgroundColor: activeColor }]}
          >
            <Text style={[styles.label, textStyle, { color: selected ? activeTextColor : inactiveTextColor }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  item: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 10 : 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.OS === 'ios' ? 36 : 32,
  },
  label: {
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '600',
  },
});
