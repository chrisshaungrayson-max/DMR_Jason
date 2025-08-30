import { NutritionItem } from '@/types/nutrition';

/**
 * Unit-level function to generate a radar chart SVG comparing actual vs ideal macro percentages.
 * Returns a full <div><svg/></div> markup string.
 */
export function generateRadarSvg(
  actual: { protein: number; carbs: number; fat: number },
  ideal?: { protein: number; carbs: number; fat: number }
): string {
  if (!ideal) {
    return '<div style="text-align: center; color: #666; font-style: italic;">Ideal macro targets not available</div>';
  }

  const size = 200;
  const center = size / 2;
  const radius = 70;
  const labels = ['Protein', 'Carbs', 'Fat'];
  const colors = { actual: '#b8a369', ideal: '#8bc34a' };

  const validatePercent = (val: number) => Math.max(0, Math.min(100, val || 0));
  const actualValues = [validatePercent(actual.protein), validatePercent(actual.carbs), validatePercent(actual.fat)];
  const idealValues = [validatePercent(ideal.protein), validatePercent(ideal.carbs), validatePercent(ideal.fat)];

  const getPoints = (values: number[]) => values.map((value, i) => {
    const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const gridCircles = [20, 40, 60, 80, 100].map(percent => {
    const r = (percent / 100) * radius;
    return `<circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="#e0e0e0" stroke-width="1"/>`;
  }).join('');

  const gridLines = labels.map((_, i) => {
    const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
    const x2 = center + radius * Math.cos(angle);
    const y2 = center + radius * Math.sin(angle);
    return `<line x1="${center}" y1="${center}" x2="${x2}" y2="${y2}" stroke="#e0e0e0" stroke-width="1"/>`;
  }).join('');

  const labelElements = labels.map((label, i) => {
    const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
    const labelRadius = radius + 20;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    return `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="12" fill="#333">${label}</text>`;
  }).join('');

  return `
    <div style="display: flex; justify-content: center; margin: 16px 0;">
      <svg width="${size}" height="${size}" style="background: white;">
        ${gridCircles}
        ${gridLines}
        <polygon points="${getPoints(idealValues)}" fill="${colors.ideal}" fill-opacity="0.2" stroke="${colors.ideal}" stroke-width="2"/>
        <polygon points="${getPoints(actualValues)}" fill="${colors.actual}" fill-opacity="0.3" stroke="${colors.actual}" stroke-width="2"/>
        ${labelElements}
      </svg>
    </div>
    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 12px;">
      <div style="display: flex; align-items: center;">
        <div style="width: 16px; height: 16px; background-color: ${colors.ideal}; margin-right: 6px; border-radius: 2px;"></div>
        <span style="font-size: 12px; color: #333;">Ideal</span>
      </div>
      <div style="display: flex; align-items: center;">
        <div style="width: 16px; height: 16px; background-color: ${colors.actual}; margin-right: 6px; border-radius: 2px;"></div>
        <span style="font-size: 12px; color: #333;">Actual</span>
      </div>
    </div>
  `;
}

/** Standardize date label for report header. */
export function formatDateLabel(input: string | Date): string {
  try {
    const d = typeof input === 'string' ? new Date(`${input}T00:00:00`) : new Date(input);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

/** Ensure data passed to PDF generator conforms to NutritionItem with numeric fields. */
export function normalizeNutritionItems(items: any[]): NutritionItem[] {
  if (!Array.isArray(items)) return [] as NutritionItem[];
  return items.map((it) => ({
    name: String(it.name ?? it.food ?? it.title ?? 'Item'),
    calories: Number(it.calories ?? it.kcal ?? 0) || 0,
    protein: Number(it.protein ?? it.p ?? 0) || 0,
    carbs: Number(it.carbs ?? it.c ?? 0) || 0,
    fat: Number(it.fat ?? it.f ?? 0) || 0,
  }));
}
