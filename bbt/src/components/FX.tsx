import React from 'react';
import { motion } from 'motion/react';

/**
 * A little cluster of coins that pop out and float up, then vanish.
 * Drop this at the spot the player just earned or spent money —
 * the tap point, a shop, a collected bubble — for the game's signature
 * "cha-ching" feedback moment. Purely decorative / pointer-events none.
 */
export const CoinBurst: React.FC<{ count?: number; emoji?: string }> = ({ count = 5, emoji = '🪙' }) => {
  const coins = Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI - Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const dist = 18 + Math.random() * 14;
    const dx = Math.cos(angle) * dist;
    const delay = Math.random() * 0.12;
    return { id: i, dx, delay };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-40" aria-hidden="true">
      {coins.map((c) => (
        <span
          key={c.id}
          className="absolute left-1/2 top-1/2 text-sm animate-coin-float"
          style={{
            transform: `translate(-50%, -50%) translateX(${c.dx}px)`,
            animationDelay: `${c.delay}s`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
};

/**
 * Coins that fly from their spawn point toward the Header's cash area
 * and fade out there — distinct from CoinBurst above, which bursts
 * outward and fades in place. This is the "coin flight" effect
 * explicitly deferred earlier in the project for a dedicated pass —
 * used specifically for the pool-claim moment, reinforcing "this money
 * is now yours, and it's going up there" rather than just celebrating
 * in place.
 *
 * The target offset is a judicious, hardcoded approximation of "toward
 * the Header's cash pill" rather than a measured DOM position — this
 * app's phone-frame layout is a known, fixed mobile width (not an
 * arbitrary responsive layout), so a fixed offset reads correctly
 * without needing a ref-based measurement for what's a purely
 * decorative flourish.
 */
export const CoinFlight: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const coins = Array.from({ length: count }).map((_, i) => ({
    id: i,
    startX: (Math.random() - 0.5) * 40,
    delay: i * 0.09 + Math.random() * 0.08,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-visible z-[60]" aria-hidden="true">
      {coins.map((c) => (
        <motion.span
          key={c.id}
          className="absolute text-lg"
          style={{ left: '50%', top: '38%' }}
          initial={{ x: c.startX, y: 0, opacity: 0, scale: 0.6 }}
          animate={{
            x: [c.startX, c.startX * 0.6, -150],
            y: [0, -60, -260],
            opacity: [0, 1, 1, 0],
            scale: [0.6, 1, 0.8, 0.5],
          }}
          transition={{ duration: 0.9, delay: c.delay, ease: 'easeIn', times: [0, 0.3, 0.75, 1] }}
        >
          🪙
        </motion.span>
      ))}
    </div>
  );
};

/**
 * A short burst of falling confetti flecks for big celebratory moments
 * (level up, first unlock, milestone). Keep it brief — this is the one
 * place the app spends its "boldness."
 */
export const Confetti: React.FC<{ count?: number }> = ({ count = 18 }) => {
  const colors = [
    'var(--color-premium-gold-400)',
    'var(--color-premium-gold-100)',
    'var(--color-premium-green-500)',
    'var(--color-premium-green-300)',
    'var(--color-premium-text-secondary)',
  ];
  const flecks = Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: 5 + Math.random() * 90,
    delay: Math.random() * 0.5,
    color: colors[i % colors.length],
    rotate: Math.random() * 360,
    size: 5 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-x-0 top-0 h-0 pointer-events-none overflow-visible z-40" aria-hidden="true">
      {flecks.map((f) => (
        <span
          key={f.id}
          className="absolute animate-confetti block rounded-sm"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size * 1.6,
            background: f.color,
            animationDelay: `${f.delay}s`,
            transform: `rotate(${f.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
};
