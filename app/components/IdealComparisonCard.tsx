import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Heading, Card, Box, HStack, VStack, Pressable } from '@gluestack-ui/themed';
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
      <HStack alignItems="center" space="xs" py="$1">
        <Text color="$textLight400" $dark-color="$textDark400" fontSize="$xs" w={80}>{label}</Text>
        <Text color="$textLight900" $dark-color="$textDark100" fontSize="$sm" fontWeight="$bold" minWidth={46} textAlign="right">{Math.round(actual)}{unit}</Text>
        <Text color="$textLight400" $dark-color="$textDark400" fontSize="$xs" mx="$1">/</Text>
        <Text color="$textLight400" $dark-color="$textDark400" fontSize="$xs" minWidth={38}>{Math.round(ideal)}{unit}</Text>
        <Box
          backgroundColor={over ? '#fdecea' : '#e8f5e9'}
          borderColor={over ? '#d9534f' : '#5cb85c'}
          borderWidth={1}
          borderRadius="$lg"
          px="$2"
          py="$1"
          ml="auto"
          accessibilityLabel={`${label}-delta-badge`}
        >
          <Text color={over ? '#d9534f' : '#3d8b40'} fontSize="$xs" fontWeight="$semibold">
            {over ? '▲' : '▼'} {Math.abs(Math.round(delta))}{unit}
          </Text>
        </Box>
        {expanded && (
          <Text color="$textLight400" $dark-color="$textDark400" fontSize="$xs" ml="$2">{pct}% of ideal</Text>
        )}
      </HStack>
    );
  };

  return (
    <Card
      backgroundColor="$backgroundLight0"
      $dark-backgroundColor="$backgroundDark950"
      borderColor="$primary500"
      borderWidth={1}
      borderRadius="$lg"
      p="$3"
      testID="ideal-comparison-card"
    >
      <HStack alignItems="center" justifyContent="space-between" mb="$2">
        <Heading size="md" color="$textLight900" $dark-color="$textDark100">{title}</Heading>
        <Pressable
          onPress={() => setExpanded(!expanded)}
          borderColor="$primary500"
          borderWidth={1}
          borderRadius="$md"
          px="$2"
          py="$1"
          accessibilityRole="button"
          accessibilityLabel="toggle-details"
          testID="ideal-details-toggle"
        >
          <Text color="$textLight900" $dark-color="$textDark100" fontSize="$xs">{expanded ? 'Hide' : 'Details'}</Text>
        </Pressable>
      </HStack>
      <Row label="Calories" ideal={idealCalories} actual={actualCalories} delta={deltaCalories} unit="" />
      <Box h={1} backgroundColor="$borderLight300" $dark-backgroundColor="$borderDark700" my="$2" />
      <Row label="Protein" ideal={idealProtein} actual={actualProtein} delta={deltaProtein} unit="g" />
      <Row label="Carbs" ideal={idealCarbs} actual={actualCarbs} delta={deltaCarbs} unit="g" />
      <Row label="Fat" ideal={idealFat} actual={actualFat} delta={deltaFat} unit="g" />
    </Card>
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
