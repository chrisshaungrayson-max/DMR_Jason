/* @vitest-environment jsdom */
import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { GoalsContext, useGoals } from '@/store/goals-store';
import type { GoalsStore } from '@/store/goals-store';
import type { GoalRecord, GoalProgress } from '@/types/goal';

vi.mock('@/services/goals', () => {
  return {
    listGoals: vi.fn(async () => []),
    createGoal: vi.fn(async (input: any) => ({ id: 'new1', status: 'active', active: true, created_at: '', updated_at: '', user_id: 'u', start_date: '2025-08-01', end_date: '2025-08-31', type: input.type, params: input.params } as any)),
    setActiveGoal: vi.fn(async (goalId: string) => ({ id: goalId } as any)),
    deactivateGoal: vi.fn(async (goalId: string) => ({ id: goalId, status: 'deactivated', active: false } as any)),
    deleteGoal: vi.fn(async () => {}),
    getGoalProgress: vi.fn(async (_goalId: string) => ({ goalId: _goalId, type: 'protein_streak', percent: 0, achieved: false, computedAtISO: '' } satisfies GoalProgress)),
  };
});

import {
  listGoals as svcListGoals,
  createGoal as svcCreateGoal,
  setActiveGoal as svcSetActiveGoal,
  deactivateGoal as svcDeactivateGoal,
  deleteGoal as svcDeleteGoal,
  getGoalProgress as svcGetGoalProgress,
} from '@/services/goals';

function Harness({ onReady }: { onReady: (store: GoalsStore) => void }) {
  const store = useGoals();
  useEffect(() => { onReady(store); }, [onReady, store]);
  return null;
}

const mk = (over: Partial<GoalRecord>): GoalRecord => ({
  id: over.id || 'id',
  user_id: over.user_id || 'u',
  type: (over.type as any) || 'protein_streak',
  params: over.params || { gramsPerDay: 150, targetDays: 2 },
  start_date: over.start_date || '2025-08-01',
  end_date: over.end_date || '2025-08-31',
  active: over.active ?? true,
  status: (over.status as any) || 'active',
  created_at: over.created_at || '',
  updated_at: over.updated_at || '',
});

describe('goals-store actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (svcListGoals as any).mockResolvedValue([]);
    (svcGetGoalProgress as any).mockResolvedValue({ goalId: 'x', type: 'protein_streak', percent: 0, achieved: false, computedAtISO: '' });
  });

  async function withStore(test: (getStore: () => GoalsStore) => Promise<void> | void) {
    let ref: GoalsStore | null = null;
    const getStore = () => {
      if (!ref) throw new Error('Store not ready');
      return ref;
    };
    render(
      <GoalsContext>
        <Harness onReady={(s) => { ref = s; }} />
      </GoalsContext>
    );
    // Wait for the provider to mount and call loadGoals once
    await waitFor(() => expect(ref).not.toBeNull());
    return test(getStore);
  }

  it('loadGoals partitions active vs archived and refreshes progress for active', async () => {
    const act1 = mk({ id: 'a1', active: true, status: 'active' as any });
    const arc1 = mk({ id: 'b1', active: false, status: 'deactivated' as any });
    (svcListGoals as any).mockResolvedValue([act1, arc1]);
    const progA1: GoalProgress = { goalId: 'a1', type: act1.type as any, percent: 50, achieved: false, computedAtISO: '' };
    (svcGetGoalProgress as any).mockImplementation(async (id: string) => id === 'a1' ? progA1 : null);

    await withStore(async (getStore) => {
      await act(async () => { await getStore().loadGoals(); });
      await waitFor(() => expect(getStore().goals.map(g => g.id)).toEqual(['a1']));
      await waitFor(() => expect(getStore().archived.map(g => g.id)).toEqual(['b1']));
      await waitFor(() => expect(getStore().progressFor('a1')?.percent).toBe(50));
      expect(svcGetGoalProgress).toHaveBeenCalledWith('a1');
    });
  });

  it('createGoal calls service and reloads list', async () => {
    const created = mk({ id: 'c1' });
    (svcCreateGoal as any).mockResolvedValue(created);
    (svcListGoals as any).mockResolvedValue([created]);

    await withStore(async (getStore) => {
      await act(async () => {
        const res = await getStore().createGoal({ type: created.type as any, params: created.params, start_date: created.start_date, end_date: created.end_date, active: true });
        expect(res.id).toBe('c1');
      });
      expect(svcCreateGoal).toHaveBeenCalledOnce();
      expect(svcListGoals).toHaveBeenCalled();
      await waitFor(() => expect(getStore().goals.map(g => g.id)).toEqual(['c1']));
    });
  });

  it('setActive calls service and reloads list', async () => {
    const g1 = mk({ id: 's1', type: 'body_fat' as any });
    (svcListGoals as any).mockResolvedValue([g1]);
    (svcSetActiveGoal as any).mockResolvedValue({ ...g1, active: true });

    await withStore(async (getStore) => {
      await act(async () => { await getStore().setActive('s1'); });
      expect(svcSetActiveGoal).toHaveBeenCalledWith('s1');
      expect(svcListGoals).toHaveBeenCalled();
    });
  });

  it('deactivate calls service and reloads list', async () => {
    const g1 = mk({ id: 'd1', status: 'active' as any, active: true });
    (svcListGoals as any).mockResolvedValue([g1]);
    (svcDeactivateGoal as any).mockResolvedValue({ ...g1, status: 'deactivated', active: false });

    await withStore(async (getStore) => {
      await act(async () => { await getStore().deactivate('d1'); });
      expect(svcDeactivateGoal).toHaveBeenCalledWith('d1');
      expect(svcListGoals).toHaveBeenCalled();
    });
  });

  it('deleteGoal calls service and updates local state without reload', async () => {
    const g1 = mk({ id: 'del1', active: true, status: 'active' as any });
    const g2 = mk({ id: 'del2', active: false, status: 'deactivated' as any });
    // Initial auto-load
    (svcListGoals as any).mockResolvedValue([g1, g2]);

    await withStore(async (getStore) => {
      // Await initial auto-load
      await waitFor(() => expect(getStore().goals.map(g => g.id)).toEqual(['del1']));
      await waitFor(() => expect(getStore().archived.map(g => g.id)).toEqual(['del2']));

      await act(async () => { await getStore().deleteGoal('del1'); });
      expect(svcDeleteGoal).toHaveBeenCalledWith('del1');
      await waitFor(() => expect(getStore().goals.map(g => g.id)).toEqual([]));
      await waitFor(() => expect(getStore().archived.map(g => g.id)).toEqual(['del2']));
    });
  });

  it('refreshProgress sets progress and triggers reload when an active goal becomes achieved', async () => {
    const g1 = mk({ id: 'p1', active: true, status: 'active' as any });
    // First load has active goal
    (svcListGoals as any).mockResolvedValueOnce([g1]);

    const progNotAchieved: GoalProgress = { goalId: 'p1', type: g1.type as any, percent: 50, achieved: false, computedAtISO: '' };
    const progAchieved: GoalProgress = { goalId: 'p1', type: g1.type as any, percent: 100, achieved: true, computedAtISO: '' };

    // First refresh (from loadGoals auto-refresh) should set 50
    (svcGetGoalProgress as any).mockResolvedValueOnce(progNotAchieved);

    await withStore(async (getStore) => {
      await waitFor(() => expect(getStore().goals.map(g => g.id)).toEqual(['p1']));
      await waitFor(() => expect(getStore().progressFor('p1')?.percent).toBe(50));

      (svcGetGoalProgress as any).mockResolvedValueOnce(progAchieved);
      // When store detects achieved, it calls loadGoals() again — emulate backend moving it to archived
      (svcListGoals as any).mockResolvedValueOnce([{ ...g1, active: false, status: 'achieved' as any }]);
      await act(async () => { await getStore().refreshProgress(['p1']); });
      await waitFor(() => expect(getStore().progressFor('p1')?.achieved).toBe(true));
      // When achieved and in active list, store attempts to reload
      await waitFor(() => expect(svcListGoals).toHaveBeenCalledTimes(2));
    });
  });
});
