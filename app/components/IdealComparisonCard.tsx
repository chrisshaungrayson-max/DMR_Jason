import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';

export type IdealComparisonCardProps = {
  title?: string;
  idealCalories: number;
  actualCalories: number;
  deltaCalories: number;
  idealProtein: number;
  actualProtein: number;
  deltaProtein: number;
  idealCarbs: number;
  actualCarbs: number;
  deltaCarbs: number;
  idealFat: number;
  actualFat: number;
  deltaFat: number;
  themeMode: 'light' | 'dark';
};

export default function IdealComparisonCard(props: IdealComparisonCardProps) {
  const {
    title = 'Ideal vs Actual (avg last 7 days)',
    idealCalories,
    actualCalories,
    deltaCalories,
    idealProtein,
    actualProtein,
    deltaProtein,
    idealCarbs,
    actualCarbs,
    deltaCarbs,
    idealFat,
    actualFat,
    deltaFat,
    themeMode,
  } = props;

  const theme = themeMode === 'dark' ? Colors.dark : Colors.light;
  const [expanded, setExpanded] = useState(false);

  const Row = ({ label, ideal, actual, delta, unit }: { label: string; ideal: number; actual: number; delta: number; unit: string }) => {
    const over = delta >= 0;
    const pct = ideal > 0 ? Math.round((actual / ideal) * 100) : 0;
    return (
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.lightText }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.darkText }]}>{Math.round(actual)}{unit}</Text>
        <Text style={[styles.sep, { color: theme.lightText }]}>/</Text>
        <Text style={[styles.valueSmall, { color: theme.lightText }]}>{Math.round(ideal)}{unit}</Text>
        <View style={[styles.badge, { backgroundColor: over ? '#fdecea' : '#e8f5e9', borderColor: over ? '#d9534f' : '#5cb85c' }]}
              accessibilityLabel={`${label}-delta-badge`}>
          <Text style={[styles.badgeText, { color: over ? '#d9534f' : '#3d8b40' }]}>
            {over ? '▲' : '▼'} {Math.abs(Math.round(delta))}{unit}
          </Text>
        </View>
        {expanded && (
          <Text style={[styles.pctText, { color: theme.lightText }]}>{pct}% of ideal</Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.gold }]}
          testID="ideal-comparison-card">
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.darkText }]}>{title}</Text>
        <TouchableOpacity onPress={() => setExpanded(!expanded)}
          style={[styles.toggle, { borderColor: theme.gold }]}
          accessibilityRole="button"
          accessibilityLabel="toggle-details"
          testID="ideal-details-toggle">
          <Text style={{ color: theme.darkText, fontSize: 12 }}>{expanded ? 'Hide' : 'Details'}</Text>
        </TouchableOpacity>
      </View>
      <Row label="Calories" ideal={idealCalories} actual={actualCalories} delta={deltaCalories} unit="" />
      <View style={styles.divider} />
      <Row label="Protein" ideal={idealProtein} actual={actualProtein} delta={deltaProtein} unit="g" />
      <Row label="Carbs" ideal={idealCarbs} actual={actualCarbs} delta={deltaCarbs} unit="g" />
      <Row label="Fat" ideal={idealFat} actual={actualFat} delta={deltaFat} unit="g" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    marginVertical: 2,
  },
  label: {
    width: 80,
    fontSize: 13,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 46,
    textAlign: 'right',
  },
  valueSmall: {
    fontSize: 13,
    minWidth: 38,
    textAlign: 'left',
  },
  sep: {
    fontSize: 12,
    marginHorizontal: 2,
  },
  badge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pctText: {
    marginLeft: 6,
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
    marginVertical: 6,
  },
  toggle: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
