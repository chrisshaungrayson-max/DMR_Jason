import { supabase } from '@/lib/supabaseClient';

export type MacroTargets = {
  id: string;
  user_id: string;
  split_protein: number;
  split_carbs: number;
  split_fat: number;
  source: 'tdee' | 'fallback' | string;
  calories_basis: number;
  grams_protein: number;
  grams_carbs: number;
  grams_fat: number;
  created_at?: string;
  updated_at?: string;
};

export type UpsertMacroTargetsInput = Omit<MacroTargets, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string };

export async function getMyMacroTargets(): Promise<MacroTargets | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('macro_targets')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data as MacroTargets | null;
}

export async function upsertMyMacroTargets(input: UpsertMacroTargetsInput): Promise<MacroTargets> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const payload: Partial<MacroTargets> = {
    user_id: user.id,
    ...input,
  } as any;
  const { data, error } = await supabase
    .from('macro_targets')
    .upsert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as MacroTargets;
}
