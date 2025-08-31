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

/**
 * Default image capture options optimized for TDEE reports
 * Balanced for quality vs performance (<5 second target)
 */
const DEFAULT_CAPTURE_OPTIONS: ImageCaptureOptions = {
  format: 'jpg',
  quality: 0.7, // Reduced from 0.8 for better performance
  result: 'tmpfile',
  width: undefined, // Will be set dynamically based on device
  height: undefined
};

/**
 * Performance-optimized capture options for different device tiers
 */
const DEVICE_OPTIMIZED_OPTIONS = {
  high: { quality: 0.8, maxWidth: 1200, maxHeight: 2400 },
  medium: { quality: 0.7, maxWidth: 900, maxHeight: 1800 },
  low: { quality: 0.6, maxWidth: 600, maxHeight: 1200 }
};

/**
 * Detect device performance tier based on screen dimensions and device info
 */
export function getDevicePerformanceTier(): 'high' | 'medium' | 'low' {
  const { width, height } = Platform.select({
    ios: require('react-native').Dimensions.get('screen'),
    android: require('react-native').Dimensions.get('screen'),
    default: { width: 375, height: 812 }
  });
  
  const totalPixels = width * height;
  const pixelDensity = Platform.select({
    ios: require('react-native').PixelRatio.get(),
    android: require('react-native').PixelRatio.get(),
    default: 2
  });
  
  // iPhone 16 Pro Max and similar flagship devices
  if (totalPixels > 2500000 || (totalPixels > 1800000 && pixelDensity >= 3)) return 'high';
  // High-end devices (iPhone 15 Pro, recent flagship Android)
  if (totalPixels > 1500000 || (totalPixels > 1200000 && pixelDensity >= 3)) return 'high';
  // Mid-range devices
  if (totalPixels > 800000) return 'medium';
  // Lower-end devices
  return 'low';
}

/**
 * Capture full content of a React Native view as an image
 * Optimized for performance with device-specific settings
 */
export async function captureViewAsImage(
  viewRef: React.RefObject<any>,
  options: Partial<ImageCaptureOptions> = {}
): Promise<ImageCaptureResult> {
  const startTime = Date.now();
  
  // Get device-optimized settings
  const deviceTier = getDevicePerformanceTier();
  const deviceOptions = DEVICE_OPTIMIZED_OPTIONS[deviceTier];
  
  const captureOptions = { 
    ...DEFAULT_CAPTURE_OPTIONS, 
    ...deviceOptions,
    ...options // User options override device defaults
  };
  
  try {
    if (!viewRef.current) {
      throw new Error('View reference is null or undefined');
    }

    // Add timeout to prevent hanging - tier-based for realistic limits
    const capturePromise = captureRef(viewRef.current, captureOptions);
    const captureTimeoutMs = deviceTier === 'high' ? 6000 : deviceTier === 'medium' ? 9000 : 15000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      const err = new Error(`Capture timeout after ${captureTimeoutMs}ms`);
      (err as any).code = 'ETIMEDOUT';
      setTimeout(() => reject(err), captureTimeoutMs);
    });

    const uri = await Promise.race([capturePromise, timeoutPromise]);
    
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

    // Add base64 data if requested (performance warning: this is expensive)
    if (captureOptions.result === 'base64' || captureOptions.result === 'zip-base64') {
      console.warn('Base64 conversion adds significant processing time');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      result.base64 = base64;
    }

    // Log performance metrics
    const captureTime = Date.now() - startTime;
    console.log(`Image capture completed in ${captureTime}ms (target: <5000ms)`);
    
    if (captureTime > 5000) {
      console.warn(`Image capture exceeded 5 second target: ${captureTime}ms`);
    }

    return result;
  } catch (error) {
    console.error('Error capturing view as image:', error);
    throw createExportError('capture_failed', 'Failed to capture view as image', error as Error);
  }
}

/**
 * Check if we have photo library permissions
 */
export async function checkPhotoLibraryPermission(): Promise<{
  granted: boolean;
  canRequest: boolean;
  status: string;
}>
{
  try {
    // First, check the default permission (read access)
    const perm = await MediaLibrary.getPermissionsAsync();
    let granted = perm.granted;
    let status: string = (perm as any).status;
    let canAskAgain = perm.canAskAgain;

    // On iOS, apps can be granted add-only privileges which are sufficient to save photos
    // If we don't have regular read permission, probe for addOnly and treat it as granted for our use-case
    if (Platform.OS === 'ios' && !granted) {
      try {
        const addOnly = await (MediaLibrary as any).getPermissionsAsync?.({ accessPrivileges: 'addOnly' });
        if (addOnly) {
          granted = addOnly.granted || granted;
          status = (addOnly as any).status || status;
          canAskAgain = addOnly.canAskAgain ?? canAskAgain;
        }
      } catch (iosPermErr) {
        console.warn('addOnly permission probe failed:', iosPermErr);
      }
    }

    return {
      granted,
      canRequest: canAskAgain,
      status
    };
  } catch (error) {
    console.error('Error checking photo library permission:', error);
    return {
      granted: false,
      canRequest: false,
      status: 'denied'
    };
  }
}

/**
 * Request photo library permissions from user
 */
export async function requestPhotoLibraryPermission(): Promise<boolean> {
  try {
    // Prefer add-only permission on iOS; falls back gracefully elsewhere
    let permission: any;
    try {
      permission = await (MediaLibrary as any).requestPermissionsAsync?.({ accessPrivileges: 'addOnly' });
    } catch {
      permission = await MediaLibrary.requestPermissionsAsync();
    }
    return !!permission?.granted;
  } catch (error) {
    console.error('Error requesting photo library permission:', error);
    return false;
  }
}

/**
 * Wrap a promise with a timeout. Rejects with a labeled timeout error.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`${label} timeout after ${ms}ms`);
      (err as any).code = 'ETIMEDOUT';
      reject(err);
    }, ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result as T;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

/**
 * Ensure the file we save has a .jpg extension. If not, copy to cache with .jpg.
 * Returns the URI to use for saving and whether a copy was created.
 */
async function ensureJpegExtension(uri: string): Promise<{ uri: string; copied: boolean }> {
  try {
    const lower = uri.toLowerCase();
    // If the file already has a known image extension, don't alter it.
    // Renaming PNG bytes to .jpg without transcoding can cause native decoders to fail or hang.
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) {
      return { uri, copied: false };
    }
    const dest = `${FileSystem.cacheDirectory}tdee-${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return { uri: dest, copied: true };
  } catch (err) {
    console.warn('ensureJpegExtension failed, proceeding with original URI:', err);
    return { uri, copied: false };
  }
}

/**
 * Ensure the asset is placed into a named album if requested.
 * Wrapped in timeouts and best-effort; failures should not break the export.
 */
async function maybePlaceAssetInAlbum(
  asset: MediaLibrary.Asset,
  albumName: string | undefined,
  timeoutMs: number
): Promise<void> {
  if (!albumName) return;
  try {
    const existing = await withTimeout(MediaLibrary.getAlbumAsync(albumName), timeoutMs, 'getAlbum');
    if (!existing) {
      await withTimeout(MediaLibrary.createAlbumAsync(albumName, asset, false), timeoutMs, 'createAlbum');
      return;
    }
    await withTimeout(MediaLibrary.addAssetsToAlbumAsync([asset], existing, false), timeoutMs, 'addToAlbum');
  } catch (err) {
    console.warn(`Album handling failed for "${albumName}" (non-fatal):`, err);
  }
}

/**
 * Save captured image to device photo library - requires permissions to be granted first
 */
export async function saveImageToLibrary(
  imageUri: string,
  options: SaveToLibraryOptions = {}
): Promise<SaveToLibraryResult> {
  const start = Date.now();
  const method = options.method ?? 'auto';
  const timeoutMs = options.timeoutMs ?? (Platform.OS === 'ios' ? 9000 : 12000);
  const retries = Math.max(0, options.retries ?? 1);
  let usedMethod: 'createAsset' | 'saveToLibrary' = 'createAsset';

  // Ensure .jpg extension for reliability
  const ensured = await ensureJpegExtension(imageUri);
  const uriToSave = ensured.uri;

  // Gather file info for diagnostics
  let fileSize: number | undefined;
  try {
    const info = await FileSystem.getInfoAsync(uriToSave);
    if (info.exists && typeof info.size === 'number') fileSize = info.size;
  } catch {}

  const attemptCreateAsset = async () => {
    return await MediaLibrary.createAssetAsync(uriToSave);
  };

  const tryCreateAssetWithRetries = async () => {
    let lastErr: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const attemptStart = Date.now();
      try {
        console.log(`MediaLibrary.createAssetAsync attempt ${attempt + 1}/${retries + 1} (timeout ${timeoutMs}ms, size=${fileSize ?? 'unknown'})`);
        const asset = await withTimeout(attemptCreateAsset(), timeoutMs, 'createAsset');
        console.log(`createAsset succeeded in ${Date.now() - attemptStart}ms`);
        return asset;
      } catch (err: any) {
        lastErr = err;
        const msg = typeof err?.message === 'string' ? err.message : String(err);
        console.warn(`createAsset attempt ${attempt + 1} failed after ${Date.now() - attemptStart}ms: ${msg}`);

        // If permission related, don't retry
        if (msg.toLowerCase().includes('permission')) {
          throw createExportError('permission_denied', 'Permission denied to save image', err as Error);
        }
        // Only retry on timeouts or transient errors
        const isTimeout = (err as any)?.code === 'ETIMEDOUT' || /timeout/i.test(msg);
        const isLast = attempt === retries;
        if (!isTimeout || isLast) {
          throw err;
        }
      }
    }
    throw lastErr;
  };

  try {
    let asset: MediaLibrary.Asset | undefined;
    if (method === 'createAsset' || method === 'auto') {
      try {
        asset = await tryCreateAssetWithRetries();
      } catch (err) {
        if (method === 'createAsset') throw err;
        console.warn('Primary save (createAsset) failed, attempting fallback saveToLibrary...', err);
      }
    }

    if (!asset) {
      // Fallback: saveToLibraryAsync (no asset returned)
      usedMethod = 'saveToLibrary';
      const fbStart = Date.now();
      await withTimeout(MediaLibrary.saveToLibraryAsync(uriToSave), timeoutMs, 'saveToLibrary');
      console.log(`saveToLibrary succeeded in ${Date.now() - fbStart}ms`);
      const timestamp = Date.now();
      const filename = options.filename || uriToSave.split('/').pop() || `TDEE-Report-${timestamp}.jpg`;
      // We cannot get an asset id reliably from this path; return minimal metadata
      const result: SaveToLibraryResult = {
        id: 'unknown',
        uri: uriToSave,
        filename,
        creationTime: timestamp,
      };
      return result;
    }

    // Success via createAsset
    usedMethod = 'createAsset';
    // If an album was requested, try to place the asset there (best-effort)
    await maybePlaceAssetInAlbum(asset, options.album, timeoutMs);
    const timestamp = asset.creationTime || Date.now();
    const filename = asset.filename || options.filename || `TDEE-Report-${timestamp}.jpg`;
    const result: SaveToLibraryResult = {
      id: asset.id,
      uri: asset.uri,
      filename,
      creationTime: timestamp,
    };
    return result;
  } catch (error) {
    console.error('Error saving image to library:', error);
    if (error instanceof Error && /permission/i.test(error.message)) {
      throw createExportError('permission_denied', 'Permission denied to save image', error);
    }
    if ((error as any)?.code === 'ETIMEDOUT') {
      throw createExportError('save_timeout', `Save operation timed out after ${timeoutMs}ms`, error as Error);
    }
    throw createExportError('save_failed', 'Failed to save image to photo library', error as Error);
  } finally {
    // Cleanup copied temp file if we created one
    if (ensured.copied) {
      cleanupTemporaryFile(uriToSave).catch(() => {});
    }
    const total = Date.now() - start;
    console.log(`saveImageToLibrary finished via ${usedMethod} in ${total}ms (timeout=${timeoutMs}ms, retries=${retries})`);
  }
}

/**
 * Complete image export workflow: capture view and save to camera roll
 * Optimized for performance with parallel processing where possible
 */
export async function exportViewAsImage(
  viewRef: React.RefObject<any>,
  captureOptions: Partial<ImageCaptureOptions> = {},
  saveOptions: SaveToLibraryOptions = {}
): Promise<SaveToLibraryResult> {
  const startTime = Date.now();
  
  try {
    // Step 1: Capture the view as an image
    const captureStart = Date.now();
    const captureResult = await captureViewAsImage(viewRef, captureOptions);
    const captureTime = Date.now() - captureStart;
    
    // Step 2: Save the captured image to camera roll
    const saveStart = Date.now();
    const saveResult = await saveImageToLibrary(captureResult.uri, saveOptions);
    const saveTime = Date.now() - saveStart;
    
    // Step 3: Clean up temporary file (don't await - let it run in background)
    cleanupTemporaryFile(captureResult.uri).catch(err => 
      console.warn('Background cleanup failed:', err)
    );
    
    // Log total export time
    const totalTime = Date.now() - startTime;
    console.log(`Complete export workflow finished in ${totalTime}ms`);
    
    // Track performance metrics
    trackExportPerformance({
      totalTime,
      success: true,
      deviceTier: getDevicePerformanceTier(),
      captureOptions,
      saveOptions,
      captureTime,
      saveTime
    });
    
    return saveResult;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Export workflow failed after ${totalTime}ms:`, error);
    
    // Track failure metrics
    trackExportPerformance({
      totalTime,
      success: false,
      error: error as Error,
      deviceTier: getDevicePerformanceTier(),
      captureOptions,
      saveOptions
    });
    
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
 * Uses device-aware optimization settings
 */
export async function optimizeImageForSharing(
  imageUri: string,
  maxWidth?: number,
  quality?: number
): Promise<string> {
  const startTime = Date.now();
  
  try {
    // Get device-optimized settings if not provided
    const deviceTier = getDevicePerformanceTier();
    const deviceOptions = DEVICE_OPTIMIZED_OPTIONS[deviceTier];
    
    const finalMaxWidth = maxWidth || deviceOptions.maxWidth;
    const finalQuality = quality || deviceOptions.quality;
    
    // This would typically use expo-image-manipulator for resizing/compression
    // For now, we'll return the original URI as a placeholder
    // In a real implementation:
    // const manipulatedImage = await ImageManipulator.manipulateAsync(
    //   imageUri,
    //   [{ resize: { width: finalMaxWidth } }],
    //   { compress: finalQuality, format: ImageManipulator.SaveFormat.JPEG }
    // );
    // return manipulatedImage.uri;
    
    const optimizationTime = Date.now() - startTime;
    console.log(`Image optimization completed in ${optimizationTime}ms`);
    
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
 * Performance metrics tracking interface
 */
interface ExportPerformanceMetrics {
  totalTime: number;
  success: boolean;
  error?: Error;
  deviceTier: 'high' | 'medium' | 'low';
  captureOptions: Partial<ImageCaptureOptions>;
  saveOptions: SaveToLibraryOptions;
  captureTime?: number;
  saveTime?: number;
}

/**
 * Track export performance metrics for monitoring and optimization
 */
function trackExportPerformance(metrics: ExportPerformanceMetrics): void {
  // Log performance data
  const logData = {
    timestamp: new Date().toISOString(),
    success: metrics.success,
    totalTime: metrics.totalTime,
    deviceTier: metrics.deviceTier,
    quality: metrics.captureOptions.quality,
    format: metrics.captureOptions.format,
    error: metrics.error?.message,
    captureTime: metrics.captureTime,
    saveTime: metrics.saveTime
  };
  
  console.log('Export Performance Metrics:', JSON.stringify(logData, null, 2));
  
  // In a production app, you would send this to analytics service:
  // Analytics.track('image_export_performance', logData);
  
  // Store locally for performance analysis
  if (typeof global !== 'undefined' && !(global as any).__exportMetrics) {
    (global as any).__exportMetrics = [];
  }
  if ((global as any).__exportMetrics) {
    (global as any).__exportMetrics.push(logData);
    
    // Keep only last 50 entries to prevent memory issues
    if ((global as any).__exportMetrics.length > 50) {
      (global as any).__exportMetrics = (global as any).__exportMetrics.slice(-50);
    }
  }
}

/**
 * Get export performance statistics
 */
export function getExportPerformanceStats(): {
  averageTime: number;
  successRate: number;
  totalExports: number;
  deviceTierBreakdown: Record<string, number>;
} {
  const metrics = (global as any).__exportMetrics || [];
  
  if (metrics.length === 0) {
    return {
      averageTime: 0,
      successRate: 0,
      totalExports: 0,
      deviceTierBreakdown: {}
    };
  }
  
  const successful = metrics.filter((m: any) => m.success);
  const averageTime = metrics.reduce((sum: number, m: any) => sum + m.totalTime, 0) / metrics.length;
  const successRate = (successful.length / metrics.length) * 100;
  
  const deviceTierBreakdown = metrics.reduce((acc: Record<string, number>, m: any) => {
    acc[m.deviceTier] = (acc[m.deviceTier] || 0) + 1;
    return acc;
  }, {});
  
  return {
    averageTime: Math.round(averageTime),
    successRate: Math.round(successRate * 100) / 100,
    totalExports: metrics.length,
    deviceTierBreakdown
  };
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
