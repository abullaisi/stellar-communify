/**
 * Seed the deployed komunify + usdc testnet contracts with demo data:
 *   3 managers, 5 contents, ~12 subscribers with an uneven read distribution
 *   (including a couple of idle subscribers so settlement has an idle-budget path).
 *
 * The dashboard must not be empty on demo day. Run once after `make deploy-all`
 * (and after both contracts are `init`ed):
 *
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

const USDC_ID = contractId("usdc");
const KOMUNIFY_ID = contractId("komunify");

async function main() {
  console.log(`usdc=${USDC_ID}`);
  console.log(`komunify=${KOMUNIFY_ID}`);

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

  // --- whitelist managers + mint USDC to subscribers (admin-signed) ---
  const adminKmf = komunifyClient(admin);
  const adminUsdc = usdcClient(admin);

  console.log("\nWhitelisting managers...");
  for (const m of managers) {
    await send(await adminKmf.set_manager({ who: m.publicKey(), enabled: true }), `set_manager ${m.publicKey()}`);
  }

  console.log("\nMinting USDC to subscribers...");
  for (const s of subscribers) {
    await send(await adminUsdc.mint({ to: s.publicKey(), amount: MINT_EACH }), `mint ${s.publicKey()}`);
  }

  // --- managers register 5 contents ---
  // c0,c1 -> mgr0 ; c2 -> mgr1 ; c3 -> mgr1 (+ mgr2 co-manager) ; c4 -> mgr2
  console.log("\nRegistering content...");
  const contentIds: bigint[] = [];
  const contentOwner = [0, 0, 1, 1, 2];
  for (let i = 0; i < 5; i++) {
    const owner = managers[contentOwner[i]];
    const sha = new Uint8Array(32).fill(i + 1);
    const client = komunifyClient(owner);
    const tx = await client.register_content({ caller: owner.publicKey(), sha256: Buffer.from(sha) });
    const id = tx.result as bigint;
    await send(tx, `register_content c${i} -> ${owner.publicKey()} (id ${id})`);
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
  console.log("\nManagers:");
  managers.forEach((m, i) => console.log(`  mgr${i} = ${m.publicKey()}`));
  console.log("\nNote: reads live in the current epoch. Wait one epoch (300s), then");
  console.log("settle_member(epoch, subscriber) for each subscriber to distribute budgets.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
