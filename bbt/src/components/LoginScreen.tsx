import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../firebase/config';

interface LoginScreenProps {
  onSignedIn: () => void;
  initialError?: string | null;
}

const GOLD = '#D4AF37'; // a genuine metallic gold, not a bright cartoon yellow — the tycoon-genre restraint

/** A single, slow-moving spotlight behind the logo — not fast-spinning
 *  rays, not a flash burst. This is the entire lighting idea: one
 *  confident source of light, breathing slowly, the way a spotlight on
 *  a stage would move, not a carnival's rotating rig. */
const Spotlight: React.FC = () => (
  <motion.div
    style={{
      position: 'absolute', width: 480, height: 480, left: '50%', top: '38%', marginLeft: -240, marginTop: -240,
      background: `radial-gradient(circle, ${GOLD}22 0%, transparent 65%)`,
      borderRadius: '50%', pointerEvents: 'none',
    }}
    animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
  />
);

/** A restrained skyline silhouette — the one piece of "place" the scene
 *  needs, kept quiet and low-contrast so it reads as atmosphere, not a
 *  competing visual element. */
const Skyline: React.FC = () => {
  const buildings = [
    { x: 0, w: 26, h: 40 }, { x: 28, w: 20, h: 62 }, { x: 50, w: 24, h: 34 }, { x: 76, w: 18, h: 52 },
    { x: 96, w: 26, h: 44 }, { x: 124, w: 16, h: 70 }, { x: 142, w: 22, h: 38 }, { x: 166, w: 20, h: 58 },
    { x: 188, w: 26, h: 40 }, { x: 216, w: 18, h: 66 }, { x: 236, w: 24, h: 34 }, { x: 262, w: 20, h: 55 },
    { x: 284, w: 26, h: 40 }, { x: 312, w: 18, h: 62 }, { x: 332, w: 24, h: 38 }, { x: 358, w: 20, h: 56 },
    { x: 380, w: 20, h: 42 },
  ];
  return (
    <svg viewBox="0 0 400 80" className="absolute inset-x-0 bottom-0 w-full pointer-events-none" style={{ height: '16%', opacity: 0.4 }} preserveAspectRatio="xMidYMax slice">
      {buildings.map((b, i) => <rect key={i} x={b.x} y={80 - b.h} width={b.w} height={b.h} fill="#000" />)}
    </svg>
  );
};

/**
 * The required sign-in gate. Rebuilt for genuine tycoon-genre restraint
 * after an earlier version over-decorated it into something closer to
 * a carnival than a business simulation — one confident spotlight, one
 * hero logo moment, a quiet skyline for place, bold clean typography.
 * No coin rain, no confetti flash, no spinning light rig — the kind of
 * visual noise that reads as "party game," not "you're about to build
 * an empire."
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignedIn, initialError = null }) => {
  const [status, setStatus] = useState<'idle' | 'working' | 'failed'>(initialError ? 'failed' : 'idle');
  const [error, setError] = useState<string | null>(initialError);

  const handleSignIn = async () => {
    setStatus('working');
    setError(null);
    const result = await signInWithGoogle();
    if (result.uid) {
      onSignedIn();
    } else {
      setStatus('failed');
      setError(result.error);
    }
  };

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-8 text-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #0A1420 55%, #060B12 100%)' }}
    >
      <Spotlight />
      <Skyline />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex flex-col items-center"
      >
        {/* The one hero moment — bigger, quieter, more confident than a
            flashy entrance. Real 3D perspective on entry (a genuine
            tilt-and-settle, not a flat scale), then a slow, subtle 3D
            wobble at rest — the logo reads as a physical object with
            actual depth, not a flat gold square with a picture on it. */}
        <div style={{ perspective: 380 }}>
          <motion.div
            className="relative w-28 h-28 rounded-[26px] flex items-center justify-center text-6xl mb-6"
            style={{
              background: 'linear-gradient(160deg, #E8C766 0%, #D4AF37 50%, #8A6F1F 100%)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.6), 0 0 50px rgba(212,175,55,0.3), inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -3px 0 rgba(0,0,0,0.3)',
              transformStyle: 'preserve-3d',
            }}
            initial={{ rotateX: 60, rotateY: -38, scale: 0.9 }}
            animate={{ rotateX: [60, -8, 0, 6, 0], rotateY: [-38, 10, 0, -8, 0], scale: 1 }}
            transition={{
              rotateX: { duration: 0.9, times: [0, 0.55, 0.7, 0.85, 1], ease: 'easeOut' },
              rotateY: { duration: 0.9, times: [0, 0.55, 0.7, 0.85, 1], ease: 'easeOut' },
              scale: { duration: 0.6, ease: 'easeOut' },
            }}
          >
            <svg width="60" height="60" viewBox="0 0 60 60" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
              <defs>
                <linearGradient id="bldg-dark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2A2210" />
                  <stop offset="100%" stopColor="#14100A" />
                </linearGradient>
              </defs>
              {/* A deliberately composed skyline — tallest tower centered,
                  stepped shoulders either side, not a random assortment
                  of rectangles. Rendered in a deep, near-black gradient
                  so it reads as a confident dark silhouette against the
                  gold field, the same "restraint" principle as the rest
                  of this screen. */}
              <rect x="4"  y="30" width="8"  height="24" fill="url(#bldg-dark)" />
              <rect x="14" y="20" width="9"  height="34" fill="url(#bldg-dark)" />
              <rect x="25" y="8"  width="10" height="46" fill="url(#bldg-dark)" />
              <rect x="37" y="22" width="9"  height="32" fill="url(#bldg-dark)" />
              <rect x="48" y="32" width="8"  height="22" fill="url(#bldg-dark)" />
              {/* Lit windows — small gold rectangles, the one detail that
                  makes this read as designed rather than a flat cutout,
                  and ties the mark's palette back to the gold field it
                  sits on. */}
              {[[6,35],[6,41],[6,47],[16,25],[16,31],[16,37],[16,43],[16,49],
                [28,13],[28,19],[28,25],[28,31],[28,37],[28,43],[28,49],
              [39,27],[39,33],[39,39],[39,45],[50,37],[50,43],[50,49]].map(([x,y], i) => (
              <rect key={i} x={x} y={y} width="3" height="3.5" fill="#D4AF37" opacity="0.85" />
            ))}
          </svg>
          </motion.div>
        </div>

        <h1
          className="font-black text-[28px] mb-2 tracking-tight uppercase"
          style={{ color: '#F0E4C0', textShadow: '0 2px 12px rgba(0,0,0,0.6)', letterSpacing: '0.02em' }}
        >
          Basti
        </h1>
        <div
          className="text-[11px] font-bold uppercase tracking-[0.25em] mb-6"
          style={{ color: GOLD }}
        >
          Business Tycoon
        </div>

        <p className="text-[12px] leading-relaxed mb-7 max-w-[270px]" style={{ color: 'rgba(240,228,192,0.55)' }}>
          Sign in to build your empire — your progress is saved to your account and follows you to any device.
        </p>

        {error && (
          <div className="text-[11px] font-semibold mb-3 max-w-[280px]" style={{ color: '#E06B6B' }}>
            Couldn't sign in: {error}
          </div>
        )}

        <motion.button
          onClick={handleSignIn}
          disabled={status === 'working'}
          whileTap={{ scale: 0.97 }}
          className="px-7 py-3.5 rounded-xl font-bold text-[13px] flex items-center gap-2.5 cursor-pointer"
          style={{
            backgroundColor: '#F5F0E1',
            color: '#1A1408',
            border: `1px solid ${GOLD}`,
            boxShadow: '0 8px 20px rgba(0,0,0,0.35), 0 2px 0 #8A6F1F',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
          </svg>
          {status === 'working' ? 'Signing in…' : 'Sign in with Google'}
        </motion.button>

        <div className="flex items-center gap-5 mt-8">
          {[
            { icon: '🏘️', label: '10 Districts' },
            { icon: '✨', label: 'Synergies' },
            { icon: '🏆', label: 'Weekly Contest' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-[16px] leading-none opacity-70">{icon}</span>
              <span className="text-[7.5px] font-bold uppercase tracking-wide" style={{ color: 'rgba(240,228,192,0.4)' }}>{label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
