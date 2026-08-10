import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { STREAK_REWARD_CYCLE } from '../utils/dailyStreak';

interface StreakWheelProps {
  /** The reward this spin will land on — already determined by the same
   *  processStreakLogin logic used everywhere else in the app (see
   *  App.tsx's streakResultRef). The wheel never decides anything
   *  itself; it's a celebratory reveal of an outcome that's already
   *  final, the same "rigged spin" pattern real games use specifically
   *  so a visual mechanic can't accidentally become a second, competing
   *  source of truth for the economy. */
  targetReward: number;
  streakDay: number;
  onSpinComplete: () => void;
}

const SEGMENT_COLORS = ['#FF8A3D', '#E8452E', '#C22D2D', '#8A1F2E', '#C22D2D', '#E8452E', '#FF8A3D'];
const SEGMENT_COUNT = STREAK_REWARD_CYCLE.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 0 0 ${end.x} ${end.y} Z`;
}

export const StreakWheel: React.FC<StreakWheelProps> = ({ targetReward, streakDay, onSpinComplete }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // The segment index this spin must land on — the wheel's own reward
  // values are the same 7-day cycle already used everywhere, so this
  // is always an exact, guaranteed match, never a guess.
  const targetIndex = STREAK_REWARD_CYCLE.indexOf(targetReward);

  // Computed once per mount, not on every render — a random offset
  // within the target segment's own width, so the wheel doesn't
  // suspiciously land dead-center every single time, while never
  // landing outside the correct segment.
  const landingOffset = useMemo(() => (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6), []);

  const handleSpin = () => {
    if (spinning || revealed) return;
    setSpinning(true);
    // The pointer is fixed at the top (12 o'clock / 0deg). Segment i is
    // centered at i * SEGMENT_ANGLE from the top. To bring that segment
    // under the pointer, the wheel rotates by the negative of that
    // angle — plus several full spins for the visual effect, plus the
    // small randomized offset computed above.
    const targetAngle = -(targetIndex * SEGMENT_ANGLE) - landingOffset;
    const fullSpins = 5 * 360;
    setRotation(fullSpins + targetAngle);
    setTimeout(() => {
      setRevealed(true);
      setTimeout(onSpinComplete, 1400);
    }, 3200);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 220, height: 220 }}>
        {/* Fixed pointer — does not rotate with the wheel */}
        <div
          className="absolute left-1/2 z-10"
          style={{ top: -6, marginLeft: -12, width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '20px solid #FFD700', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
        />
        <motion.svg
          viewBox="0 0 220 220"
          width={220}
          height={220}
          animate={{ rotate: rotation }}
          transition={{ duration: 3.2, ease: [0.15, 0.75, 0.25, 1] }}
          style={{ filter: 'drop-shadow(0 6px 16px rgba(200,50,30,0.5))' }}
        >
          <circle cx={110} cy={110} r={106} fill="#3D1010" stroke="#FFD700" strokeWidth={3} />
          {STREAK_REWARD_CYCLE.map((reward, i) => {
            const start = i * SEGMENT_ANGLE;
            const end = start + SEGMENT_ANGLE;
            const mid = start + SEGMENT_ANGLE / 2;
            const labelPos = polarToCartesian(110, 110, 68, mid);
            return (
              <g key={i}>
                <path d={describeSlice(110, 110, 100, start, end)} fill={SEGMENT_COLORS[i]} stroke="#2A0808" strokeWidth={1.5} />
                <text
                  x={labelPos.x} y={labelPos.y}
                  fill="#fff" fontSize={13} fontWeight={900} textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  ₹{reward >= 1000 ? `${reward / 1000}K` : reward}
                </text>
              </g>
            );
          })}
          <circle cx={110} cy={110} r={22} fill="#FFD700" stroke="#8A1F2E" strokeWidth={2} />
        </motion.svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl pointer-events-none">🔥</div>
      </div>

      {!revealed ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSpin}
          disabled={spinning}
          className="mt-4 px-6 py-2.5 rounded-full font-black text-[13px]"
          style={{
            backgroundColor: spinning ? '#7A5A2A' : '#FFD700',
            color: '#3D1010',
            boxShadow: spinning ? 'none' : '0 4px 0 #8A6A16, 0 7px 12px rgba(0,0,0,0.35)',
          }}
        >
          {spinning ? 'Spinning...' : `Spin for Day ${streakDay}`}
        </motion.button>
      ) : (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.15, 1], opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-4 text-center"
        >
          <div className="text-[22px] font-black" style={{ color: '#FFD700' }}>+₹{targetReward.toLocaleString('en-IN')}</div>
          <div className="text-[11px] font-bold text-white/80">Day {streakDay} claimed!</div>
        </motion.div>
      )}
    </div>
  );
};
