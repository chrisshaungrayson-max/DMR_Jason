/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';

// Lightweight mock for react-native primitives used by the component
vi.mock('react-native', () => {
  const React = require('react');
  return {
    View: ({ children, ..._props }: any) => React.createElement('div', null, children),
    Text: ({ children, ..._props }: any) => React.createElement('span', null, children),
    StyleSheet: { create: (s: any) => s },
    Platform: { OS: 'ios' },
    Dimensions: { get: () => ({ width: 400, height: 800 }) },
  };
});

// Spy-able mock for LineChart that captures last received props
let lastLineChartProps: any = null;
vi.mock('react-native-chart-kit', () => ({
  LineChart: (props: any) => {
    lastLineChartProps = props;
    return null;
  },
}));

// Mock user theme hook to stabilize colors/branching
vi.mock('@/store/user-store', () => ({ useUser: () => ({ colorScheme: 'light' }) }));

import TrendLineChart from '@/app/components/TrendLineChart';

describe('TrendLineChart', () => {
  beforeEach(() => {
    lastLineChartProps = null;
  });

  it('renders with fallback labels/data when empty and wires props to LineChart', () => {
    const el = React.createElement(TrendLineChart as any, {
      title: 'Calorie Trend',
      series: { labels: [], data: [], target: undefined },
      metricLabel: 'Calories (avg/week)',
      height: 180,
    });
    const { unmount } = render(el);
    expect(el).toBeTruthy();

    // Should have been passed to LineChart with fallback values
    expect(lastLineChartProps).toBeTruthy();
    expect(lastLineChartProps.height).toBe(180);
    expect(lastLineChartProps.width).toBeGreaterThan(0);
    expect(lastLineChartProps.data.labels).toEqual(['']);
    expect(lastLineChartProps.data.datasets[0].data).toEqual([0]);
    // No legend when only metricLabel and no target? Legend should include metric label
    expect(lastLineChartProps.data.legend).toEqual(['Calories (avg/week)']);
  });

  it('includes target dataset and legend when target provided', () => {
    const el = React.createElement(TrendLineChart as any, {
      title: 'Protein Trend',
      series: { labels: ['Aug 12', 'Aug 19'], data: [150, 155], target: 160 },
      metricLabel: 'Protein (g avg/week)',
      width: 360,
    });
    const { unmount } = render(el);
    expect(el).toBeTruthy();

    expect(lastLineChartProps).toBeTruthy();
    expect(lastLineChartProps.width).toBe(360);
    const { labels, datasets, legend } = lastLineChartProps.data;
    expect(labels).toEqual(['Aug 12', 'Aug 19']);
    expect(datasets).toHaveLength(2); // primary + target line
    expect(datasets[0].data).toEqual([150, 155]);
    expect(datasets[1].data).toEqual([160, 160]);
    expect(legend).toEqual(['Protein (g avg/week)', 'Target']);
    unmount();
  });
});
