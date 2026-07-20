import React, { useMemo } from 'react';
import { District } from '../../data/cityMapData';

interface RoadPathProps {
  id: string;
  from: District;
  to: District;
  active: boolean;
  /** True briefly after a district it touches just completed — a single
   *  soft opacity pulse, not a repeated flashy color cycle. */
  celebrating?: boolean;
}

interface Point {
  x: number;
  y: number;
}

/** Cubic bezier control points computed purely from the two endpoints —
 *  no per-road authoring. Pulls the curve along whichever axis dominates
 *  so vertical trunk roads get a gentle S-curve and same-row roads come
 *  out straight, without any special-casing. */
function getControlPoints(p0: Point, p3: Point) {
  const dx = p3.x - p0.x;
  const dy = p3.y - p0.y;
  if (Math.abs(dy) >= Math.abs(dx)) {
    const midY = (p0.y + p3.y) / 2;
    return { p1: { x: p0.x, y: midY }, p2: { x: p3.x, y: midY } };
  }
  const midX = (p0.x + p3.x) / 2;
  return { p1: { x: midX, y: p0.y }, p2: { x: midX, y: p3.y } };
}

/**
 * A single thin, elegant connector between two districts — subtle gray by
 * default, a soft gold highlight when the route is reachable. No lane
 * markings, no trees/lamps/vehicles — those were toy-game decoration,
 * inconsistent with the premium executive-dashboard direction.
 */
export const RoadPath: React.FC<RoadPathProps> = ({ id, from, to, active, celebrating = false }) => {
  const p0: Point = { x: from.x, y: from.y };
  const p3: Point = { x: to.x, y: to.y };

  const { p1, p2 } = useMemo(() => getControlPoints(p0, p3), [p0.x, p0.y, p3.x, p3.y]);
  const d = `M ${p0.x},${p0.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;

  const roadColor = active ? 'var(--color-premium-gold-400)' : 'var(--color-premium-border)';

  return (
    <g opacity={active ? 0.9 : 0.5}>
      <path d={d} stroke={roadColor} strokeWidth={2.5} fill="none" strokeLinecap="round" />

      {/* Brief single fade — a district touching this road just completed.
          Opacity only, per the "fade/opacity, no flashy" motion rule. */}
      {celebrating && (
        <path d={d} stroke="var(--color-premium-green-500)" strokeWidth={4} fill="none" strokeLinecap="round" opacity="0">
          <animate attributeName="opacity" values="0;0.6;0" dur="1.4s" repeatCount="1" fill="freeze" />
        </path>
      )}
    </g>
  );
};
