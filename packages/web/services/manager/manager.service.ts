import { getKomunifyClient } from '@/lib/contracts';
import { ApiHttp } from '@/services/api/http';
import { API_ENDPOINTS } from '@/services/api/endpoints';

import type { ManagerContent, PendingResult, SettleAllResult } from './manager.types';

/**
 * Manager-side contract reads/writes. `GET /content` (API_SPEC.md §2, Lane B) only carries
 * Postgres title/description metadata, which does not exist yet — this domain talks to the
 * `komunify` contract directly for everything (D-006: role + content are chain-derived).
 */
export class ManagerService {
  static async isManager(who: string): Promise<boolean> {
    const tx = await getKomunifyClient().is_manager({ who });
    return tx.result;
  }

  /** Content this wallet manages, this epoch's unique-read count attached (display only). */
  static async myContent(address: string): Promise<ManagerContent[]> {
    const client = getKomunifyClient();
    const [listTx, epochTx] = await Promise.all([
      client.list_content({ start: 1n, limit: 100 }),
      client.current_epoch(),
    ]);
    const mine = listTx.result.filter((c) => c.managers.includes(address));
    const epoch = epochTx.result;

    const withReads = await Promise.all(
      mine.map(async (c) => {
        const readsTx = await client.get_content_reads({ epoch, content_id: c.id });
        return {
          id: c.id.toString(),
          creator: c.creator,
          managers: c.managers,
          active: c.active,
          sha256: Buffer.from(c.sha256).toString('hex'),
          epochReads: readsTx.result,
        } satisfies ManagerContent;
      }),
    );
    return withReads;
  }

  static async accrued(who: string): Promise<bigint> {
    const tx = await getKomunifyClient().get_accrued({ who });
    return tx.result;
  }

  /** `claim(caller)` — require_auth(caller). NothingToClaim if accrued is 0. */
  static async claim(caller: string) {
    const client = getKomunifyClient(caller);
    const assembled = await client.claim({ caller });
    return assembled.signAndSend();
  }

  /**
   * `POST /manager/settle-all` — server signs `settle_member` for every un-settled subscriber of
   * the last closed cycle (approach C). No wallet prompt; the caller just needs a manager session.
   */
  static async settleAll(): Promise<SettleAllResult> {
    return ApiHttp.post<SettleAllResult>(API_ENDPOINTS.manager.settleAll, {});
  }

  /**
   * `GET /manager/pending` — read-only preview of what settle-all would move into this manager's
   * Accrued balance if run right now. `amount` is a stringified base-unit `i128`.
   */
  static async pending(): Promise<PendingResult> {
    return ApiHttp.get<PendingResult>(API_ENDPOINTS.manager.pending);
  }

  static async currentEpoch(): Promise<number> {
    const tx = await getKomunifyClient().current_epoch();
    return tx.result;
  }

  /**
   * `force_close_epoch(admin)` — admin-only demo/operator tool (D-012). Ends the current
   * billing cycle now so its earnings become settleable; a fresh cycle starts immediately.
   *
   * NOTE: this method lands in the generated bindings only after `make bindings` against the
   * D-012 redeploy. Typed shim below so the app compiles and works the moment bindings regenerate
   * — remove the shim and call `client.force_close_epoch({ admin: caller })` directly then.
   */
  static async forceCloseEpoch(caller: string) {
    const client = getKomunifyClient(caller) as unknown as {
      force_close_epoch: (args: { admin: string }) => Promise<{ signAndSend: () => Promise<unknown> }>;
    };
    const assembled = await client.force_close_epoch({ admin: caller });
    return assembled.signAndSend();
  }

  /**
   * Self-register as a manager (D-011, permissionless): `set_manager(caller, true)` signed by the
   * caller's own wallet — require_auth(caller) on-chain, no admin key. This is the "start a
   * community" action; after it lands, `is_manager(caller)` is true and `register_content` works.
   */
  static async becomeManager(caller: string) {
    const client = getKomunifyClient(caller);
    const assembled = await client.set_manager({ who: caller, enabled: true });
    return assembled.signAndSend();
  }

  /** `register_content(caller, sha256)` — require_auth(caller), caller must be a manager. */
  static async registerContent(caller: string, sha256: Uint8Array): Promise<bigint> {
    const client = getKomunifyClient(caller);
    const assembled = await client.register_content({
      caller,
      sha256: Buffer.from(sha256),
    });
    const result = await assembled.signAndSend();
    return result.result;
  }
}
