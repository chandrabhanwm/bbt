import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TutorialStepProps {
  targetSelector: string;
  title: string;
  message: string;
  /** Shown only for steps that don't require a specific real action to
   *  complete (e.g. an explanatory step) — steps that DO require a
   *  real action (like actually buying a business) have no dismiss
   *  button at all, since the whole point is that tapping the
   *  highlighted real element is what advances the tutorial, not a
   *  generic "next" button standing in for it. */
  onDismiss?: () => void;
}

/**
 * A genuine spotlight, not a decorative highlight — the "hole" is a
 * real cutout through the dark overlay, positioned and sized to
 * exactly match the real target element's current position on screen
 * (via getBoundingClientRect, re-measured on a short interval since
 * the target can shift due to layout changes, e.g. a business list
 * re-rendering after a purchase). This means the highlighted element
 * is genuinely tappable through the overlay — the tutorial doesn't
 * intercept the tap itself, since the overlay's pointer-events only
 * apply to the dark region, not the cutout.
 */
export const TutorialSpotlight: React.FC<TutorialStepProps> = ({ targetSelector, title, message, onDismiss }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const measure = () => {
      const el = document.querySelector(`[data-tutorial-target="${targetSelector}"]`);
      if (el) setRect(el.getBoundingClientRect());
    };
    measure();
    // Re-measure on a short interval rather than a one-time check —
    // the target may not exist yet on the very first render (e.g. a
    // business list still mounting), and its position can shift after
    // layout changes elsewhere on screen.
    const interval = setInterval(measure, 200);
    window.addEventListener('resize', measure);
    return () => { clearInterval(interval); window.removeEventListener('resize', measure); };
  }, [targetSelector]);

  if (!rect) return null; // target not found yet — stay invisible rather than show a broken/centered overlay

  const padding = 8;
  const holeX = rect.left - padding;
  const holeY = rect.top - padding;
  const holeW = rect.width + padding * 2;
  const holeH = rect.height + padding * 2;

  // Bubble goes below the hole if there's room, above it otherwise —
  // keeps the message readable regardless of where the target sits.
  const spaceBelow = window.innerHeight - (holeY + holeH);
  const bubbleBelow = spaceBelow > 140;
  const bubbleTop = bubbleBelow ? holeY + holeH + 16 : undefined;
  const bubbleBottom = !bubbleBelow ? window.innerHeight - holeY + 16 : undefined;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[400]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ pointerEvents: 'none' }}
      >
        {/* The spotlight hole itself — a transparent box whose huge
            box-shadow spread covers the entire rest of the screen in a
            dark overlay, leaving only this exact rect genuinely clear. */}
        <motion.div
          className="absolute rounded-2xl"
          style={{
            left: holeX, top: holeY, width: holeW, height: holeH,
            boxShadow: '0 0 0 9999px rgba(5,10,15,0.8)',
            border: '2.5px solid #FFD700',
          }}
          animate={{ boxShadow: ['0 0 0 9999px rgba(5,10,15,0.8), 0 0 0px rgba(255,215,0,0.6)', '0 0 0 9999px rgba(5,10,15,0.8), 0 0 20px rgba(255,215,0,0.6)', '0 0 0 9999px rgba(5,10,15,0.8), 0 0 0px rgba(255,215,0,0.6)'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Message bubble with an arrow pointing at the hole */}
        <motion.div
          className="absolute left-1/2 px-4 py-3 rounded-2xl max-w-[280px]"
          style={{
            top: bubbleTop, bottom: bubbleBottom,
            transform: 'translateX(-50%)',
            backgroundColor: '#1A1408', border: '1.5px solid #FFD700',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            pointerEvents: 'auto',
          }}
          initial={{ opacity: 0, y: bubbleBelow ? -8 : 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="absolute left-1/2 w-3 h-3 rotate-45"
            style={{
              transform: 'translateX(-50%) rotate(45deg)',
              backgroundColor: '#1A1408',
              borderTop: bubbleBelow ? '1.5px solid #FFD700' : undefined,
              borderLeft: bubbleBelow ? '1.5px solid #FFD700' : undefined,
              borderBottom: !bubbleBelow ? '1.5px solid #FFD700' : undefined,
              borderRight: !bubbleBelow ? '1.5px solid #FFD700' : undefined,
              top: bubbleBelow ? -6 : undefined,
              bottom: !bubbleBelow ? -6 : undefined,
            }}
          />
          <div className="text-[12px] font-black mb-1" style={{ color: '#FFD700' }}>{title}</div>
          <div className="text-[11px] leading-relaxed text-white/85">{message}</div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="mt-2.5 px-3 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer"
              style={{ backgroundColor: '#FFD700', color: '#3D2C0A' }}
            >
              Got it
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
