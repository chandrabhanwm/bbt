import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface AmbientBusinessEffectProps {
  businessId: string;
}

/**
 * Very subtle, business-specific ambient touches on the grid card's image
 * region — the thing that makes the town feel alive rather than static,
 * per the Micro Feedback spec.
 *
 * Technical note worth keeping visible in the code, not just the chat:
 * the business icons are static PNG images (Fluent Emoji assets), not
 * layered vector art — there's no separate "steam" or "window" piece
 * inside them to animate. Everything here is a small overlay element
 * sitting near/on top of the icon, faked convincingly rather than
 * literally part of the artwork. Only a handful of business ids get an
 * effect; anything else renders nothing, which is the correct behavior,
 * not a gap to fill in.
 */
export const AmbientBusinessEffect: React.FC<AmbientBusinessEffectProps> = ({ businessId }) => {
  // Stagger each card's cycle a little so a full row of Tea Stalls (or
  // repeated business types) doesn't all puff/pulse/flicker in perfect
  // unison — that reads as mechanical, not alive.
  const jitter = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < businessId.length; i++) hash = (hash * 31 + businessId.charCodeAt(i)) >>> 0;
    return (hash % 30) / 10; // 0–3s stagger
  }, [businessId]);

  if (businessId === 'tea_stall') {
    // A soft wisp that drifts up and fades, every ~9s.
    return (
      <motion.div
        className="absolute top-1 left-1/2 w-2 h-2 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%)' }}
        animate={{ y: [-2, -14], opacity: [0, 0.5, 0], scale: [0.8, 1.4] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 6.8, delay: jitter, ease: 'easeOut' }}
      />
    );
  }

  if (businessId === 'bakery') {
    // A slow, warm breathing glow — like light from an oven window.
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 60%, rgba(255,170,80,0.25), transparent 65%)' }}
        animate={{ opacity: [0.3, 0.65, 0.3] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: jitter, ease: 'easeInOut' }}
      />
    );
  }

  if (businessId === 'medical') {
    // The cross itself (baked into the icon) softly pulses via a gentle
    // glow behind it — not scaling the icon, since a size change would
    // read as "growing," not "pulsing softly."
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        animate={{ opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 3.2, repeat: Infinity, delay: jitter, ease: 'easeInOut' }}
      >
        <div className="w-10 h-10 rounded-full" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.4), transparent 70%)' }} />
      </motion.div>
    );
  }

  if (businessId === 'restaurant') {
    // A tiny window-light flicker — quick, irregular blips, not a smooth
    // loop, so it reads as "light," not "breathing."
    return (
      <motion.div
        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{ background: 'rgba(255, 214, 140, 0.9)', boxShadow: '0 0 4px rgba(255,214,140,0.8)' }}
        animate={{ opacity: [0.9, 0.3, 0.9, 0.5, 0.9] }}
        transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 5, delay: jitter, ease: 'easeInOut' }}
      />
    );
  }

  return null;
};
