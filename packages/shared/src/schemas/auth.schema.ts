import { z } from 'zod';

/**
 * Wallet-auth (D-001). See docs/API_SPEC.md §1.
 */

export const ChallengeRequestSchema = z.object({
  address: z.string(),
});
export type ChallengeRequest = z.infer<typeof ChallengeRequestSchema>;

export const ChallengeResponseSchema = z.object({
  nonce: z.string(),
});
export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>;

export const VerifyRequestSchema = z.object({
  address: z.string(),
  signature: z.string(),
});
export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

export const VerifyResponseSchema = z.object({
  address: z.string(),
  isManager: z.boolean(),
});
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;

export const MeResponseSchema = z.object({
  address: z.string(),
  isManager: z.boolean(),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;
