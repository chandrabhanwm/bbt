import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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
 * big full-screen MilestoneOverlay.
 *
 * Renders via a portal into document.body, NOT as a child of whatever
 * called it. This is a real fix, not a style choice: a card small
 * enough to hold a scratch-card reveal or an upgrade badge almost
 * always has `overflow-hidden` on it (needed to keep its own rounded
 * corners and inner image clipped correctly), which was silently
 * clipping every particle the instant it moved past the card's own
 * tiny bounds — the effect was technically running, just invisible in
 * practice. Portaling to the body and sizing the stage several times
 * larger than the anchoring element itself is what actually lets
 * particles travel far enough to read as a real burst rather than a
 * few pixels flickering inside a clipped box.
 */
export const ParticleBurst: React.FC<{
  /** The element to center the burst on — its real screen position via
   *  getBoundingClientRect() becomes the stage's anchor point. */
  anchorRef: React.RefObject<HTMLElement>;
  accentHex: string;
  count?: number;
  /** How many times larger than the anchor element the burst stage
   *  should be — this is what actually gives particles room to travel
   *  once they're no longer confined by the card's own clipping. */
  stageMultiplier?: number;
}> = ({ anchorRef, accentHex, count = 40, stageMultiplier = 3.2 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = [accentHex, '#FFD700', '#40E0D0', '#FF6B6B', '#4ADE80', '#60A5FA'];

  useEffect(() => {
    const anchor = anchorRef.current;
    const canvas = canvasRef.current;
    if (!anchor || !canvas) return;
    const rect = anchor.getBoundingClientRect();
    const stageW = rect.width * stageMultiplier;
    const stageH = rect.height * stageMultiplier;
    const left = rect.left + rect.width / 2 - stageW / 2;
    const top = rect.top + rect.height / 2 - stageH / 2;

    canvas.style.left = `${left}px`;
    canvas.style.top = `${top}px`;
    canvas.style.width = `${stageW}px`;
    canvas.style.height = `${stageH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = stageW * dpr;
    canvas.height = stageH * dpr;
    ctx.scale(dpr, dpr);

    // Scale physics off the anchor's own real size, not the inflated
    // stage — a burst originating from a 110px card should still feel
    // proportioned to that card, just with room to actually travel.
    const scale = Math.min(1.4, Math.max(0.5, Math.min(rect.width, rect.height) / 140));

    const particles: Particle[] = [];
    const centerX = stageW / 2;
    const centerY = stageH / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (3 + Math.random() * 8) * scale;
      particles.push({
        x: centerX, y: centerY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3 * scale,
        rotation: Math.random() * 360, vRotation: (Math.random() - 0.5) * 20,
        size: (5 + Math.random() * 7) * scale,
        color: colors[i % colors.length],
        shape: (['square', 'circle', 'star'] as const)[i % 3],
        life: 0, maxLife: 55 + Math.random() * 35,
      });
    }

    let raf: number;
    const gravity = 0.35 * scale;
    function tick() {
      ctx!.clearRect(0, 0, stageW, stageH);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <canvas ref={canvasRef} style={{ position: 'fixed', pointerEvents: 'none', zIndex: 300 }} />,
    document.body
  );
};

