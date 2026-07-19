import React, { useMemo } from 'react';
import { TreeDeciduous, Lamp } from 'lucide-react';
import { District } from '../../data/cityMapData';

interface RoadPathProps {
  id: string;
  from: District;
  to: District;
  active: boolean;
  /** True briefly after a district it touches just completed — pulses the
   *  road surface gold for a few seconds. Purely visual, no state here. */
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

function cubicPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

function cubicTangentAngle(t: number, p0: Point, p1: Point, p2: Point, p3: Point): number {
  const mt = 1 - t;
  const dx = 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
  const dy = 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function offsetPerpendicular(pt: Point, angleDeg: number, distance: number): Point {
  const perp = ((angleDeg + 90) * Math.PI) / 180;
  return { x: pt.x + Math.cos(perp) * distance, y: pt.y + Math.sin(perp) * distance };
}

export const RoadPath: React.FC<RoadPathProps> = ({ id, from, to, active, celebrating = false }) => {
  const p0: Point = { x: from.x, y: from.y };
  const p3: Point = { x: to.x, y: to.y };

  const { p1, p2 } = useMemo(() => getControlPoints(p0, p3), [p0.x, p0.y, p3.x, p3.y]);
  const d = `M ${p0.x},${p0.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;

  const roadColor = active ? '#8a7f6f' : '#c7c1b4';
  const laneColor = active ? '#FFEAC0' : '#e8e3d8';

  // Static decorations sampled directly from the curve — trees on one
  // side, lamp posts on the other, at a couple of points along the road.
  const decorPoints = [0.28, 0.72];
  const trees = decorPoints.map((t) => {
    const pt = cubicPoint(t, p0, p1, p2, p3);
    const angle = cubicTangentAngle(t, p0, p1, p2, p3);
    return offsetPerpendicular(pt, angle, -22);
  });
  const lamps = [0.45].map((t) => {
    const pt = cubicPoint(t, p0, p1, p2, p3);
    const angle = cubicTangentAngle(t, p0, p1, p2, p3);
    return offsetPerpendicular(pt, angle, 20);
  });

  return (
    <g opacity={active ? 1 : 0.6}>
      {/* Soft shadow beneath the road */}
      <path d={d} stroke="#2E1B0C" strokeWidth={16} fill="none" strokeLinecap="round" opacity={0.1} transform="translate(0, 4)" />

      {/* Road surface */}
      <path d={d} stroke={roadColor} strokeWidth={14} fill="none" strokeLinecap="round" />

      {/* Brief gold celebration pulse — a district touching this road just completed */}
      {celebrating && (
        <path d={d} stroke="var(--color-brass-400)" strokeWidth={18} fill="none" strokeLinecap="round" opacity="0">
          <animate attributeName="opacity" values="0;0.65;0" dur="1.1s" repeatCount="3" />
        </path>
      )}

      {/* Lane markings */}
      <path d={d} stroke={laneColor} strokeWidth={2} strokeDasharray="7 9" fill="none" strokeLinecap="round" opacity={active ? 0.9 : 0.6} />

      {/* Trees */}
      {trees.map((pt, i) => (
        <g key={`tree-${i}`} transform={`translate(${pt.x}, ${pt.y})`} opacity={active ? 1 : 0.55}>
          <foreignObject x="-9" y="-18" width="18" height="18">
            <TreeDeciduous size={18} color={active ? '#3f7d3f' : '#9a9284'} fill={active ? '#7bc47f' : '#d6d2c4'} strokeWidth={1.5} />
          </foreignObject>
        </g>
      ))}

      {/* Street lights */}
      {lamps.map((pt, i) => (
        <g key={`lamp-${i}`} transform={`translate(${pt.x}, ${pt.y})`} opacity={active ? 1 : 0.55}>
          <foreignObject x="-8" y="-20" width="16" height="20">
            <Lamp size={16} color={active ? '#7A5230' : '#9a9284'} strokeWidth={1.8} />
          </foreignObject>
          {active && <circle cy="-19" r="4" fill="#FFE9A8" opacity="0.7" />}
        </g>
      ))}

      {/* Moving traffic — only on the live frontier road, everything else stays still */}
      {active && (
        <>
          <g>
            <circle r="3.4" fill="var(--color-rose-500)" stroke="#2E1B0C" strokeWidth="0.8">
              <animateMotion dur="5s" repeatCount="indefinite" path={d} rotate="auto" />
            </circle>
          </g>
          <g>
            <circle r="2.6" fill="var(--color-sky-500)" stroke="#2E1B0C" strokeWidth="0.7">
              <animateMotion dur="4s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" path={d} rotate="auto" />
            </circle>
          </g>
          <g>
            <circle r="2" fill="var(--color-ink-900)">
              <animateMotion dur="9s" repeatCount="indefinite" path={d} />
            </circle>
          </g>
        </>
      )}
    </g>
  );
};
