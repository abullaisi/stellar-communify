import { randomBytes } from 'node:crypto';
import { prisma } from '../config/database.js';
import { BadRequestError, UnauthorizedError } from '../lib/errors.js';
import { isManager } from '../lib/soroban.js';
import { verifyWalletSignature } from '../lib/wallet-signature.js';

const NONCE_TTL_MS = 5 * 60 * 1000;

function buildNonceMessage(address: string, random: string, expiresAt: Date): string {
  return `Sign in to Komunify.\n\nAddress: ${address}\nNonce: ${random}\nExpires: ${expiresAt.toISOString()}`;
}

export class AuthService {
  /** Persists a single-use nonce for `address`, returns the full human-readable string to sign. */
  static async challenge(address: string): Promise<{ nonce: string }> {
    const random = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + NONCE_TTL_MS);
    const nonce = buildNonceMessage(address, random, expiresAt);

    await prisma.nonce.create({
      data: { wallet: address, nonce, expiresAt },
    });

    return { nonce };
  }

  /**
   * Verifies the Ed25519 signature over the nonce, marks it used, and returns whether the
   * signer is a manager (simulated fresh, never cached).
   */
  static async verify(address: string, signature: string): Promise<{ address: string; isManager: boolean }> {
    const record = await prisma.nonce.findFirst({
      where: { wallet: address, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) {
      throw new BadRequestError('Unknown, expired, or already-used nonce');
    }

    const valid = verifyWalletSignature(address, record.nonce, signature);
    if (!valid) {
      throw new UnauthorizedError('Invalid signature');
    }

    await prisma.nonce.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    const managerFlag = await isManager(address);
    return { address, isManager: managerFlag };
  }

  static async me(address: string): Promise<{ address: string; isManager: boolean }> {
    const managerFlag = await isManager(address);
    return { address, isManager: managerFlag };
  }
}
