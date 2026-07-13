import type { SaveCommunityRequest } from '@komunify/shared';
import { prisma } from '../config/database.js';
import { ContentStatus, type Community as CommunityRow } from '@prisma/client';

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

  /**
   * Communities that have published content, richest first — for the Explore/Communities tab.
   * Content lives in the `Content` table keyed by `creatorWallet`; we count REGISTERED rows per
   * creator, keep only creators that also have a saved brand, and sort by that count desc.
   */
  static async listWithContent() {
    const counts = await prisma.content.groupBy({
      by: ['creatorWallet'],
      where: { status: ContentStatus.REGISTERED },
      _count: { _all: true },
    });
    if (counts.length === 0) return [];

    const countByWallet = new Map(counts.map((c) => [c.creatorWallet, c._count._all]));
    const rows = await prisma.community.findMany({
      where: { wallet: { in: [...countByWallet.keys()] } },
    });
    return rows
      .map((row) => ({ ...toBrand(row), contentCount: countByWallet.get(row.wallet) ?? 0 }))
      .sort((a, b) => b.contentCount - a.contentCount);
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
