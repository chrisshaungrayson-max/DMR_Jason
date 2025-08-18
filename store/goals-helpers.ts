import type {
  GoalRecord,
  GoalType,
  GoalProgress,
  BodyFatGoalParams,
  WeightGoalParams,
  LeanMassGainGoalParams,
  CalorieStreakGoalParams,
  ProteinStreakGoalParams,
} from '@/types/goal';

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

// Centralized validation for goal creation inputs used by Profile UI (5.6)
export type ValidateOk =
  | { ok: true; params: BodyFatGoalParams | WeightGoalParams | LeanMassGainGoalParams | CalorieStreakGoalParams | ProteinStreakGoalParams }
  | { ok: false; message: string };

export function validateGoalInput(input: {
  goalType: GoalType;
  startDateISO: string;
  endDateISO?: string;
  fields: {
    bodyFatTargetPct?: string;
    weightTargetKg?: string;
    weightDirection?: 'down' | 'up';
    leanGainKg?: string;
    calStreakDays?: string;
    calBasis?: 'recommended' | 'custom';
    calMin?: string;
    calMax?: string;
    proteinPerDay?: string;
    proteinDays?: string;
  };
}): ValidateOk {
  const { goalType, startDateISO, endDateISO, fields } = input;

  if (!endDateISO) {
    return { ok: false, message: 'Let’s pick an end date: choose when you want this goal to wrap up.' };
  }
  if (new Date(endDateISO) < new Date(startDateISO)) {
    return { ok: false, message: 'End date is before start: set an end date that’s on or after today.' };
  }

  if (goalType === 'body_fat') {
    const pct = Number(fields.bodyFatTargetPct);
    if (!isFinite(pct) || pct < 5 || pct > 45) {
      return { ok: false, message: 'Choose a body fat percentage between 5% and 45%.' };
    }
    return { ok: true, params: { targetPct: pct } };
  }

  if (goalType === 'weight') {
    const kg = Number(fields.weightTargetKg);
    if (!isFinite(kg) || kg < 30 || kg > 300) {
      return { ok: false, message: 'Enter a weight between 30kg and 300kg.' };
    }
    const direction = fields.weightDirection ?? 'down';
    return { ok: true, params: { targetWeightKg: kg, direction } };
  }

  if (goalType === 'lean_mass_gain') {
    const gain = Number(fields.leanGainKg);
    if (!isFinite(gain) || gain <= 0 || gain > 20) {
      return { ok: false, message: 'Enter a lean mass gain between 0.5kg and 20kg.' };
    }
    return { ok: true, params: { targetKg: gain } };
  }

  if (goalType === 'calorie_streak') {
    const days = Number(fields.calStreakDays);
    if (!isFinite(days) || days < 1 || days > 365) {
      return { ok: false, message: 'Choose streak days between 1 and 365.' };
    }
    const basis = fields.calBasis ?? 'recommended';
    if (basis === 'custom') {
      const min = fields.calMin ? Number(fields.calMin) : undefined;
      const max = fields.calMax ? Number(fields.calMax) : undefined;
      if ((min && !isFinite(min)) || (max && !isFinite(max)) || (min && min <= 0) || (max && max <= 0)) {
        return { ok: false, message: 'Custom calories should be positive numbers.' };
      }
      if (min && max && min >= max) {
        return { ok: false, message: 'Make sure min calories are less than max calories.' };
      }
      const params: CalorieStreakGoalParams = { targetDays: days, basis };
      if (min) params.minCalories = min;
      if (max) params.maxCalories = max;
      return { ok: true, params };
    }
    return { ok: true, params: { targetDays: days, basis } };
  }

  if (goalType === 'protein_streak') {
    const grams = Number(fields.proteinPerDay);
    const pDays = Number(fields.proteinDays);
    if (!isFinite(grams) || grams < 30 || grams > 400) {
      return { ok: false, message: 'Set daily protein between 30g and 400g.' };
    }
    if (!isFinite(pDays) || pDays < 1 || pDays > 365) {
      return { ok: false, message: 'Choose streak days between 1 and 365.' };
    }
    return { ok: true, params: { gramsPerDay: grams, targetDays: pDays } };
  }

  return { ok: false, message: 'Unsupported goal type.' };
}
