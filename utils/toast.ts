/**
 * Toast notification utilities for user feedback
 */

import { Alert, Platform } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
}

/**
 * Show a toast notification
 * Uses native Alert for cross-platform compatibility
 */
export function showToast(
  message: string, 
  type: ToastType = 'info',
  options: ToastOptions = {}
): void {
  const title = getToastTitle(type);
  
  Alert.alert(title, message, [{ text: 'OK' }]);
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string, options?: ToastOptions): void {
  showToast(message, 'success', options);
}

/**
 * Show error toast
 */
export function showErrorToast(message: string, options?: ToastOptions): void {
  showToast(message, 'error', options);
}

/**
 * Show info toast
 */
export function showInfoToast(message: string, options?: ToastOptions): void {
  showToast(message, 'info', options);
}

/**
 * Show warning toast
 */
export function showWarningToast(message: string, options?: ToastOptions): void {
  showToast(message, 'warning', options);
}

/**
 * Get appropriate title for toast type
 */
function getToastTitle(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
    default:
      return 'Info';
  }
}
