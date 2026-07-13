import { z } from 'zod';

/**
 * Content upload / registry / download. See docs/API_SPEC.md §2.
 *
 * `contentId` is a stringified `u64` (contract type) — never a JSON number.
 */

export const ContentListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ContentListQuery = z.infer<typeof ContentListQuerySchema>;

export const ContentListItemSchema = z.object({
  contentId: z.string(), // stringified u64
  title: z.string(),
  description: z.string(),
  sha256: z.string(),
  sizeBytes: z.number().int(),
  creatorWallet: z.string(),
  createdAt: z.string(), // ISO datetime
});
export type ContentListItem = z.infer<typeof ContentListItemSchema>;

export const ContentListResponseSchema = z.object({
  items: z.array(ContentListItemSchema),
  nextCursor: z.string().nullable(),
});
export type ContentListResponse = z.infer<typeof ContentListResponseSchema>;

export const UploadResponseSchema = z.object({
  draftId: z.string(),
  sha256: z.string(),
  sizeBytes: z.number().int(),
});
export type UploadResponse = z.infer<typeof UploadResponseSchema>;

export const ConfirmRequestSchema = z.object({
  contentId: z.string(), // stringified u64
  txHash: z.string(),
});
export type ConfirmRequest = z.infer<typeof ConfirmRequestSchema>;

export const ConfirmResponseSchema = z.object({
  contentId: z.string(),
  status: z.literal('REGISTERED'),
});
export type ConfirmResponse = z.infer<typeof ConfirmResponseSchema>;

export const DownloadResponseSchema = z.object({
  url: z.string(),
  expiresIn: z.number().int(),
  sha256: z.string(),
});
export type DownloadResponse = z.infer<typeof DownloadResponseSchema>;
