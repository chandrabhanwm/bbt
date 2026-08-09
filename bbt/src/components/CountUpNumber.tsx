import React, { useEffect, useState, useRef } from 'react';

/** Animates a number counting up from 0 (or from a given start) to its
 *  final value over a short duration, rather than the value just
 *  appearing instantly. This is the specific technique behind the
 *  "satisfying number tick" in Coin Master / Monopoly GO-style
 *  celebration moments — the eye tracks the number climbing, which
 *  reads as far more rewarding than a static jump straight to the
 *  final figure, even though the end state is identical either way.
 *  Uses requestAnimationFrame directly rather than a spring/tween
 *  library, since a monotonic, ease-out count is a simpler and more
 *  predictable curve for "climbing toward a number" than a physical
 *  spring would give. */
export function useCountUp(targetValue: number, durationMs: number = 900, startValue: number = 0): number {
  const [display, setDisplay] = useState(startValue);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / durationMs);
      // Ease-out cubic — fast at first, settling in gently at the end,
      // rather than a linear climb that feels mechanical.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(startValue + (targetValue - startValue) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue]);

  return display;
}

export const CountUpNumber: React.FC<{ value: number; durationMs?: number; format?: (n: number) => string }> = ({
  value, durationMs = 900, format = (n) => n.toLocaleString('en-IN'),
}) => {
  const displayed = useCountUp(value, durationMs);
  return <>{format(displayed)}</>;
};
