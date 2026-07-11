import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { SaveCommunityRequestSchema } from '@komunify/shared';
import { requireAuth } from '../middleware/auth.middleware.js';
import { ForbiddenError, NotFoundError } from '../lib/errors.js';
import { isManager } from '../lib/soroban.js';
import { success } from '../lib/response.js';
import { CommunityService } from '../services/community.service.js';
import type { HonoEnv } from '../types/app.types.js';

const community = new Hono<HonoEnv>();

/** Public: a community's brand for its page. 404 if the manager hasn't set one up. */
community.get('/:wallet', async (c) => {
  const wallet = c.req.param('wallet');
  const brand = await CommunityService.get(wallet);
  if (!brand) {
    throw new NotFoundError('Community not found');
  }
  return success(c, brand);
});

/** Auth + manager-gated: upsert the caller's own community brand. Wallet comes from the session. */
community.put('/', requireAuth, zValidator('json', SaveCommunityRequestSchema), async (c) => {
  const address = c.get('address');
  const manager = await isManager(address);
  if (!manager) {
    throw new ForbiddenError('Only managers may set a community brand');
  }
  const brand = await CommunityService.save(address, c.req.valid('json'));
  return success(c, brand);
});

export { community };
