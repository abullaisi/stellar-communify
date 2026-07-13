import { signMessage } from '@stellar/freighter-api';
import type { ChallengeResponse, MeResponse, VerifyResponse } from '@komunify/shared';

import { API_ENDPOINTS } from '../api/endpoints';
import { ApiHttp } from '../api/http';

/** Browser-safe bytes -> base64, no Node `Buffer` dependency. */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export class AuthService {
  static challenge(address: string) {
    return ApiHttp.post<ChallengeResponse>(API_ENDPOINTS.auth.challenge, { address });
  }

  static verify(address: string, signature: string) {
    return ApiHttp.post<VerifyResponse>(API_ENDPOINTS.auth.verify, { address, signature });
  }

  static logout() {
    return ApiHttp.post<void>(API_ENDPOINTS.auth.logout);
  }

  static me() {
    return ApiHttp.get<MeResponse>(API_ENDPOINTS.auth.me);
  }

  /**
   * Full wallet-auth flow (D-001): challenge -> Freighter `signMessage` -> verify.
   *
   * Freighter's `signMessage` return shape has changed across versions (v3:
   * `signedMessage: Buffer | null`, v4: `signedMessage: string`) — see D-001 /
   * `docs/PROGRESS.md` "Discovered facts" for Lane B's confirmed encoding once
   * they land it. Until then this normalizes both shapes to a base64 string;
   * revisit if Lane B's verifier expects something else.
   */
  static async signIn(address: string): Promise<VerifyResponse> {
    const { nonce } = await this.challenge(address);
    const res = await signMessage(nonce, { address });
    if (res.error) throw new Error(res.error.message);

    const signature =
      typeof res.signedMessage === 'string'
        ? res.signedMessage
        : bytesToBase64(new Uint8Array(res.signedMessage ?? []));

    return this.verify(address, signature);
  }
}
