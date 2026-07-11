import { z } from 'zod';

/**
 * Community brand (D-010): a manager's display-only identity for their public community page —
 * name, logo, description. Keyed by wallet. Persisted server-side (not localStorage) so the
 * community page renders for any visitor. The chain stays authority on money/entitlement.
 */

const LOGO_MAX = 768 * 1024; // data: URL of a small image; generous cap, still localStorage-free

export const CommunityBrandSchema = z.object({
  wallet: z.string(),
  name: z.string(),
  description: z.string(),
  logo: z.string().nullable(), // data: URL or null
  updatedAt: z.string(), // ISO datetime
});
export type CommunityBrand = z.infer<typeof CommunityBrandSchema>;

export const SaveCommunityRequestSchema = z.object({
  name: z.string().min(1, 'Community name is required').max(80),
  description: z.string().max(500).default(''),
  logo: z.string().max(LOGO_MAX).nullable().default(null),
});
export type SaveCommunityRequest = z.infer<typeof SaveCommunityRequestSchema>;
