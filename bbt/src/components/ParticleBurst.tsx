import React, { useEffect, useRef } from 'react';

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

/**
 * Real canvas particle burst — gravity, per-particle rotation,
 * deceleration, three distinct shapes — the same technique used in the
 * big full-screen MilestoneOverlay, extracted here so smaller, in-place
 * moments (a scratch card reveal, a routine business upgrade) can use
 * genuinely richer particles too, not just the full-screen takeovers.
 * Deliberately size-flexible: pass the dimensions of whatever container
 * it's sitting inside — a 100px card or a 400px screen both work, since
 * particle count and physics scale with the box rather than assuming a
 * full viewport.
 */
export const ParticleBurst: React.FC<{
  width: number;
  height: number;
  accentHex: string;
  /** Roughly how many particles to spawn — smaller containers (a card)
   *  should use fewer than a full-screen celebration would, so the
   *  burst doesn't look like it's overflowing a small space. */
  count?: number;
  /** 0-1, where along the container's height the burst originates —
   *  0.32 (upper third) suits a big screen with text below; 0.5
   *  (dead center) suits a small, self-contained card. */
  originY?: number;
}> = ({ width, height, accentHex, count = 90, originY = 0.32 }) => {
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

    // Particle size and speed scale down for small containers — a
    // burst sized for a full screen would look absurdly oversized
    // inside a 100px card.
    const scale = Math.min(1, Math.max(0.35, Math.min(width, height) / 300));

    const particles: Particle[] = [];
    const centerX = width / 2;
    const centerY = height * originY;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (3 + Math.random() * 8) * scale;
      particles.push({
        x: centerX, y: centerY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3 * scale,
        rotation: Math.random() * 360, vRotation: (Math.random() - 0.5) * 20,
        size: (4 + Math.random() * 6) * scale,
        color: colors[i % colors.length],
        shape: (['square', 'circle', 'star'] as const)[i % 3],
        life: 0, maxLife: 60 + Math.random() * 40,
      });
    }

    let raf: number;
    const gravity = 0.35 * scale;
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
  }, [width, height, accentHex, count, originY]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width, height, pointerEvents: 'none', zIndex: 5 }} />;
};
