import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { Food, listFoods, searchFoodsByName, upsertFood, deleteFood } from '@/services/foods';

export const [FoodsProvider, useFoodsStore] = createContextHook(() => {
  const [items, setItems] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listFoods();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Best-effort initial fetch
    refresh().catch(() => {});
  }, []);

  const search = async (query: string): Promise<Food[]> => {
    if (!query) return [];
    // local-first simple filter
    const q = query.toLowerCase();
    const local = items.filter((f) => f.name.toLowerCase().includes(q));
    if (local.length > 0) return local.slice(0, 10);
    // fallback to backend
    try {
      return await searchFoodsByName(query, 20);
    } catch {
      return [];
    }
  };

  const save = async (partial: Partial<Food> & { name: string }): Promise<Food | null> => {
    try {
      const saved = await upsertFood(partial as any);
      // update local cache
      setItems((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id);
        if (idx === -1) return [saved, ...prev];
        const clone = [...prev];
        clone[idx] = saved;
        return clone;
      });
      return saved;
    } catch (e) {
      console.warn('Failed to save food:', e);
      return null;
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    try {
      await deleteFood(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (e) {
      console.warn('Failed to delete food:', e);
      return false;
    }
  };

  return { items, loading, refresh, search, save, remove };
});
