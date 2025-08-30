/**
 * ImageExportButton - Reusable button component for exporting views as images
 */

import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  View, 
  ActivityIndicator, 
  StyleSheet,
  Alert
} from 'react-native';
import { Download } from 'lucide-react-native';
import { ImageExportButtonProps, ExportState } from '@/types/image-export';
import { exportViewAsImage } from '@/utils/tdee-image-export';
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
  captureOptions = {},
  saveOptions = {}
}: ImageExportButtonProps) {
  const [exportState, setExportState] = useState<ExportState>({
    status: 'idle'
  });

  const isLoading = loading || exportState.status === 'capturing' || exportState.status === 'saving';
  const isDisabled = disabled || isLoading || !isImageExportSupported();

  const handleExport = async () => {
    try {
      // Check if export is supported
      if (!isImageExportSupported()) {
        Alert.alert(
          'Not Supported',
          'Image export is not supported on this platform.'
        );
        return;
      }

      // Start export process
      setExportState({ status: 'capturing' });
      onExportStart?.();

      // Update to saving status
      setExportState({ status: 'saving' });

      // Perform the export
      const result = await exportViewAsImage(viewRef, captureOptions, saveOptions);

      // Success
      setExportState({ 
        status: 'success', 
        result 
      });
      
      onExportSuccess?.(result);

      // Show success message
      Alert.alert(
        'Success',
        'Image saved to your photo library successfully!',
        [{ text: 'OK', onPress: () => setExportState({ status: 'idle' }) }]
      );

    } catch (error: any) {
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

      onExportError?.(exportError);

      // Show error message
      let errorMessage = exportError.message;
      if (exportError.type === 'permission_denied') {
        errorMessage = getPermissionStatusMessage('denied');
      }

      Alert.alert(
        'Export Failed',
        errorMessage,
        [{ text: 'OK', onPress: () => setExportState({ status: 'idle' }) }]
      );
    }
  };

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
