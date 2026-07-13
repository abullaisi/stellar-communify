/**
 * Seed the deployed komunify + usdc testnet contracts with demo data:
 *   3 managers (each with a community brand), 5 contents, ~12 subscribers with an uneven read
 *   distribution (including a couple of idle subscribers so settlement has an idle-budget path).
 *
 * Managers self-register on-chain (D-011, permissionless) and publish content through the real
 * API flow (upload -> register_content -> confirm) + set a community brand, so BOTH the chain and
 * Postgres are populated — the dashboard, `/explore`, and the community pages all have data.
 *
 * The dashboard must not be empty on demo day. Run once after `make deploy-all`, after both
 * contracts are `init`ed, and **with the API running** (the content/brand phase needs it):
 *
 *   bun --filter api dev   # in another terminal
 *   bun scripts/seed.ts
 *
 * Contract ids are read from .contract-id.usdc / .contract-id.komunify (written by
 * `make deploy-all`) or from USDC_CONTRACT_ID / KOMUNIFY_CONTRACT_ID env vars.
 * The admin (deployer) secret is loaded at runtime from the Stellar CLI identity
 * ("deployer") and never printed.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { Keypair, Networks } from "@stellar/stellar-sdk";
import { hash } from "@stellar/stellar-base";
import { basicNodeSigner } from "@stellar/stellar-sdk/contract";
import { Komunify, Usdc } from "@komunify/contract-client";

const RPC_URL = process.env.RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK = Networks.TESTNET;
const SOURCE_IDENTITY = process.env.SOURCE ?? "deployer";

const PRICE = 100_000000n; // must match Config.price (10 USDC @ 7dp); mint well above this
const MINT_EACH = 200_000000n; // 20 USDC per subscriber, ample for one subscribe

function contractId(name: "usdc" | "komunify"): string {
  const envKey = name === "usdc" ? "USDC_CONTRACT_ID" : "KOMUNIFY_CONTRACT_ID";
  if (process.env[envKey]) return process.env[envKey]!;
  return readFileSync(`.contract-id.${name}`, "utf8").trim();
}

/** Load the admin/deployer keypair from the Stellar CLI without echoing the secret. */
function loadAdminKeypair(): Keypair {
  const secret = execSync(`stellar keys secret ${SOURCE_IDENTITY}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  return Keypair.fromSecret(secret);
}

function signerFor(kp: Keypair) {
  return basicNodeSigner(kp, NETWORK);
}

function komunifyClient(kp: Keypair): InstanceType<typeof Komunify.Client> {
  const { signTransaction, signAuthEntries } = signerFor(kp);
  return new Komunify.Client({
    contractId: KOMUNIFY_ID,
    networkPassphrase: NETWORK,
    rpcUrl: RPC_URL,
    publicKey: kp.publicKey(),
    signTransaction,
    signAuthEntries,
  });
}

function usdcClient(kp: Keypair): InstanceType<typeof Usdc.Client> {
  const { signTransaction, signAuthEntries } = signerFor(kp);
  return new Usdc.Client({
    contractId: USDC_ID,
    networkPassphrase: NETWORK,
    rpcUrl: RPC_URL,
    publicKey: kp.publicKey(),
    signTransaction,
    signAuthEntries,
  });
}

async function send(tx: { signAndSend: () => Promise<unknown> }, label: string) {
  try {
    await tx.signAndSend();
    console.log(`  ok: ${label}`);
  } catch (e) {
    console.error(`  FAIL: ${label}: ${(e as Error).message}`);
    throw e;
  }
}

async function fundAccount(pub: string): Promise<void> {
  const res = await fetch(`https://friendbot.stellar.org/?addr=${pub}`);
  if (!res.ok && res.status !== 400) {
    // 400 usually means already funded — tolerate it.
    throw new Error(`friendbot failed for ${pub}: ${res.status}`);
  }
}

// --- API population (Postgres metadata, so /explore + community pages have data) ---
// seed's on-chain writes don't touch Postgres; content title/description and community brands
// live there (D-010). To pre-populate them we drive the real API flow the browser uses:
// login (SEP-53) -> PUT /community, and upload -> register_content -> confirm per content.
const API_BASE = process.env.API_BASE_URL ?? "http://localhost:3001";
const SEP53_PREFIX = "Stellar Signed Message:\n";

/** One community brand per manager (index-aligned with `managers`). */
const BRANDS = [
  { name: "Soroban Scholars", description: "Deep dives on Stellar smart contracts.", logo: svgLogo("#7c5cff") },
  { name: "Stellar Builders", description: "Practical guides for shipping on Stellar.", logo: svgLogo("#00b4d8") },
  { name: "Web3 Weekly", description: "A weekly digest of the decentralized web.", logo: svgLogo("#f4a261") },
];

/** Title/description per content (index-aligned with the 5-content plan below). */
const CONTENTS = [
  { title: "Intro to Soroban Storage", description: "Persistent, instance, and temporary storage explained." },
  { title: "Auth & require_auth Patterns", description: "How authorization works in Soroban contracts." },
  { title: "Deploying with the Stellar CLI", description: "From wasm build to a live testnet contract." },
  { title: "Testing Soroban Contracts", description: "Unit tests, mock_auths, and the harness." },
  { title: "Wallets & Freighter Integration", description: "Connecting a browser wallet to your dApp." },
];

function svgLogo(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="30" fill="${color}"/></svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

/** A tiny valid PDF, unique per call so its sha256 never collides (avoids the 409 dedupe). */
function makePdf(): Buffer {
  const marker = `komunify-seed ${Date.now()} ${Math.random()}`;
  return Buffer.from(
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n` +
      `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n` +
      `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n` +
      `% ${marker}\n` +
      `trailer<</Root 1 0 R>>\n%%EOF\n`,
    "utf8",
  );
}

/** Fail fast if the API isn't up — the metadata phase needs it. */
async function requireApi(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`status ${res.status}`);
  } catch (e) {
    throw new Error(
      `API not reachable at ${API_BASE} (${(e as Error).message}). Start it first: bun --filter api dev`,
    );
  }
}

/** challenge -> SEP-53 sign -> verify; returns the kmf_session cookie header value. */
async function login(kp: Keypair): Promise<string> {
  const cRes = await fetch(`${API_BASE}/auth/challenge`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address: kp.publicKey() }),
  });
  const cBody = (await cRes.json()) as { data: { nonce: string } };
  const digest = hash(Buffer.concat([Buffer.from(SEP53_PREFIX, "utf-8"), Buffer.from(cBody.data.nonce, "utf-8")]));
  const signature = kp.sign(digest).toString("base64");
  const vRes = await fetch(`${API_BASE}/auth/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address: kp.publicKey(), signature }),
  });
  if (!vRes.ok) throw new Error(`verify failed: ${vRes.status} ${await vRes.text()}`);
  return vRes.headers.get("set-cookie")!.split(";")[0];
}

async function putCommunity(cookie: string, brand: (typeof BRANDS)[number]): Promise<void> {
  const res = await fetch(`${API_BASE}/community`, {
    method: "PUT",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(brand),
  });
  if (!res.ok) throw new Error(`PUT /community failed: ${res.status} ${await res.text()}`);
}

/** Upload a PDF -> DRAFT row + server-computed sha256. */
async function apiUpload(cookie: string, pdf: Buffer, title: string, description: string) {
  const form = new FormData();
  form.append("file", new Blob([pdf], { type: "application/pdf" }), "seed.pdf");
  form.append("title", title);
  form.append("description", description);
  const res = await fetch(`${API_BASE}/content/upload`, { method: "POST", headers: { cookie }, body: form });
  if (!res.ok) throw new Error(`upload failed: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { data: { draftId: string; sha256: string } }).data;
}

/** Confirm a draft against the on-chain content -> flips DRAFT to REGISTERED. */
async function apiConfirm(cookie: string, draftId: string, contentId: string, txHash: string): Promise<void> {
  const res = await fetch(`${API_BASE}/content/${draftId}/confirm`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ contentId, txHash }),
  });
  if (!res.ok) throw new Error(`confirm failed: ${res.status} ${await res.text()}`);
}

const USDC_ID = contractId("usdc");
const KOMUNIFY_ID = contractId("komunify");

async function main() {
  console.log(`usdc=${USDC_ID}`);
  console.log(`komunify=${KOMUNIFY_ID}`);

  // The content + brand phase drives the real API, so it must be up before we start.
  await requireApi();

  const admin = loadAdminKeypair();
  console.log(`admin=${admin.publicKey()}`);

  // --- keypairs ---
  const managers = Array.from({ length: 3 }, () => Keypair.random());
  const subscribers = Array.from({ length: 12 }, () => Keypair.random());

  // --- fund every account with XLM (fees) via friendbot ---
  console.log("\nFunding accounts via friendbot...");
  for (const kp of [...managers, ...subscribers]) {
    await fundAccount(kp.publicKey());
    console.log(`  funded ${kp.publicKey()}`);
  }

  // --- managers self-register (D-011: set_manager is require_auth(who), permissionless) +
  //     mint USDC to subscribers (admin-signed) ---
  const adminKmf = komunifyClient(admin); // reads (get_stats) + admin-signed mints below
  const adminUsdc = usdcClient(admin);

  console.log("\nSelf-registering managers...");
  for (const m of managers) {
    // Signed by the manager itself, not the admin — the auth is require_auth(who) now.
    const mKmf = komunifyClient(m);
    await send(await mKmf.set_manager({ who: m.publicKey(), enabled: true }), `set_manager ${m.publicKey()}`);
  }

  console.log("\nMinting USDC to subscribers...");
  for (const s of subscribers) {
    await send(await adminUsdc.mint({ to: s.publicKey(), amount: MINT_EACH }), `mint ${s.publicKey()}`);
  }

  // --- managers log in + set their community brand (API, D-010) so they show on /explore ---
  console.log("\nSetting community brands (API)...");
  const cookies: string[] = [];
  for (let i = 0; i < managers.length; i++) {
    const cookie = await login(managers[i]);
    cookies.push(cookie);
    await putCommunity(cookie, BRANDS[i]);
    console.log(`  ok: brand "${BRANDS[i].name}" -> mgr${i}`);
  }

  // --- managers publish 5 contents through the real API flow so Postgres has REGISTERED rows ---
  // (upload PDF -> register_content on-chain with that sha -> confirm). Without this, /explore and
  // the community pages — which read Postgres — stay empty even though the chain has the content.
  // c0,c1 -> mgr0 ; c2 -> mgr1 ; c3 -> mgr1 (+ mgr2 co-manager) ; c4 -> mgr2
  console.log("\nPublishing content (API upload -> register_content -> confirm)...");
  const contentIds: bigint[] = [];
  const contentOwner = [0, 0, 1, 1, 2];
  for (let i = 0; i < 5; i++) {
    const ownerIdx = contentOwner[i];
    const owner = managers[ownerIdx];
    const cookie = cookies[ownerIdx];
    const meta = CONTENTS[i];

    const { draftId, sha256 } = await apiUpload(cookie, makePdf(), meta.title, meta.description);
    const regTx = await komunifyClient(owner).register_content({
      caller: owner.publicKey(),
      sha256: Buffer.from(sha256, "hex"),
    });
    const sent = (await regTx.signAndSend()) as { sendTransactionResponse?: { hash?: string } };
    const id = regTx.result as bigint;
    await apiConfirm(cookie, draftId, id.toString(), sent.sendTransactionResponse?.hash ?? "");
    console.log(`  ok: c${i} "${meta.title}" -> mgr${ownerIdx} (id ${id})`);
    contentIds.push(id);
  }

  // mgr2 co-manages c3 (creator is mgr1)
  console.log("\nAdding co-manager to c3...");
  const mgr1Kmf = komunifyClient(managers[1]);
  await send(
    await mgr1Kmf.add_content_manager({
      creator: managers[1].publicKey(),
      content_id: contentIds[3],
      who: managers[2].publicKey(),
    }),
    `add_content_manager c3 += mgr2`,
  );

  // --- subscribers subscribe + read (uneven; s10,s11 idle) ---
  const readPlan: number[][] = [
    [0, 1, 2, 3, 4], // s0 heavy
    [0, 1, 2],       // s1
    [0, 3],          // s2
    [2, 4],          // s3
    [0],             // s4
    [1, 2, 3],       // s5
    [4],             // s6
    [0, 1],          // s7
    [3, 4],          // s8
    [2],             // s9
    [],              // s10 idle
    [],              // s11 idle
  ];

  console.log("\nSubscribing + recording reads...");
  for (let i = 0; i < subscribers.length; i++) {
    const s = subscribers[i];
    const client = komunifyClient(s);
    await send(await client.subscribe({ member: s.publicKey() }), `subscribe s${i}`);
    for (const c of readPlan[i]) {
      await send(
        await client.record_access({ member: s.publicKey(), content_id: contentIds[c] }),
        `record_access s${i} -> c${c}`,
      );
    }
  }

  // --- report ---
  const stats = (await adminKmf.get_stats()).result;
  console.log("\nSeed complete. Stats:");
  console.log(`  total_subs=${stats.total_subs} total_volume=${stats.total_volume} content_count=${stats.content_count} manager_count=${stats.manager_count}`);
  console.log("\nManagers (each with a community brand — see /explore):");
  managers.forEach((m, i) => console.log(`  mgr${i} (${BRANDS[i].name}) = ${m.publicKey()}`));
  console.log("\nNote: reads live in the current epoch. Wait one epoch (300s), then");
  console.log("settle_member(epoch, subscriber) for each subscriber to distribute budgets.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
