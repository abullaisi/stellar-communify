import type { Context, Next } from 'hono';
import { auth } from '../lib/auth.js';
import { UnauthorizedError } from '../lib/errors.js';

/**
 * Middleware to require an authenticated session.
 * Attaches the session to c.get('session') on success.
 *
 * Usage:
 *   app.get('/protected', requireAuth, (c) => {
 *     const session = c.get('session');
 *     return c.json({ user: session.user });
 *   });
 */
export async function requireAuth(c: Context, next: Next): Promise<void> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    throw new UnauthorizedError('Authentication required');
  }

  c.set('session', session);
  await next();
}

/**
 * Optional auth middleware — attaches session if present, continues either way.
 * Use for routes that behave differently for authenticated vs. anonymous users.
 */
export async function optionalAuth(c: Context, next: Next): Promise<void> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (session) {
    c.set('session', session);
  }

  await next();
}
