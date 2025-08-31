/**
 * ImageExportButton - Reusable button component for exporting views as images
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  View, 
  ActivityIndicator, 
  StyleSheet,
  Alert,
  InteractionManager,
  Platform
} from 'react-native';
import { Download } from 'lucide-react-native';
import { ImageExportButtonProps, ExportState } from '@/types/image-export';
import { exportViewAsImage, getExportPerformanceStats, getDevicePerformanceTier, checkPhotoLibraryPermission, requestPhotoLibraryPermission } from '@/utils/tdee-image-export';
import { isImageExportSupported } from '@/utils/tdee-image-export';
import { getPermissionStatusMessage } from '@/utils/permissions';

export function ImageExportButton({
  viewRef,
  title = 'Save Image',
  style,
  disabled = false,
  loading = false,
  onExportStart,
  onExportSuccess,
  onExportError,
  onBeforeCapture,
  onAfterCapture,
  captureOptions = {},
  saveOptions = {}
}: ImageExportButtonProps) {
  const [exportState, setExportState] = useState<ExportState>({
    status: 'idle'
  });
  const exportTimeoutRef = useRef<number | null>(null);

  const isLoading = loading || exportState.status === 'capturing' || exportState.status === 'saving';
  const isDisabled = disabled || isLoading || !isImageExportSupported();

  // Optimized export handler with explicit permission handling
  const handleExport = useCallback(async () => {
    // Clear any existing timeout
    if (exportTimeoutRef.current) {
      clearTimeout(exportTimeoutRef.current);
    }

    try {
      // Check if export is supported
      if (!isImageExportSupported()) {
        Alert.alert(
          'Not Supported',
          'Image export is not supported on this platform.'
        );
        return;
      }

      // Check photo library permissions first
      const permissionStatus = await checkPhotoLibraryPermission();
      
      if (!permissionStatus.granted) {
        if (permissionStatus.canRequest) {
          // Ask user if they want to grant permission
          Alert.alert(
            'Photo Library Access Required',
            'This app needs permission to save images to your photo library. Would you like to grant permission?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Grant Permission', onPress: async () => {
                const granted = await requestPhotoLibraryPermission();
                if (granted) {
                  // Retry export after permission granted
                  handleExport();
                } else {
                  Alert.alert(
                    'Permission Denied',
                    'Cannot save image without photo library permission. You can grant permission in Settings > Privacy & Security > Photos.'
                  );
                }
              }}
            ]
          );
          return;
        } else {
          Alert.alert(
            'Permission Required',
            'Photo library permission is required to save images. Please enable it in Settings > Privacy & Security > Photos.'
          );
          return;
        }
      }

      // Start export process
      setExportState({ status: 'capturing' });
      onExportStart?.();

      // Allow parent to prepare the target view before we begin capture/save
      if (onBeforeCapture) {
        try {
          await onBeforeCapture();
        } catch (prepErr) {
          console.warn('onBeforeCapture failed, continuing with export:', prepErr);
        }
      }

      // Set realistic timeout - the bottleneck was MediaLibrary operations, not the screenshot
      const deviceTier = getDevicePerformanceTier();
      const timeoutDuration = deviceTier === 'high' ? 8000 : deviceTier === 'medium' ? 12000 : 18000;
      
      exportTimeoutRef.current = setTimeout(() => {
        console.warn(`Export taking longer than expected after ${timeoutDuration}ms`);
        // DON'T reset UI state yet - show dialog first
        Alert.alert(
          'Export Taking Longer Than Expected',
          `The export is still processing. This can happen with complex layouts. Would you like to continue waiting?`,
          [
            { text: 'Keep Waiting', onPress: () => {
              // Extend timeout by another period without resetting state
              exportTimeoutRef.current = setTimeout(() => {
                console.warn('Final timeout reached, cancelling export');
                setExportState({ status: 'idle' });
                // Ensure parent cleans up export view if still mounted
                try { onAfterCapture?.(); } catch {}
                Alert.alert('Export Timeout', 'Export process has been cancelled. Please try again with simpler content or lower quality.');
              }, timeoutDuration);
            }},
            { text: 'Cancel Export', onPress: () => {
              console.log('User cancelled export');
              setExportState({ status: 'idle' });
              // Cleanup export view immediately
              try { onAfterCapture?.(); } catch {}
            }}
          ]
        );
      }, timeoutDuration);

      // Run export in background to prevent UI blocking
      InteractionManager.runAfterInteractions(async () => {
        try {
          // Update to saving status
          setExportState({ status: 'saving' });

          // Perform the export with device-optimized settings
          const deviceTier = getDevicePerformanceTier();
          // iPhone 16 Pro Max can handle higher quality without performance issues
          const defaultQuality = deviceTier === 'high' ? 0.9 : deviceTier === 'medium' ? 0.7 : 0.6;
          
          const optimizedCaptureOptions = {
            ...captureOptions,
            // Use device-appropriate quality - higher for premium devices
            quality: captureOptions.quality ?? defaultQuality,
            format: captureOptions.format ?? 'jpg'
          };

          // Save options: rely on utils defaults for timeout unless explicitly provided
          const optimizedSaveOptions: any = {
            album: saveOptions.album,
            filename: saveOptions.filename,
            method: saveOptions.method ?? 'auto',
            retries: saveOptions.retries ?? (deviceTier === 'low' ? 2 : 1),
          };
          if (typeof saveOptions.timeoutMs === 'number') {
            optimizedSaveOptions.timeoutMs = saveOptions.timeoutMs;
          }

          const result = await exportViewAsImage(viewRef, optimizedCaptureOptions, optimizedSaveOptions);

          // Clear timeout on success
          if (exportTimeoutRef.current) {
            clearTimeout(exportTimeoutRef.current);
          }

          // Success
          setExportState({ 
            status: 'success', 
            result 
          });
          // Cleanup export view after successful save
          try { await onAfterCapture?.(); } catch {}
          
          onExportSuccess?.(result);

          // Show success message with performance stats
          const stats = getExportPerformanceStats();
          const successMessage = stats.totalExports > 0 
            ? `Image saved successfully! (Avg time: ${stats.averageTime}ms)`
            : 'Image saved to your photo library successfully!';

          Alert.alert(
            'Success',
            successMessage,
            [{ text: 'OK', onPress: () => setExportState({ status: 'idle' }) }]
          );

        } catch (error: any) {
          // Clear timeout on error
          if (exportTimeoutRef.current) {
            clearTimeout(exportTimeoutRef.current);
          }

          console.error('Export failed:', error);
          
          const exportError = {
            type: error.type || 'unknown_error',
            message: error.message || 'An unexpected error occurred',
            originalError: error.originalError || error
          };

          setExportState({ 
            status: 'error', 
            error: exportError 
          });

          // Ensure export view is cleaned up on failure
          try { await onAfterCapture?.(); } catch {}

          onExportError?.(exportError);

          // Show error message
          let errorMessage = exportError.message;
          if (exportError.type === 'permission_denied') {
            errorMessage = getPermissionStatusMessage('denied');
          } else if (exportError.type === 'save_timeout') {
            errorMessage = 'Saving took too long. This can happen with very large images or slow storage. Please try again; we will use a more aggressive fallback and tighter timeouts.';
          }

          Alert.alert(
            'Export Failed',
            errorMessage,
            [{ text: 'OK', onPress: () => setExportState({ status: 'idle' }) }]
          );
        }
      });

    } catch (error: any) {
      // Clear timeout on immediate error
      if (exportTimeoutRef.current) {
        clearTimeout(exportTimeoutRef.current);
      }

      console.error('Export setup failed:', error);
      // Cleanup if we prepared the view but failed early
      try { await onAfterCapture?.(); } catch {}
      setExportState({ status: 'idle' });
      Alert.alert(
        'Export Failed',
        'Failed to start export process. Please try again.'
      );
    }
  }, [viewRef, captureOptions, saveOptions, onExportStart, onExportSuccess, onExportError, onBeforeCapture, onAfterCapture]);

  return (
    <TouchableOpacity
      style={[styles.button, style, isDisabled && styles.disabled]}
      onPress={handleExport}
      disabled={isDisabled}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator 
            size="small" 
            color="#FFFFFF" 
            style={styles.icon}
          />
        ) : (
          <Download 
            size={16} 
            color="#FFFFFF" 
            style={styles.icon}
          />
        )}
        <Text style={[styles.text, isDisabled && styles.disabledText]}>
          {isLoading ? 'Saving...' : title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#D4A574',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  disabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#999999',
  },
});

export default ImageExportButton;
