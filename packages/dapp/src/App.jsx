import { useCallback, useEffect, useState } from "react";
import { connectWallet, signWithWallet } from "./wallet";
import {
  fetchBalance,
  fundWithFriendbot,
  buildPaymentXdr,
  submitSignedXdr,
  explorerTxUrl,
  shortAddress,
  TESTNET_PASSPHRASE,
} from "./stellar";
import {
  subscribe,
  getStats,
  classifyError,
  explorerContractUrl,
} from "./komunify";

export default function App() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [busy, setBusy] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [tx, setTx] = useState({ status: "idle", hash: "", error: "" });
  const [subAmount, setSubAmount] = useState("10");
  const [sub, setSub] = useState({ status: "idle", hash: "", error: "" });
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getStats());
    } catch {
      // stats are progressive enhancement; keep the app usable if RPC hiccups
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refreshBalance = useCallback(
    async (addr) => {
      const target = addr || address;
      if (!target) return;
      try {
        setBalance(await fetchBalance(target));
      } catch (err) {
        setConnectError(`Failed to load balance: ${err.message}`);
      }
    },
    [address]
  );

  async function connect() {
    setConnectError("");
    try {
      const addr = await connectWallet();
      setAddress(addr);
      await refreshBalance(addr);
    } catch (err) {
      setConnectError(
        err.message || "Could not connect a wallet. Is one installed?"
      );
    }
  }

  function disconnect() {
    setAddress(null);
    setBalance(null);
    setConnectError("");
    setTx({ status: "idle", hash: "", error: "" });
  }

  async function fund() {
    setBusy(true);
    setConnectError("");
    try {
      await fundWithFriendbot(address);
      await refreshBalance();
    } catch (err) {
      setConnectError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function send(e) {
    e.preventDefault();
    setTx({ status: "signing", hash: "", error: "" });
    try {
      const xdr = await buildPaymentXdr(address, destination.trim(), amount);
      const signedXdr = await signWithWallet(xdr, address, TESTNET_PASSPHRASE);
      setTx({ status: "submitting", hash: "", error: "" });
      const result = await submitSignedXdr(signedXdr);
      setTx({ status: "success", hash: result.hash, error: "" });
      setDestination("");
      setAmount("");
      await refreshBalance();
    } catch (err) {
      const codes = err?.response?.data?.extras?.result_codes;
      setTx({
        status: "error",
        hash: "",
        error: codes ? JSON.stringify(codes) : err.message || "Transaction failed",
      });
    }
  }

  async function paySubscription(e) {
    e.preventDefault();
    setSub({ status: "signing", hash: "", error: "" });
    try {
      const hash = await subscribe(address, subAmount);
      setSub({ status: "success", hash, error: "" });
      await Promise.all([refreshBalance(), loadStats()]);
    } catch (err) {
      setSub({ status: "error", hash: "", error: classifyError(err) });
    }
  }

  const sending = tx.status === "signing" || tx.status === "submitting";
  const subscribing = sub.status === "signing" || sub.status === "submitting";

  return (
    <main className="shell">
      <header>
        <div className="logo">Komunify</div>
        <p className="tagline">
          One payment. Every community. Subscriptions with on-chain revenue
          split, live on Stellar testnet.
        </p>
      </header>

      {!address ? (
        <section className="card center">
          <h2>Connect your wallet</h2>
          <p className="hint">
            Works with Freighter, xBull, Albedo, Lobstr, Hana, and more. Set
            your wallet to Testnet.
          </p>
          <button onClick={connect}>Connect Wallet</button>
          {connectError && <p className="error">{connectError}</p>}
        </section>
      ) : (
        <>
          <section className="card row">
            <div>
              <span className="label">Connected wallet</span>
              <div className="row tight">
                <code title={address}>{shortAddress(address)}</code>
                <span className="pill ok">TESTNET</span>
              </div>
            </div>
            <button className="ghost" onClick={disconnect}>
              Disconnect
            </button>
          </section>

          {connectError && <p className="error">{connectError}</p>}

          <section className="card">
            <span className="label">XLM balance</span>
            <div className="balance">
              {balance ? `${Number(balance.xlm).toLocaleString()} XLM` : "…"}
            </div>
            <div className="row tight">
              <button className="ghost" onClick={() => refreshBalance()}>
                Refresh
              </button>
              {balance && !balance.funded && (
                <button onClick={fund} disabled={busy}>
                  {busy ? "Funding…" : "Fund with Friendbot"}
                </button>
              )}
            </div>
            {balance && !balance.funded && (
              <p className="hint">
                This account isn't on the ledger yet. Friendbot sends free
                testnet XLM to activate it.
              </p>
            )}
          </section>

          <section className="card">
            <h2>Komunify Pass</h2>
            <p className="hint">
              One subscription payment, split on-chain: 70% project owner, 20%
              community manager, 10% platform. Minimum 1 XLM.
            </p>
            <form onSubmit={paySubscription}>
              <label>
                Amount (XLM)
                <input
                  value={subAmount}
                  onChange={(e) => setSubAmount(e.target.value)}
                  type="number"
                  min="1"
                  step="any"
                  required
                />
              </label>
              <button disabled={subscribing}>
                {sub.status === "signing"
                  ? "Waiting for signature…"
                  : sub.status === "submitting"
                    ? "Submitting…"
                    : "Subscribe"}
              </button>
            </form>
            {sub.status === "success" && (
              <p className="success">
                Subscribed ✓ Payment split on-chain. Transaction:{" "}
                <a
                  href={explorerTxUrl(sub.hash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <code>{sub.hash.slice(0, 10)}…</code>
                </a>
              </p>
            )}
            {sub.status === "error" && (
              <p className="error">{sub.error}</p>
            )}
          </section>

          <section className="card">
            <h2>Send a contribution</h2>
            <form onSubmit={send}>
              <label>
                Destination address
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="G…"
                  required
                />
              </label>
              <label>
                Amount (XLM)
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0.0000001"
                  step="any"
                  placeholder="10"
                  required
                />
              </label>
              <button disabled={sending}>
                {tx.status === "signing"
                  ? "Waiting for signature…"
                  : tx.status === "submitting"
                    ? "Submitting…"
                    : "Send XLM"}
              </button>
            </form>
            {tx.status === "success" && (
              <p className="success">
                Payment sent ✓ Transaction:{" "}
                <a
                  href={explorerTxUrl(tx.hash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <code>{tx.hash.slice(0, 10)}…</code>
                </a>
              </p>
            )}
            {tx.status === "error" && (
              <p className="error">Transaction failed: {tx.error}</p>
            )}
          </section>
        </>
      )}

      <section className="card">
        <span className="label">Live on-chain stats</span>
        {stats ? (
          <div className="row">
            <div>
              <span className="label">Subscribers</span>
              <div className="balance">{stats.count}</div>
            </div>
            <div>
              <span className="label">Total volume</span>
              <div className="balance">
                {stats.volumeXlm.toLocaleString()} XLM
              </div>
            </div>
          </div>
        ) : (
          <p className="hint">Loading from testnet…</p>
        )}
        <p className="hint">
          Read straight from the{" "}
          <a href={explorerContractUrl()} target="_blank" rel="noreferrer">
            Komunify contract
          </a>{" "}
          on Stellar testnet.
        </p>
      </section>

      <footer>
        Built at Build on Stellar Bootcamp Bandung · APAC Stellar Hackathon
        2026 · <a href="https://github.com/abullaisi/stellar-hackathon">GitHub</a>
      </footer>
    </main>
  );
}
