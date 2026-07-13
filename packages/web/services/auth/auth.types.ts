import type { MeResponse, VerifyResponse } from '@komunify/shared';

export type { MeResponse, VerifyResponse };

/** Session as consumed by the UI — same shape whether from /auth/me or /auth/verify. */
export type AuthSession = MeResponse;
