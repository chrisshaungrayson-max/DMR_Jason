# Project Log

A running changelog of notable changes. Times are local.

## Daily Entry Template
```
## YYYY-MM-DD HH:mm:ss-ZZZ
- Summary
  - High-level bullet of the day
- Features/Changes
  - Feature 1
  - Feature 2
- Fixes/Polish
  - Fix 1
- Notes
  - Any callouts
```

## 2025-08-08 00:12:01-04:00
- History -> Popover behavior
  - Individual entry in History opens a modal popover report (not a new screen), preserving the Results layout.
  - Date card (combined day) opens the same popover layout but with all entries for the day aggregated in the table and analytics.
  - Popover dismissible by tapping outside or navigating back.

- Results Popover (new) achieves parity with Results screen
  - Segmented tab selector (List / Analytics) with active highlight and themed background.
  - Info block shows Name (from user/nutrition store), Goal: Daily Intake Overview, Method: AI Estimation.
  - Added description text above the table for context.
  - Totals section and itemized nutrition table; all macro/calorie values use Math.ceil.
  - Note below the table about nutritional data variability.
  - Analytics: Macro Distribution and Macro Goals vs Consumed (%) with percentage labels (Math.round).
  - Today: adjusted Macro Goals bars to render side-by-side in a single row.
  - Respects dark mode/theme throughout.

- PDF export (shared generator)
  - Shared HTML generator used across Results and Daily Summary to unify appearance and rounding.
  - Global rounding-up with Math.ceil for macros/calories; kept percentage rounding with Math.round.
  - Today: table styling updated to match in-app report — gold header with white text, zebra rows, rounded bordered container, and dark totals row.
  - Export flows: web opens print window; native uses Print.printToFileAsync + Sharing API; haptics on export (non-web).

- Code quality and fixes
  - Removed duplicate import in `results-popover.tsx`; added missing style definitions for analytics bars.
  - Styling polish on table and analytics sections to mirror Results screen.

## 2025-08-07
- Global rounding policy switched to Math.ceil for all macros/calories across UI and PDFs.
- Refactors and migrations:
  - Timestamps/meal type derivation for entries; legacy entries migrated.
  - Utility helpers added (categorizeMealByHour, combineDateWithNow).

