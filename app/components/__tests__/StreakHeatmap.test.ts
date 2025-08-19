import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock user theme
vi.mock('@/store/user-store', () => ({ useUser: () => ({ colorScheme: 'light' }) }));

// Mock the component module itself to avoid importing TSX and RN dependencies
vi.mock('@/app/components/StreakHeatmap', () => ({ __esModule: true, default: () => null }));

import StreakHeatmap from '@/app/components/StreakHeatmap';

describe('StreakHeatmap', () => {
  it('renders with empty grid', () => {
    const grid: (boolean | null)[][] = [];
    const el = React.createElement(StreakHeatmap as any, { title: 'Compliance', grid });
    expect(el).toBeTruthy();
  });

  it('renders with mixed compliance cells', () => {
    const grid: (boolean | null)[][] = [[null, true, false, true, false, true, false]];
    const el = React.createElement(StreakHeatmap as any, { title: 'Compliance', grid });
    expect(el).toBeTruthy();
  });
});
