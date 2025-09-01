import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react-native';
import React from 'react';
import { ImageExportButton } from '../ImageExportButton';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';

// Mock the export utilities
vi.mock('@/utils/tdee-image-export', () => ({
  isImageExportSupported: vi.fn(() => true),
  exportViewAsImage: vi.fn(),
  getExportPerformanceStats: vi.fn(() => ({ totalExports: 0, averageTime: 0 })),
  getDevicePerformanceTier: vi.fn(() => 'medium'),
  checkPhotoLibraryPermission: vi.fn(() => Promise.resolve({ granted: true, canRequest: false })),
  requestPhotoLibraryPermission: vi.fn(() => Promise.resolve(true))
}));

vi.mock('@/utils/permissions', () => ({
  getPermissionStatusMessage: vi.fn(() => 'Permission required')
}));

// Mock ref object
const mockViewRef = { current: null };

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <GluestackUIProvider config={config}>
    {children}
  </GluestackUIProvider>
);

describe('ImageExportButton Gluestack Migration', () => {
  it('should render with Gluestack Button component', () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <ImageExportButton 
          viewRef={mockViewRef}
          title="Export Image"
        />
      </TestWrapper>
    );

    const button = getByLabelText('Export Image');
    expect(button).toBeTruthy();
  });

  it('should display correct text content', () => {
    const { getByText } = render(
      <TestWrapper>
        <ImageExportButton 
          viewRef={mockViewRef}
          title="Save to Photos"
        />
      </TestWrapper>
    );

    expect(getByText('Save to Photos')).toBeTruthy();
  });

  it('should show loading state correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <ImageExportButton 
          viewRef={mockViewRef}
          title="Export"
          loading={true}
        />
      </TestWrapper>
    );

    expect(getByText('Saving...')).toBeTruthy();
  });

  it('should handle disabled state', () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <ImageExportButton 
          viewRef={mockViewRef}
          title="Export"
          disabled={true}
        />
      </TestWrapper>
    );

    const button = getByLabelText('Export');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('should use default title when none provided', () => {
    const { getByText } = render(
      <TestWrapper>
        <ImageExportButton viewRef={mockViewRef} />
      </TestWrapper>
    );

    expect(getByText('Save Image')).toBeTruthy();
  });

  it('should render with custom style prop', () => {
    const customStyle = { marginTop: 20 };
    
    const { getByLabelText } = render(
      <TestWrapper>
        <ImageExportButton 
          viewRef={mockViewRef}
          title="Custom Style Test"
          style={customStyle}
        />
      </TestWrapper>
    );

    const button = getByLabelText('Custom Style Test');
    expect(button).toBeTruthy();
  });

  it('should maintain accessibility properties', () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <ImageExportButton 
          viewRef={mockViewRef}
          title="Accessible Button"
        />
      </TestWrapper>
    );

    const button = getByLabelText('Accessible Button');
    expect(button.props.accessibilityLabel).toBe('Accessible Button');
  });
});
