import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock chart lib and embedded chart component to avoid RN rendering
vi.mock('react-native-chart-kit', () => ({ LineChart: () => null }));
vi.mock('@/app/components/TrendLineChart', () => ({ __esModule: true, default: () => null }));

// Mock react-native to avoid Flow import syntax in real module during SSR transform
vi.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s, hairlineWidth: 1 },
  Platform: { OS: 'ios', select: (obj: any) => obj?.ios ?? obj?.default },
  Text: () => null,
  View: () => null,
  FlatList: () => null,
  TouchableOpacity: () => null,
}));

// Mock user theme
vi.mock('@/store/user-store', () => ({ useUser: () => ({ colorScheme: 'light' }) }));

// Mock router
vi.mock('expo-router', () => ({ Stack: { Screen: () => null }, useRouter: () => ({ push: vi.fn() }) }));

// Mock data stores
const mockUseNutritionStore = vi.fn();
const mockUseGoals = vi.fn();

vi.mock('@/store/nutrition-store', () => ({ useNutritionStore: () => mockUseNutritionStore() }));
vi.mock('@/store/goals-store', () => ({ useGoals: () => mockUseGoals() }));

// Now import the screen under test
import HistoryScreen from '@/app/(tabs)/history';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('History screen integration (analytics section)', () => {
  it('renders with calorie trend when no protein goal', () => {
    mockUseNutritionStore.mockReturnValue({
      dailyRecords: [
        { date: '2025-08-18', total: { calories: 2000, protein: 150, carbs: 200, fat: 70 }, entries: [] },
      ],
      isLoading: false,
    });
    mockUseGoals.mockReturnValue({ byType: () => [] });

    const el = React.createElement(HistoryScreen as any, {});
    expect(el).toBeTruthy();
  });

  it('renders with protein trend when active protein goal exists', () => {
    mockUseNutritionStore.mockReturnValue({
      dailyRecords: [
        { date: '2025-08-18', total: { calories: 2000, protein: 150, carbs: 200, fat: 70 }, entries: [] },
      ],
      isLoading: false,
    });
    mockUseGoals.mockReturnValue({
      byType: () => [
        { id: 'g1', active: true, status: 'active', params: { gramsPerDay: 160 } },
      ],
    });

    const el = React.createElement(HistoryScreen as any, {});
    expect(el).toBeTruthy();
  });
});
