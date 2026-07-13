import type { CommunityBrand, CommunityListResponse, SaveCommunityRequest } from '@komunify/shared';

import { API_ENDPOINTS } from '../api/endpoints';
import { ApiError, ApiHttp } from '../api/http';

export class CommunityService {
  /** Public: communities with published content, richest first (Explore/Communities tab). */
  static async list(): Promise<CommunityListResponse> {
    return ApiHttp.get<CommunityListResponse>(API_ENDPOINTS.community.list);
  }

  /** Public brand for a community page. Returns null when the manager hasn't set one up (404). */
  static async get(wallet: string): Promise<CommunityBrand | null> {
    try {
      return await ApiHttp.get<CommunityBrand>(API_ENDPOINTS.community.byWallet(wallet));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  /** Upsert the caller's own brand (auth + manager-gated server-side). */
  static save(data: SaveCommunityRequest): Promise<CommunityBrand> {
    return ApiHttp.put<CommunityBrand>(API_ENDPOINTS.community.save, data);
  }
}
