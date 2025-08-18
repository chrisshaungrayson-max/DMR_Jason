# PRD: Fitness Goals (Body Composition, Intake Streaks)

## 1. Introduction / Overview

We will add user-configurable fitness goals to help users track progress toward physique and nutrition consistency targets. The MVP supports body composition targets (body fat %, weight, lean mass gain) and nutrition streaks (meeting calorie and protein targets). Users can:
- Create goals (from Profile),
- View progress for active goals on the Homepage,
- See deeper progress analytics in the Analytics section.

Primary motivation: Track progress toward physique goals and build consistent nutrition habits.

## 2. Goals

- Enable users to create specific goals: body fat %, target weight, lean mass gain, calorie streak, protein streak.
- Show active goals with clear progress on the Homepage (with streak emphasis for streak-type goals).
- Provide analytics visualizations for each goal type (trends, streak visualization, comparison to ideal macros when applicable).
- Automatically mark goals achieved when criteria are met based on strict rules.
- Respect user-local timezone for streak calculations and weekly averaging for numeric targets.

## 3. User Stories

- As a user, I want to create a goal to reach 15% body fat so I can track progress toward my physique target.
- As a user, I want to set a target weight so I can monitor changes toward my desired body weight.
- As a user, I want to set a goal to gain 3 kg of lean mass so I can track improvements in muscle.
- As a user, I want to maintain a calorie intake streak (meet my recommended calories daily) for 14 days to build consistency.
- As a user, I want to maintain a protein intake streak (≥X g/day) for Y days to ensure sufficient protein intake.
- As a user, I want my active goals to be visible on the Homepage so I can see progress at a glance.
- As a user, I want analytics that show trends and streak calendars so I can understand my progress and patterns.
- As a user, I want goals to be automatically marked achieved when I meet the criteria so I don’t need to manage it manually.

## 4. Functional Requirements

1. Goal Types (MVP)
   1.1 The system must support the following goal types:
       - Body fat % target (e.g., reach 15%).
       - Weight target (e.g., reach 77 kg / 170 lbs).
       - Lean mass gain (e.g., +3 kg).
       - Calorie intake streak (e.g., meet target N consecutive days).
       - Protein intake streak (e.g., ≥X g/day for Y consecutive days).

2. Data Sources
   2.1 Numeric body composition inputs (weight, body fat %, lean mass) must support manual entry.
   2.2 Nutrition streak goals (calories, protein) must derive compliance from existing app logs where possible (e.g., total daily calories/protein from current logging features).
   2.3 No external wearable/health integrations in MVP.

3. Goal Creation and Lifecycle (Profile page)
   3.1 Users can create a goal with:
       - Type (from 1.1),
       - Start date (defaults to “today”; user can accept default),
       - Target parameters (e.g., % value; weight value; +lean mass; streak length; protein grams/day; calorie target source),
       - End date (required),
       - Active status (on by default at creation).
   3.2 Editing goals after creation is not supported in MVP (E5 = no). To change parameters, users must delete and recreate goals.
   3.3 Users can activate/deactivate and delete goals from the Profile page.
   3.4 Only one active goal per type at a time (E4 = no multiple concurrent goals of the same type). The system must prevent creating a new active goal of a type if another active goal of that type exists.

4. Progress Calculation Rules
   4.1 Timezone: All daily/streak computations use the user-local timezone.
   4.2 Numeric targets (body fat %, weight, lean mass):
       - Compute progress based on weekly averages (J1 = weekly average).
       - Minimum measurement frequency: at least weekly (J2). If missing, show “insufficient data” for the week and pause progress updates for that period.
       - Progress is measured toward the target:
         - Body fat %: decreasing toward target threshold achieves success when weekly average ≤ target %.
         - Weight target: moving toward target; achieve when weekly average equals or crosses target in the correct direction.
         - Lean mass gain: achieve when weekly average increase from baseline ≥ target gain.
       - Baseline for lean mass gain is the weekly average in the start week.
   4.3 Streak goals (calories, protein):
       - Strict daily compliance (I1 = strict). No grace days; streak breaks on any non-compliant day.
       - A day is compliant if:
         - Calorie streak: total logged daily calories are within the recommended/target range for that day.
         - Protein streak: total logged daily protein ≥ configured grams.
       - Streak length is measured in consecutive compliant days; once it reaches the configured target length, mark achieved.

5. Homepage (Dashboard) Display
   5.1 Show the top N active goals (N default 3; configurable later) using goal cards with progress bars or streak counters.
   5.2 For streak goals, prominently display current streak count and target (e.g., 9/14 days).
   5.3 Provide empty states when there are no active goals.

6. Profile Page (Goal Management)
   6.1 Provide a Goal Management section where users can:
       - Create a new goal (wizard or form).
       - Activate/Deactivate a goal.
       - Delete a goal.
   6.2 Display clear labels indicating editing is not supported in MVP; suggest deleting and recreating to change parameters.

7. Analytics
   7.1 For numeric targets, show trend charts over time (e.g., body fat %, weight, lean mass). Include weekly averages and target line.
   7.2 Provide streak calendars/heatmaps to visualize daily compliance for calorie and protein goals.
   7.3 Allow comparison against ideal macros when applicable (reuse `lib/idealMacros.ts`).

8. Achievement and Status
   8.1 The system must automatically detect and mark a goal as achieved when criteria are met.
   8.2 Achieved goals become read-only and are archived but still viewable in Analytics.
   8.3 Deactivated goals do not contribute to Homepage widgets and are excluded from active streak logic.

9. Notifications/Reminders
   9.1 No reminders or push notifications in MVP.

10. Error Handling & Empty States
   10.1 Show clear empty states when insufficient data exists (e.g., not enough measurements for weekly average).
   10.2 Handle invalid inputs and conflicting states (e.g., attempting to create a second active goal of the same type) with coach‑like, encouraging copy.

## 5. Non-Goals (Out of Scope)

- Social features, sharing, or leaderboards.
- Wearable/health integrations (Apple Health/Google Fit) for MVP.
- Advanced coaching/AI recommendations.
- Editing goals after creation (MVP choice).

## 6. Design Considerations (Optional)

- Use existing component patterns and styling. Copy tone: coach‑like, encouraging, concise.
- Homepage goal cards: concise progress bars/counters; streak subtext.
- Analytics can reuse `app/components/RadarChart.tsx` styles where reasonable; add line charts/heatmaps as needed.

## 7. Technical Considerations (Optional)

- Storage: Extend Supabase schema (see `supabase/migrations/`). Proposed tables:
  - `goals` (id, user_id, type, params JSONB, start_date, end_date, active boolean, status enum [active, achieved, deactivated], created_at, updated_at).
  - `goal_measurements` (id, goal_id, date, value JSONB, source enum [manual, log], created_at) for optional per‑goal entries when needed.
  - For streak goals, rely primarily on existing nutrition logs; avoid duplicating data; compute compliance per day.
- Types: Add `types/goal.ts` for Goal types/enums and params shape. Extend existing stores under `store/` with a `goals-store.tsx` to load/manage goals and compute progress client‑side where appropriate.
- Services:
  - Add `services/goals.ts` for CRUD + progress helpers.
  - Reuse `utils/nutrition-api.ts` and `services/nutrition.ts` for daily intake.
- UI Integration:
  - Homepage cards in `app/(tabs)/index.tsx`.
  - Profile management in `app/(tabs)/profile.tsx` (or appropriate profile screen).
  - Analytics in `app/(tabs)/history.tsx` or a dedicated analytics screen.
- Timezone: Use user-local timezone for day boundaries in streak logic.
- Performance: No special constraints for Homepage widgets in MVP.

## 8. Success Metrics

- Users can create, activate/deactivate, and delete goals on the Profile page.
- Active goals and progress are visible on the Homepage, with streak emphasis for streak goals.
- Analytics show numeric trends and streak visualizations per goal type, with ideal macro comparison where relevant.
- Goals are automatically marked as achieved when criteria are met.
- Timezone handling and streak rules work correctly for user-local days.
- Clear empty states and error handling are present.

## 9. Open Questions

- What default value and range define “recommended calories” for the calorie streak (derived strictly from the app’s recommended intake or allow a user-entered daily range)?
- What is the default N for “top N goals” on the Homepage (proposed: 3)? Should it be user-configurable?
- Do we need a per-goal note/description field for user context (e.g., “Summer cut”)?
- For lean mass tracking, how is lean mass derived (e.g., via body composition entry) if not explicitly logged today? If unavailable, consider requiring manual lean mass entries.
