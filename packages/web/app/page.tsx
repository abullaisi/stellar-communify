'use client';

import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useReducedMotion, type MotionValue } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Play, Wallet, Coins, ShieldCheck, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/services/api/client';
import { useWallet } from '@/providers/wallet-provider';
import { ScrollProgress } from '@/components/ui/scroll-progress';

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/* ============================================================================
  LANDING PAGE — Aureus (21st Design)
  Premium Web3 creator platform with kinetic typography, parallax, and luxury UX.
  Uses SPLIT v4 tokens from globals.css + Framer Motion for animations.
============================================================================ */

// Logo component — Komunify mark (overlapping circles for community + subscription)
function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" className="shrink-0" fill="none">
      {/* Left circle (creator) */}
      <circle cx="11" cy="16" r="8" stroke="currentColor" strokeWidth="2" />
      {/* Right circle (subscriber) */}
      <circle cx="21" cy="16" r="8" stroke="currentColor" strokeWidth="2" />
      {/* Center dot (connection/payment) */}
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </svg>
  );
}

// Header with nav
function Header() {
  const { isConnected, address, connecting, error, connect, disconnect } = useWallet();

  return (
    <header className="relative z-20 max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 pt-7">
      <div className="flex items-center gap-3">
        <div className="text-[var(--color-content-accent)]">
          <Logo />
        </div>
        <span className="font-serif text-lg tracking-[0.15em] text-[var(--color-content-primary)]">KOMUNIFY</span>
      </div>

      <nav className="hidden md:flex items-center gap-10 text-[13px] tracking-wide text-[var(--color-content-secondary)] font-mono">
        <a href="#how" className="hover:text-[var(--color-content-accent)] transition-colors">
          Packages
        </a>
        <a href="#faq" className="hover:text-[var(--color-content-accent)] transition-colors">
          Communities
        </a>
      </nav>

      <div className="hidden md:flex items-center gap-3">
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-mono tracking-wide text-[var(--color-content-secondary)] hover:text-[var(--color-content-accent)] transition-colors"
        >
          Get wallet
        </a>

        {isConnected && address ? (
          <button
            type="button"
            onClick={disconnect}
            title="Disconnect"
            className="inline-flex items-center gap-2 border border-solid border-[var(--color-content-accent)]/40 bg-transparent text-[var(--color-content-accent)] text-[13px] font-mono px-4 py-2 rounded-full hover:bg-[var(--color-content-accent)]/10 transition-colors"
          >
            {truncateAddress(address)}
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)]"></span>
          </button>
        ) : (
          <button
            type="button"
            onClick={connect}
            disabled={connecting}
            title={error ?? undefined}
            className="inline-flex items-center gap-2 border border-solid border-[var(--color-content-accent)]/40 bg-transparent text-[var(--color-content-accent)] text-[13px] font-mono px-4 py-2 rounded-full hover:bg-[var(--color-content-accent)]/10 transition-colors disabled:opacity-60"
          >
            {connecting ? 'Connecting…' : error ? 'Retry connect' : 'Connect'}
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)] animate-pulse"></span>
          </button>
        )}
      </div>
    </header>
  );
}

// Kinetic text word
function KineticWord({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
      transition={{ delay, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}

// Parallax layer component
function ParallaxLayer({ children, depth = 20, className = '' }: any) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      const x = dx * depth * -1;
      const y = dy * depth * -1;
      ref.current.style.transform = `translate(${x}px, ${y}px)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [depth]);

  return (
    <div ref={ref} className={`transition-transform duration-[250ms] ${className}`}>
      {children}
    </div>
  );
}

interface LiveStatsFixture {
  activeCreators: number;
  totalSubscriptions: number;
  totalRevenue: number;
}

// Live stats from API
function LiveStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async (): Promise<LiveStatsFixture> => {
      try {
        const response = await ApiClient.get<LiveStatsFixture>('/stats');
        if (!response.data) throw new Error('No stats data');
        return response.data;
      } catch {
        // Fallback fixture data
        return {
          activeCreators: 12,
          totalSubscriptions: 248,
          totalRevenue: 12450.5,
        };
      }
    },
    refetchInterval: 30000,
  });

  const creators = stats?.activeCreators || 0;
  const subscriptions = stats?.totalSubscriptions || 0;
  const revenue = stats?.totalRevenue || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.95, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
      className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-center border-t border-[var(--color-content-primary)]/10 pt-8"
    >
      <div>
        <p className="font-serif text-2xl text-[var(--color-content-accent)]">{isLoading ? '-' : creators}+</p>
        <p className="font-mono text-[11px] tracking-widest text-[var(--color-content-primary)]/45 mt-1">PARTNERS</p>
      </div>
      <div>
        <p className="font-serif text-2xl text-[var(--color-content-accent)]">{isLoading ? '-' : subscriptions}+</p>
        <p className="font-mono text-[11px] tracking-widest text-[var(--color-content-primary)]/45 mt-1">MEMBERS</p>
      </div>
      <div>
        <p className="font-serif text-2xl text-[var(--color-content-accent)]">${isLoading ? '-' : (revenue / 1000).toFixed(1)}k+</p>
        <p className="font-mono text-[11px] tracking-widest text-[var(--color-content-primary)]/45 mt-1">PROCESSED ON-CHAIN</p>
      </div>
    </motion.div>
  );
}

/* Orbital emblem — the hero signature object.
   A tilted planetary-ring system: subscription "coins" travel elliptical orbits
   into a glass-gold medallion carrying the Komunify mark. Pure SVG, transform-only
   motion (GPU-safe), theme-agnostic gold on the OLED background. `uid` keeps the
   gradient/filter/path ids unique so multiple instances don't collide. */
function OrbitalEmblem({ uid, faint = false }: { uid: string; faint?: boolean }) {
  const reduce = useReducedMotion();
  const spin = reduce ? {} : { rotate: 360 };

  // Elliptical orbit paths (local space of the tilt group). Coins ride these via animateMotion.
  const orbitOuter = 'M 20,130 a 110,42 0 1,0 220,0 a 110,42 0 1,0 -220,0';
  const orbitMid = 'M 48,130 a 82,31 0 1,0 164,0 a 82,31 0 1,0 -164,0';
  const orbitInner = 'M 76,130 a 54,20 0 1,0 108,0 a 54,20 0 1,0 -108,0';

  return (
    <svg viewBox="0 0 260 260" fill="none" className="w-full h-full overflow-visible">
      <defs>
        <radialGradient id={`medal-${uid}`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fbe7bf" />
          <stop offset="42%" stopColor="#e5a84a" />
          <stop offset="100%" stopColor="#8f6524" />
        </radialGradient>
        <linearGradient id={`ring-${uid}`} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#f3d9a8" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#e5a84a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#a97a34" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id={`core-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e5a84a" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#e5a84a" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#e5a84a" stopOpacity="0" />
        </radialGradient>
        <filter id={`glow-${uid}`} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <path id={`pO-${uid}`} d={orbitOuter} />
        <path id={`pM-${uid}`} d={orbitMid} />
        <path id={`pI-${uid}`} d={orbitInner} />
      </defs>

      {/* Soft focal glow behind the medallion */}
      <circle cx="130" cy="130" r="70" fill={`url(#core-${uid})`} />

      {/* Tilted orbital system */}
      <g transform="rotate(-22 130 130)" opacity={faint ? 0.7 : 1}>
        <ellipse cx="130" cy="130" rx="110" ry="42" stroke={`url(#ring-${uid})`} strokeWidth="1" opacity="0.55" />
        <ellipse cx="130" cy="130" rx="82" ry="31" stroke={`url(#ring-${uid})`} strokeWidth="1" opacity="0.5" />
        <ellipse
          cx="130"
          cy="130"
          rx="54"
          ry="20"
          stroke="#e5a84a"
          strokeWidth="0.75"
          strokeDasharray="2 5"
          opacity="0.4"
        />

        {/* Traveling subscription coins */}
        <circle r="3.6" fill="#f2cd8f" filter={`url(#glow-${uid})`}>
          {!reduce && (
            <animateMotion dur="26s" repeatCount="indefinite" rotate="auto">
              <mpath href={`#pO-${uid}`} />
            </animateMotion>
          )}
        </circle>
        <circle r="2.8" fill="#e5a84a" filter={`url(#glow-${uid})`}>
          {!reduce && (
            <animateMotion dur="18s" begin="-6s" repeatCount="indefinite">
              <mpath href={`#pM-${uid}`} />
            </animateMotion>
          )}
        </circle>
        <circle r="2.2" fill="#f3d9a8" filter={`url(#glow-${uid})`}>
          {!reduce && (
            <animateMotion dur="13s" begin="-3s" repeatCount="indefinite">
              <mpath href={`#pI-${uid}`} />
            </animateMotion>
          )}
        </circle>
      </g>

      {/* Upright tick ring — slow rotation adds life without touching layout */}
      <motion.g
        style={{ originX: '130px', originY: '130px' }}
        animate={spin}
        transition={reduce ? undefined : { duration: 60, ease: 'linear', repeat: Infinity }}
        opacity="0.5"
      >
        <circle cx="130" cy="130" r="36" stroke="#e5a84a" strokeWidth="0.75" strokeOpacity="0.35" />
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="130"
            y1="96"
            x2="130"
            y2={i % 6 === 0 ? 90 : 93}
            stroke="#e5a84a"
            strokeWidth="0.75"
            strokeOpacity={i % 6 === 0 ? 0.6 : 0.28}
            transform={`rotate(${i * 15} 130 130)`}
          />
        ))}
      </motion.g>

      {/* Glass medallion */}
      <g filter={`url(#glow-${uid})`}>
        <circle cx="130" cy="130" r="27" fill={`url(#medal-${uid})`} stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1" />
        {/* Inset top highlight */}
        <path d="M 108,120 A 27 27 0 0 1 152,120" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
        {/* Komunify mark */}
        <g stroke="#4a3413" strokeWidth="2" fill="none">
          <circle cx="124" cy="130" r="8" />
          <circle cx="136" cy="130" r="8" />
        </g>
        <circle cx="130" cy="130" r="2.6" fill="#4a3413" />
      </g>
    </svg>
  );
}

// Hero section
function HeroSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const glow = document.querySelector<HTMLElement>('.glow-heading');
      if (glow) {
        glow.style.transform = `translate(-50%, ${window.scrollY * 0.15}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={scrollRef} className="relative min-h-screen overflow-hidden">
      {/* Ambient glow */}
      <div className="glow-heading fixed top-[-10%] left-1/2 -translate-x-1/2 w-[70rem] h-[70rem] rounded-full pointer-events-none z-0 blur-[30px] bg-[radial-gradient(closest-side,rgba(229,168,74,0.28),transparent_70%)]" />

      {/* Signature orbital emblem — floats top-left, gently bobbing */}
      <ParallaxLayer depth={30} className="hidden md:block absolute top-8 -left-10 lg:left-2 w-56 h-56 lg:w-72 lg:h-72 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.2, duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
          className="w-full h-full"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 9, ease: 'easeInOut', repeat: Infinity }}
            className="w-full h-full"
          >
            <OrbitalEmblem uid="hero" />
          </motion.div>
        </motion.div>
      </ParallaxLayer>

      {/* Quiet echo — balances the composition bottom-right, same visual DNA */}
      <ParallaxLayer depth={50} className="hidden lg:block absolute bottom-2 right-[3%] w-40 h-40 opacity-45 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
          className="w-full h-full"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 11, ease: 'easeInOut', repeat: Infinity }}
            className="w-full h-full"
          >
            <OrbitalEmblem uid="echo" faint />
          </motion.div>
        </motion.div>
      </ParallaxLayer>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-14 md:pt-16 pb-24">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 border border-[var(--color-content-accent)]/35 rounded-full pl-3 pr-4 py-1.5 bg-[var(--color-content-accent)]/[0.06] font-mono text-[12px] tracking-wide text-[var(--color-content-accent)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)] animate-pulse" />
            Revenue verified on-chain • Instant payouts
          </div>
        </motion.div>

        {/* Heading */}
        <h1 className="mt-8 text-center font-serif font-medium tracking-tight leading-[1.02] text-[11vw] md:text-[5.2rem] lg:text-[5.8rem] text-[var(--color-content-primary)]">
          <span className="block overflow-hidden">
            <KineticWord delay={0.15}>One</KineticWord>
            <span className="ml-3">
              <KineticWord delay={0.25}>subscription</KineticWord>
            </span>
          </span>
          <span className="block overflow-hidden mt-1 md:mt-2">
            <KineticWord delay={0.35}>for</KineticWord>
            <span className="ml-3">
              <KineticWord delay={0.45}>
                <span className="bg-gradient-to-r from-[#f3d9a8] via-[#e5a84a] to-[#a97a34] bg-clip-text text-transparent">
                  multiple
                </span>
              </KineticWord>
            </span>
            <span className="ml-3">
              <KineticWord delay={0.55}>
                <span className="bg-gradient-to-r from-[#f3d9a8] via-[#e5a84a] to-[#a97a34] bg-clip-text text-transparent">
                  community perks.
                </span>
              </KineticWord>
            </span>
          </span>
        </h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="mt-8 max-w-xl mx-auto text-center text-[15px] md:text-[16px] leading-relaxed text-[var(--color-content-secondary)]"
        >
          Komunify helps members unlock premium access, discounts, and exclusive offers across community
          partners with a single on-chain subscription.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.78, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/dashboard">
            <button className="bg-gradient-to-br from-[#f2cd8f] via-[#e5a84a] to-[#b9852f] text-[var(--color-content-on-accent)] font-semibold text-[14px] tracking-wide px-7 py-3.5 rounded-full transition-all hover:shadow-[0_10px_40px_-6px_rgba(229,168,74,0.75)] hover:translate-y-[-1px] shadow-[0_8px_30px_-8px_rgba(229,168,74,0.55)]">
              Get early access
            </button>
          </Link>
          <Link href="/start">
            <motion.button
              type="button"
              whileHover={{ gap: '12px' }}
              className="group inline-flex items-center gap-2 border border-solid border-[var(--color-content-primary)]/25 bg-transparent text-[var(--color-content-primary)] text-[14px] tracking-wide px-7 py-3.5 rounded-full hover:border-[var(--color-content-accent)]/60 hover:text-[var(--color-content-accent)] transition-colors"
            >
              Become a partner
              <motion.span className="translate-x-0 group-hover:translate-x-1 transition-transform">→</motion.span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Video player */}
        <motion.div
          id="demo"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="mt-16 md:mt-20 relative max-w-4xl mx-auto scroll-mt-24"
        >
          <ParallaxLayer depth={12} className="p-[1.5px] rounded-[26px] bg-gradient-to-br from-[rgba(229,168,74,0.5)] to-[rgba(229,168,74,0.05)] via-[rgba(229,168,74,0.35)]">
            <div className="relative rounded-[24px] overflow-hidden bg-[#111110] aspect-video">
              {/* Backdrop texture */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(229,168,74,0.12),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(229,168,74,0.08),transparent_50%)]" />
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #e5a84a 1px, transparent 1px), linear-gradient(to bottom, #e5a84a 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              {/* Scanline */}
              <div className="scanline absolute left-0 right-0 h-1/3 bg-gradient-to-b from-transparent via-[rgba(229,168,74,0.16)] to-transparent animate-[scan_5s_linear_infinite]" />

              {/* Corner tags */}
              <div className="absolute top-4 right-4 font-mono text-[10px] tracking-widest text-[var(--color-content-accent)]/80 border border-[var(--color-content-accent)]/30 rounded px-2 py-1 bg-black/30">
                LIVE DEMO
              </div>
              <div className="absolute top-4 left-4 font-mono text-[10px] tracking-widest text-[var(--color-content-primary)]/50 border border-[var(--color-content-primary)]/15 rounded px-2 py-1 bg-black/30">
                HOW IT WORKS
              </div>

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center group"
                >
                  <motion.span
                    animate={{ scale: [1, 1.85], opacity: [0.55, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border border-[var(--color-content-accent)]/50"
                  />
                  <span className="absolute inset-0 rounded-full border border-[var(--color-content-accent)]/30" />
                  <span className="relative w-full h-full rounded-full bg-gradient-to-br from-[#f2cd8f] via-[#e5a84a] to-[#b9852f] flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_8px_30px_-8px_rgba(229,168,74,0.55)]">
                    <Play size={22} className="text-[var(--color-content-on-accent)] fill-current" />
                  </span>
                </motion.button>
              </div>

              {/* Bottom bar */}
              <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-center gap-4">
                <span className="font-mono text-[11px] text-[var(--color-content-primary)]/60">00:00 / 02:14</span>
                <div className="flex-1 h-[2px] bg-[var(--color-content-primary)]/15 rounded-full overflow-hidden">
                  <div className="h-full w-[8%] bg-[var(--color-content-accent)]" />
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" className="text-[var(--color-content-primary)]/60 fill-current">
                  <path d="M14 3.23v2.06c3.39.49 6 3.39 6 6.71s-2.61 6.22-6 6.71v2.06c4.49-.55 8-4.44 8-8.77s-3.51-8.22-8-8.77zM16.5 12c0-1.77-1-3.29-2.5-4.03v8.06c1.5-.74 2.5-2.26 2.5-4.03zM3 9v6h4l5 5V4L7 9H3z" />
                </svg>
              </div>
            </div>
          </ParallaxLayer>
        </motion.div>

        {/* Stats row — live from API */}
        <LiveStats />

      </main>
    </section>
  );
}

// How it works — editorial split: sticky heading left, connected step cascade right
const STEPS = [
  {
    icon: Wallet,
    title: 'Connect your wallet',
    body: 'Connect any Stellar-based wallet. You can use a Freighter wallet — no email, no password, nothing to remember.',
  },
  {
    icon: Coins,
    title: 'Pay for a package',
    body: 'Pay for your preferred package using USDC on the Stellar testnet. One payment, no per-partner checkout.',
  },
  {
    icon: ShieldCheck,
    title: 'Unlock every perk',
    body: 'Get premium access, discounted products, learning resources, and digital assets across multiple community partners.',
  },
];

const EASE = [0.19, 1, 0.22, 1] as const;

function StepCard({
  step,
  index,
  total,
  progress,
}: {
  step: (typeof STEPS)[number];
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const Icon = step.icon;

  // Activation band: this step lights up as the scroll-driven fill reaches it.
  const start = index / total;
  const end = (index + 0.85) / total;
  const active = useTransform(progress, [start, end], [0, 1], { clamp: true });

  // Solid-accent fill fades in (mirrors the .stepper "done" node in the design system).
  const iconScale = useTransform(active, [0, 1], [1, 1.08]);
  const iconColor = useTransform(active, [0, 1], ['#e5a84a', '#201607']); // accent → on-accent
  const numOpacity = useTransform(active, [0, 1], [0.5, 1]);
  const borderColor = useTransform(active, [0, 1], ['#262521', 'rgba(229,168,74,0.4)']);
  const ghostY = useTransform(progress, [start, end], [18, -18]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.08, duration: 0.8, ease: EASE }}
      className="relative"
    >
      {/* Double-bezel: outer machined shell */}
      <div className="group p-1.5 rounded-[2rem] bg-[var(--color-content-accent)]/[0.04] ring-1 ring-[rgba(229,168,74,0.1)] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] hover:ring-[rgba(229,168,74,0.3)] hover:bg-[var(--color-content-accent)]/[0.07]">
        {/* Inner core — border color tracks scroll activation */}
        <motion.div
          style={{ borderColor }}
          className="relative rounded-[calc(2rem-0.375rem)] bg-[var(--color-bg-elevated)] border px-6 py-6 md:px-7 md:py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] overflow-hidden"
        >
          {/* Ghost step number — drifts as the section scrolls */}
          <motion.span
            style={{ y: ghostY }}
            className="pointer-events-none absolute -top-4 right-3 font-serif text-[5.5rem] leading-none text-[var(--color-content-accent)]/[0.06] select-none"
          >
            {index + 1}
          </motion.span>

          <div className="relative flex items-start gap-4">
            {/* Icon tile — fills solid accent as the step activates */}
            <motion.span
              style={{ scale: iconScale }}
              className="relative shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-bg-accent-tint)] ring-1 ring-[var(--color-content-accent)]/15 overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105"
            >
              <motion.span
                style={{ opacity: active }}
                className="absolute inset-0 bg-[var(--color-content-accent)]"
              />
              <motion.span style={{ color: iconColor }} className="relative">
                <Icon size={20} strokeWidth={1.4} />
              </motion.span>
            </motion.span>

            <div className="pt-0.5">
              <div className="flex items-center gap-3">
                <motion.span
                  style={{ opacity: numOpacity }}
                  className="font-mono text-[11px] tracking-[0.2em] text-[var(--color-content-accent)]"
                >
                  0{index + 1}
                </motion.span>
                <h3 className="font-serif text-[1.35rem] leading-tight text-[var(--color-content-primary)]">
                  {step.title}
                </h3>
              </div>
              <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--color-content-secondary)] max-w-md">
                {step.body}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function HowItWorks() {
  const cascadeRef = useRef<HTMLDivElement>(null);
  // Drive progress off the window scroll event (fires for Lenis, native, and
  // programmatic scroll alike — more reliable under Lenis than framer's
  // useScroll). 0 when the cascade top hits 75% of the viewport, 1 when its
  // bottom passes 65%.
  const raw = useMotionValue(0);
  useEffect(() => {
    const update = () => {
      const el = cascadeRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (0.75 * vh - rect.top) / (0.1 * vh + rect.height);
      raw.set(Math.min(1, Math.max(0, p)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [raw]);
  // Smooth the raw progress so the connector fill glides instead of tracking 1:1.
  const fill = useSpring(raw, { stiffness: 90, damping: 30, restDelta: 0.001 });

  return (
    <section id="how" className="relative overflow-hidden py-28 md:py-40 scroll-mt-8">
      {/* Ambient side glow */}
      <div className="pointer-events-none absolute top-1/3 -left-40 w-[40rem] h-[40rem] rounded-full blur-[120px] bg-[radial-gradient(closest-side,rgba(229,168,74,0.10),transparent_70%)]" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-14 lg:gap-20">
        {/* Left — sticky editorial heading */}
        <div className="lg:sticky lg:top-24 self-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="inline-flex items-center gap-2 border border-[var(--color-content-accent)]/35 rounded-full pl-3 pr-4 py-1.5 bg-[var(--color-content-accent)]/[0.06] font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--color-content-accent)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)]" />
              How it works
            </div>

            <h2 className="mt-7 font-serif font-medium tracking-tight leading-[1.05] text-[2.6rem] md:text-[3.4rem] text-[var(--color-content-primary)]">
              One subscription,
              <br />
              every{' '}
              <span className="bg-gradient-to-r from-[#f3d9a8] via-[#e5a84a] to-[#a97a34] bg-clip-text text-transparent">
                partner perk.
              </span>
            </h2>

            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[var(--color-content-secondary)]">
              Komunify brings those pieces into one place: single subscription, multiple partner benefits,
              discounted products, and automatic revenue distribution powered by Stellar and Soroban smart
              contracts.
            </p>

            <Link href="/dashboard" className="inline-block mt-9">
              <button className="group inline-flex items-center gap-3 bg-gradient-to-br from-[#f2cd8f] via-[#e5a84a] to-[#b9852f] text-[var(--color-content-on-accent)] font-semibold text-[14px] tracking-wide pl-6 pr-2 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] hover:shadow-[0_10px_40px_-6px_rgba(229,168,74,0.75)] active:scale-[0.98] shadow-[0_8px_30px_-8px_rgba(229,168,74,0.55)]">
                Start now
                <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                  →
                </span>
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Right — connected step cascade */}
        <div ref={cascadeRef} className="relative">
          {/* Connector — dim rail with a scroll-driven gold fill on top */}
          <div className="pointer-events-none absolute left-[2.85rem] top-6 bottom-6 w-px bg-[var(--color-border-medium)] hidden md:block" />
          <motion.div
            style={{ scaleY: fill, transformOrigin: 'top' }}
            className="pointer-events-none absolute left-[2.85rem] top-6 bottom-6 w-px bg-gradient-to-b from-[var(--color-content-accent)] to-[var(--color-content-accent)]/40 hidden md:block"
          />
          <div className="flex flex-col gap-6">
            {STEPS.map((step, i) => (
              <StepCard
                key={step.title}
                step={step}
                index={i}
                total={STEPS.length}
                progress={fill}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// FAQ — accordion of common questions
const FAQ_ITEMS = [
  {
    question: 'What is Komunify?',
    answer:
      'Komunify is a Web3 platform that gives members access to benefits from multiple partner communities through a single subscription. It also helps community managers and project owners monetize resources, automate revenue sharing, and track growth on-chain.',
  },
  {
    question: 'What can be sold on Komunify?',
    answer:
      'The platform is designed for tokenized digital products, learning resources, and selected tokenized RWAs made available by partner communities. Subscriber-only pricing and community-specific offers are part of the intended value proposition.',
  },
  {
    question: 'How are payments and revenue shares handled?',
    answer:
      'Komunify uses smart contracts to split and distribute subscription revenue and marketplace fees automatically between the platform, community managers, and project owners. This reduces manual reconciliation and makes the process more transparent.',
  },
  {
    question: 'Why is Komunify better?',
    answer:
      'A single subscription reduces cost, friction, and membership overload for users who want benefits across several communities. It also makes discovery easier by bundling value into one clearer offer.',
  },
];

function FAQItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: (typeof FAQ_ITEMS)[number];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.06, duration: 0.8, ease: EASE }}
      className="group"
    >
      {/* Double-bezel: outer machined shell */}
      <div
        className={`p-1.5 rounded-[1.75rem] ring-1 transition-colors duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          isOpen
            ? 'bg-[var(--color-content-accent)]/[0.07] ring-[rgba(229,168,74,0.3)]'
            : 'bg-[var(--color-content-accent)]/[0.03] ring-[rgba(229,168,74,0.1)] hover:ring-[rgba(229,168,74,0.2)]'
        }`}
      >
        {/* Inner core */}
        <div className="relative rounded-[calc(1.75rem-0.375rem)] bg-[var(--color-bg-elevated)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] overflow-hidden">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className="w-full flex items-center justify-between gap-6 px-6 py-5 md:px-7 md:py-6 text-left bg-transparent border-none rounded-none"
          >
            <span className="font-serif text-[1.05rem] md:text-[1.2rem] leading-snug text-[var(--color-content-primary)]">
              {item.question}
            </span>
            <span
              className={`relative shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full ring-1 transition-colors duration-500 ${
                isOpen
                  ? 'bg-[var(--color-content-accent)] ring-[var(--color-content-accent)]/40'
                  : 'bg-[var(--color-bg-accent-tint)] ring-[var(--color-content-accent)]/15'
              }`}
            >
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className={isOpen ? 'text-[var(--color-content-on-accent)]' : 'text-[var(--color-content-accent)]'}
              >
                <ChevronDown size={16} strokeWidth={1.5} />
              </motion.span>
            </span>
          </button>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="overflow-hidden"
              >
                <p className="px-6 md:px-7 pb-6 max-w-2xl text-[14px] leading-relaxed text-[var(--color-content-secondary)]">
                  {item.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 md:py-40 scroll-mt-24 overflow-hidden">
      {/* Ambient side glow — mirrors the How-it-works section's atmosphere */}
      <div className="pointer-events-none absolute top-1/4 -right-40 w-[40rem] h-[40rem] rounded-full blur-[120px] bg-[radial-gradient(closest-side,rgba(229,168,74,0.08),transparent_70%)]" />

      <div className="relative max-w-3xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 border border-[var(--color-content-accent)]/35 rounded-full pl-3 pr-4 py-1.5 bg-[var(--color-content-accent)]/[0.06] font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--color-content-accent)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)]" />
            FAQ
          </div>
          <h2 className="mt-7 font-serif font-medium tracking-tight leading-[1.05] text-[2.2rem] md:text-[2.8rem] text-[var(--color-content-primary)]">
            Questions, answered.
          </h2>
        </motion.div>

        <div className="mt-12 flex flex-col gap-4">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem
              key={item.question}
              item={item}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-medium)] py-12 px-6 sm:px-12 bg-[var(--color-bg-elevated)]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-[var(--color-content-secondary)] text-sm text-center sm:text-left">
          © 2026 Komunify. Built on{' '}
          <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-[var(--color-content-accent)] hover:underline">
            Stellar
          </a>
        </div>
        <div className="flex gap-6 text-sm text-[var(--color-content-secondary)]">
          <a href="https://github.com/komunify" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-content-accent)] transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-[var(--color-content-accent)] transition-colors">
            Documentation
          </a>
          <a href="/dashboard" className="hover:text-[var(--color-content-accent)] transition-colors">
            App
          </a>
        </div>
      </div>
    </footer>
  );
}

// Main page
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Header />
      <HeroSection />
      <HowItWorks />
      <FAQSection />
      <Footer />
      <ScrollProgress />
    </div>
  );
}
