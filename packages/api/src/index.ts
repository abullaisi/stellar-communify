import { Hono } from 'hono';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { corsMiddleware } from './middleware/cors.middleware.js';
import { loggerMiddleware } from './middleware/logger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { health } from './routes/health.route.js';
import { auth } from './routes/auth.route.js';
import { content } from './routes/content.route.js';
import { community } from './routes/community.route.js';
import { manager } from './routes/manager.route.js';
import { stats } from './routes/stats.route.js';
import { ContentService } from './services/content.service.js';

const app = new Hono();

// Global middleware
app.use('*', corsMiddleware);
app.use('*', loggerMiddleware);

// Routes
app.route('/health', health);
app.route('/auth', auth);
app.route('/content', content);
app.route('/community', community);
app.route('/manager', manager);
app.route('/stats', stats);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Welcome to komunify API',
    version: '0.1.0',
  });
});

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not found',
    message: `Route ${c.req.method} ${c.req.url} not found`,
  }, 404);
});

// Garbage-collect stale DRAFT content rows (and their blobs) hourly. 24h age cutoff is
// enforced inside ContentService.gcDrafts().
const DRAFT_GC_INTERVAL_MS = 60 * 60 * 1000;
setInterval(() => {
  ContentService.gcDrafts()
    .then((count) => {
      if (count > 0) logger.info(`Draft GC: removed ${count} stale draft(s)`);
    })
    .catch((err) => logger.error('Draft GC failed', { error: (err as Error).message }));
}, DRAFT_GC_INTERVAL_MS);

// Start server
const port = env.PORT;

logger.info(`Starting server in ${env.NODE_ENV} mode...`);

export default {
  port,
  fetch: app.fetch,
};

console.log(`Server running on http://localhost:${port}`);
