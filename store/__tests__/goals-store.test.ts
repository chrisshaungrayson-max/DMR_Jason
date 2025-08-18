import { describe, it, expect } from 'vitest';
import { partitionGoals, selectTopNActive, selectByType, selectProgressFor, selectStreakSnapshot } from '@/store/goals-helpers';
import type { GoalRecord, GoalProgress } from '@/types/goal';

const mk = (over: Partial<GoalRecord>): GoalRecord => ({
  id: over.id || 'id',
  user_id: over.user_id || 'u',
  type: over.type as any || 'body_fat',
  params: over.params || {},
  start_date: over.start_date || '2025-08-01',
  end_date: over.end_date || '2025-08-31',
  active: over.active ?? true,
  status: over.status as any || 'active',
  created_at: over.created_at || '',
  updated_at: over.updated_at || '',
});

describe('goals-store helpers', () => {
  it('partitions active vs archived based on active/status', () => {
    const all = [
      mk({ id: 'a1', active: true, status: 'active' as any }),
      mk({ id: 'a2', active: false, status: 'deactivated' as any }),
      mk({ id: 'a3', active: true, status: 'achieved' as any }),
    ];
    const { act, arc } = partitionGoals(all);
    expect(act.map(g => g.id)).toEqual(['a1']);
    expect(arc.map(g => g.id).sort()).toEqual(['a2', 'a3']);
  });

  it('selectTopNActive slices from active goals array', () => {
    const active = [mk({ id: 'g1' }), mk({ id: 'g2' }), mk({ id: 'g3' })];
    expect(selectTopNActive(active, 2).map(g => g.id)).toEqual(['g1', 'g2']);
  });

  it('selectByType returns all (active+archived) of a given type', () => {
    const active = [mk({ id: 'g1', type: 'body_fat' as any })];
    const archived = [mk({ id: 'g2', active: false, status: 'deactivated' as any, type: 'weight' as any })];
    expect(selectByType(active, archived, 'body_fat' as any).map(g => g.id)).toEqual(['g1']);
    expect(selectByType(active, archived, 'weight' as any).map(g => g.id)).toEqual(['g2']);
  });

  it('selectProgressFor and selectStreakSnapshot read from progressById', () => {
    const progressById: Record<string, GoalProgress | null | undefined> = {
      g1: { goalId: 'g1', type: 'protein_streak' as any, percent: 50, label: '1/2 days',
            streak: { current: 1, target: 2, history: [] }, achieved: false, computedAtISO: '' },
      g2: null,
    };
    expect(selectProgressFor(progressById, 'g1')?.percent).toBe(50);
    expect(selectStreakSnapshot(progressById, 'g1')?.current).toBe(1);
    expect(selectProgressFor(progressById, 'g2')).toBeNull();
    expect(selectProgressFor(progressById, 'nope')).toBeUndefined();
  });
});
