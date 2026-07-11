# DECISIONS.md — Komunify MVP

Architecture decision log. Append-only. Each entry: what was decided, why, what it rules out.
**Do not silently reverse a decision here.** If a decision blocks you, add a new entry proposing the
reversal and flag it in `PROGRESS.md` under "Blocked / needs human".

---

## D-001 — Wallet is the only identity. better-auth is removed.

**Decided:** 2026-07-10

Members and managers authenticate by proving control of a Stellar address:

1. `POST /auth/challenge { address }` → server stores a single-use nonce, returns it.
2. Freighter `signMessage(nonce)` in the browser.
3. `POST /auth/verify { address, signature }` → server verifies the Ed25519 signature against
   the address, marks the nonce used, sets an HTTP-only signed session cookie (JWT, `jose`, HS256).

**Why:** Wallet is identity per product spec. Email/password auth is unused surface. better-auth
has no first-class wallet provider, so keeping it means writing custom-provider glue to reach the
same place a signed cookie reaches directly.

**Rules out:** better-auth, the `user` / `session` / `account` / `verification` Prisma models,
`packages/web/lib/auth-client.ts`, and `packages/api/CLAUDE.md`'s route-protection section as written.

**Note:** Freighter's `signMessage` return shape has changed across versions. Verify the exact
signature encoding (base64 vs raw bytes) against the installed `@stellar/freighter-api` at
implementation time before writing the verifier. Do not assume.

---

## D-002 — Payment asset is a project-owned mock SEP-41 USDC token contract.

**Decided:** 2026-07-10

We deploy our own Soroban token contract (`contracts/contracts/usdc/`): symbol `USDC`, 7 decimals,
with an open `faucet()` that mints a fixed amount to the caller, rate-limited to once per 24h per
address.

**Why:** A stable-denominated price is the product story. Real Circle testnet USDC requires judges
to add a trustline and locate a working faucet — an external dependency in the middle of a live
demo. Native XLM avoids that but loses the stablecoin narrative.

**Rules out:** Trustline flows, the native SAC, Friendbot as the funding path for the subscription
asset. (Friendbot is still needed to fund accounts for transaction fees.)

**Mandatory:** The README and the app UI must both state plainly that this is a mock token for
testnet demonstration and carries no value. Do not let a judge think it is Circle USDC.

---

## D-003 — Payouts accrue in contract state; managers withdraw via `claim()`.

**Decided:** 2026-07-10

`subscribe()` moves USDC from the member into the contract and records allocation state. It does
not fan out transfers. Each manager later calls `claim()` to withdraw their accrued balance.

**Why:** PRD §7.3 explicitly accepts "records an auditable payout allocation state" as satisfying
automated disbursement. Accrual avoids an N-transfer fan-out per subscribe, avoids one bad address
breaking `subscribe()` for everyone, and gives the manager dashboard a real on-chain action to
demo.

**Rules out:** Push-split-on-subscribe. If push semantics are wanted for v1.0, add them as a
separate entry point, not as a change to `subscribe()`.

---

## D-004 — [SUPERSEDED by D-009] Per-content attribution via a shared per-epoch pool.

**Decided:** 2026-07-10 · **Superseded:** 2026-07-10

Original mechanism: subscription revenue lands in one per-epoch pool; each content's share of that
pool is proportional to its share of total unique reads that epoch. **This is sybil-broken.** Read
share is a lever independent of money, so a single alternate wallet reading only its own content
captures a slice of *every other subscriber's* payment. When most subscribers never read (the
realistic case), the attacker steals the idle majority's money for the price of one subscription —
the platform fee does not bound it. It also mis-billed across time (one epoch's pool, a 30-day
subscription reading across thousands of epochs).

Attribution stays per-content and engagement-weighted. Only the **math** changes. See D-009.

---

## D-009 — Attribution is per-member, not per-pool. Each subscriber's own payment funds the content they read.

**Decided:** 2026-07-10 · Supersedes the mechanism in D-004.

Read `CONTRACT_SPEC.md` §3 before touching contract code.

There is no shared pool. Each subscription's revenue (after the platform fee) is a **budget owned by
that member for that epoch**, split only across the content **that member** read:

```
subscribe(m):  fee = price * platform_bps / 10_000  -> platform
               budget[e][m] = price - fee            (e = current epoch)

settle_member(e, m):   per_content = budget[e][m] / member_reads[e][m]
                       for each content c the member read:
                           split per_content equally among c.managers
```

**Why this is the sybil fix, not a mitigation:** an attacker's reads can only ever redistribute the
attacker's *own* budget. Farming reduces to "pay yourself, minus the platform fee." For any farm of
`k` alt wallets reading only the attacker's own content:

```
net = k * ((1 - b) * P - P) = -k * b * P      // exactly the platform fee, always
```

Independent of the number of honest subscribers, their read rate, and the farm size. Crucially, an
attacker's activity **cannot touch an honest member's budget** — the idle-subscriber money that the
pool model leaked is now unreachable. Wash-reading, cross-manager collusion, and vanity read
inflation all cost `b·P` and gain nothing.

**Billing period = settlement period = epoch.** `period_secs` is removed. Subscribing in epoch `e`
grants access for epoch `e` only; the subscription expires at the epoch boundary. This kills every
cross-epoch pro-rating edge case. For the demo, one short epoch is the whole billing cycle. For
production intent the epoch is the billing cycle (e.g. 30 days), and managers claim once per cycle.

**Idle-subscriber budget → platform.** A member who pays but reads nothing that epoch has a budget
with no content to attribute it to. That budget is credited to the platform address at settlement.
Chosen over splitting it among all managers because splitting requires maintaining an on-chain
enumerable manager set (a `Vec` to keep in sync on every `set_manager`), and idle→platform is the
smaller change with a coherent story: payout follows engagement; unengaged subscriptions fund the
platform. Revisit for v1.0 if managers should share idle revenue.

**Still forces epochs / deferred settlement:** you cannot compute `per_content` until the member's
read set for the epoch is final, i.e. until the epoch closes. `settle_member` therefore only runs on
a past epoch. A `claim()` still never pays out an open epoch.

**Rules out:** any shared-pool accounting, `settle_content`, `sweep_epoch` as pool-reclaim, instant
per-read payout, and a `period_secs` distinct from `epoch_secs`.

**Residual limitation, still document in the README:** the manager whitelist (`set_manager`,
admin-gated) remains the gate on *who may register content and earn at all*. The sybil economics
above assume that gate holds; an attacker who gets whitelisted still cannot profit from farming
(net `-b·P`), but the whitelist is what stops arbitrary addresses from registering content in the
first place. State the model honestly: farming is unprofitable by construction, not merely
discouraged.

---

## D-005 — Content bytes live off-chain. The chain holds the hash and the entitlement.

**Decided:** 2026-07-10

PDFs are stored in a blob store. The contract stores `sha256(pdf)` in the content registry. The API
issues a short-lived signed download URL only after it verifies, by simulating against the
contract, that (a) the caller's subscription is active and (b) the caller has already recorded an
on-chain read for that content in the current epoch.

**Why:** File bytes cannot go on-chain. Storing the hash means the file cannot be swapped after
registration without detection. Gating the URL on the read receipt means the read count that drives
revenue is the same event that grants access — you cannot get the file without paying the author's
read counter, and you cannot inflate the counter without also being an active subscriber.

**Rules out:** Off-chain access checks against a database `subscriptions` table. The chain is the
authority; Postgres holds only file metadata.

**Blob store:** Vercel Blob. Chosen for zero infra config, token-based access from the Hono API,
and native signed-URL support. Local disk fallback in development.

---

## D-006 — One Next.js app serves both dashboards. Role is derived from the chain.

**Decided:** 2026-07-10

A single `/dashboard` route. On load, the app simulates `is_manager(wallet)` against the contract.
True → manager panel. False → member panel. There is no role column in Postgres and no separate
admin build.

**Rules out:** A second frontend package. A `role` field on any database model.

---

## D-007 — shadcn/ui primitives are adopted, restyled to the DESIGN.md token set.

**Decided:** 2026-07-10

`DESIGN.md` §0 says not to pull in shadcn as a default. It is not a default here — it is an explicit
direction, which §0's Exception clause permits. `packages/web/components.json` already exists.

**Constraint:** shadcn ships unstyled-ish primitives with its own default look. Every component we
generate must be re-skinned against the `--color-*` / `--space-*` / `--radius-*` custom properties
in `DESIGN.md` §2–3. A component that ships with default shadcn colors is a bug.

---

## D-008 — DESIGN.md contains stale paths. Fix, do not follow blindly.

**Decided:** 2026-07-10

`DESIGN.md` references `src/App.css` and `src/App.jsx` throughout. Those are from an earlier Vite
prototype and do not exist in this repo. The equivalents are `packages/web/app/globals.css` and the
Next.js App Router tree.

The **token values and component specs in DESIGN.md are canonical**. The **file paths are not.**
Whoever does the first substantial web work updates the paths in DESIGN.md in the same PR.

---

## D-010 — Community brand is a server-persisted table + `/community` endpoints (extends the frozen API).

**Decided:** 2026-07-11 (post-Phase-1, during Phase 2 integration, at user request)

Managers need a public per-community page (logo, name, description, content list). That requires a
brand that any visitor can load — not just the manager's own browser — so localStorage is
insufficient. Added a `Community` Postgres table (keyed by manager wallet) plus:

- `GET /community/:wallet` — public, returns the brand or `404`.
- `PUT /community` — auth + `is_manager`-gated; upserts the caller's own brand (wallet from session).

**Why this is allowed to touch the "frozen" API_SPEC:** the freeze (PROGRESS rules #3) governs
Phase 1 lane coordination. This is an explicit Phase-2 feature request, documented here and mirrored
into `API_SPEC.md §6` in the same change — not a silent signature change.

**Scope guard:** brand is display-only identity. The chain stays authority on money and entitlement
(D-006); nothing here gates a download or a payout. The content list on the community page comes
from the existing public `GET /content` filtered by `creatorWallet`, not a new content path.

**Rules out:** putting brand on-chain (it is not consensus-critical); a per-community route/subdomain
(one `/community/[wallet]` page); an image-hosting service (logos are small data: URLs in the row).
