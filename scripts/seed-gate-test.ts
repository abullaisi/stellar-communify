/**
 * One-off provisioning for the download-gate integration test (docs/PROGRESS.md Lane B
 * checklist). Creates 3 fresh keypairs against the deployed testnet contracts:
 *   - inactive: funded, never subscribes
 *   - activeNoRead: subscribes, never calls record_access
 *   - activeWithRead: subscribes and calls record_access against a freshly registered content id
 *
 * Prints a JSON blob of secrets + the content id to stdout so the vitest integration test can
 * read it from a fixture file. Run once: `bun scripts/seed-gate-test.ts > /tmp/gate-test-fixture.json`
 */
import { Keypair, Networks } from "@stellar/stellar-sdk";
import { basicNodeSigner } from "@stellar/stellar-sdk/contract";
import { Komunify, Usdc } from "@komunify/contract-client";
import { execSync } from "node:child_process";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK = Networks.TESTNET;
const USDC_ID = process.env.USDC_CONTRACT_ID!;
const KOMUNIFY_ID = process.env.KOMUNIFY_CONTRACT_ID!;
const MINT_EACH = 200_000000n;

function loadAdminKeypair(): Keypair {
  const secret = execSync(`stellar keys secret deployer`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  return Keypair.fromSecret(secret);
}

function kmfClient(kp: Keypair) {
  const { signTransaction, signAuthEntries } = basicNodeSigner(kp, NETWORK);
  return new Komunify.Client({
    contractId: KOMUNIFY_ID,
    networkPassphrase: NETWORK,
    rpcUrl: RPC_URL,
    publicKey: kp.publicKey(),
    signTransaction,
    signAuthEntries,
  });
}

function usdcClient(kp: Keypair) {
  const { signTransaction, signAuthEntries } = basicNodeSigner(kp, NETWORK);
  return new Usdc.Client({
    contractId: USDC_ID,
    networkPassphrase: NETWORK,
    rpcUrl: RPC_URL,
    publicKey: kp.publicKey(),
    signTransaction,
    signAuthEntries,
  });
}

async function fund(pub: string) {
  const res = await fetch(`https://friendbot.stellar.org/?addr=${pub}`);
  if (!res.ok && res.status !== 400) throw new Error(`friendbot failed for ${pub}: ${res.status}`);
}

async function send(tx: { signAndSend: () => Promise<unknown> }, label: string) {
  try {
    await tx.signAndSend();
    console.error(`  ok: ${label}`);
  } catch (e) {
    console.error(`  FAIL: ${label}: ${(e as Error).message}`);
    throw e;
  }
}

async function main() {
  const admin = loadAdminKeypair();
  const manager = Keypair.random();
  const inactive = Keypair.random();
  const activeNoRead = Keypair.random();
  const activeWithRead = Keypair.random();

  console.error("Funding accounts...");
  for (const kp of [manager, inactive, activeNoRead, activeWithRead]) {
    await fund(kp.publicKey());
  }

  const adminKmf = kmfClient(admin);
  const adminUsdc = usdcClient(admin);

  console.error("Whitelisting manager...");
  await send(await adminKmf.set_manager({ who: manager.publicKey(), enabled: true }), "set_manager");

  console.error("Minting USDC to active subscribers...");
  await send(await adminUsdc.mint({ to: activeNoRead.publicKey(), amount: MINT_EACH }), "mint activeNoRead");
  await send(await adminUsdc.mint({ to: activeWithRead.publicKey(), amount: MINT_EACH }), "mint activeWithRead");

  console.error("Registering content as manager...");
  const managerClient = kmfClient(manager);
  const sha = new Uint8Array(32).fill(42);
  const regTx = await managerClient.register_content({ caller: manager.publicKey(), sha256: Buffer.from(sha) });
  const contentId = regTx.result as bigint;
  await send(regTx, `register_content -> id ${contentId}`);

  console.error("Subscribing activeNoRead...");
  const activeNoReadClient = kmfClient(activeNoRead);
  await send(await activeNoReadClient.subscribe({ member: activeNoRead.publicKey() }), "subscribe activeNoRead");

  console.error("Subscribing + recording read for activeWithRead...");
  const activeWithReadClient = kmfClient(activeWithRead);
  await send(await activeWithReadClient.subscribe({ member: activeWithRead.publicKey() }), "subscribe activeWithRead");
  await send(
    await activeWithReadClient.record_access({ member: activeWithRead.publicKey(), content_id: contentId }),
    "record_access activeWithRead",
  );

  const fixture = {
    contentId: contentId.toString(),
    sha256: Buffer.from(sha).toString("hex"),
    manager: { publicKey: manager.publicKey(), secret: manager.secret() },
    inactive: { publicKey: inactive.publicKey(), secret: inactive.secret() },
    activeNoRead: { publicKey: activeNoRead.publicKey(), secret: activeNoRead.secret() },
    activeWithRead: { publicKey: activeWithRead.publicKey(), secret: activeWithRead.secret() },
  };

  console.log(JSON.stringify(fixture, null, 2));
  console.error("\nFixture written to stdout.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
