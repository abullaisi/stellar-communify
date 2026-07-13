# CONTRACT_SPEC.md — Frozen Soroban ABI

**This file is the contract between agents.** The contracts agent implements it. The API and web
agents build against it before it exists. Nobody changes a signature here without a `DECISIONS.md`
entry and a note in `PROGRESS.md`.

Two contracts, both in the existing `contracts/` Cargo workspace:

| Crate | Path | Purpose |
|---|---|---|
| `usdc` | `contracts/contracts/usdc/` | Mock SEP-41 token, testnet only. See D-002. |
| `komunify` | `contracts/contracts/komunify/` | Subscriptions, content registry, read accounting, payouts. |

---

## 1. `usdc` — mock SEP-41 token

Implements `soroban_sdk::token::TokenInterface` in full (`allowance`, `approve`, `balance`,
`transfer`, `transfer_from`, `burn`, `burn_from`, `decimals`, `name`, `symbol`). Plus:

```rust
/// One-time setup. admin may mint freely.
fn init(env: Env, admin: Address);

/// Admin mint. require_auth(admin).
fn mint(env: Env, to: Address, amount: i128);

/// Open testnet faucet. require_auth(caller).
/// Mints FAUCET_AMOUNT (500_0000000 = 500 USDC at 7dp) to caller.
/// Panics with Error::FaucetCooldown if called again within 86400 seconds.
fn faucet(env: Env, caller: Address);

/// Unix seconds when `who` may next call faucet(). 0 if never used.
fn faucet_available_at(env: Env, who: Address) -> u64;
```

`decimals() == 7`. `symbol() == "USDC"`. `name() == "Komunify Test USDC"`.

---

## 2. `komunify` — main contract

### 2.1 Types

> **Attribution model: per-member (D-009), not shared-pool.** Each subscription's post-fee revenue
> is a budget owned by that member for that epoch, split only across the content that member read.
> There is no pool. If you are reading an older draft that mentions `Pool`, `settle_content`, or
> `period_secs`, it is superseded — see D-004/D-009.

```rust
#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub admin: Address,
    pub token: Address,          // usdc contract id
    pub platform: Address,       // receives platform fee, dust, and idle-subscriber budget
    pub platform_bps: u32,       // e.g. 1000 = 10%. Max 10_000.
    pub price: i128,             // subscription price, token base units
    pub epoch_secs: u64,         // billing + settlement window. Deploy at 2592000 (30d) — D-012.
    pub genesis: u64,            // ledger timestamp of the current epoch base (moves on force_close)
}
// NOTE: no period_secs. The epoch IS the billing period (D-009). Subscribing in epoch e grants
// access for epoch e only.
// NOTE: epoch_base (u32, instance storage, default 0) offsets the epoch number; force_close_epoch
// rebases (genesis, epoch_base) so a demo can close a 30-day epoch on demand — D-012.

#[contracttype]
#[derive(Clone)]
pub struct Content {
    pub id: u64,
    pub creator: Address,
    pub managers: Vec<Address>,  // revenue split equally among these. Always contains creator.
    pub sha256: BytesN<32>,      // hash of the PDF bytes
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct Stats {
    pub total_subs: u64,         // lifetime successful subscribe() calls
    pub total_volume: i128,      // lifetime token base units received by subscribe()
    pub total_claimed: i128,     // lifetime token base units withdrawn via claim()
    pub content_count: u64,
    pub manager_count: u32,
}
```

### 2.2 Storage keys

```rust
#[contracttype]
pub enum DataKey {
    Config,                          // instance
    Stats,                           // instance
    NextContentId,                   // instance
    Manager(Address),                // persistent -> bool
    Content(u64),                    // persistent -> Content
    Sub(Address),                    // persistent -> u32    (epoch the member subscribed to)
    Budget(u32, Address),            // persistent -> i128   (epoch, member -> post-fee budget)
    MemberReads(u32, Address),       // persistent -> u32    (epoch, member -> # distinct contents read)
    MemberContents(u32, Address),    // persistent -> Vec<u64> (epoch, member -> content ids read)
    Read(u32, u64, Address),         // persistent -> bool   (epoch, content, member -> has read)
    ContentReads(u32, u64),          // persistent -> u32    (epoch, content -> unique reads) DISPLAY ONLY
    Settled(u32, Address),           // persistent -> bool   (epoch, member -> budget distributed)
    Accrued(Address),                // persistent -> i128
    Dust,                            // instance -> i128 (rounding remainder, claimable by platform)
}
```

`ContentReads` does **not** drive money under D-009 — it exists only so the manager dashboard can
show "your content got N reads this epoch." Money follows `MemberContents` / `MemberReads`. Keep the
two straight.

Every persistent read/write must `extend_ttl`. Use a shared `bump()` helper. A contract that
silently loses state to TTL expiry after the demo is a failed demo.

### 2.3 Errors

```rust
#[contracterror]
#[derive(Copy, Clone, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized     = 2,
    NotAdmin           = 3,
    NotManager         = 4,
    NotContentCreator  = 5,
    SubExpired         = 6,   // record_access with no active subscription
    ContentNotFound    = 7,
    ContentInactive    = 8,
    EpochNotClosed     = 9,   // settle_member on the current or a future epoch
    AlreadySettled     = 10,
    NothingToClaim     = 11,
    InvalidBps         = 12,  // platform_bps > 10_000
    InvalidAmount      = 13,
    FaucetCooldown     = 14,  // usdc crate
    AlreadySubscribed  = 15,  // subscribe twice in the same epoch
}
```

### 2.4 Mutating functions

```rust
/// One-time. Sets Config, zeroes Stats, NextContentId = 1, genesis = now.
fn init(env: Env, cfg: Config);

/// Permissionless self-service (D-011). require_auth(who): a wallet toggles only its OWN
/// manager status (enable to publish, disable to resign). No admin gate. Adjusts Stats.manager_count.
fn set_manager(env: Env, who: Address, enabled: bool);

/// Manager-gated. require_auth(caller). caller must be a whitelisted manager.
/// Creates Content { id: next, creator: caller, managers: vec![caller], sha256, active: true }.
/// Returns the new content id.
fn register_content(env: Env, caller: Address, sha256: BytesN<32>) -> u64;

/// require_auth(creator). Only the content's creator may add co-managers.
/// `who` must be a whitelisted manager. No-op if already present.
fn add_content_manager(env: Env, creator: Address, content_id: u64, who: Address);

/// require_auth(creator). Sets Content.active. Inactive content cannot be read.
/// Already-recorded reads still settle normally.
fn set_content_active(env: Env, creator: Address, content_id: u64, active: bool);

/// require_auth(member). Errors AlreadySubscribed if Sub(member) == current_epoch().
///   e     = current_epoch()
///   fee   = price * platform_bps / 10_000
///   rest  = price - fee
///   token.transfer(member -> contract, price)
///   accrued[platform] += fee
///   Budget(e, member) = rest          // this member's private budget for this epoch
///   Sub(member) = e                   // access is granted for epoch e only (expires at boundary)
///   stats.total_subs += 1; stats.total_volume += price
/// Emits `subscribed`.
///
/// NOTE: no shared pool. Each member's budget is theirs alone (D-009).
fn subscribe(env: Env, member: Address);

/// require_auth(member). Errors SubExpired unless is_active(member) (i.e. Sub(member) == current).
/// Errors ContentNotFound / ContentInactive as applicable.
/// IDEMPOTENT per (epoch, content, member): if Read(e,c,m) is already true, returns without
/// incrementing any counter. Must not error — the web client may retry.
///   e = current_epoch()
///   Read(e, content_id, member) = true
///   MemberReads(e, member) += 1
///   append content_id to MemberContents(e, member)
///   ContentReads(e, content_id) += 1        // display only, does not drive money
/// Emits `accessed` only on the first read.
fn record_access(env: Env, member: Address, content_id: u64);

/// Permissionless. Anyone may call (managers do, to trigger their payout; the platform can as a
/// backstop). Distributes ONE member's budget for ONE past epoch.
/// Errors EpochNotClosed if `epoch >= current_epoch()`. Errors AlreadySettled if Settled(epoch, m).
///
///   budget = Budget(epoch, m)
///   reads  = MemberReads(epoch, m)
///   if budget == 0 { Settled = true; return }          // never subscribed / nothing to do
///   if reads == 0 {                                    // idle subscriber (D-009)
///       Accrued(config.platform) += budget             // idle budget -> platform
///       Settled(epoch, m) = true; return
///   }
///   per_content = budget / reads                       // i128; the member's per-content share
///   for c in MemberContents(epoch, m) {
///       mgrs = Content(c).managers
///       per  = per_content / mgrs.len() as i128
///       for mgr in mgrs { Accrued(mgr) += per }
///       Dust += per_content - per * mgrs.len() as i128  // split remainder
///   }
///   Dust += budget - per_content * reads as i128        // division remainder across contents
///   Settled(epoch, m) = true
/// Emits `settled`.
///
/// Conservation: every base unit of `budget` ends in some Accrued entry or in Dust. Nothing is
/// stranded, nothing is double-counted. There is no denominator shared across members, so the
/// pool-model footgun (decrementing a shared pool mid-settle) cannot occur here.
fn settle_member(env: Env, epoch: u32, m: Address);

/// require_auth(caller). Errors NothingToClaim if Accrued(caller) == 0.
/// Transfers Accrued(caller) from contract to caller, zeroes it.
/// stats.total_claimed += amount. Emits `claimed`.
/// The platform address claims its fees through this same function.
fn claim(env: Env, caller: Address);

/// require_auth(admin). Transfers Dust to Config.platform, zeroes Dust.
fn claim_dust(env: Env, admin: Address);

/// require_auth(admin). Ends the current epoch immediately (it becomes closed +
/// settleable) and starts a fresh epoch of the same epoch_secs now. Does NOT
/// distribute — distribution stays the per-member `settle_member` pull, exactly
/// as at a natural boundary. Epoch numbers stay strictly monotonic; no started
/// epoch is renumbered (D-012). Operator/demo tool. Emits `epoch_closed`.
fn force_close_epoch(env: Env, admin: Address);
```

### 2.5 Read-only functions

All of these are called by the web app and the API via `simulateTransaction` — no signing, no fee.

```rust
fn get_config(env: Env) -> Config;
fn get_stats(env: Env) -> Stats;
fn current_epoch(env: Env) -> u32;            // epoch_base + (now - genesis) / epoch_secs (D-012)
fn epoch_ends_at(env: Env, epoch: u32) -> u64;

fn is_manager(env: Env, who: Address) -> bool;
fn is_active(env: Env, member: Address) -> bool;        // Sub(member) == current_epoch()
fn get_subscription(env: Env, member: Address) -> u64;  // epoch_ends_at(Sub(member)); 0 if inactive

fn get_content(env: Env, content_id: u64) -> Content;   // errors ContentNotFound
fn list_content(env: Env, start: u64, limit: u32) -> Vec<Content>;

fn has_read(env: Env, epoch: u32, content_id: u64, member: Address) -> bool;
fn get_content_reads(env: Env, epoch: u32, content_id: u64) -> u32;  // display only
fn get_budget(env: Env, epoch: u32, member: Address) -> i128;
fn get_member_reads(env: Env, epoch: u32, member: Address) -> u32;
fn is_settled(env: Env, epoch: u32, member: Address) -> bool;

fn get_accrued(env: Env, who: Address) -> i128;
fn get_dust(env: Env) -> i128;
```

### 2.6 Events

Topic prefix `"kmf"` on every event so `getEvents` can filter cheaply.

| Topics | Data |
|---|---|
| `("kmf", "subscribed", member)` | `(price: i128, expires_at: u64, epoch: u32)` |
| `("kmf", "content", creator)` | `(content_id: u64, sha256: BytesN<32>)` |
| `("kmf", "accessed", member)` | `(content_id: u64, epoch: u32)` |
| `("kmf", "settled", member)` | `(epoch: u32, budget: i128)` |
| `("kmf", "claimed", who)` | `(amount: i128)` |
| `("kmf", "epoch_closed")` | `(closed: u32, new_base: u32, at: u64)` |

The traction dashboard is built from `getEvents` over these topics plus `get_stats()`. There is no
Horizon indexer and no event table in Postgres.

---

## 3. Settlement — per member (D-009)

Read this before writing `settle_member`.

**Invariant (per member, per epoch):** every base unit of `Budget(e, m)` ends up in some `Accrued`
entry or in `Dust`. No overpay, no strand:

```
sum over c in read-set of (per * mgrs(c).len())     // paid to managers
  + sum over c of (per_content - per*mgrs.len())     // per-content split remainder -> Dust
  + (budget - per_content * reads)                   // across-content remainder -> Dust
  == budget                                          // exactly
```

For an idle member (`reads == 0`) the whole budget goes to the platform's `Accrued`. No case leaves
money in `Budget`.

**Why the pool footgun is gone:** there is no denominator shared across members. Member A's
settlement never reads or writes anything that affects member B's settlement. You cannot
under-attribute by settling in the wrong order, because there is no order dependence. This is the
structural reason D-009 replaced the pool model — not just the sybil economics.

**Per-member settlement, bounded work:** `settle_member` distributes one member's budget across the
handful of contents that member read (`MemberContents` — realistically single digits to low tens).
It never loops all content or all members, so it stays inside the transaction resource budget. Anyone
may call it; the manager dashboard fires `settle_member` for members who read the manager's content
in a closed epoch. A "settle all my readers" button loops client-side, one tx per member.

**Backstop for unsettled budgets:** if nobody calls `settle_member(e, m)`, that member's budget sits
in the contract. There is no separate sweep — the platform (or anyone) calls `settle_member` as a
backstop; an idle member's budget then routes to the platform, an active member's to the managers
they read. Seed/demo scripts and the dashboard should settle the previous epoch's members on epoch
rollover so nothing lingers.

**Demo timing (D-012):** `epoch_secs` is the billing period AND the settlement window (D-009).
**Deploy with `epoch_secs = 2592000` (30 days)** — the honest billing period, so the price reads as
"10 USDC / month" instead of "10 USDC / 5 min". To fit subscribe → read → settle → claim into a
recorded video, the admin calls **`force_close_epoch()`** to end the current epoch on demand; it
becomes settleable immediately and a fresh 30-day epoch starts. No separate short-epoch deployment,
and no 5-minute-billing artifact to disclaim.

**Required unit tests** (`contracts/contracts/komunify/src/test.rs`):

1. One member reads two contents (one manager each), even budget → each manager gets `budget/2`.
2. One member reads two contents, budget not divisible by 2 → each gets `budget/2` (floor), the
   remainder lands in `Dust`.
3. One member reads one content with two managers, odd `per_content` → each gets `per_content/2`,
   remainder in `Dust`.
4. `settle_member` twice for the same `(epoch, member)` → second call errors `AlreadySettled`.
5. `settle_member` on the current epoch → errors `EpochNotClosed`.
6. `record_access` twice for the same `(member, content)` → `MemberReads` and `ContentReads`
   increment once; `MemberContents` contains the id once.
7. `record_access` with an inactive subscription (subscribed to an earlier epoch) → `SubExpired`.
8. `subscribe` twice in the same epoch → `AlreadySubscribed`. Subscribing again in a later epoch
   succeeds and grants that later epoch.
9. Idle member (subscribed, zero reads) → `settle_member` credits the full budget to the platform;
   managers get nothing.
10. **Conservation:** for a fixed epoch, settle every member who subscribed, then assert
    `sum(all Accrued deltas) + Dust_delta == sum(all Budget)`. This is the acceptance gate.
11. **Sybil property:** attacker is a manager, subscribes from an alt wallet, reads only their own
    single-manager content, then settles → attacker's `Accrued` gain equals `price*(1-bps)`, i.e.
    net of the paid `price` the attacker is down exactly the platform fee. Encodes D-009's claim.
12. `set_manager` without the subject's auth → panic; a wallet self-registers (own auth, no admin) → `is_manager` true.
13. `register_content` from a non-manager → `NotManager`.
14. `claim` with zero accrued → `NothingToClaim`.

Tests 10 and 11 are the ones that catch real bugs. Do not skip them.

---

## 4. Deployment + bindings

The existing `Makefile` and the `contract:bindings` script in the root `package.json` are
**hardcoded to a single contract named `notes`**. Both must be generalised to build and bind two
contracts. Bindings land as:

```
packages/contract-client/src/komunify.ts   // generated, do not edit
packages/contract-client/src/usdc.ts       // generated, do not edit
packages/contract-client/src/index.ts      // hand-written barrel re-exporting both
```

Deployment order matters: deploy `usdc` first, `init` it, then deploy `komunify` and `init` it with
the usdc contract id as `Config.token`.

Contract ids are written to `.contract-id.usdc` and `.contract-id.komunify`, and surfaced as
`NEXT_PUBLIC_USDC_CONTRACT_ID` / `NEXT_PUBLIC_KOMUNIFY_CONTRACT_ID` for web, and the unprefixed
equivalents for the API.
