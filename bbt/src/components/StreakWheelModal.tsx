import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StreakWheel } from './StreakWheel';

interface StreakWheelModalProps {
  targetReward: number;
  streakDay: number;
  onClose: () => void;
}

/**
 * The daily-open moment for a routine (non-milestone) streak day —
 * replaces what used to be a silent news-ticker line with an actual
 * popup worth opening the app for. Deliberately dismissible via Skip:
 * the reward itself was already safely granted the instant the app
 * loaded (same race-condition-safe logic as every other daily reset in
 * this app), so this is purely a celebration of something already
 * theirs, not a gate blocking it — skipping costs nothing.
 */
export const StreakWheelModal: React.FC<StreakWheelModalProps> = ({ targetReward, streakDay, onClose }) => (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 z-[250] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(60,15,15,0.92), rgba(10,5,5,0.97))' }} />

      <motion.button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px]"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' }}
        whileTap={{ scale: 0.9 }}
      >
        ✕
      </motion.button>

      <motion.div
        className="relative flex flex-col items-center"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="text-[13px] font-bold uppercase tracking-wide mb-4" style={{ color: '#FFD700' }}>
          🔥 Daily Streak
        </div>
        <StreakWheel targetReward={targetReward} streakDay={streakDay} onSpinComplete={onClose} />
        <button
          onClick={onClose}
          className="mt-5 text-[11px] font-semibold underline"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Skip
        </button>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);
