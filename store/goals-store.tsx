import { useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import type { GoalRecord, GoalType, GoalProgress } from '@/types/goal';
import {
  listGoals as svcListGoals,
  createGoal as svcCreateGoal,
  setActiveGoal as svcSetActiveGoal,
  deactivateGoal as svcDeactivateGoal,
  deleteGoal as svcDeleteGoal,
  getGoalProgress as svcGetGoalProgress,
} from '@/services/goals';

export type GoalsState = {
  goals: GoalRecord[];
  archived: GoalRecord[]; // status !== 'active' or active=false
  progressById: Record<string, GoalProgress | null | undefined>;
  isLoading: boolean;
  error?: string;
};

export type GoalsActions = {
  loadGoals: () => Promise<void>;
  createGoal: (input: Parameters<typeof svcCreateGoal>[0]) => Promise<GoalRecord>;
  setActive: (goalId: string) => Promise<GoalRecord>;
  deactivate: (goalId: string) => Promise<GoalRecord>;
  deleteGoal: (goalId: string) => Promise<void>;
  refreshProgress: (goalIds?: string[]) => Promise<void>;
};

export type GoalsSelectors = {
  topNActive: (n: number) => GoalRecord[];
  byType: (type: GoalType) => GoalRecord[];
  progressFor: (goalId: string) => GoalProgress | null | undefined;
  streakSnapshot: (goalId: string) => GoalProgress['streak'] | undefined;
};

export type GoalsStore = GoalsState & GoalsActions & GoalsSelectors;

// Pure helpers (exported for unit tests without React rendering)
export function partitionGoals(all: GoalRecord[]) {
  const act: GoalRecord[] = [];
  const arc: GoalRecord[] = [];
  for (const g of all) {
    if (g.active && g.status === 'active') act.push(g);
    else arc.push(g);
  }
  return { act, arc };
}

export function selectTopNActive(goals: GoalRecord[], n: number): GoalRecord[] {
  return goals.slice(0, n);
}

export function selectByType(goals: GoalRecord[], archived: GoalRecord[], type: GoalType): GoalRecord[] {
  return [...goals, ...archived].filter((g) => g.type === type);
}

export function selectProgressFor(progressById: Record<string, GoalProgress | null | undefined>, goalId: string) {
  return progressById[goalId];
}

export function selectStreakSnapshot(progressById: Record<string, GoalProgress | null | undefined>, goalId: string) {
  return progressById[goalId]?.streak;
}

export const [GoalsContext, useGoals] = createContextHook<GoalsStore>(() => {
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [archived, setArchived] = useState<GoalRecord[]>([]);
  const [progressById, setProgressById] = useState<GoalsState['progressById']>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // keep local reference using exported helper
  const _partitionGoals = partitionGoals;

  const loadGoals: GoalsActions['loadGoals'] = async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const all = await svcListGoals();
      const { act, arc } = _partitionGoals(all);
      setGoals(act);
      setArchived(arc);
      // Optionally refresh progress for active goals
      await refreshProgress(act.map((g) => g.id));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const createGoal: GoalsActions['createGoal'] = async (input) => {
    setError(undefined);
    const created = await svcCreateGoal(input);
    // If active, keep one active per type enforced by backend; reload list to reflect changes
    await loadGoals();
    return created;
  };

  const setActive: GoalsActions['setActive'] = async (goalId) => {
    setError(undefined);
    const updated = await svcSetActiveGoal(goalId);
    await loadGoals();
    return updated;
  };

  const deactivate: GoalsActions['deactivate'] = async (goalId) => {
    setError(undefined);
    const updated = await svcDeactivateGoal(goalId);
    await loadGoals();
    return updated;
  };

  const deleteGoal: GoalsActions['deleteGoal'] = async (goalId) => {
    setError(undefined);
    await svcDeleteGoal(goalId);
    // Remove from local state quickly
    const remaining = [...goals, ...archived].filter((g) => g.id !== goalId);
    const { act, arc } = _partitionGoals(remaining);
    setGoals(act);
    setArchived(arc);
    setProgressById((prev) => {
      const { [goalId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const refreshProgress: GoalsActions['refreshProgress'] = async (goalIds) => {
    const targets = goalIds ?? goals.map((g) => g.id);
    if (targets.length === 0) return;
    const entries = await Promise.all(
      targets.map(async (id) => [id, await svcGetGoalProgress(id)] as const)
    );
    setProgressById((prev) => {
      const next = { ...prev };
      for (const [id, prog] of entries) next[id] = prog ?? null;
      return next;
    });
  };

  // Auto-load on mount
  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selectors
  const topNActive: GoalsSelectors['topNActive'] = (n) => goals.slice(0, n);

  const byType: GoalsSelectors['byType'] = (type) =>
    [...goals, ...archived].filter((g) => g.type === type);

  const progressFor: GoalsSelectors['progressFor'] = (goalId) => progressById[goalId];

  const streakSnapshot: GoalsSelectors['streakSnapshot'] = (goalId) =>
    progressById[goalId]?.streak;

  return {
    // state
    goals,
    archived,
    progressById,
    isLoading,
    error,
    // actions
    loadGoals,
    createGoal,
    setActive,
    deactivate,
    deleteGoal,
    refreshProgress,
    // selectors
    topNActive,
    byType,
    progressFor,
    streakSnapshot,
  };
});
