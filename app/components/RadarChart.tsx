import React from 'react';
import { View } from 'react-native';
import { Text, Heading } from '@gluestack-ui/themed';
import Svg, { Circle, Polygon, Line, Text as SvgText, Defs, RadialGradient, Stop, Path } from 'react-native-svg';

export type MacroPercents = { protein: number; carbs: number; fat: number };

type Props = {
  size?: number;
  values: MacroPercents; // actual percentages 0-100
  ideal?: MacroPercents; // ideal percentages 0-100
  color?: string; // solid area color
  dashColor?: string; // ideal dashed line color
  labelColor?: string;
  backgroundColor?: string;
  strokeWidth?: number; // polygon stroke width
  gridColor?: string; // grid/ring color
  gridWidth?: number; // grid/ring stroke width
  showGradientBg?: boolean; // show soft radial gradient
  brandPrimary?: string; // brand primary color (used for actual fill/stroke if provided)
  brandAccent?: string; // brand accent color (used for ideal stroke if provided)
  curveTension?: number; // 0..1 for smoothing
  fillOpacity?: number; // 0..1 opacity for area fill
};

// Default to a common balanced split
const DEFAULT_IDEAL: MacroPercents = { protein: 30, carbs: 40, fat: 30 };

// Utility to convert a percent (0-100) to radius (0..R)
function p2r(p: number, R: number) { return Math.max(0, Math.min(100, p)) / 100 * R; }

export default function RadarChart({
  size = 220,
  values,
  ideal = DEFAULT_IDEAL,
  color = '#4F83FF',
  dashColor = '#6CC04A',
  labelColor = '#333',
  backgroundColor = 'transparent',
  strokeWidth = 2,
  gridColor = '#9AA3AF',
  gridWidth = 1,
  showGradientBg = true,
  brandPrimary,
  brandAccent,
  curveTension = 0.45,
  fillOpacity = 0.16,
}: Props) {
  const R = (size / 2) * 0.72; // more margin for labels to avoid cut-off
  const cx = size / 2;
  const cy = size / 2;

  // Angles for Protein, Carbs, Fat (clockwise, starting at 0 deg = right)
  const angles = [0, 120, 240].map((deg) => (deg * Math.PI) / 180);

  const toPoint = (percent: number, angleIdx: number) => {
    const r = p2r(percent, R);
    const a = angles[angleIdx];
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const actualPts = [values.protein, values.carbs, values.fat].map((v, i) => toPoint(v || 0, i));
  const idealPts = [ideal.protein, ideal.carbs, ideal.fat].map((v, i) => toPoint(v || 0, i));

  const actualPointsStr = actualPts.map((p) => `${p.x},${p.y}`).join(' ');
  const idealPointsStr = idealPts.map((p) => `${p.x},${p.y}`).join(' ');

  // Helper: cardinal spline (Catmull–Rom) to Bezier path for closed polygon
  function toSmoothClosedPath(points: { x: number; y: number }[], tension = 0.45) {
    if (points.length < 2) return '';
    const pts = [...points];
    // Close the loop by padding control points at both ends
    const first = pts[0];
    const last = pts[pts.length - 1];
    const p = [last, ...pts, first, pts[1]];
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < p.length - 2; i++) {
      const p0 = p[i - 1];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[i + 2];
      const t = tension;
      const cp1x = p1.x + ((p2.x - p0.x) / 6) * t * 3;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * t * 3;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * t * 3;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * t * 3;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    d += ' Z';
    return d;
  }

  const actualPath = toSmoothClosedPath(actualPts, curveTension);
  const idealPath = toSmoothClosedPath(idealPts, curveTension);

  // Grid rings
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0].map((m) => m * R);

  // Axis end points (for labels)
  const axisEnds = angles.map((a) => ({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }));

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          {/* Soft radial gradient behind the chart */}
          {showGradientBg && (
            <RadialGradient id="radarGrad" cx="50%" cy="50%" r="60%">
              {(() => {
                const gradBase = brandPrimary || color || '#93C5FD';
                return [
                  <Stop key="s0" offset="0%" stopColor={gradBase} stopOpacity={0.18} />,
                  <Stop key="s1" offset="60%" stopColor={gradBase} stopOpacity={0.10} />,
                  <Stop key="s2" offset="100%" stopColor={gradBase} stopOpacity={0.02} />,
                ];
              })()}
            </RadialGradient>
          )}
        </Defs>

        {/* Background */}
        <Circle cx={cx} cy={cy} r={R} fill={showGradientBg ? 'url(#radarGrad)' : backgroundColor} />

        {/* Grid rings (dashed) */}
        {rings.map((r, idx) => (
          <Circle
            key={`ring-${idx}`}
            cx={cx}
            cy={cy}
            r={r}
            stroke={gridColor}
            strokeWidth={gridWidth}
            strokeDasharray="4,6"
            strokeOpacity={0.35}
            fill="none"
          />
        ))}

        {/* Axes */}
        {angles.map((a, idx) => (
          <Line
            key={`axis-${idx}`}
            x1={cx}
            y1={cy}
            x2={cx + R * Math.cos(a)}
            y2={cy + R * Math.sin(a)}
            stroke={gridColor}
            strokeWidth={gridWidth}
            strokeDasharray="4,6"
            strokeOpacity={0.35}
            strokeLinecap="round"
          />
        ))}

        {/* Ideal smooth path */}
        <Path
          d={idealPath}
          fill="none"
          stroke={brandAccent || dashColor}
          strokeWidth={strokeWidth}
          strokeDasharray="8,8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Actual smooth filled path */}
        <Path
          d={actualPath}
          fill={(brandPrimary || color) + Math.round(fillOpacity * 255).toString(16).padStart(2, '0')}
          stroke={brandPrimary || color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Labels */}
        {/* Right label: anchor to end and pull slightly left to prevent clipping */}
        <SvgText x={axisEnds[0].x - 8} y={axisEnds[0].y + 4} fontSize={14} fontWeight="600" fill={labelColor} textAnchor="end">Protein</SvgText>
        <SvgText x={axisEnds[1].x - 28} y={axisEnds[1].y - 8} fontSize={14} fontWeight="600" fill={labelColor}>Carbs</SvgText>
        <SvgText x={axisEnds[2].x - 10} y={axisEnds[2].y + 20} fontSize={14} fontWeight="600" fill={labelColor}>Fat</SvgText>
      </Svg>
      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 14, height: 6, borderRadius: 3, backgroundColor: (brandPrimary || color) }} />
          <Text style={{ fontSize: 12, color: labelColor, fontWeight: '600' }}>Actual</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 14, height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderTopColor: (brandAccent || dashColor) }} />
          <Text style={{ fontSize: 12, color: labelColor, fontWeight: '600' }}>Ideal</Text>
        </View>
      </View>
    </View>
  );
}
