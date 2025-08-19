import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';
import React from 'react';

// Mock react-native to avoid loading Flow syntax and native modules in Node env
vi.mock('react-native', () => {
  return {
    View: (props: any) => null,
    Text: (props: any) => null,
    TouchableOpacity: (props: any) => null,
    StyleSheet: { create: (styles: any) => styles, hairlineWidth: 1 },
  };
});

import IdealComparisonCard from '@/app/components/IdealComparisonCard';

describe('IdealComparisonCard', () => {
  it('renders element with required props', () => {
    const el = React.createElement(IdealComparisonCard as any, {
      themeMode: 'light',
      idealCalories: 2200,
      actualCalories: 2000,
      deltaCalories: -200,
      idealProtein: 150,
      actualProtein: 140,
      deltaProtein: -10,
      idealCarbs: 220,
      actualCarbs: 200,
      deltaCarbs: -20,
      idealFat: 70,
      actualFat: 65,
      deltaFat: -5,
    });
    expect(el).toBeTruthy();
  });
});
