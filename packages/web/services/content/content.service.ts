import type { ConfirmResponse, ContentListResponse, UploadResponse } from '@komunify/shared';

import { getKomunifyClient } from '@/lib/contracts';

import { API_ENDPOINTS } from '../api/endpoints';
import { ApiHttp } from '../api/http';
import type { ContentGridItem, DownloadResponse } from './content.types';

export class ContentService {
  /** Public list of REGISTERED content metadata. Never returns a download URL. */
  static list(cursor?: string): Promise<ContentListResponse> {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return ApiHttp.get<ContentListResponse>(`${API_ENDPOINTS.content.list}${qs}`);
  }

  /**
   * `GET /content` (Lane B) hasn't landed yet, so the grid falls back to `list_content`
   * directly — real ids/active flags from the deployed contract, no title/description
   * (that metadata lives only in Postgres). Swap to `list()` once the route ships.
   */
  static async listOnChain(): Promise<ContentGridItem[]> {
    const tx = await getKomunifyClient().list_content({ start: 1n, limit: 100 });
    return tx.result
      .filter((c) => c.active)
      .map((c) => ({
        contentId: c.id.toString(),
        title: `Content #${c.id}`,
        active: c.active,
        creatorWallet: c.creator,
      }));
  }

  static async currentEpoch(): Promise<number> {
    const tx = await getKomunifyClient().current_epoch();
    return tx.result;
  }

  static async hasRead(epoch: number, contentId: bigint, member: string): Promise<boolean> {
    const tx = await getKomunifyClient().has_read({ epoch, content_id: contentId, member });
    return tx.result;
  }

  static async isActive(member: string): Promise<boolean> {
    const tx = await getKomunifyClient().is_active({ member });
    return tx.result;
  }

  /**
   * `record_access(member, content_id)` — require_auth(member), idempotent per
   * (epoch, content, member) (PLAN.md §2 step 3-4). Safe to call even if a read
   * was already recorded; it just costs a fee on retry.
   */
  static async recordAccess(member: string, contentId: bigint) {
    const client = getKomunifyClient(member);
    const assembled = await client.record_access({ member, content_id: contentId });
    return assembled.signAndSend();
  }

  /** The gate — `GET /content/:id/download` (API_SPEC.md §2). */
  static download(contentId: string): Promise<DownloadResponse> {
    return ApiHttp.get<DownloadResponse>(API_ENDPOINTS.content.download(contentId));
  }

  /**
   * Step 1 of the manager upload stepper (API_SPEC.md §2): multipart PDF upload, server
   * hashes + stores the draft. Blob custody is API-only — there is no on-chain fallback for
   * this step. Requires Lane B's `/content/upload` route + a session cookie.
   */
  static upload(file: File, title: string, description: string): Promise<UploadResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    form.append('description', description);
    return ApiHttp.postForm<UploadResponse>(API_ENDPOINTS.content.upload, form);
  }

  /** Step 3: after the browser's `register_content` tx confirms, tell the API to flip the draft. */
  static confirm(draftId: string, contentId: string, txHash: string): Promise<ConfirmResponse> {
    return ApiHttp.post<ConfirmResponse>(API_ENDPOINTS.content.confirm(draftId), {
      contentId,
      txHash,
    });
  }
}
