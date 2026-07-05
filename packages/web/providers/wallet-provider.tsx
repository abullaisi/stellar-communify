'use client';

import {
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
  WatchWalletChanges,
} from '@stellar/freighter-api';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface WalletState {
  /** Freighter extension detected in the browser. */
  isInstalled: boolean;
  /** User has granted access and an address is available. */
  isConnected: boolean;
  /** Connected account public key (G...), or null. */
  address: string | null;
  /** Active Freighter network name (e.g. "TESTNET"), or null. */
  network: string | null;
  connecting: boolean;
  /** Re-reading address/network from the extension. */
  refreshing: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  /** Re-read the current address + network from Freighter on demand. */
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect the extension and restore an already-authorized session on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const { isConnected: installed } = await isConnected();
      if (!active) return;
      setIsInstalled(installed);
      if (!installed) return;

      const addr = await getAddress();
      if (active && !addr.error && addr.address) {
        setAddress(addr.address);
        const net = await getNetwork();
        if (active && !net.error) setNetwork(net.network);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // React to account / network changes made inside the Freighter extension.
  useEffect(() => {
    const watcher = new WatchWalletChanges(2000);
    watcher.watch((changes) => {
      // Only reflect changes once the user has connected (address known locally).
      setAddress((prev) => (prev ? changes.address || null : prev));
      if (changes.network) setNetwork(changes.network);
    });
    return () => watcher.stop();
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const { isConnected: installed } = await isConnected();
      setIsInstalled(installed);
      if (!installed) {
        throw new Error('Freighter is not installed. Get it at https://www.freighter.app');
      }

      const access = await requestAccess();
      if (access.error || !access.address) {
        throw new Error(access.error?.message || 'Access to Freighter was denied');
      }
      setAddress(access.address);

      const net = await getNetwork();
      if (!net.error) setNetwork(net.network);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Freighter has no revoke API; clear local session state.
    setAddress(null);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const addr = await getAddress();
      if (!addr.error && addr.address) setAddress(addr.address);
      const net = await getNetwork();
      if (!net.error) setNetwork(net.network);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const value = useMemo<WalletState>(
    () => ({
      isInstalled,
      isConnected: !!address,
      address,
      network,
      connecting,
      refreshing,
      error,
      connect,
      disconnect,
      refresh,
    }),
    [isInstalled, address, network, connecting, refreshing, error, connect, disconnect, refresh],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

/** Access the connected Freighter wallet. Must be used under <WalletProvider>. */
export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}
