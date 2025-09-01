# PRD: Home Macros Radial Chart

- Owner: Fit App Team
- Status: Draft
- Date: 2025-09-01
- Platforms: iOS, Android (Expo React Native)

## Overview
Display a radial chart at the top of the Home screen that summarizes today’s macros and calories. The chart shows four radial rings:

1) Calories
2) Protein
3) Carbs
4) Fat

Each ring reflects progress toward a daily target derived from app data. The chart updates live as food is logged. If today has no entries, it falls back to the most recent day within a defined window. The component uses a native SVG implementation for performance and custom theming.

## Goals
- Provide a fast, glanceable overview of daily calorie and macro progress.
- Align targets with existing app logic and user-specific data.
- Update immediately when food entries change.
- Respect theming and dark mode.
- Be fully testable (unit + e2e) and accessible.

## Non-Goals
- Trends or historical charts beyond the fallback-day visualization.
- Per-meal breakdowns.
- Micronutrients.

## User Stories
- As a user, I see a “Today’s Macros” radial chart on Home showing progress toward daily targets.
- As a user, if I haven’t logged anything today, I see the most recent day’s totals within a fallback window.
- As a user, I can tap a ring to see details (grams, calories, target, and percent) in a tooltip overlay.
- As a user, if I exceed a target, I can still see by how much without visually overfilling the ring.
- As a user, the chart looks good in light/dark mode and matches brand/theme colors.

## Functional Requirements

### Placement & Container
- Render inside a Gluestack Card at the top of the Home screen, title “Today’s Macros”.
- TestID: `home-macros-card`.

### Rendering & Tech
- Implement with `react-native-svg` (native) for performance and theme control; do not use ApexCharts.
- Four concentric radial rings: Calories, Protein, Carbs, Fat.
- Size on phones ~280–320px square (min 240px). If space constrained, reduce radius rather than ring thickness.
- Ring progress caps at 100% fill; numeric percent may exceed 100% (see Overage).

### Colors & Theming
- Use theme via `lib/theme/ThemeProvider.tsx` and `lib/theme/gluestack-theme.ts`.
- Use tokens from `constants/colors.ts` (gold accent) and complementary colors for macros.
- Proposed mapping (adjust via theme tokens at implementation time):
  - Calories: gold accent
  - Protein: green/emerald
  - Carbs: blue
  - Fat: amber/orange
- Full dark mode support (text and ring colors meet contrast requirements).

### Targets (Source & Precedence)
- Target precedence: Target Calories > TDEE > Gender-based guidelines from `lib/idealMacros.ts`.
- If Target Calories exist, derive macro targets using the user’s saved macro split from `services/macros.ts`. If none found, use the default split from `lib/idealMacros.ts`.
- Use caloric densities: protein=4 kcal/g, carbs=4 kcal/g, fat=9 kcal/g (from `lib/idealMacros.ts`).
- TDEE and ideal macro helpers: `lib/idealMacros.ts`.

### Today’s Totals & Live Updates
- Data source: daily nutrition records managed by `store/nutrition-store.tsx`.
- “Today” is device local time midnight-to-midnight.
- Update triggers: 
  - On nutrition store changes (e.g., food logged/removed/edited).
  - When the Home tab/screen gains focus.
- The chart must not block initial Home render; show a skeleton while data is loading.

### Fallback Logic (No Entries Today)
- If no entries for “today,” load the most recent day’s totals within a 7-day fallback window.
- If none found within window, show empty state with CTA to log food.

### Overage Behavior
- If actual > target: 
  - Visual ring remains capped at 100%.
  - Display a small red/danger badge showing “+X%” overage.
  - TestID: `macro-overage-badge` (badge appears per-ring with macro-specific association).

### Interaction & Tooltip
- Tap any ring to show a center overlay tooltip with details:
  - Macro name
  - Actual grams and calories
  - Target grams and calories
  - Percent (whole number)
- Accessibility label example: “Protein 82 grams of 150, 55 percent.”
- TestID: `macro-tooltip`.

### Empty & Error States
- Empty (no data in fallback window): show friendly message and a primary CTA to open/focus the food entry UI on Home.
  - TestID: `macro-empty-state`.
- Error while loading: show skeleton then inline error with retry action.

### Sizing & Layout Details
- Base size 280–320px; min 240px.
- On smaller screens, prefer shrinking radius over ring thickness.
- Maintain consistent ring spacing and clear ring legends/labels.

### Accessibility
- VoiceOver labels for each ring with descriptive values.
- Min tap target 44x44 for interactive areas.
- Ensure high-contrast and large text compatibility.

### Analytics
- Use `utils/analytics.ts` to emit events:
  - `home_macros_impression` (on first render/visible).
  - `home_macros_ring_tap` with property `{ macro: 'calories'|'protein'|'carbs'|'fat' }`.
  - `home_macros_empty_cta_click`.

## Data & Logic Details
- Files referenced:
  - `lib/idealMacros.ts`: default macro split; kcal/gram; fallback calories by sex; TDEE computation; ideal macros derivation.
  - `services/macros.ts`: persisted macro targets and splits.
  - `store/nutrition-store.tsx`: daily nutrition records, totals, and events.
  - `services/foods.ts`: food items include calories, protein, carbs, fat.
  - `utils/idealComparison.ts`: reference for ideal vs actual calculations and averaging logic (not directly used by the chart but aligns semantics).
  - `lib/theme/ThemeProvider.tsx`, `lib/theme/gluestack-theme.ts`: theming and color tokens.
  - `app/components/RadarChart.tsx`: UI reference for `react-native-svg` patterns and grid/labels.

### Calculation Rules
- Percent per ring = clamp(0, actual / target, 1) for visual fill; display percent = floor(100 * actual / target).
- Grams <-> calories via `lib/idealMacros.ts` caloric densities.
- Respect user macro split if present; otherwise default split in `lib/idealMacros.ts`.
- Time boundaries from device local timezone.

## UI/UX Requirements
- Title: “Today’s Macros”.
- Legend or inline labels identify each ring (Calories, Protein, Carbs, Fat) with color dots/keys.
- On-tap tooltip appears centered over the chart; tapping outside dismisses.
- Over-target badge uses theme danger color and sits near the ring’s end-cap or in legend.

## Performance Requirements
- Show skeleton placeholder while loading.
- Render frame budget for interactions <16ms; avoid blocking JS thread.
- Memoize computed values and avoid redundant store subscriptions.
- Do not perform heavy layout calculations during animations.

## Testing Requirements
- Unit tests (Jest):
  - Target derivation precedence and split fallback.
  - Percent calculation and clamping.
  - Fallback-day selection logic (within 7 days; none => empty state).
  - Overage display rules.
- E2E (Playwright):
  - Presence of card and all four rings.
  - Tooltip appears with correct values on ring tap and dismisses on outside tap.
  - Overage badge appears when appropriate.
  - Empty state + CTA behavior when no data in window.
  - Dark mode visual smoke.
- Stable testIDs:
  - `home-macros-card`
  - `macro-ring-calories`
  - `macro-ring-protein`
  - `macro-ring-carbs`
  - `macro-ring-fat`
  - `macro-overage-badge`
  - `macro-tooltip`
  - `macro-empty-state`

## Acceptance Criteria
- Card renders at top of Home with title “Today’s Macros” and four rings sized appropriately.
- Values reflect live updates from `store/nutrition-store.tsx`.
- Targets follow precedence: Target Calories > TDEE > Gender guidelines, with split from `services/macros.ts` or `lib/idealMacros.ts` default.
- Overages cap ring fill at 100% but display numeric percent >100% and a red badge.
- Tapping a ring shows a tooltip with grams, calories, targets, and percent.
- If no data today, show most recent within 7 days; else empty state with CTA to log food.
- Full theme/dark mode support and accessible labels.
- Analytics fire for impression, ring taps, and empty CTA.
- Unit and E2E tests pass.

## Rollout & Risks
- Rollout: standard release behind a feature flag (optional) or direct if low risk.
- Risks:
  - Performance jank from heavy calculations.
  - Inconsistent targets if user’s macro split is stale.
  - Visual clutter on small screens.
- Mitigations:
  - Memoize and precompute; skeletons; keep SVG minimal.
  - Validate split retrieval and fallbacks; log diagnostics.
  - Responsive radius adjustments and concise legends.

## Dependencies
- `react-native-svg` (already in project).
- Gluestack UI theme provider: `lib/theme/ThemeProvider.tsx`, `lib/theme/gluestack-theme.ts`.
- Data dependencies: `store/nutrition-store.tsx`, `services/macros.ts`, `lib/idealMacros.ts`.

## Future Extensions (Out of Scope Now)
- Weekly/monthly trend overlays.
- Per-meal ring breakdowns.
- Additional nutrients (fiber, sugar, etc.).

## Implementation Notes (Proposed)
- New component: `app/components/HomeMacrosRadialChart.tsx`.
- Integrate into Home tab layout: add Card container with chart and legend.
- Subscribe to nutrition store updates and Home focus events.
- Add analytics hooks via `utils/analytics.ts`.
- Add stable testIDs as listed.
