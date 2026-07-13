# API_SPEC.md — Frozen HTTP surface

**This file is the contract between the API agent and the web agent.** The web agent may build
against it before any handler exists. Signatures do not change without a `DECISIONS.md` entry.

Base URL: `http://localhost:3001` in development. Hono, per the existing `packages/api` patterns
(`lib/errors.ts`, `lib/response.ts`). All request and response bodies are validated with Zod
schemas that live in `packages/shared/src/schemas/` and are imported by both packages.

The API is deliberately thin. **It owns file custody and nothing else.** Every entitlement question
is answered by simulating a read against the `komunify` contract. There is no `subscriptions` table.

---

## 1. Auth

Session is an HTTP-only, `SameSite=Lax`, signed JWT cookie named `kmf_session`, 7-day expiry,
`Secure` in production. Payload: `{ sub: <G... address>, iat, exp }`. Signed with `SESSION_SECRET`
(HS256, `jose`).

### `POST /auth/challenge`

```jsonc
// req
{ "address": "GXXXX..." }
// 200
{ "nonce": "Sign in to Komunify.\n\nAddress: GXXXX...\nNonce: 7f3a...\nExpires: 2026-07-10T12:05:00Z" }
```

Server persists `Nonce { wallet, nonce, expiresAt: now + 5min, usedAt: null }`. The nonce is the
full human-readable string above, not just the random part — the user sees what they sign.

### `POST /auth/verify`

```jsonc
// req
{ "address": "GXXXX...", "signature": "<base64>" }
// 200 — Set-Cookie: kmf_session=...
{ "address": "GXXXX...", "isManager": true }
```

Verification: look up an unused, unexpired `Nonce` for `address`; verify the Ed25519 signature over
the nonce bytes against the address (`Keypair.fromPublicKey(address).verify(...)` from
`@stellar/stellar-base`); mark `usedAt`. `isManager` comes from simulating `is_manager(address)`.

Errors: `401` invalid signature, `400` unknown/expired/used nonce.

> Confirm the exact byte encoding Freighter's `signMessage` produces against the installed
> `@stellar/freighter-api` before writing this. See D-001.

### `POST /auth/logout` → `204`, clears the cookie.

### `GET /auth/me`

```jsonc
// 200 (cookie present + valid)
{ "address": "GXXXX...", "isManager": false }
// 401 otherwise
```

`isManager` is simulated fresh on every call, never cached in the JWT — a manager can be added or
removed on-chain mid-session.

---

## 2. Content

### `GET /content?cursor=&limit=`

Public. No auth. Returns registered content metadata. **Never returns a download URL.**

```jsonc
{
  "items": [{
    "contentId": "1",              // stringified u64 — JSON numbers cannot hold u64
    "title": "Intro to Soroban",
    "description": "42 pages on...",
    "sha256": "9f86d08...",
    "sizeBytes": 1048576,
    "creatorWallet": "GXXXX...",
    "createdAt": "2026-07-10T09:00:00Z"
  }],
  "nextCursor": null
}
```

On-chain fields (managers, read counts, active flag) are **not** proxied here. The web app reads
those directly from the contract. This endpoint serves only what Postgres knows.

### `POST /content/upload`

Auth required. Caller must be a manager (`is_manager` simulated; `403` otherwise).
`multipart/form-data`: `file` (application/pdf, ≤ 20 MB), `title`, `description`.

Server: streams the file, computes `sha256`, rejects a duplicate hash (`409`), uploads to blob
storage, writes `Content { status: DRAFT, contractId: null }`.

```jsonc
// 201
{ "draftId": "clx...", "sha256": "9f86d08...", "sizeBytes": 1048576 }
```

The server does **not** call the contract. The manager's wallet must sign `register_content`, so
the browser does it.

### `POST /content/:draftId/confirm`

Auth required, caller must be the draft's `creatorWallet`.

```jsonc
// req — after the browser's register_content tx confirms
{ "contentId": "1", "txHash": "abc..." }
// 200
{ "contentId": "1", "status": "REGISTERED" }
```

Server verifies by simulating `get_content(contentId)` that the on-chain `sha256` matches the
draft's and the on-chain `creator` matches the session wallet. Only then flips
`status: REGISTERED`. **Do not trust the client's `contentId`.** `409` on mismatch.

Drafts older than 24 hours with `status: DRAFT` are garbage-collected along with their blobs.

### `GET /content/:contentId/download`

Auth required. This is the gate. In order:

1. `address` ← session cookie.
2. Simulate `is_active(address)` → `403 { code: "SUB_INACTIVE" }` if false.
3. Simulate `current_epoch()` → `e`.
4. Simulate `has_read(e, contentId, address)` → `403 { code: "READ_NOT_RECORDED" }` if false.
5. Look up the `REGISTERED` content row → `404` if absent.
6. Mint a 60-second signed blob URL.

```jsonc
// 200
{ "url": "https://blob.../abc?token=...", "expiresIn": 60, "sha256": "9f86d08..." }
```

The `READ_NOT_RECORDED` case is not an error state in the UI — it is the signal for the web app to
prompt the `record_access` signature, then retry. See `PLAN.md` §Download flow.

---

## 3. Traction

### `GET /stats`

Public. Server-side aggregation so the dashboard makes one request instead of a dozen simulations.

```jsonc
{
  "totalSubs": "42",               // u64 -> string
  "totalVolume": "420000000",      // i128 -> string, token base units
  "totalClaimed": "180000000",     // i128 -> string
  "contentCount": "7",             // u64 -> string
  "managerCount": 3,               // u32 -> number (< 2^53, safe)
  "currentEpoch": 12,              // u32 -> number
  "epochEndsAt": "2026-07-10T12:05:00Z",
  "epochReads": 31,                // u32 -> number (per-epoch read count, never near 2^32)
  "recentEvents": [
    { "type": "subscribed", "wallet": "GXXX...", "amount": "10000000", "ledger": 1234, "txHash": "abc..." },
    { "type": "claimed",    "wallet": "GYYY...", "amount": "30000000", "ledger": 1233, "txHash": "def..." }
  ]
}
```

**Boundary encoding rule (resolves the earlier contradiction):** `i128` and `u64` cross the wire as
**strings**; `u32` may be a JSON number (max ~4.29e9 < 2^53, no precision loss). So `totalSubs` and
`contentCount` (both `u64`) and every `i128` amount are strings; `managerCount`, `currentEpoch`,
`epochReads`, and `ledger` (all `u32`) are numbers. The Zod schema in `packages/shared` is the
source of truth — match it.

Source: `get_stats()` + `current_epoch()` / `epoch_ends_at()` via simulation, plus RPC `getEvents`
filtered on the `"kmf"` topic prefix over the last ~N ledgers (`epochReads` is derivable from the
`accessed` events in the current epoch, or expose a contract view if cheaper). Cache 10 seconds
in-process. No database. There is no shared pool under D-009, so there is no `epochPool` field.

All `i128` values cross the wire as **strings**. All `u64` values cross the wire as **strings**.
Never as JSON numbers. A `u64` content id or an `i128` amount will silently lose precision in
`JSON.parse`. This applies to every endpoint above.

---

## 6. Community brand (D-010)

Added post-Phase-1 for the public per-community page (manager onboarding). Display-only identity
keyed by the manager's wallet — not money or entitlement (the chain stays authority, D-006).

### `GET /community/:wallet`

Public. No auth. Returns the brand, or `404` if the manager hasn't set one up.

```jsonc
// 200
{ "wallet": "GXXX...", "name": "Soroban Scholars", "description": "Deep dives...", "logo": "data:image/...", "updatedAt": "2026-07-11T03:24:00Z" }
```

### `PUT /community`

Auth required. Caller must be a manager (`is_manager` simulated; `403` otherwise). Upserts the
caller's own brand — the wallet comes from the session, never the body.

```jsonc
// req (multipart not needed — logo is a small data: URL string)
{ "name": "Soroban Scholars", "description": "Deep dives...", "logo": "data:image/...|null" }
// 200 — same shape as GET
```

`logo` is a `data:` URL of a small image (or `null`). Schemas: `CommunityBrandSchema` /
`SaveCommunityRequestSchema` in `packages/shared`.

---

## 4. Prisma schema after the rewrite

Delete `user`, `session`, `account`, `verification` (better-auth, see D-001). The whole schema:

```prisma
model Nonce {
  id        String    @id @default(cuid())
  wallet    String
  nonce     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([wallet])
}

enum ContentStatus { DRAFT REGISTERED }

model Content {
  id            String        @id @default(cuid())
  contractId    String?       @unique   // stringified u64, null until confirmed
  title         String
  description   String
  sha256        String        @unique
  storageKey    String
  sizeBytes     Int
  creatorWallet String
  status        ContentStatus @default(DRAFT)
  createdAt     DateTime      @default(now())
  @@index([creatorWallet])
  @@index([status])
}

// Added by D-010 (community brand). Display-only; the chain stays authority on money/entitlement.
model Community {
  wallet      String   @id
  name        String
  description String   @default("")
  logo        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Nonce + Content were the original schema; `Community` was added later under D-010. If another
table feels necessary, check whether the chain already knows the answer before adding it.

---

## 5. Environment

```sh
# packages/api/.env
DATABASE_URL=postgresql://...
SESSION_SECRET=<32+ random bytes>
BLOB_READ_WRITE_TOKEN=<vercel blob token>
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
KOMUNIFY_CONTRACT_ID=C...
USDC_CONTRACT_ID=C...
CORS_ORIGIN=http://localhost:3000

# packages/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_KOMUNIFY_CONTRACT_ID=C...
NEXT_PUBLIC_USDC_CONTRACT_ID=C...
```

`BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are removed everywhere, including the `.env.example`
files and both `CLAUDE.md` files that document them.
