import { supabase } from '@/lib/supabaseClient';

export async function fetchAuthUid(): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_auth_uid');
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('fetchAuthUid error', error.message);
    return null;
  }
  return data ?? null;
}

export async function checkProfileExists(userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('id', userId);
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('checkProfileExists error', error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

export async function probeRlsProfiles(): Promise<{ ok: boolean; count: number | null; error?: string }>{
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('probeRlsProfiles error', error.message);
    return { ok: false, count: null, error: error.message };
  }
  return { ok: true, count: count ?? 0 };
}
