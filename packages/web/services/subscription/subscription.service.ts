import { getKomunifyClient, getUsdcClient } from '@/lib/contracts';

import type { Config, SubscriptionStatus } from './subscription.types';

/**
 * Reads simulate over RPC with no wallet. Writes pass the member's address as
 * `publicKey` so the contract client builds + signs via Freighter
 * (`getKomunifyClient(member)` / `getUsdcClient(member)`).
 */
export class SubscriptionService {
  static async status(member: string): Promise<SubscriptionStatus> {
    const client = getKomunifyClient();
    const [activeTx, subTx] = await Promise.all([
      client.is_active({ member }),
      client.get_subscription({ member }),
    ]);
    return { isActive: activeTx.result, expiresAt: subTx.result };
  }

  static async config(): Promise<Config> {
    const tx = await getKomunifyClient().get_config();
    const cfg = tx.result;
    return {
      admin: cfg.admin,
      epochSecs: cfg.epoch_secs,
      genesis: cfg.genesis,
      platform: cfg.platform,
      platformBps: cfg.platform_bps,
      price: cfg.price,
      token: cfg.token,
    };
  }

  /** `subscribe(member)` — require_auth(member). Moves `price` USDC into the contract. */
  static async subscribe(member: string) {
    const client = getKomunifyClient(member);
    const assembled = await client.subscribe({ member });
    return assembled.signAndSend();
  }

  static async usdcBalance(address: string): Promise<bigint> {
    const tx = await getUsdcClient().balance({ id: address });
    return tx.result;
  }

  static async usdcDecimals(): Promise<number> {
    const tx = await getUsdcClient().decimals();
    return tx.result;
  }

  /** `faucet(caller)` — 500 USDC, 24h cooldown per address (D-002). */
  static async faucet(caller: string) {
    const client = getUsdcClient(caller);
    const assembled = await client.faucet({ caller });
    return assembled.signAndSend();
  }

  static async faucetAvailableAt(who: string): Promise<bigint> {
    const tx = await getUsdcClient().faucet_available_at({ who });
    return tx.result;
  }
}
