import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabaseClient';

/**
 * Clear local and remote nutrition caches.
 * - Clears AsyncStorage history key used by `findHistoryFood()`
 * - Optionally deletes rows from Supabase `foods` by name pattern (ILIKE)
 *
 * Usage: call from a dev-only button/screen. Safe to run multiple times.
 */
export async function clearNutritionCache(options?: { supabaseNamePattern?: string }) {
  const { supabaseNamePattern } = options || {};

  // 1) Clear AsyncStorage history used by nutrition analysis
  try {
    await AsyncStorage.removeItem('nutritionRecords');
    // eslint-disable-next-line no-console
    console.info('[maintenance] Cleared AsyncStorage key: nutritionRecords');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[maintenance] Failed clearing AsyncStorage history', e);
  }

  // 2) Optionally delete Supabase foods rows by name pattern
  if (supabaseNamePattern) {
    try {
      const { error } = await supabase
        .from('foods')
        .delete()
        .ilike('name', `%${supabaseNamePattern}%`);
      if (error) throw error;
      // eslint-disable-next-line no-console
      console.info(`[maintenance] Deleted Supabase foods where name ILIKE %${supabaseNamePattern}%`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[maintenance] Supabase delete failed (likely RLS/anon perms). Skipping.', e);
    }
  }
}
