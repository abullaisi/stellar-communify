import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.middleware.js';
import { AppError, ForbiddenError } from '../lib/errors.js';
import { isManager } from '../lib/soroban.js';
import { success } from '../lib/response.js';
import { pendingForManager, settleAllLastClosedCycle } from '../services/settle.service.js';
import type { HonoEnv } from '../types/app.types.js';

const manager = new Hono<HonoEnv>();

/**
 * Read-only preview of "pay out all readers" for this manager — what settle-all would move into
 * their Accrued balance if run right now, without settling anything.
 */
manager.get('/pending', requireAuth, async (c) => {
  const address = c.get('address');
  if (!(await isManager(address))) {
    throw new ForbiddenError('Only community managers can view pending payouts');
  }
  const result = await pendingForManager(address);
  return success(c, result);
});

/**
 * Auth + manager-gated: settle every un-settled subscriber for the last closed cycle in one call
 * (approach C). The heavy lifting — signing the permissionless `settle_member` per member — is done
 * server-side by the `SETTLE_SIGNER_SECRET` keypair, so the manager signs nothing. Manager-gated
 * only to keep it off public traffic; `settle_member` itself is permissionless on-chain.
 */
manager.post('/settle-all', requireAuth, async (c) => {
  const address = c.get('address');
  if (!(await isManager(address))) {
    throw new ForbiddenError('Only community managers can settle a cycle');
  }
  try {
    const result = await settleAllLastClosedCycle();
    return success(c, result);
  } catch (err) {
    if (err instanceof Error && err.message === 'SETTLE_SIGNER_NOT_CONFIGURED') {
      throw new AppError('Settle-all is not configured on this server (no signer key)', 503);
    }
    throw err;
  }
});

export { manager };
