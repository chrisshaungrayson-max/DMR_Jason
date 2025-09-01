import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Heading } from '@gluestack-ui/themed';
import Colors from '@/constants/colors';

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  themeMode?: 'light' | 'dark';
  testID?: string;
  actionHint?: string;
};

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  themeMode = 'light',
  testID = 'empty-state',
  actionHint,
}: EmptyStateProps) {
  const theme = themeMode === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={styles.container} accessibilityRole="summary" testID={testID}>
      <Text style={[styles.title, { color: theme.darkText }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.lightText }]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityHint={actionHint}
          onPress={onAction}
          style={[styles.actionBtn, { borderColor: theme.gold }]}
          testID={`${testID}-action`}
        >
          <Text style={[styles.actionText, { color: theme.darkText }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
