/**
 * Test setup file for vitest
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Define global __DEV__ for React Native environment
(globalThis as any).__DEV__ = true;

// Mock React Native modules
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Alert: {
    alert: vi.fn()
  },
  Dimensions: {
    get: vi.fn(() => ({ width: 375, height: 812 }))
  }
}));

// Mock Expo modules
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  }
}));

vi.mock('expo-sharing', () => ({
  shareAsync: vi.fn()
}));

vi.mock('expo-file-system', () => ({
  deleteAsync: vi.fn(),
  getInfoAsync: vi.fn()
}));

vi.mock('react-native-view-shot', () => ({
  captureRef: vi.fn()
}));
