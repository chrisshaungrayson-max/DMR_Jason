import { describe, it, expect, vi, beforeEach } from 'vitest';

// IMPORTANT: mock path must match specifier used inside services/goals.ts
function makeSupabaseMock() {
  const state: any = {
    userId: 'user-123',
    // days rows keyed by date
    days: new Map<string, { date: string; total_calories: number | null; total_protein: number | null }>(),
    // profiles
    profile: { tdee: 2000 },
    // goals table lookup by id
    goals: new Map<string, any>(),
    // goal_measurements keyed by goal_id
    measurements: new Map<string, Array<{ id: string; goal_id: string; date: string; value: any; source: 'manual' | 'log'; created_at: string }>>(),
    // track last update payloads
    lastUpdate: null as any,
  }

  function makeQuery(table: string) {
    const q: any = { _table: table, _filters: [] as any[], _select: '*', _order: null as any };
    q.select = (sel: string) => { q._select = sel; return q; };
    q.eq = (col: string, val: any) => { q._filters.push({ type: 'eq', col, val }); return q; };
    q.gte = (col: string, val: any) => { q._filters.push({ type: 'gte', col, val }); return q; };
    q.lte = (col: string, val: any) => { q._filters.push({ type: 'lte', col, val }); return q; };
    q.neq = (col: string, val: any) => { q._filters.push({ type: 'neq', col, val }); return q; };
    q.order = (_col: string, _opts: any) => { q._order = { _col, _opts }; return q; };
    q.maybeSingle = async () => {
      if (table === 'profiles') {
        return { data: { ...state.profile }, error: null };
      }
      if (table === 'goals') {
        // Filter by id
        const idFilter = q._filters.find((f: any) => f.col === 'id' && f.type === 'eq');
        const g = idFilter ? state.goals.get(idFilter.val) : null;
        return { data: g ?? null, error: null };
      }
      return { data: null, error: null };
    };
    q.single = async () => {
      if (table === 'goals') {
        const idFilter = q._filters.find((f: any) => f.col === 'id' && f.type === 'eq');
        const g = idFilter ? state.goals.get(idFilter.val) : null;
        if (q._update && g) {
          state.lastUpdate = { table, payload: q._update };
          Object.assign(g, q._update);
          return { data: g, error: null };
        }
        return { data: g ?? null, error: g ? null : new Error('not found') };
      }
      return { data: null, error: null };
    };
    q.update = (payload: any) => {
      q._update = payload; return q;
    };
    q.insert = (_payload: any) => { return q; };
    q.delete = () => { return q; };
    q.upsert = (_payload: any) => { return q; };

    // Terminal select for days and goal_measurements
    const execSelect = async () => {
      if (table === 'days') {
        // Build date range
        const gte = q._filters.find((f: any) => f.type === 'gte' && f.col === 'date');
        const lte = q._filters.find((f: any) => f.type === 'lte' && f.col === 'date');
        const start = gte?.val ?? '0000-01-01';
        const end = lte?.val ?? '9999-12-31';
        const out: any[] = [];
        for (const [date, row] of state.days) {
          if (date >= start && date <= end) out.push(row);
        }
        out.sort((a: any, b: any) => a.date.localeCompare(b.date));
        return { data: out, error: null };
      }
      if (table === 'goal_measurements') {
        const goalIdEq = q._filters.find((f: any) => f.type === 'eq' && f.col === 'goal_id');
        const gid = goalIdEq?.val;
        const rows = (gid ? state.measurements.get(gid) ?? [] : []).slice();
        rows.sort((a: any, b: any) => a.date.localeCompare(b.date));
        return { data: rows, error: null };
      }
      if (table === 'goals' && q._update) {
        state.lastUpdate = { table, payload: q._update };
        // Apply to in-memory goal by id
        const idFilter = q._filters.find((f: any) => f.col === 'id' && f.type === 'eq');
        const g = idFilter ? state.goals.get(idFilter.val) : null;
        if (g) {
          Object.assign(g, q._update);
          return { data: g, error: null };
        }
        return { data: null, error: new Error('not found') };
      }
      return { data: null, error: null };
    };

    // Bind select function for general case
    q.select = q.select.bind(q);
    q.eq = q.eq.bind(q);
    q.gte = q.gte.bind(q);
    q.lte = q.lte.bind(q);
    q.neq = q.neq.bind(q);
    q.order = q.order.bind(q);
    q.maybeSingle = q.maybeSingle.bind(q);
    q.single = q.single.bind(q);
    q.update = q.update.bind(q);
    q.insert = q.insert.bind(q);
    q.delete = q.delete.bind(q);
    q.upsert = q.upsert.bind(q);
    // Make the chain awaitable: awaiting the builder will execute select for list-style queries
    q.then = ((onFulfilled?: any, onRejected?: any) => {
      return Promise.resolve(execSelect()).then(onFulfilled, onRejected);
    }) as any;
    // For chaining select on non-days tables, call execSelect when awaited
    (q as any).execSelect = execSelect;
    // Override select to return execSelect when called on 'days' or update path
    const _select = q.select;
    q.select = ((...args: any[]) => {
      _select(...args);
      return {
        ...q,
        // Keep chainable methods if needed
        order: q.order,
        gte: q.gte,
        lte: q.lte,
        eq: q.eq,
        update: q.update,
        select: q.select,
        single: q.single,
        maybeSingle: q.maybeSingle,
        // End the chain explicitly for list-style selects
        async exec() { return execSelect(); },
        then: q.then,
      } as any;
    }) as any;

    // When code calls .select(...).order(...), we cannot intercept easily; provide order that returns object with exec
    q.order = ((...oargs: any[]) => {
      (q as any)._order = oargs;
      return { ...q, async exec() { return execSelect(); }, then: q.then } as any;
    }) as any;

    return q;
  }

  const supabase = {
    auth: {
      getUser: async () => ({ data: { user: { id: state.userId } }, error: null }),
    },
    from: (table: string) => makeQuery(table),
    _state: state,
  } as any;

  return { supabase };
};
vi.mock('@/lib/supabaseClient', () => makeSupabaseMock());
vi.mock('../lib/supabaseClient', () => makeSupabaseMock());

import { getGoalProgressForStreak, getGoalProgress, finalizeGoalAsAchieved } from '../goals';
import { supabase } from '@/lib/supabaseClient';
import { computeGoalProgress } from '../goals';

function addDays(state: any, rows: Array<{ date: string; cal?: number | null; protein?: number | null }>) {
  for (const r of rows) {
    state.days.set(r.date, { date: r.date, total_calories: r.cal ?? null, total_protein: r.protein ?? null });
  }
}

function addMeasurements(state: any, goalId: string, rows: Array<{ date: string; value: any }>) {
  const arr = state.measurements.get(goalId) ?? [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    arr.push({
      id: `${goalId}-${i}`,
      goal_id: goalId,
      date: r.date,
      value: r.value,
      source: 'manual',
      created_at: `${r.date}T00:00:00Z`,
    });
  }
  state.measurements.set(goalId, arr);
}

  it('returns 0% and empty trend when weekly measurements are insufficient', async () => {
    const goal = {
      id: 'bf2', user_id: (supabase as any)._state.userId, type: 'body_fat',
      params: { targetPct: 12.0 }, start_date: '2025-08-11', end_date: '2025-08-25',
      active: true, status: 'active', created_at: '', updated_at: ''
    };
    // Only one measurement in a week (< MIN_WEEKLY_MEASUREMENTS = 2), so no weekly point
    addMeasurements((supabase as any)._state, 'bf2', [
      { date: '2025-08-11', value: { bodyFatPct: 20.0 } },
      { date: '2025-08-18', value: { bodyFatPct: 19.0 } },
    ]);
    const prog = await computeGoalProgress(goal as any);
    expect(prog?.trend?.length).toBe(0);
    expect(prog?.percent).toBe(0);
    expect(prog?.label).toBe('');
    expect(prog?.achieved).toBe(false);
  });

  it('uses profile TDEE window for calorie_streak when basis = recommended', async () => {
    // Set profile TDEE
    (supabase as any)._state.profile = { tdee: 2000 };
    // Recommended window: 1800 - 2200
    addDays((supabase as any)._state, [
      { date: '2025-08-10', cal: 1800 }, // compliant
      { date: '2025-08-11', cal: 2250 }, // non-compliant
      { date: '2025-08-12', cal: 2000 }, // compliant
    ]);
    const goal = {
      id: 'gc1', user_id: (supabase as any)._state.userId, type: 'calorie_streak',
      params: { basis: 'recommended', targetDays: 2 }, start_date: '2025-08-10', end_date: '2025-08-12',
      active: true, status: 'active', created_at: '', updated_at: ''
    };
    const prog = await getGoalProgressForStreak(goal as any);
    // Last two days: 2250 (non), 2000 (compliant) => current = 1
    expect(prog.streak?.current).toBe(1);
    expect(prog.percent).toBe(50);
    expect(prog.achieved).toBe(false);
  });

  it('streak current counts only trailing compliant days after a break', async () => {
    addDays((supabase as any)._state, [
      { date: '2025-08-10', protein: 160 }, // compliant
      { date: '2025-08-11', protein: 100 }, // break
      { date: '2025-08-12', protein: 160 }, // compliant
      { date: '2025-08-13', protein: 160 }, // compliant => current 2
    ]);
    const goal = {
      id: 'gs1', user_id: (supabase as any)._state.userId, type: 'protein_streak',
      params: { gramsPerDay: 150, targetDays: 3 }, start_date: '2025-08-10', end_date: '2025-08-13',
      active: true, status: 'active', created_at: '', updated_at: ''
    };
    const prog = await getGoalProgressForStreak(goal as any);
    expect(prog.streak?.current).toBe(2);
    expect(prog.percent).toBe(67);
    expect(prog.achieved).toBe(false);
    // History should include the break day
    expect(prog.streak?.history?.some(h => h.dateISO === '2025-08-11' && h.compliant === false)).toBe(true);
  });

describe('streak progress and auto-finalize', () => {

  beforeEach(() => {
    (supabase as any)._state.days = new Map();
    (supabase as any)._state.profile = { tdee: 2000 };
    (supabase as any)._state.goals = new Map();
    (supabase as any)._state.lastUpdate = null;
  });

  it('computes numeric progress for body_fat using weekly averages', async () => {
    const goal = {
      id: 'bf1', user_id: (supabase as any)._state.userId, type: 'body_fat',
      params: { targetPct: 15.0 }, start_date: '2025-08-11', end_date: '2025-08-25',
      active: true, status: 'active', created_at: '', updated_at: ''
    };
    // Week 1 (Mon/Tue): 20, 19 => avg 19.5; Week 2 (Mon/Tue next week): 18, 17 => avg 17.5
    addMeasurements((supabase as any)._state, 'bf1', [
      { date: '2025-08-11', value: { bodyFatPct: 20.0 } },
      { date: '2025-08-12', value: { bodyFatPct: 19.0 } },
      { date: '2025-08-18', value: { bodyFatPct: 18.0 } },
      { date: '2025-08-19', value: { bodyFatPct: 17.0 } },
    ]);
    const prog = await computeGoalProgress(goal as any);
    expect(prog?.percent).toBe(44);
    expect(prog?.label).toContain('17.5%');
    expect(prog?.achieved).toBe(false);
  });

  it('computes numeric progress for weight (down)', async () => {
    const goal = {
      id: 'w1', user_id: (supabase as any)._state.userId, type: 'weight',
      params: { targetWeightKg: 90, direction: 'down' }, start_date: '2025-08-11', end_date: '2025-08-25',
      active: true, status: 'active', created_at: '', updated_at: ''
    };
    // Week 1 avg 99.5; Week 2 avg 96.5
    addMeasurements((supabase as any)._state, 'w1', [
      { date: '2025-08-11', value: { weightKg: 100 } },
      { date: '2025-08-12', value: { weightKg: 99 } },
      { date: '2025-08-18', value: { weightKg: 97 } },
      { date: '2025-08-19', value: { weightKg: 96 } },
    ]);
    const prog = await computeGoalProgress(goal as any);
    expect(prog?.percent).toBe(32);
    expect(prog?.label).toContain('↓ 90.0kg');
    expect(prog?.achieved).toBe(false);
  });

  it('computes numeric progress for lean_mass_gain', async () => {
    const goal = {
      id: 'lm1', user_id: (supabase as any)._state.userId, type: 'lean_mass_gain',
      params: { targetKg: 5 }, start_date: '2025-08-11', end_date: '2025-08-25',
      active: true, status: 'active', created_at: '', updated_at: ''
    };
    // Week 1 avg 60.5; Week 2 avg 62.5 => gained 2.0 of 5 => 40%
    addMeasurements((supabase as any)._state, 'lm1', [
      { date: '2025-08-11', value: { leanMassKg: 60 } },
      { date: '2025-08-12', value: { leanMassKg: 61 } },
      { date: '2025-08-18', value: { leanMassKg: 62 } },
      { date: '2025-08-19', value: { leanMassKg: 63 } },
    ]);
    const prog = await computeGoalProgress(goal as any);
    expect(prog?.percent).toBe(40);
    expect(prog?.label).toContain('2.0kg');
    expect(prog?.achieved).toBe(false);
  });

  it('computes protein_streak current and percent', async () => {
    addDays((supabase as any)._state, [
      { date: '2025-08-10', protein: 120 },
      { date: '2025-08-11', protein: 160 },
      { date: '2025-08-12', protein: 170 },
    ]);
    const goal = {
      id: 'g1', user_id: (supabase as any)._state.userId, type: 'protein_streak',
      params: { gramsPerDay: 150, targetDays: 3 }, start_date: '2025-08-10', end_date: '2025-08-12',
      active: true, status: 'active', created_at: '', updated_at: ''
    };
    const prog = await getGoalProgressForStreak(goal as any);
    expect(prog.streak?.current).toBe(2);
    expect(prog.percent).toBe(67);
    expect(prog.achieved).toBe(false);
  });

  it('computes calorie_streak with custom bounds', async () => {
    addDays((supabase as any)._state, [
      { date: '2025-08-10', cal: 2000 },
      { date: '2025-08-11', cal: 2300 }, // non-compliant
      { date: '2025-08-12', cal: 1900 },
    ]);
    const goal = {
      id: 'g2', user_id: (supabase as any)._state.userId, type: 'calorie_streak',
      params: { basis: 'custom', minCalories: 1800, maxCalories: 2200, targetDays: 2 }, start_date: '2025-08-10', end_date: '2025-08-12',
      active: true, status: 'active', created_at: '', updated_at: ''
    };
    const prog = await getGoalProgressForStreak(goal as any);
    expect(prog.streak?.current).toBe(1);
    expect(prog.percent).toBe(50);
    expect(prog.achieved).toBe(false);
  });

  it('auto-finalizes achieved streak via getGoalProgress()', async () => {
    addDays((supabase as any)._state, [
      { date: '2025-08-10', protein: 160 },
      { date: '2025-08-11', protein: 155 },
    ]);
    const goal = {
      id: 'g3', user_id: (supabase as any)._state.userId, type: 'protein_streak',
      params: { gramsPerDay: 150, targetDays: 2 }, start_date: '2025-08-10', end_date: '2025-08-11',
      active: true, status: 'active', created_at: '', updated_at: ''
    };
    (supabase as any)._state.goals.set('g3', goal);

    const prog = await getGoalProgress('g3');
    expect(prog?.achieved).toBe(true);
    // ensure update happened
    expect((supabase as any)._state.lastUpdate?.payload).toMatchObject({ status: 'achieved', active: false });
    expect((supabase as any)._state.goals.get('g3').status).toBe('achieved');
    expect((supabase as any)._state.goals.get('g3').active).toBe(false);
  });

  it('auto-finalizes achieved numeric goal (body_fat) via getGoalProgress()', async () => {
    const goal = {
      id: 'g4', user_id: (supabase as any)._state.userId, type: 'body_fat',
      params: { targetPct: 18.0 }, start_date: '2025-08-11', end_date: '2025-08-25',
      active: true, status: 'active', created_at: '', updated_at: ''
    };
    // Week 1 avg 20.0; Week 2 avg 18.0 => 100%
    addMeasurements((supabase as any)._state, 'g4', [
      { date: '2025-08-11', value: { bodyFatPct: 20.0 } },
      { date: '2025-08-12', value: { bodyFatPct: 20.0 } },
      { date: '2025-08-18', value: { bodyFatPct: 18.0 } },
      { date: '2025-08-19', value: { bodyFatPct: 18.0 } },
    ]);
    (supabase as any)._state.goals.set('g4', goal);
    const prog = await getGoalProgress('g4');
    expect(prog?.achieved).toBe(true);
    expect((supabase as any)._state.lastUpdate?.payload).toMatchObject({ status: 'achieved', active: false });
    expect((supabase as any)._state.goals.get('g4').status).toBe('achieved');
    expect((supabase as any)._state.goals.get('g4').active).toBe(false);
  });
});
