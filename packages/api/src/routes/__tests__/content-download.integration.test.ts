/**
 * Integration test for the download gate (docs/PROGRESS.md Lane B checklist): is_active ->
 * current_epoch -> has_read, in that order, against the REAL deployed testnet contracts
 * (no mocks) and a real Postgres database. `READ_NOT_RECORDED` is asserted as a normal 403,
 * not an error path.
 *
 * Fixture wallets were provisioned once by `scripts/seed-gate-test.ts` (testnet-only keypairs,
 * no real value) and committed under `./fixtures/gate-test-fixture.json`:
 *   - inactive:       funded, never subscribed
 *   - activeNoRead:   subscribed, never called record_access
 *   - activeWithRead: subscribed and called record_access against contentId
 *
 * Requires DATABASE_URL, KOMUNIFY_CONTRACT_ID, USDC_CONTRACT_ID, SOROBAN_RPC_URL to be set
 * (packages/api/.env) and hits the real testnet RPC, so this is slower than a unit test.
 */
import { execSync } from 'node:child_process';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { Keypair, hash, Networks } from '@stellar/stellar-base';
import { basicNodeSigner } from '@stellar/stellar-sdk/contract';
import { Komunify, Usdc } from '@komunify/contract-client';
import { auth } from '../auth.route.js';
import { content } from '../content.route.js';
import { errorHandler } from '../../middleware/error.middleware.js';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import type { HonoEnv } from '../../types/app.types.js';
import fixture from './fixtures/gate-test-fixture.json' with { type: 'json' };

const app = new Hono<HonoEnv>();
app.route('/auth', auth);
app.route('/content', content);
app.onError(errorHandler);

const SEP53_PREFIX = 'Stellar Signed Message:\n';

function signNonce(secret: string, nonce: string): string {
  const kp = Keypair.fromSecret(secret);
  const payload = Buffer.concat([Buffer.from(SEP53_PREFIX, 'utf-8'), Buffer.from(nonce, 'utf-8')]);
  const digest = hash(payload);
  return kp.sign(digest).toString('base64');
}

/** Runs the real challenge/verify flow and returns the `kmf_session` Set-Cookie value. */
async function loginAs(secret: string, address: string): Promise<string> {
  const challengeRes = await app.request('/auth/challenge', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  expect(challengeRes.status).toBe(200);
  const { data } = (await challengeRes.json()) as { data: { nonce: string } };

  const signature = signNonce(secret, data.nonce);
  const verifyRes = await app.request('/auth/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address, signature }),
  });
  expect(verifyRes.status).toBe(200);

  const setCookie = verifyRes.headers.get('set-cookie');
  if (!setCookie) throw new Error('no set-cookie on /auth/verify response');
  return setCookie.split(';')[0]; // "kmf_session=<jwt>"
}

describe('GET /content/:contentId/download (the gate)', () => {
  const { contentId, sha256, inactive, activeNoRead, activeWithRead } = fixture;

  beforeAll(async () => {
    // Register the fixture content as a REGISTERED row so case 4 (active+read) can pass the
    // final Postgres lookup, same as a normal upload+confirm flow would have produced.
    await prisma.content.upsert({
      where: { contractId: contentId },
      create: {
        contractId: contentId,
        title: 'Gate test fixture',
        description: 'Provisioned by scripts/seed-gate-test.ts',
        sha256,
        storageKey: 'local:gate-test-fixture',
        sizeBytes: 1,
        creatorWallet: fixture.manager.publicKey,
        status: 'REGISTERED',
      },
      update: {},
    });

    // `is_active` is epoch-scoped (Sub(member) == current_epoch(), epoch_secs=300 on this
    // deployment) — the fixture's original subscriptions from `seed-gate-test.ts` may have
    // expired by the time this test runs. (Re-)subscribe right before the assertions run so
    // cases 3/4 exercise a genuinely active subscription, topping up USDC first since each
    // `subscribe()` spends the full `price`.
    const adminSecret = execSync('stellar keys secret deployer', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const admin = Keypair.fromSecret(adminSecret);

    function kmfClient(kp: Keypair) {
      const signer = basicNodeSigner(kp, Networks.TESTNET);
      return new Komunify.Client({
        contractId: env.KOMUNIFY_CONTRACT_ID!,
        networkPassphrase: Networks.TESTNET,
        rpcUrl: env.SOROBAN_RPC_URL,
        publicKey: kp.publicKey(),
        signTransaction: signer.signTransaction,
        signAuthEntry: signer.signAuthEntry,
      });
    }
    function usdcClient(kp: Keypair) {
      const signer = basicNodeSigner(kp, Networks.TESTNET);
      return new Usdc.Client({
        contractId: env.USDC_CONTRACT_ID!,
        networkPassphrase: Networks.TESTNET,
        rpcUrl: env.SOROBAN_RPC_URL,
        publicKey: kp.publicKey(),
        signTransaction: signer.signTransaction,
        signAuthEntry: signer.signAuthEntry,
      });
    }

    const adminUsdc = usdcClient(admin);
    const activeNoReadKp = Keypair.fromSecret(activeNoRead.secret);
    const activeWithReadKp = Keypair.fromSecret(activeWithRead.secret);

    const activeNoReadKmf = kmfClient(activeNoReadKp);
    const activeWithReadKmf = kmfClient(activeWithReadKp);

    // Idempotent: subscribe() errors AlreadySubscribed (#15) if Sub(member) == current_epoch()
    // already (e.g. re-running this suite within the same 300s epoch as the prior run) — only
    // (re-)subscribe when not already active, mirroring what a real client would check first.
    const noReadActive = (await activeNoReadKmf.is_active({ member: activeNoReadKp.publicKey() })).result;
    if (!noReadActive) {
      const topUp = 200_000000n;
      await (await adminUsdc.mint({ to: activeNoReadKp.publicKey(), amount: topUp })).signAndSend();
      await (await activeNoReadKmf.subscribe({ member: activeNoReadKp.publicKey() })).signAndSend();
    }

    const withReadActive = (await activeWithReadKmf.is_active({ member: activeWithReadKp.publicKey() })).result;
    if (!withReadActive) {
      const topUp = 200_000000n;
      await (await adminUsdc.mint({ to: activeWithReadKp.publicKey(), amount: topUp })).signAndSend();
      await (await activeWithReadKmf.subscribe({ member: activeWithReadKp.publicKey() })).signAndSend();
    }

    // record_access is idempotent per (epoch, content, member) per CONTRACT_SPEC — safe to
    // call every run.
    await (
      await activeWithReadKmf.record_access({
        member: activeWithReadKp.publicKey(),
        content_id: BigInt(contentId),
      })
    ).signAndSend();
  }, 120_000);

  afterAll(async () => {
    await prisma.content.deleteMany({ where: { contractId: fixture.contentId } });
  });

  it('case 1: no session -> 401', async () => {
    const res = await app.request(`/content/${contentId}/download`);
    expect(res.status).toBe(401);
    const json = (await res.json()) as { success: boolean; code?: string };
    expect(json.success).toBe(false);
    expect(json.code).toBe('UNAUTHORIZED');
  }, 15_000);

  it('case 2: inactive subscription -> 403 SUB_INACTIVE', async () => {
    const cookie = await loginAs(inactive.secret, inactive.publicKey);
    const res = await app.request(`/content/${contentId}/download`, {
      headers: { cookie },
    });
    expect(res.status).toBe(403);
    const json = (await res.json()) as { success: boolean; code?: string };
    expect(json.success).toBe(false);
    expect(json.code).toBe('SUB_INACTIVE');
  }, 30_000);

  it('case 3: active subscription, no recorded read -> 403 READ_NOT_RECORDED (expected, not an error path)', async () => {
    const cookie = await loginAs(activeNoRead.secret, activeNoRead.publicKey);
    const res = await app.request(`/content/${contentId}/download`, {
      headers: { cookie },
    });
    expect(res.status).toBe(403);
    const json = (await res.json()) as { success: boolean; code?: string };
    expect(json.success).toBe(false);
    expect(json.code).toBe('READ_NOT_RECORDED');
  }, 30_000);

  it('case 4: active subscription with a recorded read -> 200 with a 60s signed download URL', async () => {
    const cookie = await loginAs(activeWithRead.secret, activeWithRead.publicKey);
    const res = await app.request(`/content/${contentId}/download`, {
      headers: { cookie },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      success: boolean;
      data: { url: string; expiresIn: number; sha256: string };
    };
    expect(json.success).toBe(true);
    expect(json.data.expiresIn).toBe(60);
    expect(json.data.sha256).toBe(sha256);
    expect(json.data.url).toContain(`/content/${contentId}/blob?token=`);
  }, 30_000);
});
