import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { bodyLimit } from 'hono/body-limit';
import { ConfirmRequestSchema, ContentListQuerySchema } from '@komunify/shared';
import { requireAuth } from '../middleware/auth.middleware.js';
import { BadRequestError, ForbiddenError } from '../lib/errors.js';
import { isManager } from '../lib/soroban.js';
import { readBlob } from '../lib/blob.js';
import { verifyDownloadToken } from '../lib/jwt.js';
import { created, success } from '../lib/response.js';
import { ContentService } from '../services/content.service.js';
import type { HonoEnv } from '../types/app.types.js';

const content = new Hono<HonoEnv>();

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

content.get('/', zValidator('query', ContentListQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid('query');
  const result = await ContentService.list(cursor, limit);
  return success(c, result);
});

content.post(
  '/upload',
  requireAuth,
  bodyLimit({
    maxSize: MAX_UPLOAD_BYTES + 64 * 1024, // headroom for the other multipart fields
    onError: (c) => c.json({ success: false, error: 'File exceeds the 20MB limit', code: 'CONFLICT' }, 409),
  }),
  async (c) => {
    const address = c.get('address');
    const manager = await isManager(address);
    if (!manager) {
      throw new ForbiddenError('Only managers may upload content');
    }

    const body = await c.req.parseBody();
    const file = body['file'];
    const title = body['title'];
    const description = body['description'];

    if (!(file instanceof File)) {
      throw new BadRequestError('file is required');
    }
    if (typeof title !== 'string' || !title) {
      throw new BadRequestError('title is required');
    }
    if (typeof description !== 'string' || !description) {
      throw new BadRequestError('description is required');
    }

    const result = await ContentService.upload({ file, title, description, creatorWallet: address });
    return created(c, result);
  }
);

content.post('/:draftId/confirm', requireAuth, zValidator('json', ConfirmRequestSchema), async (c) => {
  const address = c.get('address');
  const draftId = c.req.param('draftId');
  const { contentId } = c.req.valid('json');

  const result = await ContentService.confirm(draftId, contentId, address);
  return success(c, result);
});

content.get('/:contentId/download', requireAuth, async (c) => {
  const address = c.get('address');
  const contentId = c.req.param('contentId');

  const result = await ContentService.download(contentId, address);
  return success(c, result);
});

/**
 * Resolves the signed download token minted by `/download` into the actual PDF bytes. Not part
 * of the public API surface listed in API_SPEC.md's route table by name, but it IS the "signed
 * blob URL" that `/download` returns — the token carries its own 60s expiry (jose `exp` claim),
 * so no separate auth check is needed here beyond verifying the token.
 */
content.get('/:contentId/blob', async (c) => {
  const token = c.req.query('token');
  if (!token) {
    throw new BadRequestError('token is required');
  }

  const payload = await verifyDownloadToken(token).catch(() => {
    throw new ForbiddenError('Download link is invalid or has expired');
  });

  if (payload.contentId !== c.req.param('contentId')) {
    throw new ForbiddenError('Download link does not match this content');
  }

  const bytes = await readBlob(payload.storageKey);
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-store',
    },
  });
});

export { content };
