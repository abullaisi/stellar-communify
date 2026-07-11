import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Session signing (wallet auth, D-001). Dev-only fallback below — set a real
  // secret in .env for anything beyond local development.
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters')
    .default('dev-only-insecure-secret-change-me-please'),

  // Blob storage. Vercel Blob when BLOB_READ_WRITE_TOKEN is set; local disk otherwise (dev
  // fallback, D-005). Signed download URLs are always minted by this API regardless of backend.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  BLOB_LOCAL_DIR: z.string().default('.blobs'),
  API_BASE_URL: z.string().default('http://localhost:3001'),

  // Stellar / Soroban — unprefixed equivalents of the web app's NEXT_PUBLIC_* vars
  STELLAR_NETWORK: z.string().default('testnet'),
  SOROBAN_RPC_URL: z.string().default('https://soroban-testnet.stellar.org'),
  KOMUNIFY_CONTRACT_ID: z.string().optional(),
  USDC_CONTRACT_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
