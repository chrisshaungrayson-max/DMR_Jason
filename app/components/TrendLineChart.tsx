import React from 'react';
import { View, Dimensions, StyleSheet, Platform } from 'react-native';
import { Text, Heading } from '@gluestack-ui/themed';
import { LineChart } from 'react-native-chart-kit';
import Colors from '@/constants/colors';
import { useUser } from '@/store/user-store';
import type { ChartSeries } from '@/utils/analytics';

export type TrendLineChartProps = {
  title?: string;
  series: ChartSeries;
  metricLabel?: string; // e.g., "Calories", "Protein (g)"
  height?: number;
  width?: number;
};

export default function TrendLineChart({ title, series, metricLabel, height = 220, width }: TrendLineChartProps) {
  const { colorScheme } = useUser();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const chartWidth = width ?? Math.min(Dimensions.get('window').width - 32, 640);

  // Datasets: primary metric + optional constant target line
  const hasData = series?.labels?.length && series?.data?.length;
  const labels = hasData ? series.labels : [''];
  const primaryData = hasData ? series.data : [0];
  const targetData = series.target != null ? new Array(labels.length).fill(series.target) : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]} testID="trend-chart"> 
      {title ? <Text style={[styles.title, { color: theme.darkText }]}>{title}</Text> : null}
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data: primaryData,
              color: () => theme.tint,
              strokeWidth: Platform.OS === 'ios' ? 3 : 2,
            },
            ...(targetData
              ? [
                  {
                    data: targetData,
                    color: () => theme.gold,
                    strokeWidth: 2,
                    withDots: false,
                  } as any,
                ]
              : []),
          ],
          legend: metricLabel ? [metricLabel, ...(targetData ? ['Target'] : [])] : undefined,
        }}
        width={chartWidth}
        height={height}
        fromZero
        withInnerLines
        withOuterLines
        yAxisLabel={''}
        yAxisSuffix={''}
        chartConfig={{
          backgroundGradientFrom: theme.cardBackground,
          backgroundGradientTo: theme.cardBackground,
          decimalPlaces: 0,
          color: (opacity = 1) => theme.darkText + Math.round(opacity * 255).toString(16).padStart(2, '0'),
          labelColor: () => theme.lightText,
          propsForLabels: { fontSize: 10 },
          propsForDots: { r: '3', strokeWidth: '1', stroke: theme.cardBackground },
        }}
        bezier
        style={{ borderRadius: Platform.OS === 'ios' ? 12 : 8 }}
      />
    </View>
  );
}

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
});
