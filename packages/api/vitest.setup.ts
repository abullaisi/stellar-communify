import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

// vitest (run via `vitest run`, whether invoked directly or as a `bun run` script) does not
// auto-load .env the way `bun run <ts-file>` does. Load it manually so config/env.ts sees
// DATABASE_URL / KOMUNIFY_CONTRACT_ID / etc without requiring a dotenv dependency.
const envPath = path.resolve(import.meta.dirname, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
