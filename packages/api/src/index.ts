import { Hono } from 'hono';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { corsMiddleware } from './middleware/cors.middleware.js';
import { loggerMiddleware } from './middleware/logger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { health } from './routes/health.route.js';
import { auth } from './lib/auth.js';

const app = new Hono();

// Global middleware
app.use('*', corsMiddleware);
app.use('*', loggerMiddleware);

// Better Auth — handles all /api/auth/* routes (sign-in, sign-up, sign-out, session, etc.)
app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw));

// Routes
app.route('/health', health);

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

// Start server
const port = env.PORT;

logger.info(`Starting server in ${env.NODE_ENV} mode...`);

export default {
  port,
  fetch: app.fetch,
};

console.log(`Server running on http://localhost:${port}`);
