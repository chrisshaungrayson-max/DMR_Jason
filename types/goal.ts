// Goal domain types and enums for Fitness Goals feature
// Mirrors DB enum-like text values defined in migrations 0003_goals.sql

export type UUID = string;

export type GoalType =
  | 'body_fat'
  | 'weight'
  | 'lean_mass_gain'
  | 'calorie_streak'
  | 'protein_streak';

export type GoalStatus = 'active' | 'achieved' | 'deactivated';

// Param interfaces per goal type
export interface BodyFatGoalParams {
  targetPct: number; // e.g., 15.0 means 15%
}

export interface WeightGoalParams {
  targetWeightKg: number; // target body weight in kg
  // Direction toward target: 'down' for weight loss, 'up' for weight gain
  direction: 'down' | 'up';
}

export interface LeanMassGainGoalParams {
  targetKg: number; // desired lean mass gain (kg)
}

export interface CalorieStreakGoalParams {
  targetDays: number; // required consecutive compliant days
  // Basis for target: recommended (from app calculation) or custom range
  basis: 'recommended' | 'custom';
  // Optional calorie range if basis = 'custom'
  minCalories?: number;
  maxCalories?: number;
}

export interface ProteinStreakGoalParams {
  gramsPerDay: number; // minimum grams per day
  targetDays: number; // required consecutive compliant days
}

export type GoalParams =
  | BodyFatGoalParams
  | WeightGoalParams
  | LeanMassGainGoalParams
  | CalorieStreakGoalParams
  | ProteinStreakGoalParams
  | Record<string, unknown>; // fallback for forwards-compat

// Generic Goal record (matches public.goals table)
export interface GoalRecord {
  id: UUID;
  user_id: UUID;
  type: GoalType;
  params: GoalParams; // stored as JSONB in DB
  start_date: string; // ISO date (YYYY-MM-DD)
  end_date: string;   // ISO date (YYYY-MM-DD)
  active: boolean;
  status: GoalStatus;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

// Discriminated helper types (optional, for consumers who narrow by type)
export interface BodyFatGoal extends GoalRecord {
  type: 'body_fat';
  params: BodyFatGoalParams;
}

export interface WeightGoal extends GoalRecord {
  type: 'weight';
  params: WeightGoalParams;
}

export interface LeanMassGainGoal extends GoalRecord {
  type: 'lean_mass_gain';
  params: LeanMassGainGoalParams;
}

export interface CalorieStreakGoal extends GoalRecord {
  type: 'calorie_streak';
  params: CalorieStreakGoalParams;
}

export interface ProteinStreakGoal extends GoalRecord {
  type: 'protein_streak';
  params: ProteinStreakGoalParams;
}

export type AnyGoal =
  | BodyFatGoal
  | WeightGoal
  | LeanMassGainGoal
  | CalorieStreakGoal
  | ProteinStreakGoal
  | GoalRecord; // fallback

// ==============================
// Progress & Analytics DTOs (2.3)
// ==============================

// A point representing a weekly average numeric value
export interface WeeklyAveragePoint {
  weekStartISO: string; // ISO date (Monday or locale week start)
  value: number; // averaged numeric value for that week
}

// Streak snapshot for streak goals
export interface StreakSnapshot {
  current: number; // current consecutive compliant days
  target: number;  // goal target days
  // Optional recent history for heatmaps: array of day compliance booleans (oldest -> newest)
  history?: { dateISO: string; compliant: boolean }[];
}

// Generic progress payload returned by services/store
export interface GoalProgress {
  goalId: UUID;
  type: GoalType;
  // Percent complete between 0 and 100
  percent: number;
  // Optional human-friendly label (e.g., "9/14 days", "16.2% → 15.0%")
  label?: string;
  // For numeric goals
  trend?: WeeklyAveragePoint[];
  // For streak goals
  streak?: StreakSnapshot;
  // Whether the goal is achieved based on latest computation
  achieved: boolean;
  // Timestamp of computation
  computedAtISO: string;
}

// ==============================
// Defaults & Constants (2.4)
// ==============================

// Number of goals to highlight by default on dashboards
export const DEFAULT_TOP_N_GOALS = 3 as const;

// Streak strictness: no grace days, every day must comply
export const STREAK_STRICT = true as const;

// Minimum number of measurements required for computing a weekly average
export const MIN_WEEKLY_MEASUREMENTS = 2 as const;

// ISO week starts on Monday (1 = Monday per ISO-8601)
export const ISO_WEEK_START_DOW = 1 as const;
