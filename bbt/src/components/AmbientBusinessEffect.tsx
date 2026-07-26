import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface AmbientBusinessEffectProps {
  businessId: string;
  /** The resolved category label (from getBusinessCategory) — this is
   *  what the effect actually dispatches on now, not the raw business
   *  id. Every business resolves to one of the 8 real categories or the
   *  GENERAL fallback, so dispatching by category is what makes this
   *  cover all 76 businesses across every district, rather than the 4
   *  the original hand-picked version covered. */
  category: string;
}

/**
 * Very subtle, category-specific ambient touches on the grid card's
 * image region — the thing that makes the town feel alive rather than
 * static, per the Micro Feedback spec.
 *
 * Technical note worth keeping visible in the code, not just the chat:
 * the business icons are static PNG images (Fluent Emoji assets), not
 * layered vector art — there's no separate "steam" or "window" piece
 * inside them to animate. Everything here is a small overlay element
 * sitting near/on top of the icon, faked convincingly rather than
 * literally part of the artwork.
 */
export const AmbientBusinessEffect: React.FC<AmbientBusinessEffectProps> = ({ businessId, category }) => {
  // Stagger each card's cycle a little so a full row of the same
  // category doesn't all puff/pulse/flicker in perfect unison — that
  // reads as mechanical, not alive. Keyed off the business id (not
  // category) so even same-category neighbors desync from each other.
  const jitter = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < businessId.length; i++) hash = (hash * 31 + businessId.charCodeAt(i)) >>> 0;
    return (hash % 30) / 10; // 0–3s stagger
  }, [businessId]);

  if (category === 'FOOD & BEVERAGE') {
    return (
      <motion.div
        className="absolute top-1 left-1/2 w-2 h-2 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%)' }}
        animate={{ y: [-2, -14], opacity: [0, 0.5, 0], scale: [0.8, 1.4] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 6.8, delay: jitter, ease: 'easeOut' }}
      />
    );
  }

  if (category === 'BAKERY') {
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 60%, rgba(255,170,80,0.25), transparent 65%)' }}
        animate={{ opacity: [0.3, 0.65, 0.3] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: jitter, ease: 'easeInOut' }}
      />
    );
  }

  if (category === 'HEALTHCARE') {
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

  if (category === 'RESTAURANT') {
    return (
      <motion.div
        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{ background: 'rgba(255, 214, 140, 0.9)', boxShadow: '0 0 4px rgba(255,214,140,0.8)' }}
        animate={{ opacity: [0.9, 0.3, 0.9, 0.5, 0.9] }}
        transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 5, delay: jitter, ease: 'easeInOut' }}
      />
    );
  }

  if (category === 'GROCERY') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-y-0 w-4"
          style={{ background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.35), transparent)' }}
          animate={{ x: ['-20%', '140%'] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 7, delay: jitter, ease: 'easeInOut' }}
        />
      </div>
    );
  }

  if (category === 'DAIRY') {
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 55%, rgba(255,255,255,0.3), transparent 65%)' }}
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 3.8, repeat: Infinity, delay: jitter, ease: 'easeInOut' }}
      />
    );
  }

  if (category === 'AUTOMOTIVE') {
    return (
      <motion.div
        className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{ background: 'rgba(200,220,255,0.9)', boxShadow: '0 0 5px rgba(200,220,255,0.8)' }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.2, 0.6] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4.5, delay: jitter, ease: 'easeOut' }}
      />
    );
  }

  if (category === 'EVENTS') {
    return (
      <>
        <motion.div
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,200,120,0.95)', boxShadow: '0 0 4px rgba(255,200,120,0.9)' }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: jitter, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,150,200,0.95)', boxShadow: '0 0 4px rgba(255,150,200,0.9)' }}
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: jitter + 0.9, ease: 'easeInOut' }}
        />
      </>
    );
  }

  // GENERAL fallback — the majority of businesses across the newer
  // districts land here (see businessCategoryPresentation.ts). Rather
  // than leave most of the game's actual content with zero ambient
  // life, this gives a gentle, low-key "open for business" shimmer —
  // deliberately subtler than the category-specific effects above, so
  // it reads as ambient texture rather than a fake, unearned identity.
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.14), transparent 70%)' }}
      animate={{ opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 5, repeat: Infinity, delay: jitter, ease: 'easeInOut' }}
    />
  );
};
