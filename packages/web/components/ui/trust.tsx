'use client';

import { contractExplorerUrl, getStellarConfig } from '@/lib/stellar';

import { Icon } from './icon';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

/**
 * Mandatory mock-USDC disclaimer (D-002): the UI must state plainly that the
 * payment token is a valueless testnet mock. A short, always-visible plain line
 * carries the mandated statement; the info icon reveals the full detail on
 * hover/focus. Present near anywhere money is shown (balance, faucet, price).
 */
export function TestnetNote({ style }: { style?: React.CSSProperties }) {
  return (
    <p
      className="hint"
      style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 0, ...style }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="What is Test USDC?"
            style={{
              display: 'inline-flex',
              background: 'none',
              border: 0,
              padding: 0,
              color: 'inherit',
              cursor: 'help',
            }}
          >
            <Icon name="info" size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          Test USDC is a mock token for this Stellar testnet demo. It has no real value and
          can&apos;t be bought or sold.
        </TooltipContent>
      </Tooltip>
      <span>Test USDC · mock token, no real value</span>
    </p>
  );
}

/**
 * Inline explorer link (trust signal): wrap a word or the token symbol so it links
 * out to the live contract on Stellar Expert. Reads as interactive via a dotted
 * underline that goes solid on hover (see `.explorer-link`). `target` picks which
 * contract; defaults to the komunify contract.
 */
export function ExplorerLink({
  children,
  target = 'komunify',
  title,
  style,
}: {
  children: React.ReactNode;
  target?: 'komunify' | 'usdc';
  title?: string;
  style?: React.CSSProperties;
}) {
  const cfg = getStellarConfig();
  const id = target === 'usdc' ? cfg.usdcContractId : cfg.komunifyContractId;
  const url = contractExplorerUrl(id, cfg.network);
  if (!url) return <>{children}</>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="explorer-link"
      title={title}
      style={style}
    >
      {children}
    </a>
  );
}

/**
 * On-chain proof link (trust signal): every balance and payout in the app is real
 * Soroban contract state. Link out to the live contract on Stellar Expert so a
 * visitor can verify it independently.
 */
export function OnChainProof({ label = 'Verify on-chain', style }: { label?: string; style?: React.CSSProperties }) {
  const cfg = getStellarConfig();
  const url = contractExplorerUrl(cfg.komunifyContractId, cfg.network);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="hint"
      style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: 'var(--color-content-accent)', marginBottom: 0, ...style }}
    >
      <Icon name="shield" size={14} />
      {label}
      <Icon name="external" size={13} />
    </a>
  );
}
