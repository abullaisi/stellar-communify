# PLAN.md — Komunify MVP implementation plan

Read order for a fresh agent:

1. **`PROGRESS.md`** — what is done, what is in flight, what to pick up. Start there, always.
2. This file — the architecture and why the phases are ordered as they are.
3. **`DECISIONS.md`** — the settled choices. Do not relitigate them in code.
4. **`CONTRACT_SPEC.md`** / **`API_SPEC.md`** — the frozen interfaces you build against.
5. `DESIGN.md` (repo root) — visual system. Canonical for tokens, stale for file paths (D-008).
6. `komunify-prd.docx.txt` — product context. The MVP scope below narrows it.

---

## 1. What we are building

One subscription, paid in a project-owned test USDC token on Stellar testnet, unlocks a library of
PDF content published by whitelisted community managers. Subscription revenue accumulates in a
Soroban contract and is attributed to content in proportion to the unique reads that content earned
during a settlement epoch. Each content's share splits equally among its managers, who withdraw it
with `claim()`. A dashboard shows the whole loop from on-chain data.

Wallet is identity. There is no email, no password, no user table.

**The demo is the spec.** If a feature does not appear in this sequence, it is not MVP:

> Connect Freighter → claim test USDC from the faucet → subscribe (sign, 10 USDC moves on-chain) →
> browse content → open a PDF (sign `record_access`, PDF opens) → switch to a manager wallet →
> see reads accrue → epoch closes → click Settle → click Claim → USDC lands in the manager's wallet →
> open the traction dashboard, every number traces to a testnet transaction.

---

## 2. Architecture

```
                    Freighter (signs everything)
                            │
   ┌────────────────────────┼────────────────────────┐
   │                        │                        │
   ▼                        ▼                        ▼
Next.js web            Hono API                Soroban (testnet)
packages/web           packages/api            contracts/
   │                        │                        │
   │  writes: subscribe, record_access,              │
   │          register_content, claim, settle_member  │
   ├────────────────────────┼───────────────────────►│
   │                        │                        │
   │  reads:  is_active, is_manager, get_content,    │
   │          get_accrued, get_stats  (simulate)     │
   ├────────────────────────┼───────────────────────►│
   │                        │                        │
   │  session cookie,       │  simulates is_active + │
   │  PDF upload,           │  has_read to gate the  │
   │  signed download URL   │  download              │
   └───────────────────────►├───────────────────────►│
                            │
                            ▼
                    Postgres (file metadata + auth nonces)
                    Vercel Blob (PDF bytes)
```

**The chain is the authority on money and entitlement. Postgres is a filing cabinet.**

The web app talks to the contract directly for every read and every write. The API exists only
because PDF bytes cannot live on-chain and a signed download URL must be minted by something that
holds a secret. Any time you are tempted to add an endpoint, first ask whether the browser could
simulate the contract itself. It usually can.

### Download flow — why it is shaped this way

Revenue depends on read counts. Read counts must therefore be as hard to forge as the money is. So
the read receipt and the file access are the same event:

1. Member clicks a locked PDF.
2. Web app simulates `has_read(currentEpoch, contentId, wallet)`. If true, skip to 5.
3. Web app builds and submits `record_access(wallet, contentId)`. Freighter prompts. The tx confirms.
4. `record_access` is idempotent per `(epoch, content, member)` — a retry after a timeout costs a
   fee but corrupts nothing.
5. Web app calls `GET /content/:id/download`. The API independently simulates `is_active` and
   `has_read` before minting a 60-second signed URL. It does not trust the browser.
6. PDF opens.

A member cannot read without an active subscription. A manager who farms reads with alt wallets only
redistributes those alt wallets' *own* budgets back to themselves, losing the platform fee on each —
under the per-member attribution model (D-009), farming is unprofitable by construction, not merely
discouraged. See D-009 for the economics and the residual whitelist assumption.

---

## 3. Package layout after this work

```
contracts/contracts/usdc/          NEW  — mock SEP-41 token + faucet
contracts/contracts/komunify/      NEW  — subscriptions, content, reads, payouts
contracts/contracts/notes/         DELETE

packages/contract-client/          — regenerated bindings for BOTH contracts + barrel index
packages/shared/                   — Zod schemas + types shared by api and web; stellar config
packages/api/                      — auth (wallet), content upload/confirm/download, /stats
packages/web/                      — one app, /dashboard renders member or manager panel
```

`packages/web` service domains, following the existing `services/` pattern
(`types.ts` / `queries.ts` / `service.ts` / `hook.ts`):

```
services/auth/          challenge → signMessage → verify → session
services/subscription/  price, isActive, expiresAt, subscribe(), faucet()
services/content/       list, upload, register, recordAccess, download
services/manager/       myContent, reads, accrued, claim(), settleContent()
services/traction/      GET /stats
services/notes/         DELETE
```

React Query owns all server state. The wallet address comes from `providers/wallet-provider.tsx`
(exists) and keys every query — switching wallets in Freighter must invalidate everything.

---

## 4. Phases

Phase 0 is a hard barrier. Nothing in Phase 1 may start until it lands, because Phase 1 runs three
agents in parallel against interfaces that Phase 0 freezes.

### Phase 0 — Foundation (one agent, sequential, blocking)

Purpose: delete the scaffold, freeze the interfaces, make the toolchain handle two contracts.

- Delete the `notes` contract, `packages/web/services/notes/`, `components/notes/`,
  `lib/notes-client.ts`.
- Delete better-auth: `packages/web/lib/auth-client.ts`, `packages/api` auth routes and config,
  the four better-auth Prisma models, `BETTER_AUTH_*` from both `.env.example` files.
- Rewrite `prisma/schema.prisma` to the two models in `API_SPEC.md` §4. Create the migration.
- Generalise the `Makefile` and root `package.json` scripts for two contracts:
  `make build CONTRACT=komunify`, `make bindings` binds both, `make deploy-all` deploys usdc then
  komunify in order and writes both ids.
- Add Zod schemas to `packages/shared/src/schemas/` for every request and response body in
  `API_SPEC.md`. Add `KOMUNIFY_CONTRACT_ID` / `USDC_CONTRACT_ID` to the stellar config resolvers in
  both `packages/shared/src/stellar.ts` and `packages/web/lib/stellar.ts` (replacing
  `NEXT_PUBLIC_NOTES_CONTRACT_ID`).
- Stub both contracts: crate skeletons that compile, with the exact function signatures from
  `CONTRACT_SPEC.md` and `unimplemented!()` bodies. Run `make bindings`. **This is what unblocks
  the web and API agents** — they get real, type-checked TypeScript clients on day one.
- Update root `CLAUDE.md` and both package `CLAUDE.md` files to describe komunify, not notes.

Exit criteria: `bun typecheck` clean, `cargo build` clean, `packages/contract-client/dist` contains
typed clients for both contracts, `git grep -i 'notes\|better-auth'` returns only `docs/` hits.

### Phase 1 — Three lanes in parallel

Each lane owns disjoint paths. Overlap is a merge conflict waiting to happen; if a lane needs to
touch another lane's path, it says so in `PROGRESS.md` first.

**Lane A — Contracts.** Owns `contracts/`.
Implement `usdc` (token interface, `faucet` with cooldown). Implement `komunify` per spec. Write all
twelve unit tests from `CONTRACT_SPEC.md` §3 — test 9 (conservation) is mandatory and is the
acceptance gate. Deploy both to testnet, `init` them, record the ids. Regenerate real bindings.
Write `scripts/seed.ts`: three manager wallets, five contents, a dozen subscribers with varied
reads, so the dashboard is not empty on demo day.

**Lane B — API.** Owns `packages/api/`.
Wallet challenge/verify/logout/me. Content upload → hash → blob → draft. Confirm. The download gate.
`/stats` with its 10-second cache. Integration tests against the deployed testnet contract, or
against Lane A's local test harness if testnet is not up yet. Everything crossing the wire follows
the `i128`/`u64`-as-string rule in `API_SPEC.md` §3.

**Lane C — Web.** Owns `packages/web/`.
Wallet connect (exists, verify it). shadcn primitives generated and re-skinned to the `DESIGN.md`
token set — a default-shadcn-coloured component is a bug (D-007). Then, in this order, because
each is demoable alone:

1. `/dashboard` shell + role routing via `is_manager`.
2. Member panel: subscription status card, faucet button, subscribe button, content grid with
   lock state, the download flow from §2.
3. Manager panel: upload + register, my-content list with epoch read counts, accrued balance,
   claim button, per-content settle buttons.
4. Traction panel: stat chips (subscribers, volume, payouts), recent event list, epoch countdown.

Lane C builds against the Phase 0 stub bindings with mocked query data until Lane A deploys. Do not
block on Lane A.

Landing page is explicitly out of scope — `/` stays a stub. Being brainstormed separately.

### Phase 2 — Integration

Real contract ids into every env. Walk the demo script end to end on testnet with two real Freighter
wallets. Fix what the walk breaks. `epoch_secs = 300` on the demo deployment (`CONTRACT_SPEC.md` §3).

### Phase 3 — Submission

Public repo. README: architecture, setup, Stellar usage, the mock-USDC disclaimer (D-002), the
per-member attribution model and its sybil property (D-009), the 5-minute-epoch note. Deploy web to
Vercel. Deploy the API. Pitch deck. 2–3 minute demo video following §1's sequence verbatim.

---

## 5. Risks, honestly

**Per-member attribution is the schedule risk.** It adds epochs, per-member settlement, and dust —
things that can be subtly wrong in ways unit tests catch and demos do not (though the per-member
model, D-009, is simpler and safer than the shared-pool model it replaced: no cross-member
denominator, no order dependence, no pool-reclaim sweep). Lane A should land `subscribe` / `claim` /
`is_active` first and prove them, then build read accounting on top. If Lane A is still fighting
settlement when Phase 2 should start, the fallback is a single-subscriber, single-content demo: one
member reads one content, `settle_member` sends that member's whole budget to the one manager. The
settle and claim buttons still work. That fallback is a demo-script change, no code change.

**Freighter's `signMessage` encoding** has moved between versions. It gates all of Lane B. Whoever
picks up Lane B verifies it against the installed package in the first hour, and writes down what
they found in `PROGRESS.md`.

**Soroban persistent storage TTL** will silently drop `Read`, `Pool`, and `Accrued` entries if
`extend_ttl` is not called. This will not surface in unit tests. It will surface in the demo, days
after deployment. Bump on every touch.

**Blob storage in the API.** `packages/api` has no deployment target chosen yet. Vercel Blob works
from anywhere given a token, but the API itself needs somewhere to run. Decide in Phase 2, not
before — it does not block Lane B.
