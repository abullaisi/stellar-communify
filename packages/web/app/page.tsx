'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

/* ============================================================================
  LANDING PAGE — Aureus (21st Design)
  Premium Web3 creator platform with kinetic typography, parallax, and luxury UX.
  Uses SPLIT v4 tokens from globals.css + Framer Motion for animations.
============================================================================ */

// Logo component
function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" className="shrink-0">
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <polygon points="20,10 29,15 29,25 20,30 11,25 11,15" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

// Header with nav
function Header() {
  return (
    <header className="relative z-20 max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 pt-7">
      <div className="flex items-center gap-3">
        <div className="text-[var(--color-content-accent)]">
          <Logo />
        </div>
        <span className="font-serif text-lg tracking-[0.15em] text-[var(--color-content-primary)]">AUREUS</span>
      </div>

      <nav className="hidden md:flex items-center gap-10 text-[13px] tracking-wide text-[var(--color-content-secondary)] font-mono">
        <a href="#" className="hover:text-[var(--color-content-accent)] transition-colors">
          Creators
        </a>
        <a href="#" className="hover:text-[var(--color-content-accent)] transition-colors">
          Vaults
        </a>
        <a href="#" className="hover:text-[var(--color-content-accent)] transition-colors">
          Docs
        </a>
      </nav>

      <button className="hidden md:inline-flex items-center gap-2 border border-[var(--color-content-accent)]/40 text-[var(--color-content-accent)] text-[13px] font-mono px-4 py-2 rounded-full hover:bg-[var(--color-content-accent)]/10 transition-colors">
        Connect Wallet
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-content-accent)] animate-pulse"></span>
      </button>
    </header>
  );
}

// Kinetic text word
function KineticWord({ children, delay }: { children: string; delay: number }) {
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

// Hero section
function HeroSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const glow = document.querySelector('.glow-heading');
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

      {/* Parallax decorative elements */}
      <ParallaxLayer depth={35} className="hidden md:block absolute -top-4 left-2 w-24 h-24">
        <div className="w-full h-full border border-[var(--color-content-accent)]/30 rounded-full animate-spin" style={{ animationDuration: '24s' }} />
        <div className="absolute inset-3 border border-dashed border-[var(--color-content-accent)]/25 rounded-full" />
      </ParallaxLayer>

      <ParallaxLayer depth={55} className="hidden md:block absolute top-24 right-6 text-[var(--color-content-accent)]/50 font-mono text-[11px] tracking-widest">
        <div className="border border-[var(--color-content-accent)]/25 rounded-lg px-3 py-2 bg-[var(--color-content-accent)]/5 backdrop-blur-sm">
          ◈ 0x4F2...9A2C<br />
          ACCESS VERIFIED
        </div>
      </ParallaxLayer>

      <ParallaxLayer depth={70} className="hidden lg:block absolute top-[40%] left-[-2%] w-10 h-10 rotate-45 border border-[var(--color-content-accent)]/30" />
      <ParallaxLayer depth={45} className="hidden lg:block absolute bottom-4 right-[6%] w-16 h-16 rounded-full border border-[var(--color-content-accent)]/25" />

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
            On-chain memberships, one token deep
          </div>
        </motion.div>

        {/* Heading */}
        <h1 className="mt-8 text-center font-serif font-medium tracking-tight leading-[1.02] text-[13vw] md:text-[6.4rem] lg:text-[7rem] text-[var(--color-content-primary)]">
          <span className="block overflow-hidden">
            <KineticWord delay={0.15}>One</KineticWord>
            <span className="ml-3">
              <KineticWord delay={0.25}>subscription.</KineticWord>
            </span>
          </span>
          <span className="block overflow-hidden mt-1 md:mt-2">
            <KineticWord delay={0.35}>
              <span className="bg-gradient-to-r from-[#f3d9a8] via-[#e5a84a] to-[#a97a34] bg-clip-text text-transparent">
                Infinite
              </span>
            </KineticWord>
            <span className="ml-3">
              <KineticWord delay={0.45}>
                <span className="bg-gradient-to-r from-[#f3d9a8] via-[#e5a84a] to-[#a97a34] bg-clip-text text-transparent">
                  possibilities.
                </span>
              </KineticWord>
            </span>
          </span>
        </h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="mt-8 max-w-xl mx-auto text-center text-[15px] md:text-[16px] leading-relaxed text-[var(--color-content-secondary)]"
        >
          Hold one pass, unlock every creator vault inside it — gated drops, private rooms, and royalties that settle
          on-chain, in your wallet, the moment they're earned.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button className="bg-gradient-to-br from-[#f2cd8f] via-[#e5a84a] to-[#b9852f] text-[var(--color-content-on-accent)] font-semibold text-[14px] tracking-wide px-7 py-3.5 rounded-full transition-all hover:shadow-[0_10px_40px_-6px_rgba(229,168,74,0.75)] hover:translate-y-[-1px] shadow-[0_8px_30px_-8px_rgba(229,168,74,0.55)]">
            Mint your pass
          </button>
          <motion.button
            whileHover={{ gap: '12px' }}
            className="group inline-flex items-center gap-2 border border-[var(--color-content-primary)]/25 text-[var(--color-content-primary)]/90 text-[14px] tracking-wide px-7 py-3.5 rounded-full hover:border-[var(--color-content-accent)]/60 hover:text-[var(--color-content-accent)] transition-colors"
          >
            Watch the film
            <motion.span className="translate-x-0 group-hover:translate-x-1 transition-transform">→</motion.span>
          </motion.button>
        </motion.div>

        {/* Video player */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="mt-16 md:mt-20 relative max-w-4xl mx-auto"
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
                PREVIEW · 4K
              </div>
              <div className="absolute top-4 left-4 font-mono text-[10px] tracking-widest text-[var(--color-content-primary)]/50 border border-[var(--color-content-primary)]/15 rounded px-2 py-1 bg-black/30">
                VAULT REEL 01
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

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-center border-t border-[var(--color-content-primary)]/10 pt-8"
        >
          <div>
            <p className="font-serif text-2xl text-[var(--color-content-accent)]">12,400+</p>
            <p className="font-mono text-[11px] tracking-widest text-[var(--color-content-primary)]/45 mt-1">PASS HOLDERS</p>
          </div>
          <div>
            <p className="font-serif text-2xl text-[var(--color-content-accent)]">38</p>
            <p className="font-mono text-[11px] tracking-widest text-[var(--color-content-primary)]/45 mt-1">CREATOR VAULTS</p>
          </div>
          <div>
            <p className="font-serif text-2xl text-[var(--color-content-accent)]">100%</p>
            <p className="font-mono text-[11px] tracking-widest text-[var(--color-content-primary)]/45 mt-1">ROYALTIES ON-CHAIN</p>
          </div>
        </motion.div>
      </main>
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
        <div className="flex gap-4 text-sm text-[var(--color-content-secondary)]">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-content-accent)] transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-[var(--color-content-accent)] transition-colors">
            Docs
          </a>
          <a href="#" className="hover:text-[var(--color-content-accent)] transition-colors">
            Status
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
      <Footer />
    </div>
  );
}
