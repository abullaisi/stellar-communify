'use client';

import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';

/* ============================================================================
  SCROLL PROGRESS — top hairline, Aureus-gold
  A 2px gradient line pinned to the top of the viewport that fills left→right
  as the page scrolls. Always visible (reads 0 at the top). Driven off the
  scroll event so it stays in lockstep with Lenis, native, and programmatic
  scrolling alike; smoothed with a spring so the fill glides. A soft leading
  glow rides the fill's edge. Reduced-motion users get the fill without spring.
============================================================================ */

export function ScrollProgress() {
  const reduce = useReducedMotion();

  // 0 → 1 across the whole document.
  const raw = useMotionValue(0);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      raw.set(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [raw]);

  const progress = useSpring(raw, reduce ? { duration: 0 } : { stiffness: 140, damping: 30, restDelta: 0.0005 });

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]"
    >
      {/* Faint track so the bar has a home even at 0% */}
      <div className="absolute inset-0 bg-[var(--color-content-accent)]/8" />

      {/* Gold gradient fill */}
      <motion.div
        style={{ scaleX: progress, transformOrigin: 'left' }}
        className="absolute inset-0 origin-left bg-gradient-to-r from-[#a97a34] via-[#e5a84a] to-[#f3d9a8] shadow-[0_0_10px_rgba(229,168,74,0.6)]"
      >
        {/* Leading-edge glow bloom */}
        <span className="absolute right-0 top-1/2 -translate-y-1/2 h-[6px] w-[6px] rounded-full bg-[#f3d9a8] shadow-[0_0_12px_4px_rgba(229,168,74,0.7)]" />
      </motion.div>
    </div>
  );
}
