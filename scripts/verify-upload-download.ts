/**
 * Headless end-to-end proof of the manager "add content" loop (TASK 1 acceptance test):
 *
 *   upload PDF -> register_content (on-chain) -> confirm -> subscribe + record_access ->
 *   GET /content/:id/download -> fetch the signed blob URL -> the PDF bytes come back intact.
 *
 * Uses the whitelisted `manager` keypair from the download-gate fixture as BOTH publisher and
 * reader (a manager can also subscribe + read). Signs the auth challenge with the same SEP-53
 * framing the real Freighter flow uses, so this exercises the exact server verifier — the only
 * thing it can't do is click Freighter, which is a browser concern handled in the UI.
 *
 * Requires the API running on API_BASE (default :3001) and packages/api/.env vars in the env.
 * Run: `bun scripts/verify-upload-download.ts`
 */
import { Keypair, hash, Networks } from '@stellar/stellar-base';
import { basicNodeSigner } from '@stellar/stellar-sdk/contract';
import { Komunify, Usdc } from '@komunify/contract-client';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const RPC_URL = process.env.SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const NETWORK = Networks.TESTNET;
const KOMUNIFY_ID = process.env.KOMUNIFY_CONTRACT_ID!;
const USDC_ID = process.env.USDC_CONTRACT_ID!;
const SEP53_PREFIX = 'Stellar Signed Message:\n';

const fixture = JSON.parse(
  readFileSync(new URL('../packages/api/src/routes/__tests__/fixtures/gate-test-fixture.json', import.meta.url), 'utf8'),
) as { manager: { publicKey: string; secret: string } };

function kmf(kp: Keypair) {
  const s = basicNodeSigner(kp, NETWORK);
  return new Komunify.Client({
    contractId: KOMUNIFY_ID,
    networkPassphrase: NETWORK,
    rpcUrl: RPC_URL,
    publicKey: kp.publicKey(),
    signTransaction: s.signTransaction,
    signAuthEntry: s.signAuthEntry,
  });
}
function usdc(kp: Keypair) {
  const s = basicNodeSigner(kp, NETWORK);
  return new Usdc.Client({
    contractId: USDC_ID,
    networkPassphrase: NETWORK,
    rpcUrl: RPC_URL,
    publicKey: kp.publicKey(),
    signTransaction: s.signTransaction,
    signAuthEntry: s.signAuthEntry,
  });
}

/** A tiny but valid PDF; unique per run so its sha256 never collides (avoids the 409 dedupe). */
function makePdf(): Buffer {
  const marker = `komunify-e2e ${Date.now()} ${Math.random()}`;
  return Buffer.from(
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n` +
      `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n` +
      `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n` +
      `% ${marker}\n` +
      `trailer<</Root 1 0 R>>\n%%EOF\n`,
    'utf8',
  );
}

async function login(kp: Keypair): Promise<string> {
  const cRes = await fetch(`${API_BASE}/auth/challenge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address: kp.publicKey() }),
  });
  const cBody = (await cRes.json()) as { data: { nonce: string } };
  const nonce = cBody.data.nonce;
  const digest = hash(Buffer.concat([Buffer.from(SEP53_PREFIX, 'utf-8'), Buffer.from(nonce, 'utf-8')]));
  const signature = kp.sign(digest).toString('base64');
  const vRes = await fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address: kp.publicKey(), signature }),
  });
  if (!vRes.ok) throw new Error(`verify failed: ${vRes.status} ${await vRes.text()}`);
  const cookie = vRes.headers.get('set-cookie');
  if (!cookie) throw new Error('no set-cookie on verify');
  return cookie.split(';')[0];
}

async function main() {
  const kp = Keypair.fromSecret(fixture.manager.secret);
  console.log(`Manager: ${kp.publicKey()}`);

  // Make sure the wallet can pay fees.
  await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`).catch(() => {});

  // 1. Auth (challenge -> SEP-53 sign -> verify), get the session cookie.
  const cookie = await login(kp);
  console.log('1. logged in (kmf_session set)');

  // 2. Upload a real PDF (multipart) -> DRAFT row + sha256.
  const pdf = makePdf();
  const localSha = createHash('sha256').update(pdf).digest('hex');
  const form = new FormData();
  form.append('file', new Blob([pdf], { type: 'application/pdf' }), 'e2e.pdf');
  form.append('title', 'E2E verification doc');
  form.append('description', 'Uploaded by scripts/verify-upload-download.ts');
  const upRes = await fetch(`${API_BASE}/content/upload`, { method: 'POST', headers: { cookie }, body: form });
  if (!upRes.ok) throw new Error(`upload failed: ${upRes.status} ${await upRes.text()}`);
  const up = (await upRes.json()) as { data: { draftId: string; sha256: string } };
  if (up.data.sha256 !== localSha) throw new Error(`server sha256 ${up.data.sha256} != local ${localSha}`);
  console.log(`2. uploaded draft ${up.data.draftId}, sha256 ${up.data.sha256.slice(0, 16)}…`);

  // 3. register_content on-chain (real signed tx) -> new content id.
  const shaBytes = Buffer.from(up.data.sha256, 'hex');
  const regTx = await kmf(kp).register_content({ caller: kp.publicKey(), sha256: shaBytes });
  const sent = await regTx.signAndSend();
  const contentId = (regTx.result as bigint).toString();
  console.log(`3. register_content -> content #${contentId} (tx ${sent.sendTransactionResponse?.hash ?? '?'})`);

  // 4. Confirm: server re-checks the on-chain sha256 + creator, flips DRAFT -> REGISTERED.
  const confRes = await fetch(`${API_BASE}/content/${up.data.draftId}/confirm`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ contentId, txHash: sent.sendTransactionResponse?.hash ?? '' }),
  });
  if (!confRes.ok) throw new Error(`confirm failed: ${confRes.status} ${await confRes.text()}`);
  console.log(`4. confirmed content #${contentId} -> REGISTERED`);

  // 5. Ensure the reader (same wallet) has an active subscription + a recorded read.
  const km = kmf(kp);
  const active = (await km.is_active({ member: kp.publicKey() })).result;
  if (!active) {
    const adminSecret = execSync('stellar keys secret deployer', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const admin = Keypair.fromSecret(adminSecret);
    await (await usdc(admin).mint({ to: kp.publicKey(), amount: 200_000000n })).signAndSend();
    await (await km.subscribe({ member: kp.publicKey() })).signAndSend();
    console.log('5a. minted USDC + subscribed');
  } else {
    console.log('5a. already active this epoch');
  }
  await (await km.record_access({ member: kp.publicKey(), content_id: BigInt(contentId) })).signAndSend();
  console.log('5b. record_access recorded');

  // 6. The gate: GET /content/:id/download -> signed 60s URL.
  const dlRes = await fetch(`${API_BASE}/content/${contentId}/download`, { headers: { cookie } });
  if (!dlRes.ok) throw new Error(`download gate failed: ${dlRes.status} ${await dlRes.text()}`);
  const dl = (await dlRes.json()) as { data: { url: string; expiresIn: number; sha256: string } };
  console.log(`6. download URL minted (expires ${dl.data.expiresIn}s): ${dl.data.url.slice(0, 72)}…`);

  // 7. Fetch the blob and prove the PDF comes back byte-identical.
  const blobRes = await fetch(dl.data.url);
  if (!blobRes.ok) throw new Error(`blob fetch failed: ${blobRes.status}`);
  const gotBytes = Buffer.from(await blobRes.arrayBuffer());
  const gotSha = createHash('sha256').update(gotBytes).digest('hex');
  const ct = blobRes.headers.get('content-type');
  if (gotSha !== localSha) throw new Error(`downloaded sha256 ${gotSha} != uploaded ${localSha}`);
  if (ct !== 'application/pdf') throw new Error(`unexpected content-type ${ct}`);
  if (!gotBytes.subarray(0, 5).toString('latin1').startsWith('%PDF-')) throw new Error('not a PDF');

  console.log(`7. downloaded ${gotBytes.length} bytes, content-type ${ct}, sha256 matches ✔`);
  console.log('\nPASS — full upload → register → confirm → record_access → download loop verified.');
}

main().catch((e) => {
  console.error('\nFAIL:', e.message ?? e);
  process.exit(1);
});
