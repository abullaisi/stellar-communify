'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useWallet } from '@/providers/wallet-provider';
import { useMe, useSignOut } from '@/services/auth';

const SIDEBAR_STORAGE_KEY = 'komunify-app-sidebar';

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Explore',
    href: '/explore',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" />
      </svg>
    ),
  },
  {
    label: 'Start',
    href: '/start',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v18M3 12h18" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
] as const;

export function AppSidenav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isConnected, address, connecting, connect, disconnect } = useWallet();
  const me = useMe();
  const signOut = useSignOut();
  const isAuthed = !!me.data;

  async function handleSignOut() {
    await signOut.mutateAsync();
    disconnect();
  }

  useEffect(() => {
    const storedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);

    if (storedValue !== null) {
      setCollapsed(storedValue === 'true');
    }
  }, []);

  function toggleSidebar() {
    setCollapsed((currentValue) => {
      const nextValue = !currentValue;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
      return nextValue;
    });
  }

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col gap-8 overflow-y-auto border-r border-[var(--color-border-medium)] bg-[var(--color-bg-elevated)] px-4 py-5 transition-[width] duration-200 ease-out min-[901px]:flex ${
        collapsed ? 'w-16' : 'w-[232px]'
      }`}
    >
      <div
        className={`flex items-center justify-between gap-3 ${
          collapsed ? 'flex-col' : 'flex-row'
        }`}
      >
        <Link
          href="/"
          aria-label="Komunify home"
          className={`inline-flex items-center ${collapsed ? 'gap-0' : 'gap-3'}`}
        >
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo-mark.png`}
            alt=""
            className="h-8 w-auto shrink-0"
          />
          <span
            className={`whitespace-nowrap font-sans text-lg font-bold tracking-[0.15em] ${
              collapsed ? 'hidden' : 'inline'
            }`}
          >
            <span className="text-[var(--color-content-accent)]">K</span>
            <span className="text-[var(--color-content-primary)]">OMUNIFY</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={toggleSidebar}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-medium)] bg-[var(--color-bg-input)] text-[var(--color-content-secondary)] transition-colors duration-150 hover:border-[var(--color-border-accent)] hover:bg-[var(--color-bg-accent-tint)] hover:text-[var(--color-content-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-content-accent)]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="h-4 w-4 stroke-current"
          >
            <path
              d={collapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <nav aria-label="Member navigation" className="flex flex-col gap-0.5">
        <p
          className={`mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-content-secondary)] ${
            collapsed ? 'hidden' : 'block'
          }`}
        >
          Member
        </p>

        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-[var(--radius-md)] py-2 text-[15px] transition-colors duration-150 ${
                collapsed ? 'justify-center gap-0 px-0' : 'gap-2 px-2.5'
              } ${
                isActive
                  ? 'bg-[var(--color-bg-accent-tint)] font-semibold text-[var(--color-content-accent)]'
                  : 'text-[var(--color-content-secondary)] hover:bg-[color-mix(in_srgb,var(--color-content-accent)_6%,transparent)] hover:text-[var(--color-content-primary)]'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-content-accent)]`}
            >
              <span className="inline-flex shrink-0 items-center [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:stroke-current [&>svg]:stroke-[1.75]">
                {item.icon}
              </span>
              <span className={collapsed ? 'hidden' : 'inline'}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={`mt-auto flex flex-col items-start gap-2 text-[13px] text-[var(--color-content-secondary)] ${collapsed ? 'hidden' : 'flex'}`}>
        {isConnected && address ? (
          <>
            <code
              title={address}
              className={isAuthed ? 'inline-flex items-center gap-1 text-[var(--color-content-success)]' : undefined}
            >
              {truncateAddress(address)}
            </code>
            <button
              type="button"
              onClick={isAuthed ? handleSignOut : disconnect}
              disabled={isAuthed ? signOut.isPending : false}
              className="disconnect-link bg-transparent p-0"
            >
              {isAuthed ? 'Sign out' : 'Disconnect'}
            </button>
          </>
        ) : (
          <button type="button" onClick={connect} disabled={connecting} className="disconnect-link bg-transparent p-0">
            {connecting ? 'Connecting…' : 'Connect'}
          </button>
        )}
        <span className="text-[11px] font-medium uppercase tracking-[0.06em]">TESTNET</span>
      </div>
    </aside>
  );
}
