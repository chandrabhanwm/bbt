import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ParticleBurst } from './ParticleBurst';

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

const LightRays: React.FC<{ color: string }> = ({ color }) => (
  <motion.div
    style={{
      position: 'absolute', width: 320, height: 320, left: '50%', top: 60, marginLeft: -160,
      background: `conic-gradient(from 0deg, transparent 0deg, ${color}33 8deg, transparent 16deg, transparent 40deg, ${color}33 48deg, transparent 56deg, transparent 80deg, ${color}33 88deg, transparent 96deg, transparent 120deg, ${color}33 128deg, transparent 136deg, transparent 160deg, ${color}33 168deg, transparent 176deg, transparent 200deg, ${color}33 208deg, transparent 216deg, transparent 240deg, ${color}33 248deg, transparent 256deg, transparent 280deg, ${color}33 288deg, transparent 296deg, transparent 320deg, ${color}33 328deg, transparent 336deg)`,
      borderRadius: '50%', pointerEvents: 'none',
    }}
    animate={{ rotate: 360 }}
    transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
  />
);

/** The genuine full-screen takeover — reserved for major milestones and
 *  special events only (first major purchase, max level reached, new
 *  district unlocked, a synergy discovered for the first time, district
 *  completion, player XP level-up, a big pool claim, daily reward,
 *  prestige badges). NOT used for routine business upgrades — those get
 *  the lighter, in-card micro-celebration instead (see
 *  BusinessGridCard's own `celebrating` state), so the full treatment
 *  stays meaningful rather than becoming background noise the player
 *  learns to tap through. */
export const MilestoneOverlay: React.FC<{ data: MilestoneData }> = ({ data }) => {
  const accentHex = COLOR_HEX[data.color];
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setShakeKey(1), 350); // fires right as the icon lands
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      initial={{ opacity: 0 }}
      animate={shakeKey ? { opacity: 1, x: [0, -6, 5, -4, 3, -2, 0], y: [0, 3, -2, 2, -1, 1, 0] } : { opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shakeKey ? 0.35 : 0.25, ease: 'easeOut' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%, rgba(20,30,45,0.8), rgba(5,10,18,0.95))` }} />
      <ParticleBurst anchorRef={iconRef} accentHex={accentHex} count={100} stageMultiplier={3.2} />
      <LightRays color={accentHex} />

      <motion.div
        style={{ position: 'relative', textAlign: 'center', padding: '0 24px', perspective: 800 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          ref={iconRef}
          className="glossy-3d"
          style={{
            width: 120, height: 120, borderRadius: 28, margin: '0 auto', position: 'relative',
            border: `3px solid ${accentHex}`, boxShadow: `0 0 50px ${accentHex}A6, 0 0 100px ${accentHex}4D`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52,
            backgroundColor: 'var(--color-premium-elevated)', transformStyle: 'preserve-3d',
          }}
          initial={{ rotateX: 65, scale: 0.35, opacity: 0 }}
          animate={{ rotateX: [65, -8, 0], scale: [0.35, 1.14, 1], opacity: 1 }}
          transition={{ duration: 0.5, times: [0, 0.7, 1], ease: 'easeOut' }}
        >
          {data.icon}
        </motion.div>

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
