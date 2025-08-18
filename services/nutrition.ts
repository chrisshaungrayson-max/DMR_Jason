import { supabase } from '@/lib/supabaseClient';

export type Day = {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at?: string;
  updated_at?: string;
};

export type Entry = {
  id: string;
  user_id: string;
  day_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meta?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
};

export async function upsertDay(input: Omit<Day, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Day> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const payload = { user_id: user.id, ...input } as any;
  const { data, error } = await supabase
    .from('days')
    .upsert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as Day;
}

export async function getDayByDate(date: string): Promise<Day | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('days')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data as Day | null;
}

export async function listEntriesForDay(day_id: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('day_id', day_id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as Entry[];
}

export async function upsertEntry(input: Omit<Entry, 'user_id' | 'created_at' | 'updated_at'>): Promise<Entry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const payload = { user_id: user.id, ...input } as any;
  const { data, error } = await supabase
    .from('entries')
    .upsert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as Entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
