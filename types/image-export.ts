/**
 * TypeScript type definitions for TDEE image export functionality
 */

import { ViewStyle } from 'react-native';

/**
 * Configuration options for image capture
 */
export interface ImageCaptureOptions {
  /** Image format - JPEG for smaller file sizes */
  format: 'jpg' | 'png';
  /** Image quality (0-1) for JPEG compression */
  quality: number;
  /** Capture result type */
  result: 'tmpfile' | 'base64' | 'zip-base64';
  /** Width of the captured image */
  width?: number;
  /** Height of the captured image */
  height?: number;
}

/**
 * Result from image capture operation
 */
export interface ImageCaptureResult {
  /** URI of the captured image file */
  uri: string;
  /** Width of the captured image */
  width: number;
  /** Height of the captured image */
  height: number;
  /** Base64 data if requested */
  base64?: string;
}

/**
 * Options for saving image to camera roll
 */
export interface SaveToLibraryOptions {
  /** Album name to save to (optional) */
  album?: string;
  /** Filename for the saved image */
  filename?: string;
}

/**
 * Result from saving image to camera roll
 */
export interface SaveToLibraryResult {
  /** Asset ID of the saved image */
  id: string;
  /** URI of the saved image */
  uri: string;
  /** Filename of the saved image */
  filename: string;
  /** Creation time of the saved image */
  creationTime: number;
}

/**
 * Permission status for camera roll access
 */
export type MediaLibraryPermissionStatus = 
  | 'undetermined'
  | 'denied' 
  | 'granted'
  | 'limited';

/**
 * Permission response from media library
 */
export interface MediaLibraryPermissionResponse {
  status: MediaLibraryPermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
  expires: 'never' | number;
}

/**
 * Export operation status
 */
export type ExportStatus = 
  | 'idle'
  | 'capturing'
  | 'saving'
  | 'success'
  | 'error';

/**
 * Export error types
 */
export type ExportErrorType =
  | 'permission_denied'
  | 'capture_failed'
  | 'save_failed'
  | 'unknown_error';

/**
 * Export error details
 */
export interface ExportError {
  type: ExportErrorType;
  message: string;
  originalError?: Error;
}

/**
 * Export operation state
 */
export interface ExportState {
  status: ExportStatus;
  progress?: number;
  error?: ExportError;
  result?: SaveToLibraryResult;
}

/**
 * Props for ImageExportButton component
 */
export interface ImageExportButtonProps {
  /** View reference to capture */
  viewRef: React.RefObject<any>;
  /** Button text */
  title?: string;
  /** Button style */
  style?: ViewStyle;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Callback when export starts */
  onExportStart?: () => void;
  /** Callback when export succeeds */
  onExportSuccess?: (result: SaveToLibraryResult) => void;
  /** Callback when export fails */
  onExportError?: (error: ExportError) => void;
  /** Image capture options */
  captureOptions?: Partial<ImageCaptureOptions>;
  /** Save options */
  saveOptions?: SaveToLibraryOptions;
}

/**
 * Props for ConfirmationDialog component
 */
export interface ConfirmationDialogProps {
  /** Whether dialog is visible */
  visible: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Loading state for confirm button */
  loading?: boolean;
}
