/**
 * TDEE image export utility functions
 * Handles image capture, compression, and camera roll operations
 */

import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { 
  ImageCaptureOptions, 
  ImageCaptureResult, 
  SaveToLibraryOptions, 
  SaveToLibraryResult,
  ExportError,
  ExportErrorType
} from '@/types/image-export';
import { ensureMediaLibraryPermission } from '@/utils/permissions';

/**
 * Default image capture options optimized for TDEE reports
 */
const DEFAULT_CAPTURE_OPTIONS: ImageCaptureOptions = {
  format: 'jpg',
  quality: 0.8,
  result: 'tmpfile',
  width: undefined, // Use original dimensions
  height: undefined
};

/**
 * Capture full content of a React Native view as an image
 */
export async function captureViewAsImage(
  viewRef: React.RefObject<any>,
  options: Partial<ImageCaptureOptions> = {}
): Promise<ImageCaptureResult> {
  const captureOptions = { ...DEFAULT_CAPTURE_OPTIONS, ...options };
  
  try {
    if (!viewRef.current) {
      throw new Error('View reference is null or undefined');
    }

    const uri = await captureRef(viewRef.current, captureOptions);
    
    // Get image dimensions
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      throw new Error('Captured image file does not exist');
    }

    // For now, we'll use placeholder dimensions since FileSystem doesn't provide them
    // In a real implementation, you might use expo-image-manipulator to get dimensions
    const result: ImageCaptureResult = {
      uri,
      width: captureOptions.width || 375, // Placeholder
      height: captureOptions.height || 812, // Placeholder
    };

    // Add base64 data if requested
    if (captureOptions.result === 'base64' || captureOptions.result === 'zip-base64') {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      result.base64 = base64;
    }

    return result;
  } catch (error) {
    console.error('Error capturing view as image:', error);
    throw createExportError('capture_failed', 'Failed to capture view as image', error as Error);
  }
}

/**
 * Save image to device camera roll/photo library
 */
export async function saveImageToLibrary(
  imageUri: string,
  options: SaveToLibraryOptions = {}
): Promise<SaveToLibraryResult> {
  try {
    // Ensure we have permission to save to media library
    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) {
      throw createExportError('permission_denied', 'Permission denied to access photo library');
    }

    // Generate filename with timestamp if not provided
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = options.filename || `TDEE-Report-${timestamp}.jpg`;

    // Save to media library
    const asset = await MediaLibrary.createAssetAsync(imageUri);
    
    // Create album if specified
    if (options.album) {
      try {
        let album = await MediaLibrary.getAlbumAsync(options.album);
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(options.album, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (albumError) {
        console.warn('Failed to create/add to album, but image was saved:', albumError);
      }
    }

    const result: SaveToLibraryResult = {
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename || filename,
      creationTime: asset.creationTime || Date.now(),
    };

    return result;
  } catch (error) {
    console.error('Error saving image to library:', error);
    if (error instanceof Error && error.message.includes('permission')) {
      throw createExportError('permission_denied', 'Permission denied to save image', error);
    }
    throw createExportError('save_failed', 'Failed to save image to photo library', error as Error);
  }
}

/**
 * Complete image export workflow: capture view and save to camera roll
 */
export async function exportViewAsImage(
  viewRef: React.RefObject<any>,
  captureOptions: Partial<ImageCaptureOptions> = {},
  saveOptions: SaveToLibraryOptions = {}
): Promise<SaveToLibraryResult> {
  try {
    // Step 1: Capture the view as an image
    const captureResult = await captureViewAsImage(viewRef, captureOptions);
    
    // Step 2: Save the captured image to camera roll
    const saveResult = await saveImageToLibrary(captureResult.uri, saveOptions);
    
    // Step 3: Clean up temporary file
    await cleanupTemporaryFile(captureResult.uri);
    
    return saveResult;
  } catch (error) {
    console.error('Error in complete export workflow:', error);
    throw error; // Re-throw the specific error from capture or save
  }
}

/**
 * Clean up temporary files created during image capture
 */
export async function cleanupTemporaryFile(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.warn('Failed to cleanup temporary file:', uri, error);
    // Don't throw error for cleanup failures
  }
}

/**
 * Optimize image for sharing (compress and resize if needed)
 */
export async function optimizeImageForSharing(
  imageUri: string,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<string> {
  try {
    // This would typically use expo-image-manipulator for resizing/compression
    // For now, we'll return the original URI as a placeholder
    // In a real implementation:
    // const manipulatedImage = await ImageManipulator.manipulateAsync(
    //   imageUri,
    //   [{ resize: { width: maxWidth } }],
    //   { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    // );
    // return manipulatedImage.uri;
    
    return imageUri;
  } catch (error) {
    console.error('Error optimizing image:', error);
    return imageUri; // Return original if optimization fails
  }
}

/**
 * Check if image export is supported on current platform
 */
export function isImageExportSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Get estimated file size for image capture options
 */
export function estimateImageFileSize(
  width: number,
  height: number,
  quality: number = 0.8
): number {
  // Rough estimation: width * height * 3 (RGB) * quality factor
  const baseSize = width * height * 3;
  const compressionFactor = quality * 0.1; // JPEG compression reduces size significantly
  return Math.round(baseSize * compressionFactor);
}

/**
 * Create standardized export error
 */
function createExportError(
  type: ExportErrorType,
  message: string,
  originalError?: Error
): ExportError {
  return {
    type,
    message,
    originalError
  };
}
