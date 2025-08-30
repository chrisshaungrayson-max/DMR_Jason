import { describe, it, expect } from 'vitest';
import { generateRadarSvg } from '@/utils/report';

function extractPolygonPoints(svg: string, index: number): number[] {
  // Capture all polygon points attributes
  const matches = [...svg.matchAll(/<polygon[^>]*points="([^"]+)"/g)];
  const m = matches[index];
  if (!m) return [];
  // m[1] is like "x1,y1 x2,y2 x3,y3"
  const coords = m[1]
    .trim()
    .split(/\s+/)
    .flatMap((pair) => pair.split(',').map((v) => Number(v)));
  return coords;
}

describe('generateRadarSvg', () => {
  it('returns placeholder when ideal is missing', () => {
    const out = generateRadarSvg({ protein: 30, carbs: 40, fat: 30 }, undefined);
    expect(out).toContain('Ideal macro targets not available');
  });

  it('renders svg with two polygons and labels when ideal provided', () => {
    const out = generateRadarSvg(
      { protein: 30, carbs: 40, fat: 30 },
      { protein: 33, carbs: 33, fat: 34 }
    );
    expect(out).toContain('<svg');
    // Two polygons: first ideal, second actual
    const polygons = [...out.matchAll(/<polygon[^>]*points="([^"]+)"/g)];
    expect(polygons.length).toBe(2);

    // Labels and legend
    expect(out).toContain('Protein');
    expect(out).toContain('Carbs');
    expect(out).toContain('Fat');
    expect(out).toContain('Ideal');
    expect(out).toContain('Actual');
  });

  it('clamps invalid percentage values to valid coordinate range', () => {
    // Provide some invalid values to trigger clamping
    // actual: protein -10 -> 0, carbs 1000 -> 100, fat NaN -> 0
    // ideal: extremely large as well
    const out = generateRadarSvg(
      { protein: -10 as any, carbs: 1000 as any, fat: Number.NaN as any },
      { protein: 1000 as any, carbs: -50 as any, fat: 50 }
    );

    // Grab the second polygon (actual) points
    const actualPoints = extractPolygonPoints(out, 1);
    expect(actualPoints.length).toBe(6); // 3 vertices => 6 numbers

    // Coordinates should all lie within the drawing box bounds:
    // center=100, radius=70 => x,y should generally be within [30, 170]
    for (const n of actualPoints) {
      expect(Number.isFinite(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(30 - 0.5); // small leeway for rounding
      expect(n).toBeLessThanOrEqual(170 + 0.5);
    }
  });
});
