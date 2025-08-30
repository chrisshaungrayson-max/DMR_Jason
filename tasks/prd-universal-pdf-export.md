# Universal PDF Export for Macros & Analytics

## 1. Introduction / Overview
Create a single, branded, universal PDF export flow that produces consistent output from anywhere the export is initiated in the app. The report should feature brand styling, the same header across all origins, include analytics (including radar), and maintain the rounded table styling. The output should be A4 portrait and reliably shareable on iOS using the native share sheet.

This addresses the current inconsistencies where different screens show different headers/branding and some exports lack branding altogether.

## 2. Goals
- Ensure a single export implementation is used across the app using a shared generator.
- Enforce consistent branding and layout in every PDF export.
- Include the same analytics sections everywhere (totals, macro distribution, progress to target bars, radar).
- Guarantee A4 portrait output and a consistent filename format.
- Confirm working end-to-end on iOS with the native share sheet.

## 3. User Stories
- As a coach, I want to export a client’s daily macros as a branded PDF so I can share or store a consistent report.
- As a user, I want the exported PDF to include totals, macro distribution, progress to targets, and the itemized list so I can review and share my results with others.
- As a user, I want the exported PDF branding (colors, header, logo) to be consistent regardless of where I initiate the export so it looks professional.

## 4. Functional Requirements
1. The app must use a single shared HTML-to-PDF generator function (existing: `utils/pdf.ts` `generateReportHTML()`) for all export entry points.
2. The header must read: "Daily Macros by Jason Lam" followed by "[NAME]’s Daily Macros" and the date label beneath it. Maintain current brand subtitle stack but update primary heading text per spec.
3. Branding must use:
   - Primary gold: `#b8a369` (`Colors.light.gold`).
   - Light gold accent: `#d0c7a9` (`Colors.light.lightGold`).
   - Section light background similar to `#F2EBE3`.
4. The logo must be stored locally (not remote URL) and embedded in the export. Place at `assets/images/brand-logo.png` and update the generator to reference it.
5. The PDF must include the following sections, in order:
   - Totals (Calories, Protein, Carbs, Fat) in brand-styled cards.
   - Calorie status badge (over/under/on-track) as implemented.
   - Macro distribution with percentages.
   - Progress toward targets (bar progress for Protein, Carbs, Fat).
   - Radar chart comparing actual macro percentages vs ideal targets (must be included in PDF output).
   - Itemized food and nutrition table with alternating row backgrounds, gold header row, and bold dark total row; rounded table edges.
6. Page format must be A4 portrait with sensible margins (approx 12–20mm). Ensure content fits without clipping.
7. Filename pattern must be: `${NAME}-Daily-Macros-${YYYY-MM-DD}.pdf`.
8. iOS export must use the native share sheet; show success/failure feedback.
9. The same output must be produced from these origins:
   - `app/results.tsx`
   - `app/daily-summary.tsx`
   - `app/results-popover.tsx`
10. If a screen passes a different data shape (e.g., multiple entries flattened), normalize input so the PDF shows the same sections.
11. Web/Android parity is not a certification target for this PRD, but generator and usage should remain compatible for future enablement.

## 5. Non-Goals
- No custom per-user themes.
- No watermarking or coach signature fields in this iteration.
- No multi-day/range report in this iteration.

## 6. Design Considerations
- Colors defined in `constants/colors.ts` must drive the palette.
- Use the PDF reference `Damien_Macros_272829JUL_A4_Final.pdf` for inspiration on layout, spacing, and hierarchy. Keep rounded edges and card/table treatments consistent with in-app visuals.
- Typography: system sans (e.g., San Francisco/Helvetica/Roboto stack) as used today in exports.
- No footer.

## 7. Technical Considerations
- Centralize all exports to call `generateReportHTML()` in `utils/pdf.ts`.
- Replace remote logo URL with a local asset (`assets/images/brand-logo.png`). Confirm it loads in HTML for `expo-print` (consider base64 embedding via `Asset`/`FileSystem` if required).
- Radar chart in PDF:
  - Approach A (recommended): Render a simple SVG/Canvas-like radar as inline SVG in the generated HTML using calculated points. This avoids runtime dependencies and image loading issues.
  - Approach B: Pre-render radar to a data URL (base64 image) inside the generator.
- A4 sizing with `expo-print`: confirm options and CSS page size (`@page { size: A4 portrait; margin: 14mm; }`) are respected.
- Consistent filename: pass desired name to share/save where supported; otherwise document any platform limitation.
- Ensure iOS share sheet flow via `expo-print` + `expo-sharing` remains unchanged but uses the updated generator.

## 8. Success Metrics
- 100% of exports from the three origins use the same header, logo, colors, and layout.
- 0 known instances of missing branding in exported PDFs on iOS.
- Radar chart is present and correctly reflects actual vs ideal percentages.
- A4 PDF opens in iOS share sheet without layout clipping.

## 9. Open Questions
- Should we add page numbers for multi-page overflow scenarios (if item table is long)? Default: no for now.
- Should we include a small legal/disclaimer line below footnote? Default: keep current note only.

## 10. Acceptance Criteria
- From `app/results.tsx`, `app/daily-summary.tsx`, and `app/results-popover.tsx`, exporting generates identical A4 PDFs with:
  - Local logo, gold header row, rounded table, totals cards, calorie status, macro distribution, progress bars, radar chart.
  - Header text: "Daily Macros by Jason Lam", then `[NAME]’s Daily Macros`, then date below.
  - Filename pattern `${NAME}-Daily-Macros-${YYYY-MM-DD}.pdf`.
  - iOS share sheet opens successfully; user can share the file.
- Colors and spacing match brand variables and look consistent with the reference PDF and in-app styling.

## 11. Implementation Plan (Proposed)
1) Update generator (`utils/pdf.ts`):
   - Change header text per spec.
   - Swap remote logo URL to local asset and ensure it embeds (base64 if needed).
   - Add radar chart to HTML (inline SVG or base64 image) using ideal from store and totals-derived percentages.
   - Add `@page` CSS for A4 portrait and margins.
   - Ensure table retains rounded corners and alternating rows; keep gold header and dark total row.
2) Ensure all export callers only use `generateReportHTML()` and pass consistent data:
   - `app/results.tsx`
   - `app/daily-summary.tsx`
   - `app/results-popover.tsx`
3) Standardize filename construction and pass through to share/save flows where supported.
4) QA on iOS real/simulator for visual parity and share flow.

## 12. Data Requirements
- Inputs: user name, display date, list of `NutritionItem` entries, and ideal macro percentages from store (`useUser().ideal`).
- Derived: totals (calories, protein, carbs, fat), macro percent split, radar points.

