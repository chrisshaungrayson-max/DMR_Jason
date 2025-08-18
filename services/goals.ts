import { supabase } from '../lib/supabaseClient';
import type {
  AnyGoal,
  GoalRecord,
  GoalType,
  GoalStatus,
  GoalParams,
  GoalProgress,
  WeeklyAveragePoint,
} from '../types/goal';
import { parseGoalParams } from '../types/goal.validation';
import { ISO_WEEK_START_DOW, MIN_WEEKLY_MEASUREMENTS, STREAK_STRICT } from '../types/goal';

// Simple typed error for unique constraint (one active goal per type)
export class ActiveGoalConflictError extends Error {
  constructor(public goalType: GoalType) {
    super(`You already have an active ${goalType} goal. Deactivate it first.`);
    this.name = 'ActiveGoalConflictError';
  }
}

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) throw new Error('Not authenticated');
  return data.user.id;
}

// Check if the current user already has an active goal of the given type
export async function hasActiveGoalOfType(type: GoalType): Promise<boolean> {
  const { data, error } = await supabase
    .from('goals')
    .select('id')
    .eq('type', type)
    .eq('active', true)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// Throw a friendly error if an active goal of the type already exists
export async function ensureNoActiveGoalOfType(type: GoalType): Promise<void> {
  const exists = await hasActiveGoalOfType(type);
  if (exists) throw new ActiveGoalConflictError(type);
}

// Create a goal (MVP: no edit). Params are validated per type using zod.
export async function createGoal(input: {
  type: GoalType;
  params: unknown; // runtime validation will parse
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  active?: boolean;   // default true
}): Promise<GoalRecord> {
  const user_id = await getUserId();

  // Validate params by type
  const parsedParams = parseGoalParams<GoalParams>(input.type, input.params);

  // Client-side guard before insert (DB will still enforce via unique index)
  const willBeActive = input.active ?? true;
  if (willBeActive) {
    await ensureNoActiveGoalOfType(input.type);
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id,
      type: input.type,
      params: parsedParams,
      start_date: input.start_date,
      end_date: input.end_date,
      active: input.active ?? true,
      status: 'active' as GoalStatus,
    })
    .select('*')
    .single();

  if (error) {
    // Detect partial unique index violation for one-active-goal-per-type
    // Postgres error code 23505 for unique_violation
    if ((error as any).code === '23505') {
      throw new ActiveGoalConflictError(input.type);
    }
    throw error;
  }
  return data as GoalRecord;
}

export async function listGoals(filters?: {
  type?: GoalType;
  active?: boolean;
}): Promise<GoalRecord[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  let results = (data ?? []) as GoalRecord[];
  if (filters?.type) results = results.filter((g) => g.type === filters.type);
  if (typeof filters?.active === 'boolean') results = results.filter((g) => g.active === filters.active);
  return results;
}

export async function deactivateGoal(goalId: string): Promise<GoalRecord> {
  const { data, error } = await supabase
    .from('goals')
    .update({ active: false, status: 'deactivated' as GoalStatus })
    .eq('id', goalId)
    .select('*')
    .single();
  if (error) throw error;
  return data as GoalRecord;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', goalId);
  if (error) throw error;
}

// Make the given goal active, deactivating any other active goals of the same type for the user
export async function setActiveGoal(goalId: string): Promise<GoalRecord> {
  // Fetch the goal to learn its type and user
  const { data: goal, error: fetchErr } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single();
  if (fetchErr) throw fetchErr;
  if (!goal) throw new Error('Goal not found');

  const goalType = (goal as GoalRecord).type;
  const userId = (goal as GoalRecord).user_id;

  // Deactivate any other active goals of this type for the same user
  const { error: clearErr } = await supabase
    .from('goals')
    .update({ active: false })
    .eq('user_id', userId)
    .eq('type', goalType)
    .eq('active', true)
    .neq('id', goalId);
  if (clearErr) throw clearErr;

  // Activate this goal
  const { data: updated, error: updateErr } = await supabase
    .from('goals')
    .update({ active: true, status: 'active' as GoalStatus })
    .eq('id', goalId)
    .select('*')
    .single();
  if (updateErr) throw updateErr;
  return updated as GoalRecord;
}

// ==============================
// Progress helpers (3.3 numeric)
// ==============================

type RawMeasurement = {
  id: string;
  goal_id: string;
  date: string; // YYYY-MM-DD
  value: Record<string, any>;
  source: 'manual' | 'log';
  created_at: string;
};

async function fetchGoalMeasurements(goalId: string): Promise<RawMeasurement[]> {
  const { data, error } = await supabase
    .from('goal_measurements')
    .select('*')
    .eq('goal_id', goalId)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as RawMeasurement[];
}

function getWeekStart(dateStr: string): string {
  // Use local timezone; compute week start according to ISO_WEEK_START_DOW
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay(); // 0=Sun..6=Sat
  // ISO week starts Monday (1). Shift back to Monday.
  const isoDow = dow === 0 ? 7 : dow; // Sun->7
  const diffDays = isoDow - ISO_WEEK_START_DOW; // usually 1
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - diffDays);
  return weekStart.toISOString().slice(0, 10);
}

function bucketWeeklyAverage(values: { date: string; num: number }[]): WeeklyAveragePoint[] {
  const buckets = new Map<string, number[]>();
  for (const v of values) {
    if (Number.isFinite(v.num)) {
      const wk = getWeekStart(v.date);
      const arr = buckets.get(wk) ?? [];
      arr.push(v.num);
      buckets.set(wk, arr);
    }
  }
  const points: WeeklyAveragePoint[] = [];
  const sortedWeeks = Array.from(buckets.keys()).sort();
  for (const wk of sortedWeeks) {
    const arr = buckets.get(wk)!;
    if (arr.length >= MIN_WEEKLY_MEASUREMENTS) {
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      points.push({ weekStartISO: wk, value: Number(avg.toFixed(3)) });
    }
  }
  return points;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function computePercentForBodyFat(trend: WeeklyAveragePoint[], targetPct: number): { percent: number; label: string } {
  if (trend.length === 0) return { percent: 0, label: '' };
  const start = trend[0].value;
  const current = trend[trend.length - 1].value;
  if (start === targetPct) return { percent: 100, label: `${current.toFixed(1)}% → ${targetPct.toFixed(1)}%` } as any;
  const denom = Math.abs(start - targetPct);
  const progress = Math.abs(current - start) / (denom === 0 ? 1 : denom);
  const pct = Math.round(clamp01(progress) * 100);
  return { percent: pct, label: `${current.toFixed(1)}% → ${targetPct.toFixed(1)}%` };
}

function computePercentForWeight(trend: WeeklyAveragePoint[], targetWeightKg: number, direction: 'down' | 'up') {
  if (trend.length === 0) return { percent: 0, label: '' };
  const start = trend[0].value;
  const current = trend[trend.length - 1].value;
  const denom = Math.abs(start - targetWeightKg) || 1;
  const raw = direction === 'down' ? (start - current) / denom : (current - start) / denom;
  const pct = Math.round(clamp01(raw) * 100);
  const arrow = direction === 'down' ? '↓' : '↑';
  return { percent: pct, label: `${current.toFixed(1)}kg ${arrow} ${targetWeightKg.toFixed(1)}kg` };
}

function computePercentForLeanMassGain(trend: WeeklyAveragePoint[], targetGainKg: number) {
  if (trend.length === 0) return { percent: 0, label: '' };
  const start = trend[0].value;
  const current = trend[trend.length - 1].value;
  const gained = Math.max(0, current - start);
  const raw = gained / (targetGainKg || 1);
  const pct = Math.round(clamp01(raw) * 100);
  return { percent: pct, label: `${gained.toFixed(1)}kg / ${targetGainKg.toFixed(1)}kg` };
}

function extractNumericByType(goal: GoalRecord, m: RawMeasurement): number | null {
  const v = m.value || {};
  switch (goal.type) {
    case 'body_fat':
      return typeof v.bodyFatPct === 'number' ? v.bodyFatPct : typeof v.pct === 'number' ? v.pct : null;
    case 'weight':
      return typeof v.weightKg === 'number' ? v.weightKg : typeof v.kg === 'number' ? v.kg : null;
    case 'lean_mass_gain':
      return typeof v.leanMassKg === 'number' ? v.leanMassKg : typeof v.kg === 'number' ? v.kg : null;
    default:
      return null;
  }
}

export async function computeGoalProgress(goal: GoalRecord): Promise<GoalProgress | null> {
  // Only numeric types here; streak types handled in 3.4
  if (goal.type === 'calorie_streak' || goal.type === 'protein_streak') return null;

  const measurements = await fetchGoalMeasurements(goal.id);
  const numeric = measurements
    .map((m) => ({ date: m.date, num: extractNumericByType(goal, m) }))
    .filter((x): x is { date: string; num: number } => typeof x.num === 'number');
  const trend = bucketWeeklyAverage(numeric);

  let percent = 0;
  let label = '';
  if (goal.type === 'body_fat') {
    const { targetPct } = goal.params as any;
    ({ percent, label } = computePercentForBodyFat(trend, targetPct));
  } else if (goal.type === 'weight') {
    const { targetWeightKg, direction } = goal.params as any;
    ({ percent, label } = computePercentForWeight(trend, targetWeightKg, direction));
  } else if (goal.type === 'lean_mass_gain') {
    const { targetKg } = goal.params as any;
    ({ percent, label } = computePercentForLeanMassGain(trend, targetKg));
  }

  const progress: GoalProgress = {
    goalId: goal.id,
    type: goal.type,
    percent,
    label,
    trend,
    achieved: percent >= 100,
    computedAtISO: new Date().toISOString(),
  };
  return progress;
}

// ==============================
// Achievement auto-marking (3.5)
// ==============================

export async function finalizeGoalAsAchieved(goalId: string): Promise<GoalRecord> {
  const { data, error } = await supabase
    .from('goals')
    .update({ status: 'achieved' as GoalStatus, active: false })
    .eq('id', goalId)
    .select('*')
    .single();
  if (error) throw error;
  return data as GoalRecord;
}

export async function getGoalProgress(goalId: string): Promise<GoalProgress | null> {
  const { data: goal, error } = await supabase.from('goals').select('*').eq('id', goalId).single();
  if (error) throw error;
  const g = goal as GoalRecord;
  let progress: GoalProgress | null = null;
  if (g.type === 'calorie_streak' || g.type === 'protein_streak') {
    progress = await getGoalProgressForStreak(g);
  } else {
    progress = await computeGoalProgress(g);
  }
  // Auto-finalize if achieved
  if (progress && progress.achieved && g.active && g.status !== 'achieved') {
    await finalizeGoalAsAchieved(g.id);
  }
  return progress;
}

// ==============================
// Streak progress (3.4)
// ==============================

type DayRow = {
  date: string; // YYYY-MM-DD
  total_calories: number | null;
  total_protein: number | null;
};

async function fetchDaysRange(userId: string, startDate: string, endDate: string): Promise<DayRow[]> {
  const { data, error } = await supabase
    .from('days')
    .select('date,total_calories,total_protein')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DayRow[];
}

async function getUserProfileTDEE(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('tdee')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.tdee as number | null) ?? null;
}

function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function toLocalISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function eachDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  // iterate by local dates to avoid timezone shifts
  for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
       d <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
       d.setDate(d.getDate() + 1)) {
    dates.push(toLocalISODate(d));
  }
  return dates;
}

function computeCurrentStreak(history: { date: string; compliant: boolean }[], target: number) {
  let current = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].compliant) current++;
    else break;
  }
  const percent = Math.round(Math.min(1, current / Math.max(1, target)) * 100);
  return { current, percent };
}

export async function getGoalProgressForStreak(goal: GoalRecord): Promise<GoalProgress> {
  const userId = await getUserId();
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const start = goal.start_date;
  const end = goal.end_date < todayISO ? goal.end_date : todayISO;

  const days = await fetchDaysRange(userId, start, end);
  const byDate = new Map(days.map((d) => [d.date, d]));
  const dates = eachDateRange(start, end);

  let targetDays = 0;
  let history: { date: string; compliant: boolean }[] = [];

  if (goal.type === 'protein_streak') {
    const { gramsPerDay, targetDays: tgt } = goal.params as any;
    targetDays = tgt;
    for (const date of dates) {
      const row = byDate.get(date);
      const protein = row?.total_protein ?? 0;
      const compliant = STREAK_STRICT ? protein >= gramsPerDay : protein >= gramsPerDay; // strict currently identical
      history.push({ date, compliant });
    }
  } else if (goal.type === 'calorie_streak') {
    const { basis, minCalories, maxCalories, targetDays: tgt } = goal.params as any;
    targetDays = tgt;
    let minC = minCalories ?? null;
    let maxC = maxCalories ?? null;
    if (basis === 'recommended' && (minC === null || maxC === null)) {
      // Use profile TDEE with a ±10% window as a default strict compliance window
      const tdee = await getUserProfileTDEE(userId);
      if (tdee) {
        minC = Math.round(tdee * 0.9);
        maxC = Math.round(tdee * 1.1);
      }
    }
    for (const date of dates) {
      const row = byDate.get(date);
      const cal = row?.total_calories ?? 0;
      const compliant = minC !== null && maxC !== null ? cal >= minC && cal <= maxC : false;
      history.push({ date, compliant });
    }
  } else {
    throw new Error('Unsupported streak goal type');
  }

  const { current, percent } = computeCurrentStreak(history, targetDays);
  const progress: GoalProgress = {
    goalId: goal.id,
    type: goal.type,
    percent,
    label: `${current}/${targetDays} days`,
    streak: {
      current,
      target: targetDays,
      history: history.slice(-30).map((h) => ({ dateISO: h.date, compliant: h.compliant })),
    },
    achieved: current >= targetDays,
    computedAtISO: new Date().toISOString(),
  };
  return progress;
}
