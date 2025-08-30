/**
 * Unit tests for ImageExportButton component
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Alert } from 'react-native';
import ImageExportButton from '../ImageExportButton';
import * as ImageExportUtils from '@/utils/tdee-image-export';
import * as PermissionUtils from '@/utils/permissions';

// Mock dependencies
vi.mock('@/utils/tdee-image-export');
vi.mock('@/utils/permissions');
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native');
  return {
    ...actual,
    Alert: {
      alert: vi.fn()
    }
  };
});

const mockExportUtils = vi.mocked(ImageExportUtils);
const mockPermissionUtils = vi.mocked(PermissionUtils);
const mockAlert = vi.mocked(Alert);

describe('ImageExportButton', () => {
  const mockViewRef = { current: {} };
  const defaultProps = {
    viewRef: mockViewRef as any,
    title: 'Save Image',
    onExportStart: vi.fn(),
    onExportSuccess: vi.fn(),
    onExportError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockExportUtils.isImageExportSupported.mockReturnValue(true);
  });

  it('should render with default props', () => {
    const { getByText, getByLabelText } = render(
      <ImageExportButton {...defaultProps} />
    );

    expect(getByText('Save Image')).toBeTruthy();
    expect(getByLabelText('Save Image')).toBeTruthy();
  });

  it('should render with custom title', () => {
    const { getByText } = render(
      <ImageExportButton {...defaultProps} title="Export TDEE" />
    );

    expect(getByText('Export TDEE')).toBeTruthy();
  });

  it('should be disabled when disabled prop is true', () => {
    const { getByLabelText } = render(
      <ImageExportButton {...defaultProps} disabled={true} />
    );

    const button = getByLabelText('Save Image');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('should be disabled when loading prop is true', () => {
    const { getByLabelText, getByText } = render(
      <ImageExportButton {...defaultProps} loading={true} />
    );

    const button = getByLabelText('Save Image');
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(getByText('Saving...')).toBeTruthy();
  });

  it('should be disabled when image export is not supported', () => {
    mockExportUtils.isImageExportSupported.mockReturnValue(false);

    const { getByLabelText } = render(
      <ImageExportButton {...defaultProps} />
    );

    const button = getByLabelText('Save Image');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('should show not supported alert when pressed on unsupported platform', async () => {
    mockExportUtils.isImageExportSupported.mockReturnValue(false);

    const { getByLabelText } = render(
      <ImageExportButton {...defaultProps} />
    );

    const button = getByLabelText('Save Image');
    fireEvent.press(button);

    expect(mockAlert.alert).toHaveBeenCalledWith(
      'Not Supported',
      'Image export is not supported on this platform.'
    );
  });

  it('should call export workflow on press', async () => {
    const mockResult = {
      id: 'asset-123',
      uri: 'ph://asset-123',
      filename: 'TDEE-Report.jpg',
      creationTime: Date.now()
    };

    mockExportUtils.exportViewAsImage.mockResolvedValue(mockResult);

    const { getByLabelText } = render(
      <ImageExportButton {...defaultProps} />
    );

    const button = getByLabelText('Save Image');
    fireEvent.press(button);

    await waitFor(() => {
      expect(defaultProps.onExportStart).toHaveBeenCalled();
      expect(mockExportUtils.exportViewAsImage).toHaveBeenCalledWith(
        mockViewRef,
        {},
        {}
      );
    });
  });

  it('should call onExportSuccess when export succeeds', async () => {
    const mockResult = {
      id: 'asset-123',
      uri: 'ph://asset-123',
      filename: 'TDEE-Report.jpg',
      creationTime: Date.now()
    };

    mockExportUtils.exportViewAsImage.mockResolvedValue(mockResult);

    const { getByLabelText } = render(
      <ImageExportButton {...defaultProps} />
    );

    const button = getByLabelText('Save Image');
    fireEvent.press(button);

    await waitFor(() => {
      expect(defaultProps.onExportSuccess).toHaveBeenCalledWith(mockResult);
    });

    expect(mockAlert.alert).toHaveBeenCalledWith(
      'Success',
      'Image saved to your photo library successfully!',
      expect.any(Array)
    );
  });

  it('should call onExportError when export fails', async () => {
    const mockError = {
      type: 'capture_failed',
      message: 'Failed to capture image',
      originalError: new Error('Capture error')
    };

    mockExportUtils.exportViewAsImage.mockRejectedValue(mockError);

    const { getByLabelText } = render(
      <ImageExportButton {...defaultProps} />
    );

    const button = getByLabelText('Save Image');
    fireEvent.press(button);

    await waitFor(() => {
      expect(defaultProps.onExportError).toHaveBeenCalledWith(mockError);
    });

    expect(mockAlert.alert).toHaveBeenCalledWith(
      'Export Failed',
      mockError.message,
      expect.any(Array)
    );
  });

  it('should show permission error message for permission denied', async () => {
    const mockError = {
      type: 'permission_denied',
      message: 'Permission denied',
      originalError: new Error('Permission error')
    };

    mockExportUtils.exportViewAsImage.mockRejectedValue(mockError);
    mockPermissionUtils.getPermissionStatusMessage.mockReturnValue(
      'Permission denied. Please enable photo library access in Settings.'
    );

    const { getByLabelText } = render(
      <ImageExportButton {...defaultProps} />
    );

    const button = getByLabelText('Save Image');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockPermissionUtils.getPermissionStatusMessage).toHaveBeenCalledWith('denied');
    });

    expect(mockAlert.alert).toHaveBeenCalledWith(
      'Export Failed',
      'Permission denied. Please enable photo library access in Settings.',
      expect.any(Array)
    );
  });

  it('should pass capture and save options to export function', async () => {
    const captureOptions = { format: 'png' as const, quality: 1 };
    const saveOptions = { album: 'Test Album' };
    const mockResult = {
      id: 'asset-123',
      uri: 'ph://asset-123',
      filename: 'test.png',
      creationTime: Date.now()
    };

    mockExportUtils.exportViewAsImage.mockResolvedValue(mockResult);

    const { getByLabelText } = render(
      <ImageExportButton 
        {...defaultProps} 
        captureOptions={captureOptions}
        saveOptions={saveOptions}
      />
    );

    const button = getByLabelText('Save Image');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockExportUtils.exportViewAsImage).toHaveBeenCalledWith(
        mockViewRef,
        captureOptions,
        saveOptions
      );
    });
  });

  it('should show loading state during export', async () => {
    let resolveExport: (value: any) => void;
    const exportPromise = new Promise((resolve) => {
      resolveExport = resolve;
    });

    mockExportUtils.exportViewAsImage.mockReturnValue(exportPromise);

    const { getByLabelText, getByText } = render(
      <ImageExportButton {...defaultProps} />
    );

    const button = getByLabelText('Save Image');
    fireEvent.press(button);

    // Should show loading state
    await waitFor(() => {
      expect(getByText('Saving...')).toBeTruthy();
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    // Resolve the export
    resolveExport!({
      id: 'asset-123',
      uri: 'ph://asset-123',
      filename: 'test.jpg',
      creationTime: Date.now()
    });

    // Should return to normal state
    await waitFor(() => {
      expect(getByText('Save Image')).toBeTruthy();
    });
  });
});
