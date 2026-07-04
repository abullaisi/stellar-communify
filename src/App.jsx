import { useCallback, useState } from "react";
import {
  requestAccess,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import {
  fetchBalance,
  fundWithFriendbot,
  buildPaymentXdr,
  submitSignedXdr,
  explorerTxUrl,
  shortAddress,
  TESTNET_PASSPHRASE,
} from "./stellar";

export default function App() {
  const [address, setAddress] = useState(null);
  const [network, setNetwork] = useState(null);
  const [balance, setBalance] = useState(null);
  const [busy, setBusy] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [tx, setTx] = useState({ status: "idle", hash: "", error: "" });

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
      const access = await requestAccess();
      if (access.error) throw new Error(access.error);
      setAddress(access.address);
      const net = await getNetwork();
      if (!net.error) setNetwork(net.network);
      await refreshBalance(access.address);
    } catch (err) {
      setConnectError(
        err.message ||
          "Could not connect to Freighter. Is the extension installed?"
      );
    }
  }

  function disconnect() {
    setAddress(null);
    setNetwork(null);
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
      const signed = await signTransaction(xdr, {
        networkPassphrase: TESTNET_PASSPHRASE,
        address,
      });
      if (signed.error) throw new Error(signed.error);
      setTx({ status: "submitting", hash: "", error: "" });
      const result = await submitSignedXdr(signed.signedTxXdr ?? signed);
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

  const sending = tx.status === "signing" || tx.status === "submitting";

  return (
    <main className="shell">
      <header>
        <div className="logo">Communify</div>
        <p className="tagline">
          Community pool payments on Stellar testnet. Pool together, decide
          together, grow together.
        </p>
      </header>

      {!address ? (
        <section className="card center">
          <h2>Connect your wallet</h2>
          <p className="hint">
            Uses the Freighter browser extension, set to Testnet.
          </p>
          <button onClick={connect}>Connect Freighter</button>
          {connectError && <p className="error">{connectError}</p>}
        </section>
      ) : (
        <>
          <section className="card row">
            <div>
              <span className="label">Connected wallet</span>
              <div className="row tight">
                <code title={address}>{shortAddress(address)}</code>
                {network && (
                  <span
                    className={`pill ${network === "TESTNET" ? "ok" : "warn"}`}
                  >
                    {network}
                  </span>
                )}
              </div>
            </div>
            <button className="ghost" onClick={disconnect}>
              Disconnect
            </button>
          </section>

          {network && network !== "TESTNET" && (
            <p className="error">
              Freighter is on {network}. Switch to Testnet in the extension,
              then reconnect.
            </p>
          )}
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

      <footer>
        Built at Build on Stellar Bootcamp Bandung · APAC Stellar Hackathon
        2026 · <a href="https://github.com/abullaisi/stellar-communify">GitHub</a>
      </footer>
    </main>
  );
}
