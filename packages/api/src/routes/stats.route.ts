import { Hono } from 'hono';
import { success } from '../lib/response.js';
import { getStatsResult } from '../services/stats.service.js';

const stats = new Hono();

stats.get('/', async (c) => {
  const result = await getStatsResult();
  return success(c, result);
});

export { stats };
