'use client';

import { txExplorerUrl } from '@/lib/stellar';
import type { TxInfo } from '@/services/notes';

function shorten(value: string, head = 8, tail = 6) {
  return value.length > head + tail + 1 ? `${value.slice(0, head)}…${value.slice(-tail)}` : value;
}

function stroopsToXlm(stroops: string) {
  return (Number(stroops) / 10_000_000).toFixed(7);
}

/** Technical detail of the last submitted contract transaction. */
export function TxDetails({ tx }: { tx: TxInfo }) {
  const ok = tx.status === 'SUCCESS';
  const url = txExplorerUrl(tx.hash, tx.network);

  return (
    <div className="tx">
      <div className="row">
        <span className="label">Last transaction</span>
        <span className={`pill ${ok ? 'ok' : 'warn'}`}>{tx.status}</span>
      </div>
      <dl className="tx-grid">
        <dt className="label">Function</dt>
        <dd>
          <code>{tx.fn}</code>
        </dd>

        <dt className="label">Hash</dt>
        <dd>
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" title={tx.hash}>
              <code>{shorten(tx.hash)}</code>
            </a>
          ) : (
            <code title={tx.hash}>{shorten(tx.hash)}</code>
          )}
        </dd>

        {tx.ledger != null ? (
          <>
            <dt className="label">Ledger</dt>
            <dd>
              <code>{tx.ledger.toLocaleString()}</code>
            </dd>
          </>
        ) : null}

        {tx.feeCharged ? (
          <>
            <dt className="label">Fee</dt>
            <dd>
              <code>
                {stroopsToXlm(tx.feeCharged)} XLM
                <span style={{ opacity: 0.6 }}> · {tx.feeCharged} stroops</span>
              </code>
            </dd>
          </>
        ) : null}

        <dt className="label">Contract</dt>
        <dd>
          <code title={tx.contractId}>{shorten(tx.contractId)}</code>
        </dd>

        <dt className="label">Network</dt>
        <dd>
          <code>{tx.network}</code>
        </dd>
      </dl>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="tx-link">
          View on Stellar Expert →
        </a>
      ) : null}
    </div>
  );
}
