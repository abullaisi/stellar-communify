'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { WalletControl } from '@/components/wallet/wallet-control';
import { getStellarConfig } from '@/lib/stellar';

/**
 * Sticky app bar: brand + network badge left, wallet control right. Rendered app-wide
 * from the root layout. Hidden on the landing route `/`, which owns its own header.
 */
export function AppHeader() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  const network = getStellarConfig().network;

  return (
    <div className="app-bar">
      <div className="app-bar-brand-group">
        <Link href="/dashboard" className="app-bar-brand">
          komunify
        </Link>
        <span className="pill accent">{network}</span>
      </div>
      <WalletControl />
    </div>
  );
}
