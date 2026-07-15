'use client';

import { animate, motion, AnimatePresence, useInView, useMotionValue, useTransform, useSpring, useReducedMotion, useScroll, type MotionValue } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Wallet, Coins, ShieldCheck, ChevronDown, Crown, BadgePercent, BookOpen, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/services/api/client';
import { useWallet } from '@/providers/wallet-provider';

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/* ============================================================================
  LANDING PAGE, Aureus (21st Design)
  Premium Web3 creator platform with kinetic typography, parallax, and luxury UX.
  Uses SPLIT v4 tokens from globals.css + Framer Motion for animations.
============================================================================ */

// Logo component
function Logo() {
  return <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo-mark.png`} alt="Komunify" className="h-8 w-auto shrink-0" />;
}

// Header with nav
function Header() {
  const { isConnected, address, connecting, error, connect, disconnect } = useWallet();

  return (
    <header className="relative z-20 max-w-7xl mx-auto px-6 md:px-10 pt-6">
      <div className="flex items-center justify-between nav-shell backdrop-blur-md px-5 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="text-[var(--color-content-accent)]">
            <Logo />
          </div>
          <span className="font-serif text-lg tracking-[0.15em] text-[var(--color-content-primary)]">KOMUNIFY</span>
        </div>

        <nav className="hidden md:flex items-center gap-10 text-[13px] tracking-wide text-[var(--color-content-secondary)]">
          <a href="#how" className="hover:text-[var(--color-content-accent)] transition-colors">
            Packages
          </a>
          <a href="#communities" className="hover:text-[var(--color-content-accent)] transition-colors">
            Communities
          </a>
          <a
            href="https://github.com/yoms07/stellar-hackathon"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-content-accent)] transition-colors"
          >
            Github
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] tracking-wide text-[var(--color-content-secondary)] hover:text-[var(--color-content-accent)] transition-colors"
          >
            Get wallet
          </a>

          {isConnected && address ? (
            <button
              type="button"
              onClick={disconnect}
              title="Disconnect"
              className="inline-flex items-center gap-2 border border-solid border-[color-mix(in_srgb,var(--color-content-accent)_40%,transparent)] bg-transparent text-[var(--color-content-accent)] text-[13px] font-mono px-4 py-2 rounded-full hover:bg-[color-mix(in_srgb,var(--color-content-accent)_10%,transparent)] transition-colors"
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
              className="inline-flex items-center gap-2 border border-solid border-[color-mix(in_srgb,var(--color-content-accent)_40%,transparent)] bg-transparent text-[var(--color-content-accent)] text-[13px] px-4 py-2 rounded-full hover:bg-[color-mix(in_srgb,var(--color-content-accent)_10%,transparent)] transition-colors disabled:opacity-60"
            >
              {connecting ? 'Connecting…' : error ? 'Retry connect' : 'Connect'}
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)] animate-pulse"></span>
            </button>
          )}
        </div>
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

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });
  const [formattedValue, setFormattedValue] = useState((0).toFixed(decimals));
  const latestValue = useRef(value);
  const latestDecimals = useRef(decimals);
  const hasCompleted = useRef(false);

  latestValue.current = value;
  latestDecimals.current = decimals;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hasCompleted.current = true;
      setFormattedValue(latestValue.current.toFixed(latestDecimals.current));
      return;
    }

    if (!isInView) return;

    const controls = animate(0, latestValue.current, {
      duration: 1.4,
      ease: [0.19, 1, 0.22, 1],
      onUpdate: (current) => setFormattedValue(current.toFixed(latestDecimals.current)),
      onComplete: () => {
        hasCompleted.current = true;
        setFormattedValue(latestValue.current.toFixed(latestDecimals.current));
      },
    });

    return () => controls.stop();
  }, [isInView]);

  useEffect(() => {
    if (hasCompleted.current) {
      setFormattedValue(value.toFixed(decimals));
    }
  }, [decimals, value]);

  return <span ref={ref}>{formattedValue}</span>;
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
      className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto text-center pt-8"
    >
      <div>
        <p className="font-serif text-5xl md:text-6xl text-[var(--color-bg-primary)]">{isLoading ? '-' : <CountUp value={creators} />}+</p>
        <p className="text-[13px] font-semibold tracking-widest text-[color-mix(in_srgb,var(--color-bg-primary)_85%,transparent)] mt-1.5">PARTNERS</p>
      </div>
      <div>
        <p className="font-serif text-5xl md:text-6xl text-[var(--color-bg-primary)]">{isLoading ? '-' : <CountUp value={subscriptions} />}+</p>
        <p className="text-[13px] font-semibold tracking-widest text-[color-mix(in_srgb,var(--color-bg-primary)_85%,transparent)] mt-1.5">MEMBERS</p>
      </div>
      <div>
        <p className="font-serif text-5xl md:text-6xl text-[var(--color-bg-primary)]">${isLoading ? '-' : <CountUp value={revenue / 1000} decimals={1} />}k+</p>
        <p className="text-[13px] font-semibold tracking-widest text-[color-mix(in_srgb,var(--color-bg-primary)_85%,transparent)] mt-1.5">PROCESSED ON-CHAIN</p>
      </div>
    </motion.div>
  );
}

/* Orbital emblem, the hero signature object.
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
          <stop offset="42%" stopColor="#fad657" />
          <stop offset="100%" stopColor="#8f6524" />
        </radialGradient>
        <linearGradient id={`ring-${uid}`} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#fef0bf" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#fad657" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#b08d3e" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id={`core-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fad657" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#fad657" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#fad657" stopOpacity="0" />
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
          stroke="#fad657"
          strokeWidth="0.75"
          strokeDasharray="2 5"
          opacity="0.4"
        />

        {/* Traveling subscription coins */}
        <circle r="3.6" fill="#fce27e" filter={`url(#glow-${uid})`}>
          {!reduce && (
            <animateMotion dur="26s" repeatCount="indefinite" rotate="auto">
              <mpath href={`#pO-${uid}`} />
            </animateMotion>
          )}
        </circle>
        <circle r="2.8" fill="#fad657" filter={`url(#glow-${uid})`}>
          {!reduce && (
            <animateMotion dur="18s" begin="-6s" repeatCount="indefinite">
              <mpath href={`#pM-${uid}`} />
            </animateMotion>
          )}
        </circle>
        <circle r="2.2" fill="#fef0bf" filter={`url(#glow-${uid})`}>
          {!reduce && (
            <animateMotion dur="13s" begin="-3s" repeatCount="indefinite">
              <mpath href={`#pI-${uid}`} />
            </animateMotion>
          )}
        </circle>
      </g>

      {/* Upright tick ring, slow rotation adds life without touching layout */}
      <motion.g
        style={{ originX: '130px', originY: '130px' }}
        animate={spin}
        transition={reduce ? undefined : { duration: 60, ease: 'linear', repeat: Infinity }}
        opacity="0.5"
      >
        <circle cx="130" cy="130" r="36" stroke="#fad657" strokeWidth="0.75" strokeOpacity="0.35" />
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="130"
            y1="96"
            x2="130"
            y2={i % 6 === 0 ? 90 : 93}
            stroke="#fad657"
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
        {/* Stellar symbol (black), official mark from the brand asset in public/ */}
        <image
          href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/stellar-symbol.png`}
          x="115"
          y="117.3"
          width="30"
          height="25.4"
        />
      </g>
    </svg>
  );
}

function SectionFlourish({ lines = 'both' }: { lines?: 'both' | 'upper' | 'lower' }) {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
        {(lines === 'both' || lines === 'upper') && (
          <>
            <path
              d="M -40 260 C 420 140, 760 420, 1480 300"
              fill="none"
              stroke="rgba(250,214,87,0.14)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            {!reduce && (
              <motion.path
                d="M -40 260 C 420 140, 760 420, 1480 300"
                fill="none"
                stroke="rgba(250,214,87,0.55)"
                strokeWidth={1.2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                pathLength={1470}
                strokeDasharray="70 1400"
                animate={{ strokeDashoffset: [0, -1470] }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 9 }}
              />
            )}
          </>
        )}

        {(lines === 'both' || lines === 'lower') && (
          <>
            <path
              d="M -40 640 C 520 760, 900 520, 1480 660"
              fill="none"
              stroke="rgba(250,214,87,0.14)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            {!reduce && (
              <motion.path
                d="M -40 640 C 520 760, 900 520, 1480 660"
                fill="none"
                stroke="rgba(250,214,87,0.55)"
                strokeWidth={1.2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                pathLength={1470}
                strokeDasharray="70 1400"
                animate={{ strokeDashoffset: [0, -1470] }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 13, delay: 2 }}
              />
            )}
          </>
        )}
      </svg>
    </div>
  );
}

// Hero section
function HeroSection() {
  const heroRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroBright = useTransform(scrollYProgress, [0, 0.6], [0, 1]);

  return (
    <section ref={heroRef} className="relative overflow-hidden">
      <Header />

      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(120%_100%_at_50%_110%,rgba(250,214,87,0.30),rgba(250,214,87,0.12)_45%,rgba(250,214,87,0)_80%),linear-gradient(180deg,rgba(250,214,87,0.03),rgba(250,214,87,0.06)_60%,rgba(250,214,87,0.10)_100%)]" />
      {!reduce && (
        <motion.div
          aria-hidden
          style={{ opacity: heroBright }}
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(120%_100%_at_50%_110%,rgba(250,214,87,0.45),rgba(250,214,87,0.18)_45%,rgba(250,214,87,0)_80%),linear-gradient(180deg,rgba(250,214,87,0.05),rgba(250,214,87,0.10)_60%,rgba(250,214,87,0.16)_100%)]"
        />
      )}
      <div aria-hidden className="pointer-events-none absolute left-1/2 bottom-[-22rem] -translate-x-1/2 w-[70rem] h-[70rem] rounded-full z-0 blur-[30px] bg-[radial-gradient(closest-side,rgba(250,214,87,0.20),transparent_70%)]" />

      {/* Signature orbital emblem, floats top-left, gently bobbing */}
      <ParallaxLayer depth={30} className="hidden md:block absolute top-32 -left-10 lg:left-2 w-56 h-56 lg:w-72 lg:h-72 pointer-events-none">
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

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-14 md:pt-16 pb-24">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-1.5 bg-[color-mix(in_srgb,var(--color-content-accent)_6%,transparent)] text-[11px] tracking-[0.2em] uppercase text-[var(--color-content-accent)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)] animate-pulse" />
            Verified on-chain • Instant payouts
          </div>
        </motion.div>

        {/* Heading */}
        <h1 className="mt-8 text-center font-serif font-medium tracking-tight leading-[1.02] text-[9vw] md:text-[4rem] lg:text-[4.5rem] text-[var(--color-content-primary)]">
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
                <span className="bg-gradient-to-r from-[#fef0bf] to-[#fad657] bg-clip-text text-transparent">
                  multiple
                </span>
              </KineticWord>
            </span>
            <span className="ml-3">
              <KineticWord delay={0.55}>
                <span className="bg-gradient-to-r from-[#fad657] to-[#b08d3e] bg-clip-text text-transparent">
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
          One subscription, split on-chain the moment it settles. Soroban routes every payment
          70/20/10 to the people who earned it, and unlocks perks across partner communities.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.78, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/dashboard">
            <button className="group inline-flex items-center gap-3 bg-gradient-to-br from-[#fce27e] via-[#fad657] to-[#c9a83f] text-[var(--color-content-on-accent)] font-semibold text-[14px] tracking-wide pl-7 pr-2.5 py-2.5 rounded-full transition-all hover:shadow-[0_10px_40px_-6px_rgba(250,214,87,0.75)] hover:translate-y-[-1px] shadow-[0_8px_30px_-8px_rgba(250,214,87,0.55)]">
              Get early access
              <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                →
              </span>
            </button>
          </Link>
          <Link href="/start">
            <motion.button
              type="button"
              className="inline-flex items-center border border-solid border-[color-mix(in_srgb,var(--color-content-primary)_25%,transparent)] bg-transparent text-[var(--color-content-primary)] text-[14px] tracking-wide px-7 py-3.5 rounded-full hover:border-[color-mix(in_srgb,var(--color-content-accent)_60%,transparent)] hover:text-[var(--color-content-accent)] transition-colors"
            >
              Become a partner
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
          <ParallaxLayer depth={12} className="p-[1.5px] rounded-[5.5px] bg-gradient-to-br from-[rgba(250,214,87,0.5)] to-[rgba(250,214,87,0.05)] via-[rgba(250,214,87,0.35)]">
            <div className="relative rounded-[4px] overflow-hidden bg-[#111110] aspect-video">
              {/* Product demo loop (14s, silent) */}
              <video
                src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/demo.mp4`}
                poster={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/demo-poster.jpg`}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/* Corner tags */}
              <div className="absolute top-4 left-4 text-[10px] tracking-widest text-[color-mix(in_srgb,var(--color-content-primary)_50%,transparent)] border border-[color-mix(in_srgb,var(--color-content-primary)_15%,transparent)] rounded px-2 py-1 bg-black/30">
                HOW IT WORKS
              </div>

            </div>
          </ParallaxLayer>
        </motion.div>

        {/* Stats row, live from API */}
        <LiveStats />

      </main>
    </section>
  );
}

// How it works, editorial split: sticky heading left, connected step cascade right
const STEPS = [
  {
    icon: Wallet,
    title: 'Connect your wallet',
    body: 'Connect any Stellar-based wallet. You can use a Freighter wallet, no email, no password, nothing to remember.',
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
  const iconColor = useTransform(active, [0, 1], ['#fad657', '#201607']); // accent → on-accent
  const numOpacity = useTransform(active, [0, 1], [0.5, 1]);
  // Drift stays within the card: top-3 (12px) anchor minus 12px max lift = flush, never clipped.
  const ghostY = useTransform(progress, [start, end], [12, -12]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.08, duration: 0.8, ease: EASE }}
      className="relative"
    >
      {/* Border color tracks scroll activation */}
      <motion.div
        className="group relative card-standard px-6 py-6 md:px-7 md:py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] overflow-hidden"
      >
          <motion.div
            aria-hidden="true"
            className="card-selected-overlay"
            style={{ opacity: active }}
          />
          {/* Ghost step number, drifts as the section scrolls */}
          <motion.span
            style={{ y: ghostY }}
            className="pointer-events-none absolute top-3 right-4 font-serif text-[5.5rem] leading-none text-[var(--color-content-primary)] select-none"
          >
            {index + 1}
          </motion.span>

          <div className="relative flex items-start gap-4">
            {/* Icon tile, fills solid accent as the step activates */}
            <motion.span
              style={{ scale: iconScale }}
              className="relative shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-bg-accent-tint)] ring-1 ring-[color-mix(in_srgb,var(--color-content-accent)_15%,transparent)] overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105"
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
                  className="text-[11px] tracking-[0.2em] text-[var(--color-content-accent)]"
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
    </motion.div>
  );
}

function HowItWorks() {
  const cascadeRef = useRef<HTMLDivElement>(null);
  // Drive progress off the window scroll event (fires for Lenis, native, and
  // programmatic scroll alike, more reliable under Lenis than framer's
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
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-14 lg:gap-20">
        {/* Left, sticky editorial heading */}
        <div className="lg:sticky lg:top-24 self-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-1.5 bg-[color-mix(in_srgb,var(--color-content-accent)_6%,transparent)] text-[11px] tracking-[0.2em] uppercase text-[var(--color-content-accent)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)]" />
              How it works
            </div>

            <h2 className="mt-7 font-serif font-medium tracking-tight leading-[1.05] text-[2.6rem] md:text-[3.4rem] text-[var(--color-content-primary)]">
              One subscription,
              <br />
              every{' '}
              <span className="bg-gradient-to-r from-[#fef0bf] via-[#fad657] to-[#b08d3e] bg-clip-text text-transparent">
                partner perk.
              </span>
            </h2>

            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[var(--color-content-secondary)]">
              Komunify brings those pieces into one place: single subscription, multiple partner benefits,
              discounted products, and automatic revenue distribution powered by Stellar and Soroban smart
              contracts.
            </p>

            <Link href="/dashboard" className="inline-block mt-9">
              <button className="group inline-flex items-center gap-3 bg-gradient-to-br from-[#fce27e] via-[#fad657] to-[#c9a83f] text-[var(--color-content-on-accent)] font-semibold text-[14px] tracking-wide pl-6 pr-2 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] hover:shadow-[0_10px_40px_-6px_rgba(250,214,87,0.75)] active:scale-[0.98] shadow-[0_8px_30px_-8px_rgba(250,214,87,0.55)]">
                Start now
                <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                  →
                </span>
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Right, connected step cascade */}
        <div ref={cascadeRef} className="relative">
          {/* Connector, dim rail with a scroll-driven gold fill on top */}
          <div className="pointer-events-none absolute left-[2.85rem] top-6 bottom-6 w-px bg-[var(--color-border-medium)] hidden md:block" />
          <motion.div
            style={{ scaleY: fill, transformOrigin: 'top' }}
            className="pointer-events-none absolute left-[2.85rem] top-6 bottom-6 w-px bg-gradient-to-b from-[var(--color-content-accent)] to-[color-mix(in_srgb,var(--color-content-accent)_40%,transparent)] hidden md:block"
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

function SplitLedgerSection() {
  const subscriptionCardRef = useRef<HTMLDivElement>(null);
  const payouts = [
    { name: 'Project owner', percentage: '70%', amount: '$7.00' },
    { name: 'Community manager', percentage: '20%', amount: '$2.00' },
    { name: 'Komunify platform', percentage: '10%', amount: '$1.00' },
  ];

  const handleSubscriptionCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;

    e.currentTarget.style.setProperty('--tilt-x', `${-py * 12}deg`);
    e.currentTarget.style.setProperty('--tilt-y', `${px * 12}deg`);
    e.currentTarget.style.setProperty('--holo-x', `${(px + 0.5) * 100}%`);
    e.currentTarget.style.setProperty('--holo-y', `${(py + 0.5) * 100}%`);
    e.currentTarget.style.setProperty('--shadow-x', `${-px * 10}px`);
    e.currentTarget.style.setProperty('--shadow-y', `${py * -10 + 2}px`);
    e.currentTarget.style.setProperty('--holo-o', '1');
  };

  const handleSubscriptionCardPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    e.currentTarget.style.setProperty('--tilt-x', '0deg');
    e.currentTarget.style.setProperty('--tilt-y', '0deg');
    e.currentTarget.style.setProperty('--shadow-x', '0px');
    e.currentTarget.style.setProperty('--shadow-y', '2px');
    e.currentTarget.style.setProperty('--holo-o', '0');
  };

  return (
    <section id="split" className="relative py-24 md:py-36 scroll-mt-24 overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 w-[36rem] h-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] bg-[radial-gradient(closest-side,rgba(250,214,87,0.08),transparent_70%)]" />

      <div className="relative max-w-6xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-1.5 bg-[color-mix(in_srgb,var(--color-content-accent)_6%,transparent)] text-[11px] tracking-[0.2em] uppercase text-[var(--color-content-accent)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)]" />
            Automatic split
          </div>
          <h2 className="mt-7 font-serif font-medium tracking-tight leading-[1.05] text-[2.4rem] md:text-[3.2rem] text-[var(--color-content-primary)]">
            One payment,{' '}
            <span className="bg-gradient-to-r from-[#fef0bf] via-[#fad657] to-[#b08d3e] bg-clip-text text-transparent">
              three payouts.
            </span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-[15px] leading-relaxed text-[var(--color-content-secondary)]">
            Every subscription is split on-chain the moment it settles. No invoices, no reconciliation: the
            Soroban contract routes each share instantly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ delay: 0.12, duration: 0.8, ease: EASE }}
          className="relative mt-14 md:mt-16 grid grid-cols-1 lg:grid-cols-[1fr_7rem_1fr] gap-8 lg:gap-0 items-stretch"
        >
          <div
            ref={subscriptionCardRef}
            onPointerMove={handleSubscriptionCardPointerMove}
            onPointerLeave={handleSubscriptionCardPointerLeave}
            className="group relative z-10 h-full min-h-72 card-standard px-7 py-8 md:px-9 md:py-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] flex flex-col justify-between overflow-clip"
            style={{
              transform: 'perspective(1000px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))',
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
              boxShadow: 'var(--shadow-x, 0px) var(--shadow-y, 2px) 12px 0 rgba(0,0,0,0.35)',
            }}
          >
            <div>
              <p className="text-[11px] tracking-[0.22em] text-[var(--color-content-accent)]">
                YOUR SUBSCRIPTION
              </p>
              <p className="mt-7 font-serif text-[3.2rem] md:text-[4rem] leading-none tracking-tight text-[var(--color-content-primary)]">
                $10 <span className="text-[var(--color-content-accent)]">USDC</span>
              </p>
              <p className="mt-3 text-[14px] text-[var(--color-content-secondary)]">per month</p>
            </div>
            <span className="mt-10 self-start inline-flex rounded-full border border-[color-mix(in_srgb,var(--color-content-accent)_20%,transparent)] bg-[var(--color-bg-accent-tint)] px-3 py-1.5 font-mono text-[11px] tracking-wide text-[color-mix(in_srgb,var(--color-content-accent)_80%,transparent)]">
              29d91130…f96a78
            </span>
            <div aria-hidden className="card-selected-overlay -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit]"
              style={{
                zIndex: 4,
                mixBlendMode: 'overlay',
                opacity: 'var(--holo-o, 0)',
                transition: 'opacity 0.3s',
                background:
                  'radial-gradient(circle at var(--holo-x, 50%) var(--holo-y, 50%), rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.3) 10%, rgba(255,255,255,0.2) 20%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 60%, transparent 80%)',
              }}
            />
          </div>

          <div className="hidden lg:block relative">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 100 300"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="splitGrad" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="100" y2="150">
                  <stop offset="0%" stopColor="rgba(250,214,87,0.85)" />
                  <stop offset="100%" stopColor="rgba(250,214,87,0.25)" />
                </linearGradient>
              </defs>
              {[
                'M -2 150 C 45 150, 45 50, 102 50',
                'M -2 150 L 102 150',
                'M -2 150 C 45 150, 45 250, 102 250',
              ].map((d, index) => (
                <motion.path
                  key={d}
                  d={d}
                  fill="none"
                  stroke="url(#splitGrad)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ delay: 0.2 + index * 0.08, duration: 0.6, ease: EASE }}
                />
              ))}
              <circle cx={2} cy={150} r={3} fill="#fad657" />
              <circle cx={98} cy={50} r={3} fill="#fad657" />
              <circle cx={98} cy={150} r={3} fill="#fad657" />
              <circle cx={98} cy={250} r={3} fill="#fad657" />
            </svg>
          </div>

          <div className="relative flex flex-col justify-between">
            {payouts.map((payout, index) => (
              <motion.div
                key={payout.name}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: 0.18 + index * 0.08, duration: 0.7, ease: EASE }}
                className="relative card-standard px-5 py-5 flex items-center justify-between gap-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]"
              >
                <div>
                  <p className="font-serif text-[1.05rem] text-[var(--color-content-primary)]">{payout.name}</p>
                  <p className="mt-1 text-[13px] text-[var(--color-content-secondary)]">{payout.amount}</p>
                </div>
                <p className="font-serif text-[2rem] leading-none text-[var(--color-content-accent)]">{payout.percentage}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const PARTNER_COMMUNITIES = [
  {
    initial: 'D',
    name: 'Dev Web3 Bandung',
    logo: '/communities/dev-web3-bandung.png',
    description: 'Builder workshops, Soroban study group, and bootcamp recordings.',
    badge: '+2.4K members',
  },
  {
    initial: 'S',
    name: 'Sawargy',
    logo: '/communities/sawargy.png',
    description: 'Design and freelance collective: client playbooks, portfolio reviews, and working sessions.',
    badge: 'Pilot partner',
  },
  {
    initial: 'S',
    name: 'Serenity',
    logo: '/communities/serenity.webp',
    description: 'Community benefits and member events, onboarding with the first Bandung pilots.',
    badge: 'Pilot partner',
  },
  {
    initial: 'M',
    name: 'Manexus',
    logo: '/communities/manexus.png',
    description: 'Builder community joining the pilot cohort with member resources and events.',
    badge: 'Pilot partner',
  },
];

const PERKS = [
  {
    icon: Crown,
    title: 'Premium access',
    body: 'Members-only channels, office hours, and early event access across every partner.',
  },
  {
    icon: BadgePercent,
    title: 'Member discounts',
    body: 'Subscriber pricing on partner products, services, and tokenized listings.',
  },
  {
    icon: BookOpen,
    title: 'Learning resources',
    body: 'Premium educational content: bootcamp recordings, playbooks, and courses.',
  },
  {
    icon: Layers,
    title: 'Digital assets',
    body: 'Voucher-like tokenized items and digital resources, verifiable on-chain.',
  },
];

function PartnersSection() {
  return (
    <section id="communities" className="relative py-24 md:py-36 scroll-mt-24 overflow-hidden">
      <SectionFlourish lines="lower" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-1.5 bg-[color-mix(in_srgb,var(--color-content-accent)_6%,transparent)] text-[11px] tracking-[0.2em] uppercase text-[var(--color-content-accent)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)]" />
            Communities + perks
          </div>
          <h2 className="mt-7 font-serif font-medium tracking-tight leading-[1.05] text-[2.4rem] md:text-[3.2rem] text-[var(--color-content-primary)]">
            Real communities,{' '}
            <span className="bg-gradient-to-r from-[#fef0bf] via-[#fad657] to-[#b08d3e] bg-clip-text text-transparent">
              real perks.
            </span>
          </h2>
        </motion.div>

        <p className="mt-14 md:mt-16 text-[11px] tracking-[0.2em] uppercase text-[var(--color-content-secondary)]">Our communities</p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {PARTNER_COMMUNITIES.map((community, index) => (
            <motion.article
              key={community.name}
              initial={{ opacity: 0, y: 32, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.08, duration: 0.8, ease: EASE }}
              className="group card-standard card-hoverable h-full px-6 py-6 md:px-7 md:py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] flex flex-col"
            >
              <div className="relative z-[1] flex flex-1 flex-col">
                <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden ring-1 ring-[color-mix(in_srgb,var(--color-content-accent)_25%,transparent)]">
                  <img
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${community.logo}`}
                    alt={community.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-6 font-serif text-[1.35rem] leading-tight text-[var(--color-content-primary)]">
                  {community.name}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-content-secondary)]">
                  {community.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

        <p className="mt-14 text-[11px] tracking-[0.2em] uppercase text-[var(--color-content-secondary)]">What you unlock</p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {PERKS.map((perk, index) => {
            const Icon = perk.icon;

            return (
              <motion.article
                key={perk.title}
                initial={{ opacity: 0, y: 32, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.08, duration: 0.8, ease: EASE }}
                className="group card-standard card-hoverable h-full px-6 py-6 md:px-7 md:py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]"
              >
                <div className="relative z-[1]">
                  <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-bg-accent-tint)] ring-1 ring-[color-mix(in_srgb,var(--color-content-accent)_15%,transparent)] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[var(--color-content-accent)]" />
                  </div>
                  <h3 className="mt-6 font-serif text-[1.1rem] leading-tight text-[var(--color-content-primary)]">
                    {perk.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-content-secondary)]">{perk.body}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const raw = useMotionValue(0);
  useEffect(() => {
    const update = () => {
      const el = timelineRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (0.85 * vh - rect.top) / (0.55 * vh);
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
  const fill = useSpring(raw, { stiffness: 90, damping: 30, restDelta: 0.001 });

  const phases = [
    {
      marker: 'Q3 2026',
      descriptor: 'LIVE ON TESTNET',
      title: 'The full loop works',
      body: 'Wallet connect, subscription payment, automatic 70/20/10 split, and a live on-chain dashboard. Exit metric: loop proven. Every dashboard number is an on-chain read.',
      nodeOpacity: 'opacity-100',
    },
    {
      marker: 'Q4 2026',
      descriptor: 'PILOT ONE, WITH NUMBERS',
      title: 'First partner communities',
      body: 'October: Dev Web3 Bandung (2.4K members) goes live. Target funnel: 2,400 members, 250 wallets, 100 paid subscriptions. Pass mark: 100 active on-chain subscriptions, then Sawargy, Manexus, and Serenity follow.',
      nodeOpacity: 'opacity-[0.55]',
    },
    {
      marker: '2027',
      descriptor: 'THE RAILS',
      title: 'Every chapter runs on Komunify',
      body: 'Target: 10 chapters and 1,000 active subscriptions. Self-serve partner onboarding, multi-tier subscriptions, configurable splits, reporting out of the box.',
      nodeOpacity: 'opacity-30',
    },
  ];

  return (
    <section id="roadmap" className="relative py-24 md:py-36 scroll-mt-24 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-1.5 bg-[color-mix(in_srgb,var(--color-content-accent)_6%,transparent)] text-[11px] tracking-[0.2em] uppercase text-[var(--color-content-accent)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)]" />
            WHERE THIS GOES
          </div>
          <h2 className="mt-7 font-serif font-medium tracking-tight leading-[1.05] text-[2.4rem] md:text-[3.2rem] text-[var(--color-content-primary)]">
            Testnet today,{' '}
            <span className="bg-gradient-to-r from-[#fef0bf] via-[#fad657] to-[#b08d3e] bg-clip-text text-transparent">
              rails tomorrow.
            </span>
          </h2>
        </motion.div>

        <div ref={timelineRef} className="relative mt-12 md:mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          <div aria-hidden="true" className="hidden md:block absolute top-0 inset-x-0 h-px bg-[var(--color-border-medium)]" />
          <motion.div
            aria-hidden="true"
            style={{ scaleX: fill }}
            className="hidden md:block absolute top-0 inset-x-0 h-px origin-left bg-gradient-to-r from-[var(--color-content-accent)] to-[color-mix(in_srgb,var(--color-content-accent)_40%,transparent)]"
          />
          {phases.map((phase, index) => (
            <motion.article
              key={phase.marker}
              initial={{ opacity: 0, y: 32, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.08, duration: 0.8, ease: EASE }}
              className="relative border-t border-[var(--color-border-medium)] pt-6 md:border-t-0"
            >
              <span
                aria-hidden="true"
                className={`absolute -top-[5px] left-0 w-[9px] h-[9px] rounded-full bg-[var(--color-content-accent)] ${phase.nodeOpacity}`}
              />
              <p className="text-[26px] md:text-[30px] font-semibold tracking-[0.01em] text-[var(--color-content-accent)] leading-none">
                {phase.marker}
              </p>
              <p className="mt-2.5 text-[11px] tracking-[2px] uppercase text-[var(--color-content-secondary)]">
                {phase.descriptor}
              </p>
              <h3 className="mt-3 font-serif text-[1.35rem] font-semibold leading-tight text-[var(--color-content-primary)]">
                {phase.title}
              </h3>
              <p className="mt-3 max-w-[44ch] text-[13px] leading-relaxed text-[var(--color-content-secondary)]">
                {phase.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  const members = [
    {
      initial: 'I',
      name: 'Imam Abullaisi',
      role: 'Product + Design',
      community: 'Sawargy',
      photo: 'https://github.com/abullaisi.png',
      linkedin: 'https://www.linkedin.com/in/abullaisi/',
      x: 'https://x.com/abullaisi',
      niche: 'Freelance & design community',
      memberCount: '950+ members',
    },
    {
      initial: 'J',
      name: 'Jason Stanley',
      role: 'Engineering',
      community: 'Dev Web3 Bandung',
      photo: '/team/jason.jpg?v=2',
      linkedin: 'https://www.linkedin.com/in/jason-stanley-yoman/',
      x: 'https://x.com/jason_yomann',
      niche: 'Web3 builders & hackathons',
      memberCount: null,
    },
    {
      initial: 'F',
      name: 'Faris Abdurrahman',
      role: 'Product Manager',
      community: 'Manexus',
      photo: '/team/faris.jpg?v=2',
      linkedin: 'https://www.linkedin.com/in/faris-abdurrahman/',
      x: null,
      niche: 'Web3 + AI community hub',
      memberCount: null,
    },
    {
      initial: 'N',
      name: 'Qatrun Nada',
      role: 'Business + Partnerships',
      community: 'Serenity',
      photo: '/team/nada.jpg?v=2',
      linkedin: 'https://www.linkedin.com/in/nadadv/',
      x: null,
      niche: null,
      memberCount: null,
    },
  ];

  return (
    <section id="team" className="relative py-24 md:py-36 scroll-mt-24 overflow-hidden">
      <SectionFlourish lines="upper" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative z-10 md:flex md:items-end md:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-1.5 bg-[color-mix(in_srgb,var(--color-content-accent)_6%,transparent)] text-[11px] tracking-[0.2em] uppercase text-[var(--color-content-accent)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)]" />
              THE TEAM
            </div>
            <h2 className="mt-7 font-serif font-medium tracking-tight leading-[1.05] text-[2.4rem] md:text-[3.2rem] text-[var(--color-content-primary)]">
              Four builders,{' '}
              <span className="bg-gradient-to-r from-[#fef0bf] via-[#fad657] to-[#b08d3e] bg-clip-text text-transparent">
                four communities.
              </span>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-content-secondary)]">
              We each run a community. We're building the tool we need.
            </p>
          </div>
        </motion.div>

        <div className="relative z-10 mt-12 md:mt-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
            {members.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 32, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.08, duration: 0.8, ease: EASE }}
              >
                <div className="relative aspect-[4/5] w-full rounded-[4px] overflow-hidden border border-[var(--color-border-medium)]">
                  <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-content-accent)_6%,transparent)] flex items-center justify-center text-5xl font-extrabold text-[var(--color-content-accent)]">
                    {member.initial}
                  </div>
                  {member.photo && (
                    <img
                      src={member.photo.startsWith('http') ? member.photo : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${member.photo}`}
                      alt={member.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-[var(--color-content-primary)]">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {member.linkedin ? (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${member.name} on LinkedIn`}
                          className="w-8 h-8 border border-[var(--color-border-medium)] rounded-lg flex items-center justify-center text-[var(--color-content-secondary)] hover:text-[var(--color-content-accent)] transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor" aria-hidden="true">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452z" />
                          </svg>
                        </a>
                      ) : null}
                      {member.x ? (
                        <a
                          href={member.x}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${member.name} on X`}
                          className="w-8 h-8 border border-[var(--color-border-medium)] rounded-lg flex items-center justify-center text-[var(--color-content-secondary)] hover:text-[var(--color-content-accent)] transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor" aria-hidden="true">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-[12px] text-[var(--color-content-secondary)]">{member.role}</p>
                  <p className="text-[11px] tracking-[2px] text-[var(--color-content-accent)]">
                    {`RUNS ${member.community.toUpperCase()}`}
                  </p>
                  {member.niche ? (
                    <p className="text-[12px] text-[var(--color-content-secondary)]">{member.niche}</p>
                  ) : null}
                  {member.memberCount ? (
                    <p className="text-[12px] text-[var(--color-content-secondary)]">{member.memberCount}</p>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// FAQ, accordion of common questions
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
      <div
        className={`relative rounded-[4px] transition-colors duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04),0_10px_28px_rgba(0,0,0,0.30)] overflow-hidden ${
          isOpen
            ? 'card-selected'
            : 'card-standard card-hoverable'
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="relative z-[1] w-full flex items-center justify-between gap-6 px-6 py-5 md:px-7 md:py-6 text-left bg-transparent border-none rounded-none"
        >
          <span className="font-serif text-[1.05rem] md:text-[1.2rem] leading-snug text-[var(--color-content-primary)]">
            {item.question}
          </span>
          <span
            className={`relative shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full ring-1 transition-colors duration-500 ${
              isOpen
                ? 'bg-[var(--color-content-accent)] ring-[color-mix(in_srgb,var(--color-content-accent)_40%,transparent)]'
                : 'bg-[var(--color-bg-accent-tint)] ring-[color-mix(in_srgb,var(--color-content-accent)_15%,transparent)]'
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
              className="relative z-[1] overflow-hidden"
            >
              <p className="px-6 md:px-7 pb-6 max-w-2xl text-[14px] leading-relaxed text-[var(--color-content-secondary)]">
                {item.answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: faqRef, offset: ['start end', 'end end'] });
  const faqBright = useTransform(scrollYProgress, [0.2, 0.9], [0, 1]);

  return (
    <section ref={faqRef} id="faq" className="relative py-24 md:py-40 scroll-mt-24 overflow-hidden">
      {/* Quiet echo, balances the composition bottom-right, same visual DNA */}
      <ParallaxLayer depth={50} className="hidden lg:block absolute bottom-4 right-[3%] w-64 h-64 pointer-events-none">
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
            <OrbitalEmblem uid="echo" />
          </motion.div>
        </motion.div>
      </ParallaxLayer>

      {/* Ambient side glow, mirrors the How-it-works section's atmosphere */}
      <div className="pointer-events-none absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 w-[110rem] h-[110rem] rounded-full blur-[60px] bg-[radial-gradient(closest-side,rgba(250,214,87,0.15),transparent_70%)]" />
      {!reduce && (
        <motion.div
          aria-hidden
          style={{ opacity: faqBright }}
          className="pointer-events-none absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 w-[110rem] h-[110rem] rounded-full blur-[60px] bg-[radial-gradient(closest-side,rgba(250,214,87,0.28),transparent_70%)]"
        />
      )}

      <div className="relative max-w-3xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-1.5 bg-[color-mix(in_srgb,var(--color-content-accent)_6%,transparent)] text-[11px] tracking-[0.2em] uppercase text-[var(--color-content-accent)]">
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

function ClosingCTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const raw = useMotionValue(0);
  useEffect(() => {
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (0.95 * vh - rect.top) / (0.6 * vh);
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
  const fill = useSpring(raw, { stiffness: 80, damping: 26 });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-[var(--color-border-medium)] bg-[var(--color-bg-elevated)] py-16 md:py-20 px-6 md:px-10"
    >
      <motion.div
        aria-hidden="true"
        style={{ opacity: fill }}
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(90% 120% at 50% 115%, rgba(250,214,87,0.28), rgba(250,214,87,0.10) 45%, transparent 75%), linear-gradient(180deg, transparent, rgba(250,214,87,0.06))',
          }}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-[1] max-w-6xl mx-auto flex flex-col md:flex-row md:items-center gap-9 md:gap-12"
      >
        <div className="flex items-center gap-6 md:gap-9 min-w-0">
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo-mark.png`} alt="Komunify" className="w-16 h-16 object-contain shrink-0" />
          <div className="w-px h-16 bg-[var(--color-border-medium)] shrink-0" />
          <p className="font-serif font-medium tracking-tight leading-[1.08] text-[1.85rem] sm:text-[2.3rem] md:text-[2.7rem] text-[var(--color-content-primary)]">
            <span className="block">Single subscription.</span>
            <span className="block text-[var(--color-content-accent)]">
              Multiple benefits.
            </span>
          </p>
        </div>

        <Link href="/dashboard" className="md:ml-auto shrink-0 self-start md:self-auto">
          <button className="group inline-flex items-center gap-3 bg-gradient-to-br from-[#fce27e] via-[#fad657] to-[#c9a83f] text-[var(--color-content-on-accent)] font-semibold text-[14px] tracking-wide pl-7 pr-2.5 py-2.5 rounded-full transition-all hover:shadow-[0_10px_40px_-6px_rgba(250,214,87,0.75)] hover:translate-y-[-1px] shadow-[0_8px_30px_-8px_rgba(250,214,87,0.55)]">
            Get early access
            <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
              →
            </span>
          </button>
        </Link>
      </motion.div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-medium)] py-12 px-6 sm:px-12 bg-[var(--color-bg-elevated)]">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-[var(--color-content-secondary)] text-sm text-center sm:text-left">
            © 2026 Komunify. Built on{' '}
            <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-[var(--color-content-accent)] hover:underline">
              Stellar
            </a>
          </div>
          <div className="flex gap-6 text-sm text-[var(--color-content-secondary)]">
            <a href="https://github.com/yoms07/stellar-hackathon" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-content-accent)] transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-[var(--color-content-accent)] transition-colors">
              Documentation
            </a>
            <a href="/dashboard" className="hover:text-[var(--color-content-accent)] transition-colors">
              App
            </a>
          </div>
          <div className="flex items-center gap-2">
          <a
            href="https://x.com/komunifyapp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Komunify on X"
            className="w-8 h-8 border border-[var(--color-border-medium)] rounded-lg flex items-center justify-center text-[var(--color-content-secondary)] hover:text-[var(--color-content-accent)] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://instagram.com/komunify.app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Komunify on Instagram"
            className="w-8 h-8 border border-[var(--color-border-medium)] rounded-lg flex items-center justify-center text-[var(--color-content-secondary)] hover:text-[var(--color-content-accent)] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor" aria-hidden="true">
              <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm10.5 1.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
            </svg>
          </a>
          <a
            href="https://t.me/komunify"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Komunify on Telegram"
            className="w-8 h-8 border border-[var(--color-border-medium)] rounded-lg flex items-center justify-center text-[var(--color-content-secondary)] hover:text-[var(--color-content-accent)] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor" aria-hidden="true">
              <path d="M21.944 2.506a1.5 1.5 0 0 0-1.533-.13L2.9 10.254a1.5 1.5 0 0 0 .122 2.786l4.535 1.518 1.774 5.408a1.5 1.5 0 0 0 2.607.47l2.574-3.078 4.476 3.268a1.5 1.5 0 0 0 2.36-.92l1.137-15.78a1.5 1.5 0 0 0-.541-1.42zM9.051 13.217l8.683-6.018-6.939 7.383-.682 2.932-1.062-4.297zm10.331 5.121-5.128-3.745-2.08 2.488.334-1.435 7.82-8.32-.946 11.012z" />
            </svg>
          </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main page
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <HeroSection />
      <HowItWorks />
      <SplitLedgerSection />
      <PartnersSection />
      <RoadmapSection />
      <TeamSection />
      <FAQSection />
      <ClosingCTASection />
      <Footer />
    </div>
  );
}
