/**
 * Unit tests for TDEE image export utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import {
  captureViewAsImage,
  saveImageToLibrary,
  exportViewAsImage,
  cleanupTemporaryFile,
  optimizeImageForSharing,
  isImageExportSupported,
  estimateImageFileSize
} from '../tdee-image-export';
import { ensureMediaLibraryPermission } from '../permissions';

// Mock dependencies
vi.mock('expo-file-system');
vi.mock('expo-media-library');
vi.mock('react-native-view-shot');
vi.mock('../permissions');

const mockFileSystem = vi.mocked(FileSystem);
const mockMediaLibrary = vi.mocked(MediaLibrary);
const mockCaptureRef = vi.mocked(captureRef);
const mockEnsurePermission = vi.mocked(ensureMediaLibraryPermission);

describe('tdee-image-export utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('captureViewAsImage', () => {
    it('should capture view and return image result', async () => {
      const mockViewRef = { current: {} };
      const mockUri = 'file://test-image.jpg';
      
      mockCaptureRef.mockResolvedValue(mockUri);
      mockFileSystem.getInfoAsync.mockResolvedValue({ 
        exists: true, 
        size: 1024,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: mockUri
      });

      const result = await captureViewAsImage(mockViewRef as any);

      expect(mockCaptureRef).toHaveBeenCalledWith(mockViewRef.current, {
        format: 'jpg',
        quality: 0.8,
        result: 'tmpfile',
        width: undefined,
        height: undefined
      });
      expect(result.uri).toBe(mockUri);
      expect(result.width).toBe(375); // placeholder value
      expect(result.height).toBe(812); // placeholder value
    });

    it('should throw error when view reference is null', async () => {
      const mockViewRef = { current: null };

      await expect(captureViewAsImage(mockViewRef as any))
        .rejects.toThrow('View reference is null or undefined');
    });

    it('should throw error when captured file does not exist', async () => {
      const mockViewRef = { current: {} };
      const mockUri = 'file://test-image.jpg';
      
      mockCaptureRef.mockResolvedValue(mockUri);
      mockFileSystem.getInfoAsync.mockResolvedValue({ 
        exists: false,
        size: 0,
        isDirectory: false,
        modificationTime: 0,
        uri: mockUri
      });

      await expect(captureViewAsImage(mockViewRef as any))
        .rejects.toThrow('Captured image file does not exist');
    });

    it('should include base64 data when requested', async () => {
      const mockViewRef = { current: {} };
      const mockUri = 'file://test-image.jpg';
      const mockBase64 = 'base64data';
      
      mockCaptureRef.mockResolvedValue(mockUri);
      mockFileSystem.getInfoAsync.mockResolvedValue({ 
        exists: true,
        size: 1024,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: mockUri
      });
      mockFileSystem.readAsStringAsync.mockResolvedValue(mockBase64);

      const result = await captureViewAsImage(mockViewRef as any, { result: 'base64' });

      expect(mockFileSystem.readAsStringAsync).toHaveBeenCalledWith(mockUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      expect(result.base64).toBe(mockBase64);
    });
  });

  describe('saveImageToLibrary', () => {
    it('should save image to library successfully', async () => {
      const mockUri = 'file://test-image.jpg';
      const mockAsset = {
        id: 'asset-123',
        uri: 'ph://asset-123',
        filename: 'TDEE-Report-2024-01-01.jpg',
        creationTime: Date.now()
      };

      mockEnsurePermission.mockResolvedValue(true);
      mockMediaLibrary.createAssetAsync.mockResolvedValue(mockAsset as any);

      const result = await saveImageToLibrary(mockUri);

      expect(mockEnsurePermission).toHaveBeenCalled();
      expect(mockMediaLibrary.createAssetAsync).toHaveBeenCalledWith(mockUri);
      expect(result.id).toBe(mockAsset.id);
      expect(result.uri).toBe(mockAsset.uri);
    });

    it('should throw permission error when permission denied', async () => {
      const mockUri = 'file://test-image.jpg';
      
      mockEnsurePermission.mockResolvedValue(false);

      await expect(saveImageToLibrary(mockUri))
        .rejects.toMatchObject({
          type: 'permission_denied',
          message: 'Permission denied to access photo library'
        });
    });

    it('should create album when specified', async () => {
      const mockUri = 'file://test-image.jpg';
      const mockAsset = {
        id: 'asset-123',
        uri: 'ph://asset-123',
        filename: 'test.jpg',
        creationTime: Date.now()
      };
      const mockAlbum = { id: 'album-123', title: 'TDEE Reports' };

      mockEnsurePermission.mockResolvedValue(true);
      mockMediaLibrary.createAssetAsync.mockResolvedValue(mockAsset as any);
      mockMediaLibrary.getAlbumAsync.mockResolvedValue(null);
      mockMediaLibrary.createAlbumAsync.mockResolvedValue(mockAlbum as any);

      await saveImageToLibrary(mockUri, { album: 'TDEE Reports' });

      expect(mockMediaLibrary.getAlbumAsync).toHaveBeenCalledWith('TDEE Reports');
      expect(mockMediaLibrary.createAlbumAsync).toHaveBeenCalledWith('TDEE Reports', mockAsset, false);
    });
  });

  describe('exportViewAsImage', () => {
    it('should complete full export workflow', async () => {
      const mockViewRef = { current: {} };
      const mockCaptureUri = 'file://temp-image.jpg';
      const mockAsset = {
        id: 'asset-123',
        uri: 'ph://asset-123',
        filename: 'TDEE-Report.jpg',
        creationTime: Date.now()
      };

      mockCaptureRef.mockResolvedValue(mockCaptureUri);
      mockFileSystem.getInfoAsync.mockResolvedValueOnce({ 
        exists: true,
        size: 1024,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: mockCaptureUri
      });
      mockEnsurePermission.mockResolvedValue(true);
      mockMediaLibrary.createAssetAsync.mockResolvedValue(mockAsset as any);
      mockFileSystem.getInfoAsync.mockResolvedValueOnce({ 
        exists: true,
        size: 1024,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: mockCaptureUri
      });
      mockFileSystem.deleteAsync.mockResolvedValue();

      const result = await exportViewAsImage(mockViewRef as any);

      expect(result.id).toBe(mockAsset.id);
      expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith(mockCaptureUri, { idempotent: true });
    });
  });

  describe('cleanupTemporaryFile', () => {
    it('should delete existing temporary file', async () => {
      const mockUri = 'file://temp-image.jpg';
      
      mockFileSystem.getInfoAsync.mockResolvedValue({ 
        exists: true,
        size: 1024,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: mockUri
      });
      mockFileSystem.deleteAsync.mockResolvedValue();

      await cleanupTemporaryFile(mockUri);

      expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith(mockUri, { idempotent: true });
    });

    it('should not throw error when file does not exist', async () => {
      const mockUri = 'file://temp-image.jpg';
      
      mockFileSystem.getInfoAsync.mockResolvedValue({ 
        exists: false,
        size: 0,
        isDirectory: false,
        modificationTime: 0,
        uri: mockUri
      });

      await expect(cleanupTemporaryFile(mockUri)).resolves.not.toThrow();
      expect(mockFileSystem.deleteAsync).not.toHaveBeenCalled();
    });

    it('should not throw error when cleanup fails', async () => {
      const mockUri = 'file://temp-image.jpg';
      
      mockFileSystem.getInfoAsync.mockRejectedValue(new Error('File system error'));

      await expect(cleanupTemporaryFile(mockUri)).resolves.not.toThrow();
    });
  });

  describe('optimizeImageForSharing', () => {
    it('should return original URI as placeholder', async () => {
      const mockUri = 'file://test-image.jpg';
      
      const result = await optimizeImageForSharing(mockUri);
      
      expect(result).toBe(mockUri);
    });
  });

  describe('isImageExportSupported', () => {
    it('should return true for supported platforms', () => {
      // Mock Platform.OS
      vi.doMock('react-native', () => ({
        Platform: { OS: 'ios' }
      }));
      
      expect(isImageExportSupported()).toBe(true);
    });
  });

  describe('estimateImageFileSize', () => {
    it('should calculate estimated file size', () => {
      const width = 375;
      const height = 812;
      const quality = 0.8;
      
      const size = estimateImageFileSize(width, height, quality);
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should use default quality when not provided', () => {
      const width = 375;
      const height = 812;
      
      const size = estimateImageFileSize(width, height);
      
      expect(size).toBeGreaterThan(0);
    });
  });
});
