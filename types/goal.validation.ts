import { z } from 'zod';
import type {
  GoalType,
  BodyFatGoalParams,
  WeightGoalParams,
  LeanMassGainGoalParams,
  CalorieStreakGoalParams,
  ProteinStreakGoalParams,
  GoalParams,
} from './goal';

export const BodyFatParamsSchema = z.object({
  targetPct: z.number().positive().max(100),
}) satisfies z.ZodType<BodyFatGoalParams>;

export const WeightParamsSchema = z.object({
  targetWeightKg: z.number().positive(),
  direction: z.enum(['down', 'up']),
}) satisfies z.ZodType<WeightGoalParams>;

export const LeanMassGainParamsSchema = z.object({
  targetKg: z.number().positive(),
}) satisfies z.ZodType<LeanMassGainGoalParams>;

const CalorieStreakParamsBase = z.object({
  targetDays: z.number().int().min(1).max(365),
  basis: z.enum(['recommended', 'custom']).default('recommended'),
  minCalories: z.number().int().positive().optional(),
  maxCalories: z.number().int().positive().optional(),
});

export const CalorieStreakParamsSchema = CalorieStreakParamsBase
  .refine(
    (v: z.infer<typeof CalorieStreakParamsBase>) =>
      v.basis === 'custom'
        ? v.minCalories !== undefined && v.maxCalories !== undefined && v.minCalories <= v.maxCalories
        : true,
    { message: 'For custom basis, provide minCalories <= maxCalories' }
  ) satisfies z.ZodType<CalorieStreakGoalParams>;

export const ProteinStreakParamsSchema = z.object({
  gramsPerDay: z.number().int().min(1).max(1000),
  targetDays: z.number().int().min(1).max(365),
}) satisfies z.ZodType<ProteinStreakGoalParams>;

export function schemaForType(type: GoalType) {
  switch (type) {
    case 'body_fat':
      return BodyFatParamsSchema;
    case 'weight':
      return WeightParamsSchema;
    case 'lean_mass_gain':
      return LeanMassGainParamsSchema;
    case 'calorie_streak':
      return CalorieStreakParamsSchema;
    case 'protein_streak':
      return ProteinStreakParamsSchema;
    default:
      // fallback accepts any object
      return z.record(z.any());
  }
}

export function parseGoalParams<T extends GoalParams>(type: GoalType, params: unknown): T {
  const schema = schemaForType(type);
  return schema.parse(params) as T;
}

export function safeParseGoalParams<T extends GoalParams>(type: GoalType, params: unknown) {
  const schema = schemaForType(type);
  return schema.safeParse(params) as ReturnType<typeof schema.safeParse>;
}
