import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

/**
 * Load a bundled image (require/module) and return a data URL suitable for embedding in HTML.
 * Note: Expo FileSystem/Asset is supported on iOS/Android. On Web, return empty string.
 */
export async function loadImageAsDataUrl(imageModule: number, mime: string = 'image/png'): Promise<string> {
  try {
    if (Platform.OS === 'web') return '';
    const asset = Asset.fromModule(imageModule);
    await asset.downloadAsync();
    const uri = asset.localUri || asset.uri;
    if (!uri) return '';
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return `data:${mime};base64,${base64}`;
  } catch (e) {
    console.warn('loadImageAsDataUrl failed', e);
    return '';
  }
}
