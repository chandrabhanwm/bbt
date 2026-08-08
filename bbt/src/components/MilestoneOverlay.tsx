import React from 'react';
import { motion } from 'motion/react';

export interface MilestoneData {
  icon: string;
  title: string;
  message: string;
  bonusText: string;
  color: 'gold' | 'green' | 'purple' | 'teal';
}

const COLOR_HEX: Record<MilestoneData['color'], string> = {
  gold: '#FFD700',
  green: '#4ADE80',
  purple: '#A855F7',
  teal: '#40E0D0',
};

/** Confetti particle field — many small rects, random trajectories,
 *  gravity-like fall, staggered start. Transform/opacity only (no layout
 *  thrash), cheap enough to run on every major milestone without jank. */
function ConfettiBurst({ accentHex }: { accentHex: string }) {
  const colors = [accentHex, '#FFD700', '#40E0D0', '#FF6B6B', '#4ADE80', '#60A5FA'];
  const particles = React.useMemo(() => Array.from({ length: 55 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 340,
    delay: Math.random() * 0.15,
    color: colors[i % colors.length],
    rotate: Math.random() * 360,
    size: 6 + Math.random() * 6,
    duration: 1.1 + Math.random() * 0.6,
  })), []);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{ position: 'absolute', left: '50%', top: '32%', width: p.size, height: p.size * 0.4, background: p.color, borderRadius: 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, -60, 260], opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/** The genuine full-screen takeover — reserved for major milestones and
 *  special events only (first major purchase, max level reached, new
 *  district unlocked, a synergy discovered for the first time, district
 *  completion, player XP level-up, a big pool claim, daily reward). NOT
 *  used for routine business upgrades — those get the lighter, in-card
 *  micro-celebration instead (see BusinessGridCard's own `celebrating`
 *  state), so the full treatment stays meaningful rather than becoming
 *  background noise the player learns to tap through. */
export const MilestoneOverlay: React.FC<{ data: MilestoneData }> = ({ data }) => {
  const accentHex = COLOR_HEX[data.color];
  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%, rgba(20,30,45,0.8), rgba(5,10,18,0.95))` }} />
      <ConfettiBurst accentHex={accentHex} />

      <motion.div
        style={{ position: 'relative', textAlign: 'center', padding: '0 24px' }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.12, 1], opacity: 1 }}
        transition={{ duration: 0.45, times: [0, 0.7, 1], ease: 'easeOut' }}
      >
        <motion.div
          style={{ position: 'absolute', left: '50%', top: -30, width: 220, height: 220, marginLeft: -110, borderRadius: '50%', background: `radial-gradient(circle, ${accentHex}55, transparent 70%)` }}
          animate={{ scale: [0.8, 1.3, 1], opacity: [0.9, 0.5, 0.7] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
        />

        <div
          className="glossy-3d"
          style={{
            width: 120, height: 120, borderRadius: 28, margin: '0 auto', position: 'relative',
            border: `3px solid ${accentHex}`, boxShadow: `0 0 50px ${accentHex}A6, 0 0 100px ${accentHex}4D`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52,
            backgroundColor: 'var(--color-premium-elevated)',
          }}
        >
          {data.icon}
        </div>

        <motion.div
          style={{ marginTop: 20, fontSize: 28, fontWeight: 900, color: accentHex, textShadow: `0 3px 20px ${accentHex}99`, letterSpacing: 1, textTransform: 'uppercase' }}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {data.title}
        </motion.div>
        <motion.div
          style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: '#fff', maxWidth: 300 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          {data.message}
        </motion.div>
        {data.bonusText && (
          <motion.div
            style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: 'var(--color-premium-green-500)' }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3, type: 'spring' }}
          >
            {data.bonusText}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
