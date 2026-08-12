import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle } from '../firebase/config';

interface LoginScreenProps {
  onSignedIn: () => void;
  initialError?: string | null;
}

const GOLD = '#FFD700';

/** Rotating light-ray beacon behind the logo. */
const LightRays: React.FC = () => (
  <motion.div
    style={{
      position: 'absolute', width: 520, height: 520, left: '50%', top: '50%', marginLeft: -260, marginTop: -260,
      background: `conic-gradient(from 0deg, transparent 0deg, ${GOLD}38 8deg, transparent 16deg, transparent 40deg, ${GOLD}38 48deg, transparent 56deg, transparent 80deg, ${GOLD}38 88deg, transparent 96deg, transparent 120deg, ${GOLD}38 128deg, transparent 136deg, transparent 160deg, ${GOLD}38 168deg, transparent 176deg, transparent 200deg, ${GOLD}38 208deg, transparent 216deg, transparent 240deg, ${GOLD}38 248deg, transparent 256deg, transparent 280deg, ${GOLD}38 288deg, transparent 296deg, transparent 320deg, ${GOLD}38 328deg, transparent 336deg)`,
      borderRadius: '50%', pointerEvents: 'none',
    }}
    animate={{ rotate: 360 }}
    transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
  />
);

/** Distant twinkling stars — the far background layer, deliberately
 *  slower and dimmer than the coin rain and gold particles up front,
 *  giving the scene real depth rather than one flat plane of motion. */
const Stars: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 40 }).map((_, i) => {
      const left = (i * 17 + 3) % 100;
      const top = (i * 11 + 5) % 60;
      const duration = 2 + (i % 4);
      return (
        <motion.div
          key={i}
          style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, width: 2, height: 2, borderRadius: '50%', background: '#fff' }}
          animate={{ opacity: [0.1, 0.8, 0.1] }}
          transition={{ duration, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
        />
      );
    })}
  </div>
);

/** A layered city skyline silhouette along the bottom — flat rectangle
 *  shapes, not detailed illustrated buildings, the same "achievable
 *  with code, not real art" boundary already established this
 *  session. Two depth layers (a dim far row, a darker near row)
 *  reinforce the parallax feeling without needing any actual art. */
const SkylineSilhouette: React.FC = () => {
  const farBuildings = [
    { x: 0, w: 30, h: 60 }, { x: 32, w: 22, h: 90 }, { x: 56, w: 26, h: 50 }, { x: 84, w: 20, h: 75 },
    { x: 106, w: 28, h: 65 }, { x: 136, w: 18, h: 100 }, { x: 156, w: 24, h: 55 }, { x: 182, w: 22, h: 85 },
    { x: 206, w: 30, h: 60 }, { x: 238, w: 20, h: 95 }, { x: 260, w: 26, h: 50 }, { x: 288, w: 22, h: 80 },
    { x: 312, w: 28, h: 60 }, { x: 342, w: 20, h: 90 }, { x: 364, w: 26, h: 55 },
  ];
  const nearBuildings = [
    { x: -10, w: 40, h: 45 }, { x: 34, w: 32, h: 70 }, { x: 70, w: 36, h: 40 }, { x: 110, w: 28, h: 60 },
    { x: 142, w: 40, h: 35 }, { x: 186, w: 30, h: 65 }, { x: 220, w: 34, h: 45 }, { x: 258, w: 26, h: 55 },
    { x: 288, w: 38, h: 38 }, { x: 330, w: 30, h: 62 }, { x: 364, w: 36, h: 42 },
  ];
  return (
    <svg viewBox="0 0 400 100" className="absolute inset-x-0 bottom-0 w-full pointer-events-none" style={{ height: '22%' }} preserveAspectRatio="xMidYMax slice">
      {farBuildings.map((b, i) => (
        <rect key={'f' + i} x={b.x} y={100 - b.h} width={b.w} height={b.h} fill="#3D2C0A" opacity={0.55} />
      ))}
      {nearBuildings.map((b, i) => (
        <rect key={'n' + i} x={b.x} y={100 - b.h} width={b.w} height={b.h} fill="#241A06" opacity={0.85} />
      ))}
    </svg>
  );
};

/** Continuous falling gold coins — the front-most, fastest layer,
 *  reinforcing the "tycoon" theme directly rather than generic
 *  sparkle. Each coin spins as it falls for real physicality. */
const CoinRain: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 14 }).map((_, i) => {
      const left = (i * 23 + 5) % 100;
      const duration = 3.5 + (i % 5) * 0.6;
      return (
        <motion.div
          key={i}
          style={{ position: 'absolute', left: `${left}%`, top: -30, fontSize: 14 + (i % 3) * 4 }}
          animate={{ y: [0, 900], rotate: [0, 360], opacity: [0, 0.9, 0.9, 0] }}
          transition={{ duration, repeat: Infinity, delay: i * 1.1, ease: 'linear' }}
        >
          🪙
        </motion.div>
      );
    })}
  </div>
);

/**
 * The required sign-in gate — rebuilt as a genuine, choreographed
 * cinematic entrance rather than a single fade-in: the screen starts
 * dark, a flash of light crashes the logo into place with a real
 * overshoot, then the title, tagline, features, and button reveal in
 * sequence rather than all appearing together. Multiple depth layers
 * (distant stars, a two-tier skyline silhouette, falling coins, and
 * rotating light rays) run continuously underneath for a scene that
 * feels alive throughout, not just during the opening beat.
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignedIn, initialError = null }) => {
  const [status, setStatus] = useState<'idle' | 'working' | 'failed'>(initialError ? 'failed' : 'idle');
  const [error, setError] = useState<string | null>(initialError);
  const [flashDone, setFlashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlashDone(true), 550);
    return () => clearTimeout(t);
  }, []);

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
      style={{ background: 'radial-gradient(circle at 50% 28%, #2E2109 0%, #1A1408 45%, #050402 100%)' }}
    >
      <Stars />
      <LightRays />
      <CoinRain />
      <SkylineSilhouette />

      {/* The opening flash — a bright white-gold burst that crashes in
          then fades away almost immediately, the actual "goosebumps"
          beat: the screen visibly reacts the instant it opens rather
          than gently fading up. */}
      <AnimatePresence>
        {!flashDone && (
          <motion.div
            className="absolute inset-0 z-50 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255,245,200,0.95), rgba(255,215,0,0.3) 40%, transparent 70%)' }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 0], scale: [0.3, 1.8, 2.4] }}
            transition={{ duration: 0.55, times: [0, 0.35, 1], ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex flex-col items-center">
        {/* Logo — crashes in with real overshoot, timed to land right
            as the flash fades, so the two beats feel connected rather
            than coincidental. */}
        <motion.div
          style={{ perspective: 700 }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
        >
          <motion.div
            className="relative w-28 h-28 rounded-[30px] flex items-center justify-center text-6xl mb-5"
            style={{
              background: 'linear-gradient(160deg, #FFE9A8 0%, #FFD700 45%, #B8860B 100%)',
              boxShadow: '0 24px 50px rgba(0,0,0,0.55), 0 0 80px rgba(255,215,0,0.55), inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -3px 0 rgba(0,0,0,0.25)',
              transformStyle: 'preserve-3d',
            }}
            initial={{ scale: 3.2, opacity: 0, rotateX: -50 }}
            animate={{ scale: [3.2, 0.9, 1], opacity: 1, rotateX: [-50, 8, 0] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            🏙️
          </motion.div>
        </motion.div>

        <motion.h1
          className="font-black text-[30px] mb-1.5 tracking-tight"
          style={{
            color: GOLD,
            textShadow: '0 1px 0 #B8860B, 0 2px 0 #A57706, 0 3px 0 #946600, 0 4px 10px rgba(0,0,0,0.6), 0 0 40px rgba(255,215,0,0.4)',
          }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          Basti Business Tycoon
        </motion.h1>

        <motion.p
          className="text-[12px] leading-relaxed mb-5 max-w-[280px] text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.4 }}
        >
          Sign in to build your empire — your progress is saved to your account and follows you to any device.
        </motion.p>

        <motion.div
          className="flex items-center gap-4 mb-7"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.4 }}
        >
          {[
            { icon: '🏘️', label: '10 Districts' },
            { icon: '✨', label: 'Synergies' },
            { icon: '🏆', label: 'Weekly Contest' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-[20px] leading-none">{icon}</span>
              <span className="text-[8.5px] font-bold text-white/55 whitespace-nowrap">{label}</span>
            </div>
          ))}
        </motion.div>

        {error && (
          <div className="text-[11px] font-semibold mb-3 max-w-[280px]" style={{ color: '#FF6B6B' }}>
            Couldn't sign in: {error}
          </div>
        )}

        <motion.button
          onClick={handleSignIn}
          disabled={status === 'working'}
          whileTap={{ scale: 0.96 }}
          className="relative px-7 py-4 rounded-2xl font-bold text-[14px] flex items-center gap-2.5 cursor-pointer"
          style={{
            backgroundColor: '#fff',
            color: '#3D2C0A',
            boxShadow: '0 10px 24px rgba(255,215,0,0.35), 0 4px 0 #C9A227, inset 0 1.5px 0 rgba(255,255,255,0.9)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.4 }}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: `0 0 0 2px ${GOLD}` }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          />
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
          </svg>
          {status === 'working' ? 'Signing in…' : 'Sign in with Google'}
        </motion.button>
      </div>
    </div>
  );
};
