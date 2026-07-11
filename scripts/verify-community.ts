/** Quick round-trip check for the community brand API (D-010): PUT (auth+manager) then public GET. */
import { Keypair, hash, Networks } from '@stellar/stellar-base';
import { readFileSync } from 'node:fs';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const SEP53_PREFIX = 'Stellar Signed Message:\n';
const fixture = JSON.parse(
  readFileSync(new URL('../packages/api/src/routes/__tests__/fixtures/gate-test-fixture.json', import.meta.url), 'utf8'),
) as { manager: { publicKey: string; secret: string } };

void Networks.TESTNET;

async function login(kp: Keypair): Promise<string> {
  const c = await (await fetch(`${API_BASE}/auth/challenge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address: kp.publicKey() }),
  }).then((r) => r.json())) as { data: { nonce: string } };
  const digest = hash(Buffer.concat([Buffer.from(SEP53_PREFIX, 'utf-8'), Buffer.from(c.data.nonce, 'utf-8')]));
  const signature = kp.sign(digest).toString('base64');
  const v = await fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address: kp.publicKey(), signature }),
  });
  return v.headers.get('set-cookie')!.split(';')[0];
}

async function main() {
  const kp = Keypair.fromSecret(fixture.manager.secret);
  const cookie = await login(kp);

  const logo = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>').toString('base64');
  const putRes = await fetch(`${API_BASE}/community`, {
    method: 'PUT',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Soroban Scholars', description: 'Deep dives on Stellar smart contracts.', logo }),
  });
  if (!putRes.ok) throw new Error(`PUT failed: ${putRes.status} ${await putRes.text()}`);
  console.log('PUT ok:', JSON.stringify((await putRes.json()).data).slice(0, 120));

  const getRes = await fetch(`${API_BASE}/community/${kp.publicKey()}`);
  const got = (await getRes.json()) as { data: { name: string; description: string; logo: string | null } };
  if (got.data.name !== 'Soroban Scholars') throw new Error('GET name mismatch');
  if (!got.data.logo) throw new Error('GET logo missing');
  console.log(`GET ok (public): ${got.data.name} — ${got.data.description}`);
  console.log('\nPASS — community brand PUT/GET round-trip verified.');
}
main().catch((e) => { console.error('FAIL:', e.message ?? e); process.exit(1); });
