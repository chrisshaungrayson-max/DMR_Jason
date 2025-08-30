/**
 * Cross-platform permission utilities for camera roll access
 */

import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { MediaLibraryPermissionResponse, MediaLibraryPermissionStatus } from '@/types/image-export';

/**
 * Request permission to access media library for saving images
 */
export async function requestMediaLibraryPermission(): Promise<MediaLibraryPermissionResponse> {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync();
    return {
      status: permission.status as MediaLibraryPermissionStatus,
      granted: permission.granted,
      canAskAgain: permission.canAskAgain,
      expires: permission.expires
    };
  } catch (error) {
    console.error('Error requesting media library permission:', error);
    return {
      status: 'denied',
      granted: false,
      canAskAgain: false,
      expires: 'never'
    };
  }
}

/**
 * Check current media library permission status
 */
export async function getMediaLibraryPermissionStatus(): Promise<MediaLibraryPermissionResponse> {
  try {
    const permission = await MediaLibrary.getPermissionsAsync();
    return {
      status: permission.status as MediaLibraryPermissionStatus,
      granted: permission.granted,
      canAskAgain: permission.canAskAgain,
      expires: permission.expires
    };
  } catch (error) {
    console.error('Error getting media library permission status:', error);
    return {
      status: 'denied',
      granted: false,
      canAskAgain: false,
      expires: 'never'
    };
  }
}

/**
 * Ensure media library permission is granted, requesting if necessary
 */
export async function ensureMediaLibraryPermission(): Promise<boolean> {
  try {
    // Check current status first
    const currentStatus = await getMediaLibraryPermissionStatus();
    
    if (currentStatus.granted) {
      return true;
    }

    // Request permission if not granted
    if (currentStatus.canAskAgain) {
      const requestResult = await requestMediaLibraryPermission();
      return requestResult.granted;
    }

    return false;
  } catch (error) {
    console.error('Error ensuring media library permission:', error);
    return false;
  }
}

/**
 * Get user-friendly permission status message
 */
export function getPermissionStatusMessage(status: MediaLibraryPermissionStatus): string {
  switch (status) {
    case 'granted':
      return 'Permission granted to save images to your photo library.';
    case 'denied':
      return Platform.OS === 'ios' 
        ? 'Permission denied. Please enable photo library access in Settings > Privacy & Security > Photos.'
        : 'Permission denied. Please enable storage access in Settings > Apps > Permissions.';
    case 'limited':
      return 'Limited photo library access granted. Some features may not work as expected.';
    case 'undetermined':
      return 'Photo library permission not yet requested.';
    default:
      return 'Unknown permission status.';
  }
}

/**
 * Check if the current platform supports media library operations
 */
export function isMediaLibrarySupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
