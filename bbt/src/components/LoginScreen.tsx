import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../firebase/config';

interface LoginScreenProps {
  onSignedIn: () => void;
  initialError?: string | null;
}

const GOLD = '#FFD700';

/** Rotating light-ray beacon behind the logo — the same conic-gradient
 *  technique proven in MilestoneOverlay's celebrations, reused here to
 *  give the very first thing a player sees the same "genuinely alive"
 *  treatment as the game's biggest in-game moments, not a lesser,
 *  separate visual language. */
const LightRays: React.FC = () => (
  <motion.div
    style={{
      position: 'absolute', width: 420, height: 420, left: '50%', top: '50%', marginLeft: -210, marginTop: -210,
      background: `conic-gradient(from 0deg, transparent 0deg, ${GOLD}2E 8deg, transparent 16deg, transparent 40deg, ${GOLD}2E 48deg, transparent 56deg, transparent 80deg, ${GOLD}2E 88deg, transparent 96deg, transparent 120deg, ${GOLD}2E 128deg, transparent 136deg, transparent 160deg, ${GOLD}2E 168deg, transparent 176deg, transparent 200deg, ${GOLD}2E 208deg, transparent 216deg, transparent 240deg, ${GOLD}2E 248deg, transparent 256deg, transparent 280deg, ${GOLD}2E 288deg, transparent 296deg, transparent 320deg, ${GOLD}2E 328deg, transparent 336deg)`,
      borderRadius: '50%', pointerEvents: 'none',
    }}
    animate={{ rotate: 360 }}
    transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
  />
);

/** Small ambient gold particles drifting slowly upward and fading — a
 *  continuous, gentle motion (not a one-shot burst like ParticleBurst),
 *  the same ambient-life device already proven on the City Map. */
const AmbientParticles: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 18 }).map((_, i) => {
      const left = (i * 29 + 7) % 100;
      const duration = 5 + (i % 6);
      return (
        <motion.div
          key={i}
          style={{ position: 'absolute', left: `${left}%`, bottom: -10, width: 3, height: 3, borderRadius: '50%', background: GOLD }}
          animate={{ opacity: [0, 0.9, 0], y: [0, -280] }}
          transition={{ duration, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
        />
      );
    })}
  </div>
);

/**
 * The required sign-in gate. Nothing about the actual game renders
 * until this succeeds — a deliberate product decision (real accounts
 * from the start, not silent anonymous sessions most players would
 * never bother linking).
 *
 * Rebuilt from a plain dark screen with a single emoji into a real
 * introduction moment — rich gradient depth, rotating light rays,
 * ambient particles, a genuine 3D-tilted logo mark, and feature
 * highlights, using the exact same techniques already proven
 * throughout the rest of the app rather than a separate, lesser visual
 * language for the very first screen a player ever sees.
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
      style={{ background: 'radial-gradient(circle at 50% 30%, #2A1F08 0%, #1A1408 45%, #0A0805 100%)' }}
    >
      <LightRays />
      <AmbientParticles />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative flex flex-col items-center"
      >
        {/* 3D-tilted logo mark — real perspective depth via CSS
            transform, not a flat scale-in, plus a layered text-shadow
            stack on the wordmark to give it genuine extruded depth
            rather than a single flat drop-shadow. */}
        <motion.div
          style={{ perspective: 700 }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            className="relative w-24 h-24 rounded-[28px] flex items-center justify-center text-5xl mb-5"
            style={{
              background: 'linear-gradient(160deg, #FFE9A8 0%, #FFD700 45%, #B8860B 100%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 60px rgba(255,215,0,0.45), inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -3px 0 rgba(0,0,0,0.25)',
              transformStyle: 'preserve-3d',
            }}
            initial={{ rotateX: 35, rotateY: -12 }}
            animate={{ rotateX: [35, -6, 0], rotateY: [-12, 6, 0] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            🏙️
          </motion.div>
        </motion.div>

        <h1
          className="font-black text-[26px] mb-1.5 tracking-tight"
          style={{
            color: GOLD,
            textShadow: '0 1px 0 #B8860B, 0 2px 0 #A57706, 0 3px 0 #946600, 0 4px 8px rgba(0,0,0,0.5), 0 0 30px rgba(255,215,0,0.35)',
          }}
        >
          Basti Business Tycoon
        </h1>
        <p className="text-[12px] leading-relaxed mb-5 max-w-[280px] text-white/70">
          Sign in to build your empire — your progress is saved to your account and follows you to any device.
        </p>

        {/* Feature highlights — turns this from a bare login form into
            a genuine introduction to what the game actually is. */}
        <div className="flex items-center gap-4 mb-7">
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
        </div>

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
        >
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: `0 0 0 2px ${GOLD}` }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
          </svg>
          {status === 'working' ? 'Signing in…' : 'Sign in with Google'}
        </motion.button>
      </motion.div>
    </div>
  );
};
