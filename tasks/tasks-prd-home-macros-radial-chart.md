## Relevant Files

- `app/components/HomeMacrosRadialChart.tsx` - New component rendering the radial chart inside a Gluestack Card.
- `app/components/HomeMacrosRadialChart.test.tsx` - Unit tests for calculations, rendering, tooltip, and overage visuals.
- `app/(tabs)/index.tsx` - Home screen where the chart card is integrated at the top.
- `e2e/home-macros-radial-chart.spec.ts` - Playwright tests for rings, tooltip, overage, empty state, and dark mode smoke.
- `lib/idealMacros.ts` - Caloric densities, default split, and helpers for TDEE/ideal macros.
- `services/macros.ts` - Fetch user macro targets/splits; basis for target precedence.
- `store/nutrition-store.tsx` - Source of daily totals and change events; subscribe for live updates.
- `utils/track.ts` - Emit analytics events (`home_macros_chart_impression`, `home_macros_ring_tap`, `home_goals_empty_cta_tap`).
- `lib/theme/ThemeProvider.tsx` - Theme provider; ensure component respects light/dark mode.
- `lib/theme/gluestack-theme.ts` - Theme tokens for colors/variants used by rings and badges.
- `constants/colors.ts` - Brand/gold tokens used for the Calories ring and accents.
 - `app/components/RadarChart.tsx` - SVG patterns/reference for shapes and labeling.
 - `app/components/LogFoodOverlayModal.tsx` - Overlay modal for logging food; empty state CTA should open this.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Scaffold Home Macros Radial Chart component and Card container
  - [x] 1.1 Create `app/components/HomeMacrosRadialChart.tsx` with a Gluestack Card titled "Today’s Macros" (`testID=home-macros-card`).
  - [x] 1.2 Add placeholder layout for four rings and legend container; no data binding yet.
  - [x] 1.3 Add a basic skeleton placeholder while data loads.

- [x] 2.0 Implement radial rings rendering with `react-native-svg` and theme tokens
  - [x] 2.1 Render four concentric rings (Calories, Protein, Carbs, Fat) with radii/spacing and theme colors from `constants/colors.ts` and `lib/theme/gluestack-theme.ts`.
  - [x] 2.2 Cap visual fill at 100% while allowing numeric percent to exceed 100%.
  - [x] 2.3 Expose ring `testID`s: `ring-calories`, `ring-protein`, `ring-carbs`, `ring-fat`.

- [x] 3.0 Implement targets derivation (Target Calories > TDEE > Gender guidelines) and macro split fallback
  - [x] 3.1 Implement a helper to compute targets using precedence: Target Calories > TDEE > gender guidelines (`lib/idealMacros.ts`).
  - [x] 3.2 Fetch user macro split via `services/macros.ts`; fallback to default split from `lib/idealMacros.ts` when absent.
  - [x] 3.3 Convert between grams and calories using caloric densities from `lib/idealMacros.ts` (P=4, C=4, F=9).

- [ ] 4.0 Implement today totals, local-time boundaries, and 7-day fallback logic
  - [x] 4.1 Read today’s totals from `store/nutrition-store.tsx`; define "today" via device local midnight-to-midnight.
  - [ ] 4.2 If no entries today, load most recent within a 7-day window; else show empty state. (Fallback implemented; explicit empty state not shown.)
  - [ ] 4.3 Handle errors with an inline error state and retry action.

- [x] 5.0 Wire live updates on nutrition store changes and Home focus events
  - [x] 5.1 Subscribe to nutrition store updates or selectors; update component state accordingly.
  - [x] 5.2 Recompute on Home tab focus; ensure no redundant recomputations.
  - [x] 5.3 Memoize derived values to avoid unnecessary re-renders.

- [x] 6.0 Implement overage visuals (cap ring at 100%, show +X% badge)
  - [x] 6.1 Compute overage percent for values >100%.
  - [x] 6.2 Show small danger badge near ring end/legend with `+X%` (`testID=overage-badge`).

- [ ] 7.0 Add tooltip interaction with grams, calories, target, percent; add accessibility labels
  - [x] 7.1 Add tap handlers per ring to open center overlay tooltip (`testID=macro-tooltip`).
  - [x] 7.2 Tooltip shows macro name, actual grams/kcal, target grams/kcal, and whole-number percent.
  - [ ] 7.3 Add VoiceOver labels like “Protein 82 grams of 150, 55 percent.” and ensure 44x44 tap targets.

- [x] 8.0 Add skeleton loading state and performance optimizations (memoization, minimal layout work)
  - [x] 8.1 Show skeleton until targets and today’s/fallback totals resolve.
  - [x] 8.2 Use `useMemo`/`useCallback` to cache calculations and handlers.
  - [x] 8.3 Avoid heavy layout during animations; keep SVG structure minimal.

- [x] 9.0 Integrate component into Home screen layout with legend/labels
  - [x] 9.1 Place chart card at the top of `app/(tabs)/index.tsx` Home screen.
  - [x] 9.2 Add legend or inline labels mapping colors to Calories/Protein/Carbs/Fat.

- [x] 10.0 Add analytics events (`home_macros_chart_impression`, `home_macros_ring_tap`, `home_goals_empty_cta_tap`)
  - [x] 10.1 Fire `home_macros_chart_impression` on first visible render.
  - [x] 10.2 Fire `home_macros_ring_tap` on ring tap with `{ macro }` property.
  - [x] 10.3 Fire `home_goals_empty_cta_tap` when CTA is used from Home Goals empty state.

- [ ] 11.0 Implement testing: unit (calc, fallback, overage) and E2E (rings, tooltip, empty, dark mode)
  - [ ] 11.1 Unit: target precedence and split fallback correctness.
  - [ ] 11.2 Unit: percent calculation and clamping logic including >100% cases.
  - [ ] 11.3 Unit: fallback-day selection within 7 days; none => empty state.
  - [ ] 11.4 Unit: overage badge display conditions.
  - [ ] 11.5 Component tests: presence of all rings and tooltip open/close behavior.
  - [ ] 11.6 E2E: interactions with testIDs, empty state CTA behavior, dark mode smoke test.

- [ ] 12.0 Verify theming and dark mode across all rings and text
  - [ ] 12.1 Verify colors from `constants/colors.ts` and theme tokens in light/dark.
  - [ ] 12.2 Check contrast and legibility for badges, labels, and tooltip.

- [ ] 13.0 Implement empty and error states with CTA to open/focus food entry UI
  - [x] 13.1 Empty: show friendly message + primary CTA to open `app/components/LogFoodOverlayModal.tsx` (implemented in Home Goals empty state).
  - [ ] 13.2 Error: show inline error with retry; maintain skeleton during initial load.

- [ ] 14.0 Documentation and rollout plan (feature flag optional)
  - [ ] 14.1 Update PRD status and add implementation notes.
  - [ ] 14.2 Optional feature flag wiring; define default ON/OFF plan.
  - [ ] 14.3 Add changelog entry and basic README section if needed.
