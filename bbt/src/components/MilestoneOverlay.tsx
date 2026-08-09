import React, { useEffect, useRef, useState } from 'react';
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

interface Particle {
  x: number; y: number; vx: number; vy: number;
  rotation: number; vRotation: number;
  size: number; color: string; shape: 'square' | 'circle' | 'star';
  life: number; maxLife: number;
}

function drawStar(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(angle) * size;
    const y = Math.sin(angle) * size;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    const innerAngle = angle + Math.PI / 5;
    ctx.lineTo(Math.cos(innerAngle) * size * 0.45, Math.sin(innerAngle) * size * 0.45);
  }
  ctx.closePath();
}

/** Real canvas particle system — replaces the earlier DOM-animated-div
 *  confetti entirely. Gravity, per-particle rotation, deceleration, and
 *  three distinct shapes (not one rectangle repeated in different
 *  colors) running on requestAnimationFrame. Canvas handles this volume
 *  of physically-simulated particles far more cheaply than animating
 *  90 individual DOM elements would. */
const ParticleCanvas: React.FC<{ width: number; height: number; accentHex: string }> = ({ width, height, accentHex }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = [accentHex, '#FFD700', '#40E0D0', '#FF6B6B', '#4ADE80', '#60A5FA'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    const centerX = width / 2;
    const centerY = height * 0.32;
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      particles.push({
        x: centerX, y: centerY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3,
        rotation: Math.random() * 360, vRotation: (Math.random() - 0.5) * 20,
        size: 4 + Math.random() * 6,
        color: colors[i % colors.length],
        shape: (['square', 'circle', 'star'] as const)[i % 3],
        life: 0, maxLife: 70 + Math.random() * 50,
      });
    }

    let raf: number;
    const gravity = 0.35;
    function tick() {
      ctx!.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        if (p.life >= p.maxLife) return;
        p.vy += gravity;
        p.vx *= 0.99;
        p.x += p.vx; p.y += p.vy;
        p.rotation += p.vRotation;
        p.life++;
        const fadeStart = p.maxLife * 0.7;
        const opacity = p.life > fadeStart ? Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart)) : 1;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.globalAlpha = opacity;
        ctx!.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx!.beginPath(); ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx!.fill();
        } else if (p.shape === 'star') {
          drawStar(ctx!, p.size / 2); ctx!.fill();
        } else {
          ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx!.restore();
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, height, accentHex]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width, height, pointerEvents: 'none' }} />;
};

/** Rotating light rays behind the icon — a conic gradient spun via CSS
 *  transform. Distinct from the earlier radial-gradient "soft halo"
 *  glow: this reads as a directional burst of light radiating outward,
 *  not just an ambient bloom. */
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
  const [size, setSize] = useState({ width: 390, height: 700 });
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    }
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
      <ParticleCanvas width={size.width} height={size.height} accentHex={accentHex} />
      <LightRays color={accentHex} />

      <motion.div
        style={{ position: 'relative', textAlign: 'center', padding: '0 24px', perspective: 800 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
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
