import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Heading, Card, Box, HStack, VStack } from '@gluestack-ui/themed';
import Colors from '@/constants/colors';
import type { GoalRecord, GoalProgress } from '@/types/goal';

export interface GoalCardProps {
  goal: GoalRecord;
  progress?: GoalProgress | null;
}

const typeLabel: Record<GoalRecord['type'], string> = {
  body_fat: 'Body Fat',
  weight: 'Weight',
  lean_mass_gain: 'Lean Mass',
  calorie_streak: 'Calorie Streak',
  protein_streak: 'Protein Streak',
};

export default function GoalCard({ goal, progress }: GoalCardProps) {
  const isStreak = goal.type === 'calorie_streak' || goal.type === 'protein_streak';
  const percent = Math.max(0, Math.min(100, progress?.percent ?? 0));
  const theme = Colors.light; // cards follow light theme by default; container should adapt at screen level if needed

  return (
    <Card
      backgroundColor="$backgroundLight0"
      $dark-backgroundColor="$backgroundDark950"
      borderColor="$borderLight300"
      $dark-borderColor="$borderDark700"
      borderWidth={1}
      borderRadius="$lg"
      p="$3"
      mb="$3"
      testID={`goal-card-${goal.id}`}
    >
      <HStack alignItems="center" justifyContent="space-between" flex={1} mb="$2">
        <Text color="$textLight900" $dark-color="$textDark100" fontSize="$md" fontWeight="$semibold" flex={1} mr="$2" numberOfLines={1}>
          {renderTitle(goal)}
        </Text>
        <Box backgroundColor="$primary500" px="$2" py="$1" borderRadius="$full">
          <Text color="$white" fontSize="$xs" fontWeight="$bold" testID={`goal-badge-${goal.type}`}>{typeLabel[goal.type]}</Text>
        </Box>
      </HStack>
        <Text color="$textLight400" $dark-color="$textDark400" fontSize="$xs" mb="$2">Status: {renderStatus(goal)}</Text>

      {isStreak ? (
        <VStack space="sm">
          {progress?.streak ? (
            <>
            <VStack space="sm">
                <Text color="$textLight900" $dark-color="$textDark100" fontSize="$md" fontWeight="$bold">
                  {progress.streak.current}/{progress.streak.target} days
                </Text>
                <Box h={6} backgroundColor="$borderLight300" $dark-backgroundColor="$borderDark700" borderRadius="$sm" overflow="hidden">
                  <Box 
                    h="100%"
                    w={`${Math.min(100, (progress.streak.current / progress.streak.target) * 100)}%`}
                    backgroundColor={getStreakColor(progress.streak.current, progress.streak.target, theme)}
                    borderRadius="$sm"
                  />
                </Box>
              </VStack>
              <Text color={getStreakStatusColor(progress.streak.current, progress.streak.target, theme)} fontSize="$xs" fontWeight="$medium">
                {getStreakStatusText(progress.streak.current, progress.streak.target)}
              </Text>
            </>
          ) : (
            <Text color="$textLight400" $dark-color="$textDark400" fontSize="$sm" fontWeight="$semibold">—</Text>
          )}
        </VStack>
      ) : (
        <VStack space="sm">
          <VStack space="sm">
              <Text color="$textLight900" $dark-color="$textDark100" fontSize="$sm" fontWeight="$semibold">
                {renderNumericProgress(goal, progress)}
              </Text>
              <Box h={8} backgroundColor="$borderLight300" $dark-backgroundColor="$borderDark700" borderRadius="$sm" overflow="hidden">
                <Box 
                  h="100%"
                  w={`${percent}%`}
                  backgroundColor={getNumericProgressColor(percent, theme)}
                  borderRadius="$sm"
                />
              </Box>
            </VStack>
            {progress?.trend && progress.trend.length > 0 && (
              <Text color="$textLight400" $dark-color="$textDark400" fontSize="$xs" fontStyle="italic">
                {renderTrendText(progress.trend)}
              </Text>
            )}
        </VStack>
      )}

      {!!progress?.label && (
        <Text color="$textLight400" $dark-color="$textDark400" fontSize="$xs" mt="$2">{progress.label}</Text>
      )}
    </Card>
  );
}

function renderTitle(goal: GoalRecord) {
  // Basic, human-friendly title per goal type using params
  switch (goal.type) {
    case 'body_fat':
      return `Body fat → ${(goal.params as any).targetPct}%`;
    case 'weight': {
      const p = goal.params as any;
      return `${p.direction === 'down' ? 'Lose' : 'Gain'} to ${p.targetWeightKg} kg`;
    }
    case 'lean_mass_gain':
      return `Gain ${(goal.params as any).targetKg} kg lean mass`;
    case 'calorie_streak': {
      const p = goal.params as any;
      return `Calories ${p.basis === 'custom' ? 'custom range' : 'recommended'} • ${p.targetDays}-day streak`;
    }
    case 'protein_streak':
      return `Protein ${(goal.params as any).gramsPerDay}g • ${(goal.params as any).targetDays}-day streak`;
    default:
      return goal.type;
  }
}

function renderStatus(goal: GoalRecord) {
  if (goal.status === 'achieved') return 'Achieved';
  if (!goal.active || goal.status === 'deactivated') return 'Inactive';
  return 'Active';
}

function getStreakColor(current: number, target: number, theme: any) {
  const ratio = current / target;
  if (ratio >= 1) return '#22c55e'; // green - achieved
  if (ratio >= 0.7) return theme.gold; // gold - close
  if (ratio >= 0.3) return '#f59e0b'; // amber - progress
  return '#ef4444'; // red - needs work
}

function getStreakStatusColor(current: number, target: number, theme: any) {
  const ratio = current / target;
  if (ratio >= 1) return '#22c55e';
  if (ratio >= 0.7) return theme.gold;
  return theme.lightText;
}

function getStreakStatusText(current: number, target: number) {
  const ratio = current / target;
  if (ratio >= 1) return 'Goal achieved! 🎉';
  if (ratio >= 0.7) return 'Almost there! Keep going 💪';
  if (current === 0) return 'Start your streak today';
  const remaining = target - current;
  return `${remaining} more day${remaining === 1 ? '' : 's'} to go`;
}

function renderNumericProgress(goal: GoalRecord, progress?: GoalProgress | null) {
  if (!progress?.trend || progress.trend.length === 0) {
    return 'No data yet';
  }

  const latestWeek = progress.trend[progress.trend.length - 1];
  const currentValue = latestWeek.value;

  switch (goal.type) {
    case 'body_fat': {
      const target = (goal.params as any).targetPct;
      return `${currentValue.toFixed(1)}% → ${target}%`;
    }
    case 'weight': {
      const target = (goal.params as any).targetWeightKg;
      return `${currentValue.toFixed(1)} kg → ${target} kg`;
    }
    case 'lean_mass_gain': {
      const target = (goal.params as any).targetKg;
      const gained = currentValue - ((goal.params as any).startingKg || currentValue);
      return `+${gained.toFixed(1)} kg / ${target} kg`;
    }
    default:
      return `${currentValue.toFixed(1)}`;
  }
}

function getNumericProgressColor(percent: number, theme: any) {
  if (percent >= 100) return '#22c55e'; // green - achieved
  if (percent >= 70) return theme.gold; // gold - close
  if (percent >= 30) return '#f59e0b'; // amber - progress
  return '#ef4444'; // red - needs work
}

function renderTrendText(trend: any[]) {
  if (trend.length < 2) return 'Building trend data...';
  
  const latest = trend[trend.length - 1].value;
  const previous = trend[trend.length - 2].value;
  const change = latest - previous;
  const direction = change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️';
  
  return `${direction} ${Math.abs(change).toFixed(1)} from last week`;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  streakRow: {
    marginTop: 10,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
  },
  streakContainer: {
    marginTop: 10,
  },
  streakProgress: {
    marginBottom: 6,
  },
  streakNumbers: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  streakBar: {
    height: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
  streakFill: {
    height: '100%',
    borderRadius: 6,
  },
  streakStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  numericContainer: {
    marginTop: 10,
  },
  numericProgress: {
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  trendText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

