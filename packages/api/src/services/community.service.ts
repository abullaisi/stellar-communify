import type { SaveCommunityRequest } from '@komunify/shared';
import { prisma } from '../config/database.js';
import type { Community as CommunityRow } from '@prisma/client';

/**
 * Community brand persistence (D-010). Display-only identity keyed by manager wallet; the chain
 * stays authority on money/entitlement. Read is public (the community page); write is gated to
 * managers by the route.
 */
export class CommunityService {
  static async get(wallet: string) {
    const row = await prisma.community.findUnique({ where: { wallet } });
    return row ? toBrand(row) : null;
  }

  static async save(wallet: string, data: SaveCommunityRequest) {
    const row = await prisma.community.upsert({
      where: { wallet },
      create: { wallet, name: data.name, description: data.description, logo: data.logo },
      update: { name: data.name, description: data.description, logo: data.logo },
    });
    return toBrand(row);
  }
}

function toBrand(row: CommunityRow) {
  return {
    wallet: row.wallet,
    name: row.name,
    description: row.description,
    logo: row.logo,
    updatedAt: row.updatedAt.toISOString(),
  };
}
