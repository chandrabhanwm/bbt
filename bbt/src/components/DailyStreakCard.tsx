import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getHoursUntilMidnight, getStreakRewardForDay, STREAK_REWARD_CYCLE } from '../utils/dailyStreak';

interface DailyStreakCardProps {
  currentStreak: number;
}

/**
 * Rebuilt from scratch with a genuine fire identity, not the same
 * neutral "info card" template reused for every other Home card.
 * Researched directly against how Duolingo specifically treats this
 * exact pattern — a streak is the single most copied retention
 * mechanic in mobile products, and its visual language (saturated
 * warm gradient, one dominant flame, a lit/unlit day-by-day row) is
 * genuinely distinct from a generic reward or info card for a reason:
 * it needs to read as "a fire you're keeping alive," not as another
 * line item.
 */
export const DailyStreakCard: React.FC<DailyStreakCardProps> = ({ currentStreak }) => {
  const [hoursLeft, setHoursLeft] = useState(getHoursUntilMidnight());

  useEffect(() => {
    const interval = setInterval(() => setHoursLeft(getHoursUntilMidnight()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (currentStreak <= 0) return null;

  const nextReward = getStreakRewardForDay(currentStreak + 1);
  const showBreakWarning = hoursLeft <= 6;

  // Position within the current 7-day reward cycle — this is what
  // actually drives the lit/unlit day row, the specific visual device
  // Duolingo uses to make "day 5 of a cycle" legible at a glance
  // rather than just a number.
  const cyclePosition = ((currentStreak - 1) % STREAK_REWARD_CYCLE.length) + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl px-3.5 py-2.5 relative overflow-hidden"
      style={{
        background: showBreakWarning
          ? 'linear-gradient(135deg, #7A1F1F 0%, #4A1010 100%)'
          : 'linear-gradient(135deg, #FF8A3D 0%, #E8452E 55%, #C22D2D 100%)',
        boxShadow: '0 8px 20px rgba(200,50,30,0.35), inset 0 1.5px 0 rgba(255,255,255,0.25)',
      }}
    >
      {/* Ambient warm glow, pulsing slowly behind everything — the same
          "this thing is alive" cue used for the icon glows elsewhere in
          the app, applied here to the whole card since fire is the
          entire point of this one. */}
      <motion.div
        className="absolute -right-6 -top-6 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,200,100,0.5), transparent 70%)' }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative flex items-center gap-2.5">
        <motion.div
          className="text-[26px] leading-none flex-shrink-0"
          animate={{ scale: [1, 1.08, 0.97, 1], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,150,50,0.9))' }}
        >
          🔥
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[18px] font-black text-white leading-none" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
              {currentStreak}
            </span>
            <span className="text-[11px] font-bold text-white/90">Day Streak</span>
          </div>
          {showBreakWarning ? (
            <div className="text-[9.5px] font-bold mt-0.5" style={{ color: '#FFD4A8' }}>
              ⚠️ Breaks in {Math.max(1, Math.round(hoursLeft))}h — come back today!
            </div>
          ) : (
            <div className="text-[9.5px] font-semibold mt-0.5 text-white/80">
              Tomorrow: <span className="text-white font-bold">₹{nextReward.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Lit/unlit 7-day row — the Duolingo device. Days already passed
          this cycle are solid and bright; the current day pulses to
          draw the eye; days still ahead sit dim, visibly "not yet
          earned," giving the whole cycle a shape you can read in one
          glance instead of a bare number. */}
      <div className="relative flex gap-1.5 mt-2">
        {STREAK_REWARD_CYCLE.map((_, i) => {
          const dayNum = i + 1;
          const isPast = dayNum < cyclePosition;
          const isCurrent = dayNum === cyclePosition;
          return (
            <motion.div
              key={i}
              className="flex-1 h-1 rounded-full"
              style={{ backgroundColor: isPast || isCurrent ? '#FFD700' : 'rgba(255,255,255,0.22)' }}
              animate={isCurrent ? { opacity: [0.6, 1, 0.6] } : {}}
              transition={isCurrent ? { duration: 1.2, repeat: Infinity } : {}}
            />
          );
        })}
      </div>
    </motion.div>
  );
};
