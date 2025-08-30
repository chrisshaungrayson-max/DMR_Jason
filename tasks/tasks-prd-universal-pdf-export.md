## Relevant Files

- `utils/pdf.ts` - Shared HTML generator for PDF export; implement branded header, radar, A4 sizing, and styling.
- `constants/colors.ts` - Source of brand colors (gold, lightGold, etc.) to be used by the generator.
- `app/results.tsx` - Screen with an export action; ensure it uses the unified generator and consistent inputs.
- `app/daily-summary.tsx` - Screen/modal with an export action; ensure it uses the unified generator and consistent inputs.
- `app/results-popover.tsx` - Screen/modal with an export action; ensure it uses the unified generator and consistent inputs.
- `assets/images/brand-logo.png` - New local brand logo to embed in the PDF (replace remote URL in generator).
- `store/user-store.ts` - Source of `ideal.percents` needed for radar data (access or pass through to generator as needed).
- `types/nutrition.ts` - Data types for `NutritionItem` to ensure generator input consistency.
 - `utils/report.ts` - Shared helpers: `generateRadarSvg()`, `normalizeNutritionItems()`, `formatDateLabel()`.
 - `utils/assets.ts` - Helper `loadImageAsDataUrl()` to embed local logo as base64 for PDF HTML.

### Notes

- Unit tests should typically be placed alongside the code files they are testing.

## Tasks

- [x] 1.0 Centralize and update the PDF generator per PRD
  - [x] 1.1 Update header text in `utils/pdf.ts` to: "Daily Macros by Jason Lam" then `[NAME]'s Daily Macros`, then date
  - [x] 1.2 Replace remote logo reference with local asset path placeholder and hook for base64 embedding
  - [x] 1.3 Add `@page { size: A4 portrait; margin: 14mm; }` and print-safe CSS (avoid clipped content)
  - [x] 1.4 Ensure table styling matches brand: rounded corners, alternating rows, gold header, dark bold total row
  - [x] 1.5 Add parameters to `generateReportHTML()` for ideal macro percents and optional logo data URL
  - [x] 1.6 Refactor internals to compute macro percentages once and reuse across sections
  - [x] 1.7 Add safe guards for empty data and invalid numbers

- [x] 2.0 Add local brand logo asset and embed it in PDF exports
  - [x] 2.1 Add `assets/images/brand-logo.png` (brand-approved artwork)
  - [x] 2.2 Implement helper to load image as base64 data URL for embedding in HTML (e.g., via `expo-asset`/`expo-file-system`)
  - [x] 2.3 Pass the logo data URL into `generateReportHTML()` and remove remote URL usage
  - [x] 2.4 Add fallback alt-text and graceful degradation if the asset fails to load

- [x] 3.0 Implement Radar chart in generated HTML (inline SVG)
  - [x] 3.1 Calculate actual macro percentages from totals (P4/C4/F9 method)
  - [x] 3.2 Accept ideal percentages via function parameter and validate ranges (0–100)
  - [x] 3.3 Render inline SVG grid/axes, labels, and two polygons (ideal vs actual) using brand colors
  - [x] 3.4 Ensure SVG scales within page layout and respects print backgrounds
  - [x] 3.5 Add unit-level function to generate SVG string for easier testing

- [x] 4.0 Enforce A4 page size, margins, filename pattern, and iOS share flow
  - [x] 4.1 Add/verify `@page` CSS and section spacing to avoid page breaks in headings
  - [x] 4.2 Add `page-break-inside: avoid` to cards/tables where appropriate; allow table body to break cleanly
  - [x] 4.3 Standardize filename construction: `${NAME}-Daily-Macros-${YYYY-MM-DD}.pdf`
  - [x] 4.4 Ensure iOS flow: `Print.printToFileAsync` -> `Sharing.shareAsync` with correct mime/UTI and dialog title
  - [x] 4.5 Verify web flow still opens `window.print()` with same HTML (non-blocking for certification)

- [x] 5.0 Unify export calls across screens and normalize input data
  - [x] 5.1 Update `app/results.tsx` `handleExportPDF()` to pass ideal percents and filename, and use new logo data
  - [x] 5.2 Update `app/daily-summary.tsx` `handleExport()` similarly
  - [x] 5.3 Update `app/results-popover.tsx` `handleExport()` similarly
  - [x] 5.4 Normalize items into `NutritionItem[]` with numeric fields; reuse a shared normalizer if needed
  - [x] 5.5 Standardize date label formatting across callers
  - [x] 5.6 Ensure consistent error handling and loading state UX

- [ ] 6.0 QA and certification on iOS (visual parity, overflow, share)
  - [ ] 6.1 Test on iOS simulator (iPhone + iPad) with short and long item lists
  - [ ] 6.2 Verify branding: header text, colors, local logo embedded
  - [ ] 6.3 Validate radar values vs ideal and actual totals
  - [ ] 6.4 Confirm A4 layout (no clipping) by previewing the generated PDF in Files/Preview
  - [ ] 6.5 Validate page breaks for long tables (header rows do not split awkwardly)
  - [ ] 6.6 Record results and screenshots in `test-results/`

- [ ] 7.0 Documentation and handoff (usage notes, future parity considerations)
  - [ ] 7.1 Update `docs/API.md` or `README.md` with generator API, required inputs, and example usage
  - [ ] 7.2 Document how to update the brand logo asset and regenerate base64 if needed
  - [ ] 7.3 Note current certification scope (iOS) and outline steps for future Android/Web parity
  - [ ] 7.4 Add known limitations and troubleshooting tips (e.g., very long tables)
