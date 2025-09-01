import { StyleSheet, View, ScrollView, Alert, Platform, TouchableOpacity, FlatList } from 'react-native';
import { Text, Heading, Pressable, Box } from '@gluestack-ui/themed';
import React, { useMemo } from 'react';
import { useNutritionStore } from '@/store/nutrition-store';
import { DailyNutritionRecord, NutritionEntry } from '@/types/nutrition';
import { useUser } from '@/store/user-store';
import Colors from '@/constants/colors';
import { Stack, useRouter } from 'expo-router';
import { buildTrendSeries } from '@/utils/analytics';
import TrendLineChart from '@/app/components/TrendLineChart';
import { useGoals } from '@/store/goals-store';
import { computeAvgDailyMacros } from '@/utils/idealComparison';
import IdealComparisonCard from '@/app/components/IdealComparisonCard';
import EmptyState from '@/app/components/EmptyState';
import StreakHeatmap from '@/app/components/StreakHeatmap';
import { strings } from '@/utils/strings';
import { buildProteinCompliance, toWeeklyGrid } from '@/utils/streak';

export default function HistoryScreen() {
  const { dailyRecords, isLoading } = useNutritionStore();
  const { colorScheme, ideal } = useUser();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const router = useRouter();
  const { byType } = useGoals();

  const sortedRecords = useMemo(() => {
    return [...dailyRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dailyRecords]);

  // Determine metric and optional target based on active goals (protein target if available)
  const chartSeries = useMemo(() => {
    // Try to find an active protein streak goal to get gramsPerDay target
    const proteinGoals = byType ? byType('protein_streak') : [];
    const activeProtein = proteinGoals?.find((g) => g.active && g.status === 'active');
    const target = typeof (activeProtein as any)?.params?.gramsPerDay === 'number'
      ? (activeProtein as any).params.gramsPerDay as number
      : undefined;

    return buildTrendSeries(sortedRecords as DailyNutritionRecord[], target ? 'protein' : 'calories', {
      weeks: 8,
      target,
    });
  }, [sortedRecords, byType]);

  // Actual averages over last 7 days
  const avg = useMemo(() => computeAvgDailyMacros(sortedRecords as DailyNutritionRecord[], 7, new Date()), [sortedRecords]);

  // Protein streak heatmap grid over last 28 days when protein goal active
  const proteinHeatmapGrid = useMemo(() => {
    const proteinGoals = byType ? byType('protein_streak') : [];
    const activeProtein = proteinGoals?.find((g) => g.active && g.status === 'active');
    const gramsPerDay = typeof (activeProtein as any)?.params?.gramsPerDay === 'number'
      ? (activeProtein as any).params.gramsPerDay as number
      : undefined;
    if (!gramsPerDay) return null;
    const pts = buildProteinCompliance(sortedRecords as DailyNutritionRecord[], gramsPerDay, 28, new Date());
    return toWeeklyGrid(pts);
  }, [sortedRecords, byType]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }: { item: DailyNutritionRecord }) => (
    <TouchableOpacity 
      style={[styles.recordCard, { backgroundColor: theme.cardBackground }]}
      testID={`record-${item.date}`}
      onPress={() => router.push({ pathname: '/results-popover', params: { date: item.date } })}
    >
      <Box style={styles.recordHeader}>
        <Text style={[styles.dateText, { color: theme.darkText }]}>{formatDate(item.date)}</Text>
        <Text style={[styles.caloriesText, { color: theme.gold }]}>{Math.ceil(item.total.calories)} cal</Text>
      </Box>
      
      <Box style={styles.macrosContainer}>
        <Box style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: theme.darkText }]}>{Math.ceil(item.total.protein)}g</Text>
          <Text style={[styles.macroLabel, { color: theme.lightText }]}>Protein</Text>
        </Box>
        <Box style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: theme.darkText }]}>{Math.ceil(item.total.carbs)}g</Text>
          <Text style={[styles.macroLabel, { color: theme.lightText }]}>Carbs</Text>
        </Box>
        <Box style={styles.macroItem}>
          <Text style={[styles.macroValue, { color: theme.darkText }]}>{Math.ceil(item.total.fat)}g</Text>
          <Text style={[styles.macroLabel, { color: theme.lightText }]}>Fat</Text>
        </Box>
      </Box>

      <Box style={styles.foodItemsContainer}>
        {item.entries.map((entry: NutritionEntry, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.entryItem}
            onPress={() => {
              const result = {
                calories: entry.total.calories,
                protein: entry.total.protein,
                carbs: entry.total.carbs,
                fat: entry.total.fat,
                items: entry.items,
              };
              router.push({
                pathname: '/results-popover',
                params: {
                  macros: JSON.stringify(result),
                  date: entry.date,
                  foodList: entry.foodList,
                },
              });
            }}
            testID={`history-entry-${item.date}-${index}`}
          >
            <Box style={styles.entryHeader}>
              <Text style={[styles.foodName, { color: theme.darkText }]}>{entry.foodList}</Text>
              <Box style={[styles.mealChip, { backgroundColor: isDarkMode ? '#2e2e2e' : '#eee', borderColor: theme.gold }]}> 
                <Text style={[styles.mealChipText, { color: theme.darkText }]}>{entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1)}</Text>
              </Box>
            </Box>
            <Box style={styles.entryMetaRow}>
              <Text style={[styles.foodCalories, { color: theme.lightText }]}>{Math.ceil(entry.total.calories)} cal</Text>
              <Text style={[styles.entryTime, { color: theme.lightText }]}>{new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
            </Box>
          </TouchableOpacity>
        ))}
      </Box>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      <Stack.Screen options={{ 
        title: 'History',
        headerStyle: { backgroundColor: theme.cardBackground },
        headerTintColor: theme.darkText,
      }} />

      {/* Analytics: Weekly Trend */}
      <Box style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <TrendLineChart
          title={chartSeries.target != null ? 'Protein Trend' : 'Calorie Trend'}
          series={chartSeries}
          metricLabel={chartSeries.target != null ? 'Protein (g avg/week)' : 'Calories (avg/week)'}
          height={220}
        />
      </Box>

      {/* Ideal vs Actual */}
      <Box style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <IdealComparisonCard
          themeMode={isDarkMode ? 'dark' : 'light'}
          idealCalories={ideal.calories}
          actualCalories={avg.calories}
          deltaCalories={avg.calories - ideal.calories}
          idealProtein={ideal.grams.protein}
          actualProtein={avg.grams.protein}
          deltaProtein={avg.grams.protein - ideal.grams.protein}
          idealCarbs={ideal.grams.carbs}
          actualCarbs={avg.grams.carbs}
          deltaCarbs={avg.grams.carbs - ideal.grams.carbs}
          idealFat={ideal.grams.fat}
          actualFat={avg.grams.fat}
          deltaFat={avg.grams.fat - ideal.grams.fat}
        />
      </Box>

      {/* Protein Streak Heatmap */}
      {proteinHeatmapGrid && (
        <Box style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <StreakHeatmap title="Protein Streak (Last 4 Weeks)" grid={proteinHeatmapGrid} />
        </Box>
      )}
      
      {isLoading ? (
        <Box style={styles.loadingContainer}>
          <Text style={{ color: theme.lightText }}>Loading history...</Text>
        </Box>
      ) : dailyRecords.length === 0 ? (
        <EmptyState
          title={strings.empty.history.title}
          description={strings.empty.history.description}
          actionLabel={strings.empty.history.actionLabel}
          onAction={() => router.push('/')}
          themeMode={isDarkMode ? 'dark' : 'light'}
          testID="history-empty"
          actionHint={strings.empty.history.actionHint}
        />
      ) : (
        <FlatList
          data={sortedRecords}
          renderItem={renderItem}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContainer}
          testID="history-list"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
  },
  recordCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: '700',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  foodItem: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 14,
  },
  foodCalories: {
    fontSize: 14,
  },
  entryTime: {
    fontSize: 12,
  },
  // Styles referenced by macro header UI
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  macroLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  foodItemsContainer: {
    gap: 8,
  },
  // Missing styles referenced by entry items
  entryItem: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  mealChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
