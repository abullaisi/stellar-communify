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

---

## D-011 — Permissionless managers: `set_manager` is self-authorized (`require_auth(who)`), no admin gate.

**Decided:** 2026-07-11 (Phase 2, at user request — "anyone can become a manager as long as they sign in and create a community", then "I want to drop the admin gate")

Anyone can become a community manager by self-registering on-chain. The contract's `set_manager`
gate changes from `require_auth(admin)` to **`require_auth(who)`**: a wallet toggles only its OWN
manager status (enable to start publishing, disable to resign). No admin involvement, and — because
the subject must sign — no one can force or revoke anyone else's status. This is genuinely
permissionless, not admin-brokered.

Flow:
- Contract: `set_manager(who, enabled)` — same signature, auth swapped to the subject (`lib.rs`).
  Tests t12 (subject-auth required) + t12b (permissionless self-register → `register_content` works).
- Web: a signed-in non-manager sees "Start your community"; saving (1) signs `set_manager(self, true)`
  with their own wallet, then (2) `PUT /community` to persist the brand. The shell then re-renders
  the ManagerPanel.
- API: `PUT /community` keeps its `is_manager` gate — but it needs no key of its own; it just
  confirms the user's on-chain self-registration landed before persisting a brand.

**Pivot note:** an earlier iteration this session had the API hold the deployer key and broker
`set_manager` (`ADMIN_SECRET_KEY`, `lib/soroban-admin.ts`). Superseded here — the admin key in the
API was itself a centralization the user asked to remove. That code was deleted; no admin key exists
anywhere in the request path now.

**Why this is allowed to touch the "frozen" contract:** same reasoning as D-010 — an explicit
Phase-2 product decision by the owner, documented here and mirrored into `CONTRACT_SPEC.md §func` +
the test list, not a silent change.

**Trust / abuse note:** permissionless means no spam control — anyone can register as a manager and
publish. Acceptable for a testnet demo (D-002). A production system would gate publishing with
economic skin in the game (a slashable stake on `set_manager`/`register_content`) or curation, not
a platform whitelist. The `admin` field in `Config` is now unused by `set_manager` (still used
elsewhere); a future stake/governance model would give it a new role or remove it.

**Activation:** requires **redeploying the `komunify` contract** — the live testnet deployment still
carries the old admin gate, so the browser self-register call fails against it until redeploy. New
contract id + re-seed. Tracked in PROGRESS.

**Rules out:** an admin whitelist for managers; the API holding the admin key; an unauthenticated
`set_manager` (griefing — anyone disabling anyone).

---

## D-012 — Epoch is 30 days; `force_close_epoch()` (admin) ends it on demand for the demo.

**Decided:** 2026-07-12 (Phase 2, at user request — "epoch should be 30 days")

The demo ran `epoch_secs = 300` so the subscribe → read → settle → claim loop fit in a few minutes.
But since epoch = billing period (D-009), that made the price read as "10 USDC / 5 min" (~$2,880/day)
— a credibility problem in the demo. Fix: **deploy with `epoch_secs = 2592000` (30 days)** — the
honest billing period — and add an admin-only `force_close_epoch()` to end the current epoch on
demand so settlement can still be shown live.

**Why not just mutate `epoch_secs` mid-flight:** the epoch number is `(now - genesis) / epoch_secs`,
the divisor over *all* history. Overwriting it renumbers past time non-monotonically (can jump the
current epoch backward → re-open a settled epoch, double-attribute a budget) and orphans every
epoch-keyed entry (`Sub`, `Budget`, `Read`, `Settled`). Unsafe.

**Mechanism (rebase, not renumber):** an `epoch_base: u32` (instance storage, default 0) offsets the
epoch number; `current_epoch = epoch_base + (now - genesis) / epoch_secs`. `force_close_epoch()` sets
`epoch_base = current + 1` and `genesis = now`, so the current epoch ends immediately, the next one
starts now, epoch numbers stay strictly monotonic, and no started epoch is renumbered — all existing
epoch-keyed state stays addressable. `Config`'s shape is unchanged (base lives outside it), so
bindings / `init` args / seed are untouched. `epoch_ends_at(e)` for `e < epoch_base` returns the last
rebase timestamp (display-only, approximate — acceptable).

**Distribution is unchanged.** `force_close_epoch()` does NOT distribute. There is no pool (D-009);
settlement stays the per-member `settle_member` pull, exactly as at a natural boundary. Closing just
makes the epoch settleable. (An on-chain "distribute everyone" loop was rejected: D-009 keeps no
enumerable member set on-chain, and looping N members risks the tx resource limit.)

**Contract change:** `force_close_epoch(admin)` (admin-gated, `require_auth(admin)`); `epoch_base`
storage key; `compute_epoch`/`epoch_ends_at` rebased; `epoch_closed` event. Test t15 proves
monotonicity, that a pre-close budget survives and settles, that the old sub expires, and that a
fresh epoch runs. `cargo test -p komunify`: 17/17.

**Activation:** requires **redeploying `komunify`** (new function + storage) with `epoch_secs =
2592000`, new id, re-seed. The UI/README should state the epoch is 30 days and that the demo uses an
operator "force close" to compress it — not that billing is 5 minutes.

**Rules out:** a general mutable `epoch_secs` setter; an on-chain distribute-all loop; any member-
callable epoch close (admin-only — it moves everyone's billing boundary).

---

## D-013 — "Settle all" is a server-side batch of `settle_member` calls (approach C), not a contract function.

**Decided:** 2026-07-13 (Phase 2, manager dashboard UX)

D-009 already rules out an on-chain "distribute everyone" loop: there's no enumerable member set
in contract state, and looping N members risks the tx resource limit. But a manager dashboard with
one `settle_member(epoch, m)` button per subscriber doesn't scale past a couple of readers, and a
wallet-signed tx per member is a bad demo (N signature prompts).

**Mechanism:** `settle_member` stays permissionless and unchanged on-chain. The API adds
`POST /manager/settle-all` (`packages/api/src/routes/manager.route.ts`,
`packages/api/src/services/settle.service.ts`), manager-gated (`requireAuth` + `is_manager`). It:
1. Resolves `epoch = current_epoch() - 1` (the last closed cycle — `settle_member` errors
   `EpochNotClosed` on the open one).
2. Scans recent `kmf` contract events (`subscribed` minus `settled`, ~5.5h/4000-ledger lookback,
   paginated) to find that epoch's un-settled subscribers. No enumerable on-chain member list, so
   this is the only source; upgrade path is indexing `subscribed` into Postgres at scale.
3. Signs and submits `settle_member(epoch, m)` **sequentially**, one tx per member, from a
   server-held `SETTLE_SIGNER_SECRET` keypair — so the manager signs nothing. Sequential keeps
   sequence-number handling simple; each member is its own tx so one failure never reverts the rest.
   `AlreadySettled` (a race with a concurrent per-member payout) is treated as success, not failure.
4. Returns `{ epoch, attempted, settled, failed, truncated }`; capped at `MAX_MEMBERS = 200` per
   call with `truncated: true` beyond that (call again to continue — no auto-pagination yet).

**Why manager-gated, not permissionless like `settle_member` itself:** the endpoint burns the
server signer's fee budget on every call, so it's kept off public traffic. The on-chain
authorization is unaffected — `settle_member` remains callable by anyone directly.

**Failure mode:** if `SETTLE_SIGNER_SECRET` is unset, the route returns 503
(`SETTLE_SIGNER_NOT_CONFIGURED`) rather than crashing — deployable without the batch feature.

**Rules out:** an on-chain `settle_all`/distribute loop (still ruled out by D-009's reasoning); a
client-side loop that has the connected wallet sign N transactions; caching a member list anywhere
on-chain to make enumeration cheaper.
