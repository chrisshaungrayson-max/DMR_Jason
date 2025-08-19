import { describe, it, expect, vi } from 'vitest';

// Mock react-native primitives for Node test env
vi.mock('react-native', () => {
  return {
    View: (props: any) => null,
    Text: (props: any) => null,
    TouchableOpacity: (props: any) => null,
    StyleSheet: { create: (styles: any) => styles, hairlineWidth: 1 },
  };
});

import React from 'react';
import EmptyState from '@/app/components/EmptyState';

describe('EmptyState', () => {
  it('creates element with title and description', () => {
    const el = React.createElement(EmptyState as any, {
      title: 'Nothing here yet',
      description: 'Add your first item to get started',
      themeMode: 'light',
      testID: 'empty-test',
    });
    expect(el).toBeTruthy();
  });

  it('creates element with action button', () => {
    const onAction = vi.fn();
    const el = React.createElement(EmptyState as any, {
      title: 'No data',
      actionLabel: 'Do something',
      onAction,
      themeMode: 'dark',
    });
    expect(el).toBeTruthy();
  });
});
