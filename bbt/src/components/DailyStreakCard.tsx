import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { getHoursUntilMidnight, getStreakRewardForDay } from '../utils/dailyStreak';

interface DailyStreakCardProps {
  currentStreak: number;
}

/**
 * Sits in the main Home flow alongside the other daily cards — this is
 * deliberately always visible, not tucked into a menu, since the whole
 * point of a streak mechanic is the ambient "don't lose it" pressure
 * that only works if it's something the player sees every time they
 * open the app, not something they have to go looking for.
 */
export const DailyStreakCard: React.FC<DailyStreakCardProps> = ({ currentStreak }) => {
  const [hoursLeft, setHoursLeft] = useState(getHoursUntilMidnight());

  useEffect(() => {
    const interval = setInterval(() => setHoursLeft(getHoursUntilMidnight()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (currentStreak <= 0) return null;

  const nextReward = getStreakRewardForDay(currentStreak + 1);
  // Loss-aversion is the entire mechanism here — the warning only shows
  // once there's genuinely limited time left today, not all day every
  // day, so it reads as a real, timely nudge rather than background
  // noise the player learns to ignore.
  const showBreakWarning = hoursLeft <= 6;

  return (
    <div
      className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
      style={{
        background: 'linear-gradient(165deg, rgba(255,255,255,0.06) 0%, var(--color-premium-surface) 12%, var(--color-premium-surface) 100%)',
        boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25), 0 6px 14px rgba(0,0,0,0.35)',
        border: showBreakWarning ? '1px solid rgba(255,107,107,0.4)' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#FF8A3D', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1.5px 0 rgba(0,0,0,0.2)' }}
      >
        <Flame size={14} color="#fff" fill="#fff" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold truncate" style={{ color: 'var(--color-premium-text)' }}>
          {currentStreak} Day Streak
        </div>
        {showBreakWarning ? (
          <div className="text-[9px] font-semibold" style={{ color: '#FF6B6B' }}>
            Streak breaks in {Math.max(1, Math.round(hoursLeft))}h — come back today!
          </div>
        ) : (
          <div className="text-[9px] font-semibold" style={{ color: 'var(--color-premium-text-secondary)' }}>
            Tomorrow's reward: <span style={{ color: 'var(--color-premium-green-500)' }}>₹{nextReward.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
