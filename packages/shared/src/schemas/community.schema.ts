import { z } from 'zod';

/**
 * Community brand (D-010): a manager's display-only identity for their public community page —
 * name, logo, description. Keyed by wallet. Persisted server-side (not localStorage) so the
 * community page renders for any visitor. The chain stays authority on money/entitlement.
 */

const LOGO_MAX = 768 * 1024; // data: URL of a small image; generous cap, still localStorage-free

/**
 * A logo must be an inline raster-image data URL — the exact shape the browser's
 * FileReader.readAsDataURL produces. Rejecting anything else closes three holes on this
 * user-controlled, publicly-rendered field: external URLs (a `https://…/pixel.png` logo is a
 * tracking beacon that deanonymizes everyone who opens the community page), non-image payloads,
 * and SVG (whose embedded scripts are a latent XSS surface if the <img> render is ever changed).
 */
const LOGO_DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;

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
  logo: z
    .string()
    .max(LOGO_MAX)
    .regex(LOGO_DATA_URL, 'Logo must be a PNG, JPEG, WebP, or GIF image')
    .nullable()
    .default(null),
});
export type SaveCommunityRequest = z.infer<typeof SaveCommunityRequestSchema>;

/** A community brand plus how many REGISTERED contents it has — for the Explore/Communities list. */
export const CommunityListItemSchema = CommunityBrandSchema.extend({
  contentCount: z.number().int(),
});
export type CommunityListItem = z.infer<typeof CommunityListItemSchema>;

export const CommunityListResponseSchema = z.object({
  communities: z.array(CommunityListItemSchema),
});
export type CommunityListResponse = z.infer<typeof CommunityListResponseSchema>;
