import { getKomunifyClient } from '@/lib/contracts';

import type { ManagerContent } from './manager.types';

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

  /** `settle_member(epoch, m)` — permissionless. `epoch` must be closed (< current_epoch). */
  static async settleMember(caller: string, epoch: number, member: string) {
    const client = getKomunifyClient(caller);
    const assembled = await client.settle_member({ epoch, m: member });
    return assembled.signAndSend();
  }

  static async currentEpoch(): Promise<number> {
    const tx = await getKomunifyClient().current_epoch();
    return tx.result;
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
