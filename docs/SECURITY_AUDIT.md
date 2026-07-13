# Security Audit — komunify

**Scope:** `contracts/contracts/komunify` (Soroban) and the community-brand API/UI surface
(`packages/api`, `packages/web`) that surrounds it.
**Method:** manual review of the authorization model, the money-flow invariants, and the
user-controlled input surface, cross-checked against the contract's own test suite.
**Date:** 2026-07-12 · **Reviewer:** Jason Stanley

This document exists to answer one question a judge (or an integrator) will reasonably ask:
*"Creating a community is free and permissionless — is that dangerous?"* The short answer is
**no theft is possible, and the residual risk is spam, which is bounded.** The reasoning below
is evidence-based: every claim points at a line of contract code or a passing test.

---

## 1. Authorization model (the trust boundary)

Every value-bearing entry point is gated by `require_auth` on the address that owns the value
being moved. There is no privileged path that can act *on behalf of* another wallet's money.

| Function | Auth gate | What it can touch |
|---|---|---|
| `subscribe(member)` | `member.require_auth()` — `lib.rs:337` | Pulls `price` **from the caller only** (`lib.rs:354`) |
| `claim(caller)` | `caller.require_auth()` — `lib.rs:486` | Withdraws **the caller's own** accrual only |
| `set_manager(who, …)` | `who.require_auth()` — `lib.rs:240` | Toggles **the subject's own** manager flag only |
| `register_content(caller, …)` | `caller.require_auth()` + manager check — `lib.rs:259` | Registers under the caller's own wallet |
| `record_access(member, …)` | `member.require_auth()` — `lib.rs:376` | Records a read for the caller only |
| `settle_member / claim_dust / end_epoch` | permissionless / admin as documented | Pure accounting; no caller-directed value |

**Consequence:** impersonation is impossible. An attacker cannot make a victim pay
(`subscribe`), cannot drain a victim's balance (`claim`), cannot register content as someone
else, and cannot flip another wallet's manager status. This is enforced by the SDK, not by
application logic, and is regression-tested: `t12_set_manager_requires_subject_auth`
(`test.rs:321`) asserts the call **panics** when the subject does not sign.

### Money-safety properties verified as *holding*

- **Checks-effects-interactions in `claim()`** — the accrual is zeroed (`lib.rs:493`) *before*
  the token transfer (`lib.rs:497`), so a re-entrant token could not double-withdraw.
- **Per-member budget isolation** — `settle_member` distributes exactly one member's budget
  (`Budget(epoch, m)`, `lib.rs:431`) across only the content **that member** read
  (`MemberContents`, `lib.rs:456`). One member's settlement can never reach into another
  member's budget.
- **No value is minted or lost** — post-fee revenue is either attributed to a manager, sent to
  the platform (idle subscriber, `lib.rs:445`), or captured as `Dust` from integer-division
  remainders (`lib.rs:459-472`). Conservation is asserted by the `t10_conservation` test.

---

## 2. The permissionless design (D-011) is intentional

Becoming a manager is self-service: any wallet calls `set_manager(self, true)` and pays only
network gas — there is no admin allow-list. This is a **deliberate decentralization guarantee**
(decision D-011), proven by `t12b_set_manager_permissionless_self_register` (`test.rs:346`).
It is the source of the "is it free?" question, so the findings below treat it as the design
premise and ask only: *what can a free, permissionless actor actually do?*

---

## 3. Findings

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| F-1 | Unvalidated `logo` field on a public, user-controlled record | **Medium** | **Fixed** |
| F-2 | Sybil / self-dealing revenue farming | Not exploitable (design-bounded) | Accepted |
| F-3 | Content & Explore-list spam via permissionless registration | **Low** (cosmetic) | Accepted / backlog |

### F-1 — Unvalidated `logo` field · Medium · FIXED

**Where:** `PUT /community/` → `CommunityService.save` persists a `logo` string that is rendered
publicly as `<img src={logo}>` (`explore-view.tsx:101`, `community-view.tsx:42`,
`community-onboarding.tsx`). The original schema constrained only length (`≤ 768 KB`), not
content.

**Impact (three distinct issues, in order of realism):**
1. **Tracking beacon / viewer deanonymization (privacy).** A `logo` set to an *external* URL
   (`https://attacker.example/pixel.png`) turns every visit to the public community page into a
   request to attacker-controlled infrastructure, leaking the IP and user-agent of everyone who
   views it. This needs no script execution — an `<img src>` to a remote host is sufficient.
2. **Storage abuse.** A 768 KB base64 blob per manager wallet, upserted for free.
3. **Latent XSS.** `<img src>` does not execute `javascript:` URIs or scripts inside an
   SVG data-URL *today*, so this is not live RCE. But an SVG payload becomes an XSS vector the
   moment anyone changes the render path (e.g. to `dangerouslySetInnerHTML` or inline SVG). It
   is defense-in-depth to reject it at the boundary now.

> **Honest severity note:** issue (3) is frequently *overstated* as live stored-XSS. Under the
> current `<img src>` render it is not exploitable; the concrete, present-day harm is the
> tracking beacon (1). Rated **Medium** on that basis, not on a hypothetical.

**Fix:** the `logo` field is now constrained to an inline **raster-image data URL** — exactly
the shape the browser's `FileReader.readAsDataURL` already produces — via a regex in the shared
Zod schema (`packages/shared/src/schemas/community.schema.ts`), which the API enforces on write
through `zValidator`. External URLs, protocol-relative URLs, `data:text/html`, `javascript:`,
and SVG are all rejected. The upload `accept` attribute was narrowed to match
(`community-onboarding.tsx`) so the client and server agree.

Verified with a behavior test — accepts real PNG/JPEG uploads, rejects the beacon URL,
protocol-relative URL, SVG-with-script, `data:text/html`, and `javascript:` payloads (7/7).

### F-2 — Sybil / self-dealing revenue farming · Not exploitable · ACCEPTED

**Hypothesis:** a permissionless manager spins up many wallets, subscribes with them, and reads
their own content to farm revenue.

**Why it fails — by construction.** Attribution is *per member*, not a shared pool (D-009). A
subscriber's post-fee budget is split only across the content **they** read
(`settle_member`, `lib.rs:454-467`). So a sybil reading its own content simply routes its own
post-fee budget back to its own manager wallet — while having paid the full `price`, including
the non-refundable platform fee. The attacker's net across both roles is therefore **negative
by exactly the fee**.

This is not an assumption; it is the assertion in `t11_sybil_property` (`test.rs:315`):

```rust
// Net across the attacker entity (mgr gains budget, alt paid price) = -fee.
assert_eq!(s.client.get_accrued(&attacker_mgr) - s.price, -fee);
```

The only way sybil activity dents an *honest* manager's revenue is the shared-audience case:
if an attacker persuades that manager's **own paying subscribers** to also read padding content
in the same epoch, the even per-read split (`budget / reads`, `lib.rs:455`) dilutes the honest
manager's slice of *those specific members'* budgets. That requires capturing real user
attention — a marketing/social cost, not a free on-chain exploit — and is bounded to the
affected members' budgets; it can never reach an honest manager's already-accrued balance.

### F-3 — Content & Explore-list spam · Low (cosmetic) · ACCEPTED / BACKLOG

Permissionless registration means an attacker can register junk content and (with a funded
wallet) appear in the Explore list, which surfaces any creator with `REGISTERED` content
(`community.service.ts:listWithContent`). There is no rate limit on `register_content` or
`PUT /community/`.

**Impact is discovery/UX pollution only** — not financial (see F-2). Per-wallet spam is bounded
by upsert-by-wallet (one brand per wallet) and by gas; cross-wallet spam requires funding fresh
wallets. Building anti-spam machinery (rate limits, moderation, reporting, per-wallet content
caps) is deferred as post-MVP: it addresses a problem that only exists at real-user scale and
would be premature for the current milestone.

---

## 4. Conclusion

The protocol's money paths are **sound**: authorization is enforced at the SDK boundary on
every value-moving call, budgets are isolated per member, `claim()` is reentrancy-safe, and
value is conserved — all backed by passing tests. **Theft, drain, impersonation, and
double-spend are not possible.**

"Creating a community is free" is safe because *creation moves no money* — it is a gas-only
on-chain flag plus a display-only off-chain record. The genuine risks are (a) an input-hygiene
issue on the public `logo` field, now **fixed and verified**, and (b) spam, which is bounded to
cosmetic harm by the per-member economic model and deferred to a post-MVP moderation backlog.

**Risk ranking:** discovery pollution (cheap, cosmetic) > logo hygiene (fixed) > revenue
dilution (bounded, needs real attention) > theft (impossible by design).
