import { supabase } from '@/lib/supabaseClient';

export type Profile = {
  id: string;
  name?: string | null;
  sex?: 'male' | 'female' | 'other' | '';
  age?: number | null;
  height?: string | null;
  weight?: string | null;
  avatar_url?: string | null;
  use_metric_units?: boolean | null;
  use_dark_mode?: boolean | null;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete' | null;
  tdee?: number | null;
  created_at?: string;
  updated_at?: string;
};

export async function getMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function upsertMyProfile(update: Partial<Profile>): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const payload = { id: user.id, ...update } as any;
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as Profile;
}
