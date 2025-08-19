## Relevant Files

- `supabase/migrations/` - New migration(s) to add goals tables and any supporting structures.
- `types/goal.ts` - New TypeScript types/enums for goal domain (goal types, status, params schemas).
- `services/goals.ts` - New service for CRUD and progress helpers; integrates with Supabase and nutrition data.
- `store/goals-store.tsx` - New state store to load/manage goals, compute/hold progress and streak snapshots.
- `app/(tabs)/index.tsx` - Modify to show Homepage goal cards (top N active goals with progress/streaks).
- `app/(tabs)/profile.tsx` (or equivalent) - Add Goal Management UI: create/activate/deactivate/delete (no edit in MVP).
- `app/(tabs)/history.tsx` (or dedicated analytics screen) - Add analytics: trends (weekly averages) and streak calendars.
- `app/components/` - Potential new reusable components: GoalCard, StreakCounter, TrendLineChart, StreakHeatmap.
 - `app/components/GoalCard.tsx` - Shared card for showing goal title, type badge, progress bar or streak counter, and status.
 - `app/components/EmptyState.tsx` - Reusable empty-state component with accessible action, dark/light theming.
- `utils/nutrition-api.ts` - Reuse to fetch daily totals for calories/protein for streak compliance.
- `services/nutrition.ts` - Reuse for nutrition data access in progress calculations.
- `lib/idealMacros.ts` - Reuse for analytics comparison against ideal macros.
- `types/goal.test.ts` - Unit tests for goal domain models and type guards.
- `services/goals.test.ts` - Unit tests for CRUD, progress calculations, and achievement logic.
- `store/goals-store.test.tsx` - Unit tests for store selectors and computed progress.
- `app/components/GoalCard.test.tsx` - Component tests for goal cards and streak counters.
- `app/components/TrendLineChart.test.tsx` - Component tests for trend charts.
- `app/components/StreakHeatmap.test.tsx` - Component tests for heatmap rendering.
 - `store/goals-helpers.ts` - Added `validateGoalInput` helper centralizing goal creation validation logic.
 - `store/__tests__/goal-validation.test.ts` - New unit tests for goal creation validation scenarios.
 - `app/(tabs)/profile.tsx` - Refactored to use `validateGoalInput`; added UI loading state and new styles for goal actions.
 - `app/components/__tests__/EmptyState.test.ts` - Unit tests for EmptyState component.
 - `utils/strings.ts` - Centralized user-facing strings for localization readiness.
 - `utils/events.ts` - New lightweight global event bus for cross-store notifications.
 - `store/nutrition-store.tsx` - Emits `nutrition:changed` events when entries change to trigger goal recomputation.
 - `store/goals-store.tsx` - Subscribes to `nutrition:changed` and calls `refreshProgress()`; recomputes on app open via `loadGoals()`.

### Notes

- No wearable/health integrations in MVP.
- Strict streaks; user-local timezone for day boundaries.
- Numeric targets use weekly averages; require at least weekly measurements.
- Only one active goal per type; no editing after creation in MVP.
- Coach-like copy; clear empty states and validation.

## Tasks

- [ ] 1.0 Design database schema and migrations for goals
  - [x] 1.1 Define `goals` table (id, user_id, type enum, params JSONB, start_date, end_date, active, status enum, created_at, updated_at).
  - [x] 1.2 Define optional `goal_measurements` table (id, goal_id, date, value JSONB, source enum, created_at) for manual entries as needed.
  - [x] 1.3 Add constraints: one active goal per (user_id, type); FK to users; indexes on (user_id, active, type).
  - [x] 1.4 Write Supabase migration SQL and create rollback script.
  - [x] 1.5 Seed/dev data helpers for local testing (optional).

- [x] 2.0 Define goal domain models and TypeScript types/enums
  - [x] 2.1 Create `types/goal.ts` with enums: GoalType, GoalStatus; param interfaces for each type (bodyFat, weight, leanMassGain, calorieStreak, proteinStreak).
  - [x] 2.2 Add type guards/validators for params; zod or manual schemas (align with runtime validation needs).
  - [x] 2.3 Define progress and analytics DTOs (e.g., GoalProgress, StreakSnapshot, WeeklyAveragePoint).
  - [x] 2.4 Export constants for default “top N goals” and streak strictness.

- [ ] 3.0 Implement goals service (CRUD + progress calculation helpers)
  - [x] 3.1 CRUD: createGoal (no edit in MVP), listGoals, setActive, deactivate, delete.
  - [x] 3.2 Validation: prevent multiple active goals of same type per user.
  - [x] 3.3 Progress: numeric targets via weekly averages (timezone-safe bucketing; min weekly measurement handling).
  - [x] 3.4 Progress: streak compliance using `utils/nutrition-api.ts` + `services/nutrition.ts` for daily totals.
  - [x] 3.5 Achievement: auto-mark achieved when criteria met; archive/read-only behavior.
  - [x] 3.6 Unit tests for service logic and edge cases (timezones, streak breaks, insufficient data).

- [x] 4.0 Implement goals state management store
  - [x] 4.1 Define store shape for active goals, archived goals, and computed progress.
  - [x] 4.2 Actions: loadGoals, createGoal, setActive/deactivate, deleteGoal.
  - [x] 4.3 Selectors: top N goals, byType, progressFor(goalId), streakSnapshot.
  - [x] 4.4 Integrate timezone-aware date boundaries for streaks.
  - [x] 4.5 Unit tests for selectors and reducers/actions.

- [x] 5.0 Build Profile Goal Management UI (create/activate/deactivate/delete)
  - [x] 5.1 Add Goal Management section in `app/(tabs)/profile.tsx` (or equivalent screen).
  - [x] 5.2 Goal creation form: type select, auto start date (today), required end date, type-specific params.
  - [x] 5.3 Show non-editable notice; provide delete-and-recreate guidance.
  - [x] 5.4 List existing goals with actions: Activate/Deactivate/Delete; enforce one active per type.
  - [x] 5.5 Client-side validation and helpful, coach-like error messages.
  - [x] 5.6 Component tests for form validation and flows.

- [ ] 6.0 Implement Homepage goal widgets (progress bars, streak counters)
  - [x] 6.1 Create `GoalCard` component (shared): title, type badge, progress bar or streak counter, status.
  - [x] 6.2 For streak goals, show current vs target (e.g., 9/14 days) with clear break/continue states.
  - [x] 6.3 For numeric goals, show progress toward target using latest weekly average.
  - [x] 6.4 Integrate into `app/(tabs)/index.tsx` to show top N active goals; empty state when none.
  - [x] 6.5 Tests for rendering and basic interactions.

- [ ] 7.0 Implement Analytics views (trends, streak calendar, ideal macros compare)
  - [x] 7.1 TrendLineChart for numeric goals with weekly averages and target line.
  - [x] 7.2 StreakHeatmap for daily compliance visualization (calories, protein).
  - [x] 7.3 Compare to ideal macros using `lib/idealMacros.ts` where relevant.
  - [x] 7.4 Integrate into `app/(tabs)/history.tsx` or dedicated analytics screen.
  - [x] 7.5 Tests for analytics components (rendering, data formatting).

- [ ] 8.0 Implement progress computation + automatic achievement marking
  - [x] 8.1 Background or on-demand computation: recalc on data changes and on app open.
  - [x] 8.2 Mark achieved goals and move to archived state; prevent further updates.
  - [x] 8.3 Ensure deactivated goals are excluded from computations and UI widgets.
  - [x] 8.4 Edge cases: insufficient data weeks, timezone boundary days, param validation.
  - [x] 8.5 Tests for achievement transitions and exclusions.

- [x] 9.0 Add error handling, empty states, and coach-like copy
  - [x] 9.1 Define standardized empty-state components/messages for Homepage and Analytics.
  - [x] 9.2 Validation errors and conflict states (duplicate active goal type) with friendly guidance.
  - [x] 9.3 Accessibility checks for components (aria labels, focus states).
  - [x] 9.4 Localization readiness for copy strings.

- [ ] 10.0 Add tests and QA coverage (services, store, components)
  - [x] 10.1 Unit tests for services, store selectors/actions.
    - Covered: goals service CRUD/progress, validation helpers, store actions/selectors.
  - [x] 10.2 Component tests for GoalCard, TrendLineChart, StreakHeatmap, Profile forms.
    - Covered: TrendLineChart, GoalCard, Profile create-goal flow (multiple types, validation, conflict UI).
  - [x] 10.3 E2E smoke flows: create goal -> see on Homepage -> view Analytics -> achieve goal.
  - [x] 10.4 CI config updates if needed to run new tests.
- [x] 11.0 Documentation and configuration (feature flag/top-N setting)
  - [x] 11.1 Create comprehensive README with setup, architecture, and usage guide.
  - [x] 11.2 Add centralized configuration system with environment variable support.
  - [x] 11.3 Document API endpoints, data models, and integration patterns.
  - [x] 11.4 Update .env.example with all configurable options and defaults.
