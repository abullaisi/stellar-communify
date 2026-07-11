import { createHash } from 'node:crypto';
import { ContentStatus, type Content as ContentRow } from '@prisma/client';
import { prisma } from '../config/database.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../lib/errors.js';
import { deleteBlob, storeBlob } from '../lib/blob.js';
import { signDownloadToken } from '../lib/jwt.js';
import { currentEpoch, getContent, hasRead, isActive } from '../lib/soroban.js';
import { env } from '../config/env.js';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const DRAFT_GC_AGE_MS = 24 * 60 * 60 * 1000;
const DOWNLOAD_EXPIRES_IN = 60;

export class ContentService {
  static async upload(params: { file: File; title: string; description: string; creatorWallet: string }) {
    const { file, title, description, creatorWallet } = params;

    if (file.type !== 'application/pdf') {
      throw new ConflictError('Only application/pdf uploads are accepted');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ConflictError('File exceeds the 20MB limit');
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash('sha256').update(bytes).digest('hex');

    const existing = await prisma.content.findUnique({ where: { sha256 } });
    if (existing) {
      throw new ConflictError('A file with this content hash has already been uploaded', { sha256 });
    }

    const { storageKey } = await storeBlob(sha256, bytes);

    const draft = await prisma.content.create({
      data: {
        title,
        description,
        sha256,
        storageKey,
        sizeBytes: bytes.length,
        creatorWallet,
        status: ContentStatus.DRAFT,
      },
    });

    return { draftId: draft.id, sha256: draft.sha256, sizeBytes: draft.sizeBytes };
  }

  /**
   * Verifies on-chain `get_content(contentId)` has a matching sha256 and a creator equal to the
   * session wallet before flipping the draft to REGISTERED. Never trusts the client's contentId
   * blindly — it is only accepted once the chain corroborates it.
   */
  static async confirm(draftId: string, contentId: string, sessionWallet: string) {
    const draft = await prisma.content.findUnique({ where: { id: draftId } });
    if (!draft) {
      throw new NotFoundError('Draft not found');
    }
    if (draft.creatorWallet !== sessionWallet) {
      throw new ForbiddenError('Only the draft creator may confirm it');
    }
    if (draft.status === ContentStatus.REGISTERED) {
      // Idempotent: already confirmed with this same contentId is fine, a different one is not.
      if (draft.contractId === contentId) {
        return { contentId, status: 'REGISTERED' as const };
      }
      throw new ConflictError('Draft already confirmed under a different content id');
    }

    let onChain;
    try {
      onChain = await getContent(BigInt(contentId));
    } catch {
      throw new ConflictError('No content registered on-chain with that id');
    }

    const onChainSha256 = Buffer.from(onChain.sha256).toString('hex');
    if (onChainSha256 !== draft.sha256) {
      throw new ConflictError('On-chain sha256 does not match the uploaded file');
    }
    if (onChain.creator !== sessionWallet) {
      throw new ConflictError('On-chain creator does not match the session wallet');
    }

    const existingConfirmed = await prisma.content.findUnique({ where: { contractId: contentId } });
    if (existingConfirmed && existingConfirmed.id !== draft.id) {
      throw new ConflictError('This content id is already confirmed against a different draft');
    }

    const updated = await prisma.content.update({
      where: { id: draftId },
      data: { contractId: contentId, status: ContentStatus.REGISTERED },
    });

    return { contentId: updated.contractId as string, status: 'REGISTERED' as const };
  }

  static async list(cursor: string | undefined, limit: number) {
    const rows = await prisma.content.findMany({
      where: { status: ContentStatus.REGISTERED },
      orderBy: { id: 'asc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const items = (hasMore ? rows.slice(0, limit) : rows).map(toListItem);
    const nextCursor = hasMore ? rows[limit - 1].id : null;

    return { items, nextCursor };
  }

  /**
   * The download gate (API_SPEC.md §2): is_active -> current_epoch -> has_read, in order. Only
   * then mints a 60s signed download token. `READ_NOT_RECORDED` is a normal 403, not an error path.
   */
  static async download(contentId: string, address: string) {
    const active = await isActive(address);
    if (!active) {
      throw new ForbiddenError('Subscription is not active', undefined, 'SUB_INACTIVE');
    }

    const epoch = await currentEpoch();

    const read = await hasRead(epoch, BigInt(contentId), address);
    if (!read) {
      throw new ForbiddenError('Read has not been recorded for this epoch', undefined, 'READ_NOT_RECORDED');
    }

    const row = await prisma.content.findUnique({
      where: { contractId: contentId, status: ContentStatus.REGISTERED },
    });
    if (!row) {
      throw new NotFoundError('Content not found');
    }

    const token = await signDownloadToken({ contentId, storageKey: row.storageKey });
    const url = `${env.API_BASE_URL}/content/${contentId}/blob?token=${encodeURIComponent(token)}`;

    return { url, expiresIn: DOWNLOAD_EXPIRES_IN, sha256: row.sha256 };
  }

  /** Deletes DRAFT rows (and their blobs) older than 24h. */
  static async gcDrafts(): Promise<number> {
    const cutoff = new Date(Date.now() - DRAFT_GC_AGE_MS);
    const stale = await prisma.content.findMany({
      where: { status: ContentStatus.DRAFT, createdAt: { lt: cutoff } },
    });

    for (const row of stale) {
      await deleteBlob(row.storageKey).catch(() => undefined);
      await prisma.content.delete({ where: { id: row.id } }).catch(() => undefined);
    }

    return stale.length;
  }
}

function toListItem(row: ContentRow) {
  return {
    contentId: row.contractId as string,
    title: row.title,
    description: row.description,
    sha256: row.sha256,
    sizeBytes: row.sizeBytes,
    creatorWallet: row.creatorWallet,
    createdAt: row.createdAt.toISOString(),
  };
}
