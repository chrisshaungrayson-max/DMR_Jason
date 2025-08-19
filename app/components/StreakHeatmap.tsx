import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/store/user-store';

export type StreakHeatmapProps = {
  title?: string;
  grid: (boolean | null)[][]; // rows of 7 (Mon..Sun). null = pad/empty
  labels?: { rows?: string[]; cols?: string[] }; // optional
};

export default function StreakHeatmap({ title, grid, labels }: StreakHeatmapProps) {
  const { colorScheme } = useUser();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const colLabels = labels?.cols ?? ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]} testID="streak-heatmap"> 
      {title ? <Text style={[styles.title, { color: theme.darkText }]}>{title}</Text> : null}
      {/* Column labels */}
      <View style={styles.row}>
        {colLabels.map((c, idx) => (
          <Text key={`cl-${idx}`} style={[styles.colLabel, { color: theme.lightText }]}>
            {c}
          </Text>
        ))}
      </View>

      {/* Grid */}
      {grid.map((row, rIdx) => (
        <View key={`r-${rIdx}`} style={styles.row}>
          {row.map((cell, cIdx) => {
            let bg = theme.border; // default for null/empty
            if (cell === true) bg = '#22c55e'; // compliant
            if (cell === false) bg = '#ef4444'; // non-compliant
            return <View key={`c-${rIdx}-${cIdx}`} style={[styles.cell, { backgroundColor: bg }]} />;
          })}
        </View>
      ))}
    </View>
  );
}

const CELL = 16;

const styles = StyleSheet.create({
  container: {
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: 12,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colLabel: {
    width: CELL,
    textAlign: 'center',
    fontSize: 10,
    marginBottom: 2,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 3,
    marginRight: 4,
  },
});
