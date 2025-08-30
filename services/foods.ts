import { supabase } from '@/lib/supabaseClient';

export type Food = {
  id: string;
  user_id: string;
  name: string;
  brand?: string | null;
  portion?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags?: string[] | null;
  meta?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
};

export type UpsertFoodInput = Omit<Food, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string };

export async function listFoods(): Promise<Food[]> {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function searchFoodsByName(query: string, limit = 20): Promise<Food[]> {
  if (!query) return [];
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function upsertFood(input: UpsertFoodInput): Promise<Food> {
  // Ensure we include the authenticated user's id to satisfy RLS policies
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userData?.user;
  if (!user) throw new Error('Not authenticated: cannot upsert food without a user session');

  const payload = { ...input, user_id: (input as any).user_id ?? user.id } as any;
  const { data, error } = await supabase
    .from('foods')
    .upsert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as Food;
}

export async function deleteFood(id: string): Promise<void> {
  const { error } = await supabase
    .from('foods')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
