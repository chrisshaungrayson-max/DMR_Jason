import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
    <View
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
      testID={`goal-card-${goal.id}`}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.darkText }]} numberOfLines={1}>
          {renderTitle(goal)}
        </Text>
        <View style={[styles.badge, { backgroundColor: theme.gold }]}>
          <Text style={styles.badgeText} testID={`goal-badge-${goal.type}`}>{typeLabel[goal.type]}</Text>
        </View>
      </View>

      <Text style={[styles.meta, { color: theme.lightText }]}>Status: {renderStatus(goal)}</Text>

      {isStreak ? (
        <View style={styles.streakContainer}>
          {progress?.streak ? (
            <>
              <View style={styles.streakProgress}>
                <Text style={[styles.streakNumbers, { color: theme.darkText }]}>
                  {progress.streak.current}/{progress.streak.target} days
                </Text>
                <View style={[styles.streakBar, { backgroundColor: theme.border }]}>
                  <View 
                    style={[
                      styles.streakFill, 
                      { 
                        width: `${Math.min(100, (progress.streak.current / progress.streak.target) * 100)}%`,
                        backgroundColor: getStreakColor(progress.streak.current, progress.streak.target, theme)
                      }
                    ]} 
                  />
                </View>
              </View>
              <Text style={[styles.streakStatus, { color: getStreakStatusColor(progress.streak.current, progress.streak.target, theme) }]}>
                {getStreakStatusText(progress.streak.current, progress.streak.target)}
              </Text>
            </>
          ) : (
            <Text style={[styles.streakText, { color: theme.lightText }]}>—</Text>
          )}
        </View>
      ) : (
        <View style={styles.numericContainer}>
          <View style={styles.numericProgress}>
            <Text style={[styles.progressText, { color: theme.darkText }]}>
              {renderNumericProgress(goal, progress)}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View style={[
                styles.progressFill, 
                { 
                  width: `${percent}%`, 
                  backgroundColor: getNumericProgressColor(percent, theme)
                }
              ]} />
            </View>
          </View>
          {progress?.trend && progress.trend.length > 0 && (
            <Text style={[styles.trendText, { color: theme.lightText }]}>
              {renderTrendText(progress.trend)}
            </Text>
          )}
        </View>
      )}

      {!!progress?.label && (
        <Text style={[styles.meta, { color: theme.lightText }]}>{progress.label}</Text>
      )}
    </View>
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

