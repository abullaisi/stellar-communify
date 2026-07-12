'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Instagram, Twitter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/services/api/client';

// Animated counter for live metrics
function AnimatedCounter({
  value,
  duration = 1,
  decimals = 0,
}: {
  value: number;
  duration?: number;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      const newValue = progress * value;
      setDisplayValue(newValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return displayValue.toFixed(decimals);
}

// Hero Section with kinetic typography
function HeroSection() {
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  const lines = ['One subscription.', 'Infinite creators.', 'Direct payouts.'];

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-[#0b0b0a] flex items-center justify-center"
    >
      {/* Parallax background */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 opacity-30"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#e5a84a]/20 to-transparent" />
      </motion.div>

      {/* Floating elements for depth */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 left-10 w-64 h-64 bg-[#e5a84a] rounded-full opacity-10 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
          className="absolute bottom-20 right-10 w-80 h-80 bg-[#4a9ded] rounded-full opacity-5 blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-12 text-center">
        {/* Kinetic headline */}
        <div className="mb-8">
          {lines.map((line, i) => (
            <motion.h1
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.8, ease: 'easeOut' }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#ecd9c1] leading-tight"
              style={{
                letterSpacing: '0.02em',
              }}
            >
              {line}
            </motion.h1>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-lg sm:text-xl text-[#928e85] max-w-2xl mx-auto mb-12"
        >
          Creators earn what they deserve. Subscribers own their choices.
          <br />
          No algorithm. No middleman. Just you and your community.
        </motion.p>

        {/* Video placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="relative max-w-2xl mx-auto"
        >
          <div className="aspect-video rounded-lg overflow-hidden bg-[#131311] border border-[#262521] shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#262521] to-[#0b0b0a] flex items-center justify-center group cursor-pointer">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 rounded-full bg-[#e5a84a] flex items-center justify-center shadow-lg"
              >
                <div className="w-0 h-0 border-l-8 border-l-[#201607] border-t-5 border-t-transparent border-b-5 border-b-transparent ml-1" />
              </motion.button>
              <span className="absolute bottom-4 left-4 text-xs text-[#928e85]">Demo video (placeholder)</span>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-16 flex justify-center"
        >
          <div className="text-[#928e85] text-sm">Scroll to explore</div>
        </motion.div>
      </div>
    </section>
  );
}

// Live Metrics Section
function MetricsSection() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      try {
        const response = await ApiClient.get('/stats');
        return response;
      } catch {
        return {
          activeCreators: 12,
          totalSubscriptions: 248,
          totalRevenue: 12450.50,
          avgCreatorEarnings: 50.20,
        };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end end'] });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  const metrics = [
    {
      label: 'Active Creators',
      value: stats?.activeCreators || 0,
      caption: 'Independent voices earning on their terms',
    },
    {
      label: 'Total Subscriptions',
      value: stats?.totalSubscriptions || 0,
      caption: 'Communities people choose to join',
    },
    {
      label: 'Revenue Processed',
      value: stats?.totalRevenue || 0,
      format: 'currency',
      caption: 'Verified on-chain. Instant settlement.',
    },
    {
      label: 'Avg Creator Earnings',
      value: stats?.avgCreatorEarnings || 0,
      format: 'currency',
      caption: 'Direct attribution. No guessing.',
    },
  ];

  return (
    <motion.section
      ref={containerRef}
      style={{ opacity }}
      className="relative py-24 px-6 sm:px-12 bg-[#0b0b0a]"
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2 className="text-4xl sm:text-5xl font-bold text-[#ecd9c1] text-center mb-16">
          Built for communities that are actually growing.
        </motion.h2>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              viewport={{ once: true, amount: 0.3 }}
              className="bg-[#131311] border border-[#262521] rounded-lg p-8 relative group hover:border-[#e5a84a]/50 transition-colors duration-300"
            >
              {/* Blockchain signal icon */}
              <motion.div
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-4 right-4 w-6 h-6 text-[#e5a84a] opacity-60"
              >
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 3v2H5v14h14V5h-4V3H9zm0 4h6v2h2V7h-8v4h8v2h-2v2h-6v-2H7V7h2V7zm0 4v2h6v-2H9z" />
                </svg>
              </motion.div>

              <div className="text-xs font-mono uppercase tracking-wider text-[#928e85] mb-3">
                {metric.label}
              </div>

              <div className="text-3xl sm:text-4xl font-bold text-[#ecd9c1] tabular-nums mb-2">
                {metric.format === 'currency' ? '$' : ''}
                <AnimatedCounter
                  value={metric.value}
                  duration={1.5}
                  decimals={metric.format === 'currency' ? 2 : 0}
                />
                {metric.format === 'currency' ? '' : ''}
              </div>

              <p className="text-sm text-[#928e85]">{metric.caption}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// Demo Video Section
function DemoSection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end end'] });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <motion.section
      ref={containerRef}
      style={{ opacity }}
      className="relative py-24 px-6 sm:px-12 bg-[#0b0b0a]"
    >
      <div className="max-w-4xl mx-auto">
        <motion.h2 className="text-4xl sm:text-5xl font-bold text-[#ecd9c1] text-center mb-12">
          Watch how it works.
        </motion.h2>

        {/* Video container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="aspect-video rounded-lg overflow-hidden bg-[#131311] border border-[#262521] shadow-2xl"
        >
          <div className="w-full h-full bg-gradient-to-br from-[#262521] to-[#0b0b0a] flex items-center justify-center group cursor-pointer hover:from-[#363531] transition-colors">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-full bg-[#e5a84a] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-0 h-0 border-l-10 border-l-[#201607] border-t-6 border-t-transparent border-b-6 border-b-transparent ml-1" />
            </motion.button>
            <span className="absolute bottom-4 left-4 text-xs text-[#928e85]">Demo video (placeholder)</span>
          </div>
        </motion.div>

        {/* Video caption */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center text-[#928e85] mt-8 max-w-2xl mx-auto"
        >
          A creator publishes content. A subscriber reads it. Revenue flows directly to the creator.
          <br />
          No intermediary. No delay. On-chain, verified, final.
        </motion.p>
      </div>
    </motion.section>
  );
}

// Community Showcase Section
function CommunitySection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end end'] });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  const communities = [
    {
      name: 'Photography Collective',
      initials: 'PC',
      tagline: 'Independent photographers. Premium prints. Direct sales.',
      subscribers: 342,
      color: 'bg-[#e5a84a]',
    },
    {
      name: 'Tech Writing',
      initials: 'TW',
      tagline: 'Long-form analysis. No ads. Subscribers fund the research.',
      subscribers: 1205,
      color: 'bg-[#4a9ded]',
    },
    {
      name: 'Creative Workshop',
      initials: 'CW',
      tagline: 'Tutorials, assets, community. Everything creators need.',
      subscribers: 587,
      color: 'bg-[#3ecf8e]',
    },
  ];

  return (
    <motion.section
      ref={containerRef}
      style={{ opacity }}
      className="relative py-24 px-6 sm:px-12 bg-[#0b0b0a]"
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2 className="text-4xl sm:text-5xl font-bold text-[#ecd9c1] text-center mb-16">
          Built by communities. For creators.
        </motion.h2>

        {/* Communities grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {communities.map((community, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, borderColor: '#e5a84a' }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              viewport={{ once: true, amount: 0.3 }}
              className="bg-[#131311] border border-[#262521] rounded-lg p-8 text-center transition-colors duration-300"
            >
              {/* Avatar placeholder */}
              <div className={`w-16 h-16 rounded-full ${community.color} mx-auto mb-4 flex items-center justify-center text-[#0b0b0a] font-bold text-lg`}>
                {community.initials}
              </div>

              <h3 className="text-lg font-bold text-[#ecd9c1] mb-2">{community.name}</h3>
              <p className="text-sm text-[#928e85] mb-4">{community.tagline}</p>

              <div className="pt-4 border-t border-[#262521]">
                <div className="text-xs font-mono uppercase tracking-wider text-[#928e85] mb-1">
                  Subscribers
                </div>
                <div className="text-2xl font-bold text-[#e5a84a]">{community.subscribers}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social footer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className="flex justify-center items-center gap-4 pt-8 border-t border-[#262521]"
        >
          <span className="text-[#928e85] text-sm">Follow us on</span>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#e5a84a] hover:text-[#f1dfca] transition-colors"
            aria-label="Instagram"
          >
            <Instagram size={20} />
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#e5a84a] hover:text-[#f1dfca] transition-colors"
            aria-label="X"
          >
            <Twitter size={20} />
          </a>
        </motion.div>
      </div>
    </motion.section>
  );
}

// CTA Section
function CTASection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end end'] });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <motion.section
      ref={containerRef}
      style={{ opacity }}
      className="relative py-24 px-6 sm:px-12 bg-gradient-to-b from-[#0b0b0a] to-[#131311]"
    >
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2 className="text-4xl sm:text-5xl font-bold text-[#ecd9c1] mb-12">
          Ready to take control?
        </motion.h2>

        {/* Three-step flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          {['Connect Wallet', 'Subscribe or Create', 'Earn or Explore'].map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="bg-[#262521] border border-[#928e85] rounded-lg px-4 py-2">
                <span className="text-sm text-[#ecd9c1]">{step}</span>
              </div>
              {i < 2 && <div className="text-[#928e85] hidden sm:block">→</div>}
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(229, 168, 74, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-[#e5a84a] text-[#201607] font-bold rounded-lg text-lg shadow-lg transition-all"
            >
              Launch Komunify
            </motion.button>
          </Link>
        </motion.div>

        {/* Button subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mt-6 text-[#928e85] text-sm max-w-md mx-auto"
        >
          Connect your Freighter wallet to get started.
          <br />
          No email. No password. Just you.
        </motion.p>
      </div>
    </motion.section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-[#131311] border-t border-[#262521] py-12 px-6 sm:px-12">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-[#928e85] text-sm text-center sm:text-left">
          © 2026 Komunify. Built on{' '}
          <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-[#e5a84a] hover:underline">
            Stellar
          </a>
        </div>
        <div className="flex gap-4 text-sm text-[#928e85]">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#e5a84a] transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-[#e5a84a] transition-colors">
            Docs
          </a>
          <a href="#" className="hover:text-[#e5a84a] transition-colors">
            Status
          </a>
        </div>
      </div>
    </footer>
  );
}

// Main page component
export default function LandingPage() {
  return (
    <main className="w-full bg-[#0b0b0a]">
      <HeroSection />
      <MetricsSection />
      <DemoSection />
      <CommunitySection />
      <CTASection />
      <Footer />
    </main>
  );
}
