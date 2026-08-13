import React from 'react';
import { motion } from 'motion/react';

const GOLD = '#FFD700';

/**
 * A genuinely simple tutorial nudge — a plain, static card sitting
 * inline in the Home screen's normal content flow, the same way
 * DailyStreakCard or ShareEarnCard do. Deliberately replaces an
 * earlier spotlight-overlay system that tried to dynamically measure
 * and highlight real DOM elements in real time — exactly the kind of
 * thing that's fragile on real devices (viewport differences, layout
 * timing, positioning math), and was reported as genuinely glitchy in
 * practice. No portal, no measurement, no cutout — just a card that
 * renders wherever it's placed, like everything else on this screen.
 */
export const TutorialBanner: React.FC<{ icon: string; title: string; message: string; onDismiss?: () => void }> = ({ icon, title, message, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl px-3.5 py-3 flex items-center gap-2.5 relative overflow-hidden"
    style={{
      background: 'linear-gradient(135deg, #3D2FA8 0%, #241C6B 100%)',
      boxShadow: '0 8px 20px rgba(60,40,180,0.3), inset 0 1.5px 0 rgba(255,255,255,0.15)',
    }}
  >
    <motion.div
      className="text-[24px] leading-none flex-shrink-0"
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {icon}
    </motion.div>
    <div className="flex-1 min-w-0">
      <div className="text-[12px] font-black text-white">{title}</div>
      <div className="text-[10.5px] font-medium leading-snug text-white/80">{message}</div>
    </div>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="flex-shrink-0 px-2.5 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer"
        style={{ backgroundColor: GOLD, color: '#3D2C0A' }}
      >
        Got it
      </button>
    )}
  </motion.div>
);
