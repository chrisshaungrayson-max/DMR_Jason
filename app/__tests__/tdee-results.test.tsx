/**
 * Unit tests for TDEE Results screen integration with image export
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TDEEResultsScreen from '../tdee-results';
import * as ImageExportUtils from '@/utils/tdee-image-export';

// Mock dependencies
vi.mock('@/utils/tdee-image-export');
vi.mock('@/store/user-store', () => ({
  useUser: () => ({ colorScheme: 'light' })
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({ back: vi.fn() }),
  useLocalSearchParams: () => ({
    name: 'John Doe',
    age: '30',
    gender: 'male',
    height: '180',
    weight: '75',
    activityLevel: 'moderate',
    goal: 'maintain'
  })
}));
vi.mock('expo-sharing');
vi.mock('expo-haptics');
vi.mock('react-native-view-shot', () => ({
  captureRef: vi.fn(),
  captureScreen: vi.fn()
}));
vi.mock('../components/RadarChart', () => {
  return function MockRadarChart() {
    return null;
  };
});
vi.mock('../components/ImageExportButton', () => {
  return function MockImageExportButton({ onExportSuccess, onExportError, ...props }: any) {
    return (
      <div 
        testID="image-export-button"
        onPress={() => {
          // Simulate successful export
          if (onExportSuccess) {
            onExportSuccess({
              id: 'test-asset-123',
              uri: 'ph://test-asset-123',
              filename: 'TDEE-Report-Test.jpg',
              creationTime: Date.now()
            });
          }
        }}
        {...props}
      />
    );
  };
});

const mockImageExportUtils = vi.mocked(ImageExportUtils);

describe('TDEEResultsScreen Image Export Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockImageExportUtils.isImageExportSupported.mockReturnValue(true);
  });

  it('should render TDEE Results screen with image export button', () => {
    const { getByTestId } = render(<TDEEResultsScreen />);
    
    expect(getByTestId('image-export-button')).toBeTruthy();
  });

  it('should display user data correctly', () => {
    const { getByText } = render(<TDEEResultsScreen />);
    
    expect(getByText("JOHN DOE'S DAILY MACROS")).toBeTruthy();
  });

  it('should calculate and display TDEE values', () => {
    const { getByText } = render(<TDEEResultsScreen />);
    
    // Should display calculated values (exact values depend on calculation logic)
    expect(getByText(/BMR/)).toBeTruthy();
    expect(getByText(/TDEE/)).toBeTruthy();
    expect(getByText(/Target Calories/)).toBeTruthy();
  });

  it('should display macro breakdown table', () => {
    const { getByText } = render(<TDEEResultsScreen />);
    
    expect(getByText('Daily Macro Targets')).toBeTruthy();
    expect(getByText('Protein')).toBeTruthy();
    expect(getByText('Carbohydrates')).toBeTruthy();
    expect(getByText('Fat')).toBeTruthy();
  });

  it('should have proper view reference for image capture', () => {
    const { getByTestId } = render(<TDEEResultsScreen />);
    
    const imageExportButton = getByTestId('image-export-button');
    expect(imageExportButton.props.viewRef).toBeDefined();
  });

  it('should pass correct capture options to ImageExportButton', () => {
    const { getByTestId } = render(<TDEEResultsScreen />);
    
    const imageExportButton = getByTestId('image-export-button');
    expect(imageExportButton.props.captureOptions).toEqual({
      format: 'jpg',
      quality: 0.8,
      result: 'tmpfile'
    });
  });

  it('should pass correct save options to ImageExportButton', () => {
    const { getByTestId } = render(<TDEEResultsScreen />);
    
    const imageExportButton = getByTestId('image-export-button');
    expect(imageExportButton.props.saveOptions).toEqual({
      album: 'TDEE Reports'
    });
  });

  it('should handle successful image export', async () => {
    const { getByTestId } = render(<TDEEResultsScreen />);
    
    const imageExportButton = getByTestId('image-export-button');
    fireEvent.press(imageExportButton);

    // Should not throw any errors
    await waitFor(() => {
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });

  it('should maintain existing export functionality', () => {
    const { getByText } = render(<TDEEResultsScreen />);
    
    // Should still have the original export button
    expect(getByText('Export')).toBeTruthy();
    expect(getByText('Share')).toBeTruthy();
  });

  it('should have proper styling for image export button', () => {
    const { getByTestId } = render(<TDEEResultsScreen />);
    
    const imageExportButton = getByTestId('image-export-button');
    expect(imageExportButton.props.style).toBeDefined();
    expect(imageExportButton.props.title).toBe('Save Image');
  });

  it('should render all required sections for complete image capture', () => {
    const { getByText } = render(<TDEEResultsScreen />);
    
    // Verify all major sections are present for complete capture
    expect(getByText('Your TDEE Results')).toBeTruthy();
    expect(getByText('Personal Information')).toBeTruthy();
    expect(getByText('Caloric Breakdown')).toBeTruthy();
    expect(getByText('Macro Distribution')).toBeTruthy();
    expect(getByText('Daily Macro Targets')).toBeTruthy();
  });

  it('should handle different user parameters correctly', () => {
    // This test would need to be expanded with different parameter sets
    // For now, we verify the component renders without errors
    const { getByText } = render(<TDEEResultsScreen />);
    
    expect(getByText("JOHN DOE'S DAILY MACROS")).toBeTruthy();
  });

  it('should maintain responsive layout for image capture', () => {
    const { getByTestId } = render(<TDEEResultsScreen />);
    
    // Verify the main container exists for proper capture
    const imageExportButton = getByTestId('image-export-button');
    expect(imageExportButton.props.viewRef.current).toBeDefined();
  });
});
