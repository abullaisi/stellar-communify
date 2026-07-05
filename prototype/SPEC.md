# Komunify Prototype -- Screen Spec (build brief)

Clickable static-HTML prototype of the Komunify MVP (Faris PRD v2.0), 4 screens following the PRD demo script: connect wallet > choose subscription > sign payment > entitlement activation > payout split > traction dashboard.

Sources of truth (read before building):
- `/Users/imam/Documents/stellar-hackathon/DESIGN.md` (SPLIT v4 theme, component specs, motion rules)
- `styles.css` in this folder (ALL classes you may use; do not invent CSS)
- `app.js` in this folder (state + data: `K`, `KDATA`, `shortAddr`, `shortHash`, `fmtXlm`)

## Hard rules (violations = rejected)

1. **No raw hex colors, no new CSS files.** If a screen truly needs a local style, max ~15 lines in a `<style>` block using ONLY the CSS custom properties, with a comment `/* candidate for promotion */`.
2. **No em dashes (—) anywhere in copy.** Use periods, commas, or colons.
3. **One primary button per card.** Secondary actions use `class="ghost"`.
4. All numbers that can column-align use existing classes (`.balance`, `.alloc-amt`, `.stat-value`) or inherit `tabular-nums` from them.
5. Copy tone: simple, concrete, benefits before features, 8th grade reading level. No "leverage", "unlock" is allowed ONLY as the product's literal verb (unlocking benefits), no "seamless", no "robust".
6. Accent gold marks the primary action and focus only. Never decorative. The `.split-flow` glow class goes on exactly ONE card in the whole prototype (the split card on subscribe.html).
7. **Desktop-first (revised 2026-07-05, Imam's call; supersedes the original 520px single-column rule).** `.shell` is 1080px. Every page opens with the shared `.topbar` (logo left; mono uppercase nav Connect/Subscribe/Benefits/Dashboard/Traction with `.active` on the current page; `#topbar-wallet` code chip filled by app.js when connected). Content lays out with the shared grids: `.grid-2` (index hero|connect, subscribe subscription|split, traction payout|activity), `.grid-3` (benefits partner cards), `.grid-dash` (dashboard: library 2fr | membership+stats rail), `.grid-detail` (partner: rail 1fr | content 2fr). Grids collapse to one column under 900px as a fallback, not a design target. Footer is a one-line credit: PROTOTYPE · Komunify on Stellar testnet · Reset demo.
8. Valid standalone HTML5 file: `<!DOCTYPE html>`, `<html lang="en">`, `<head>` with `<meta charset>`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<title>`, `<link rel="stylesheet" href="styles.css">`, `<script src="app.js"></script>` before the closing body tag followed by the page's own inline `<script>`.

## Shared page skeleton (identical on every screen)

```html
<main class="shell">
  <div class="topbar">
    <a class="logo" href="index.html">Komunify</a>
    <nav class="topbar-nav">
      <a href="index.html">Connect</a>
      <a href="subscribe.html">Subscribe</a>
      <a href="benefits.html">Benefits</a>
      <a href="dashboard.html">Dashboard</a>
      <a href="traction.html">Traction</a>
      <code id="topbar-wallet" class="hidden"></code>
    </nav>
  </div>

  <!-- stepper card: see per-screen state -->

  <!-- screen content, using the shared grids -->

  <footer>
    <span class="label">Prototype</span> · Komunify on Stellar testnet ·
    <a href="#" id="reset-proto">Reset demo</a>
  </footer>
</main>
```
Mark the current page's topbar link with `class="active"`.

Wire `#reset-proto` to `K.reset()` then reload to `index.html`.

## Stepper (shared molecule, states per screen)

```html
<div class="card">
  <div class="stepper">
    <div class="step done"><span class="step-dot">1</span><span class="step-name">Connect</span></div>
    <div class="step-line lit"></div>
    <div class="step active"><span class="step-dot">2</span><span class="step-name">Pay</span></div>
    <div class="step-line"></div>
    <div class="step todo"><span class="step-dot">3</span><span class="step-name">Unlocked</span></div>
  </div>
</div>
```

Done steps: `step done` + preceding `step-line lit`. Use checkmark `✓` in the dot for done steps.

- index.html: 1 active, 2-3 todo (when wallet connected: 1 done, 2 active)
- subscribe.html: 1 done, 2 active, 3 todo (after payment success: all done)
- benefits.html: all done
- traction.html: no stepper (judge-facing screen, not part of the member flow)

## Screen 1: `index.html` (Connect)

PRD 7.1 acceptance: user can connect a supported wallet and see connected account state.

- Hero card (`.card.center`): two-tone headline `<h1 class="headline">One payment.<span class="gold">Every community.</span></h1>`, then one short sentence: subscribe once on Stellar, get member benefits from every partner community in the bundle.
- Partner cluster inside hero: `.avatar-group` of the 3 partners from `KDATA.partners` (use `initial` + `avatarCls`), `.avatar-note` "3 partner communities in this bundle".
- Connect card, two states:
  - Disconnected: `.num-label` (`<span class="num">01</span> WALLET`), hint text, primary button "Connect Wallet". On click: `K.connect()` then re-render (or reload).
  - Connected: `.label` WALLET, address `code` chip via `shortAddr(K.wallet)` with `title` = full address, `.pill.ok` TESTNET, balance block (`.label` XLM BALANCE + `.balance` via `fmtXlm(KDATA.demoBalanceXlm)`), `.row.tight` with primary "Choose subscription" linking to subscribe.html (use `.btn`) and ghost "Disconnect" (calls `K.disconnect()` + re-render).
- If already subscribed (`K.subscribed`), the connected card's primary CTA says "Open member dashboard" and links to benefits.html instead.
- Render state with a small inline script (show/hide `.hidden` sections).

## Screen 2: `subscribe.html` (Pay + split)

PRD 7.1 + 7.3 acceptance: submit one subscription payment on testnet; split logic visible; tx status visible.

- Guard: if no `K.wallet`, show a single `.card.center` telling the user to connect first with a `.btn` back to index.html (hide everything else).
- Subscription card: `.num-label` (`02 SUBSCRIPTION`), plan name "Community Bundle, monthly", price as `.balance` (`fmtXlm(KDATA.priceXlm)`), 3 short included lines (member benefits at every partner, subscriber prices in the listing, on-chain receipt), primary button "Pay 10 XLM".
- Split card (THE `.split-flow` card, only glow use): `.num-label` (`03 AUTOMATIC SPLIT`), one sentence: the Soroban contract splits every payment the moment it settles. Then 3 `.alloc-row`s from `KDATA.split`: name, `.alloc-pct` (70%, 20%, 10%), `.alloc-amt` (7 XLM, 2 XLM, 1 XLM), `.alloc-track` + `.alloc-fill` (width = pct, classes from `cls`).
- Contract line under the rows: `.hint` with contract `code` chip `shortAddr`-style (use `shortHash(KDATA.contractId)` or first/last chars) + `title` full id.
- Tx status area (hidden until Pay is clicked):
  - Pending: `.toast.pending` with dot, `t-msg` "Confirming on Stellar testnet", `t-sub` "Waiting for signature and ledger close".
  - Success (`K.subscribe` callback): swap to `.toast.tx-success` with `t-msg` "Subscription active", `t-sub` showing tx hash `code` chip (`shortHash(KDATA.demoTxHash)`, `title` full hash) linking to `KDATA.explorerBase + "/tx/" + KDATA.demoTxHash`. Then reveal (`.fade-in`) a primary `.btn.block` "See what you unlocked" to benefits.html. Update the stepper to all done. Disable the Pay button after success ("Subscribed" label).
- If already subscribed on load, show the success state directly.

## Screen 3: `benefits.html` (Member dashboard / entitlements + listing)

PRD 7.1 + 7.2 acceptance: entitlement record visible; dashboard shows unlocked partner benefits; subscribers see discounted pricing.

- Guard: if not `K.subscribed`, single `.card.center`: "No active subscription yet", `.btn` to subscribe.html (hide the rest).
- Membership card: `.label` MEMBERSHIP, `.row` with "Community Bundle" (16px/600, use `h2`) + `.pill.accent` ACTIVE, `.hint` "Renews Aug 5, 2026 · entitlement recorded on-chain", address `code` chip.
- One card per partner (3 cards) from `KDATA.partners`: `.row` header with `.avatar` + partner name (`h2`) + `.badge.unlocked` UNLOCKED, then each benefit as a `.benefit-line` (benefit text left, `.pill.ok` INCLUDED right).
- Listing card: `.num-label` (`04 MEMBER PRICES`), one sentence: partner items at subscriber prices, on Stellar. Per `KDATA.listings` a `.benefit-line`: left = item name (13px) + `.hint`-style sub-line (kind · partner, margins tightened via existing classes), right = `.price-was` (fmtXlm priceXlm) + `.price-now` (fmtXlm memberPriceXlm) side by side in a `.row.tight`.
- Bottom `.row.tight`: primary `.btn` "View on-chain traction" to traction.html.

## Screen 4: `traction.html` (On-chain traction dashboard)

PRD 7.4 acceptance: subscriber count, payment volume, payout summary, recent activity, judge-verifiable against chain.

- No stepper. Top: `.num-label` (`05 TRACTION`), `h2`-weight title "Live on-chain traction", one sentence: every number below reads from the KomunifyContract on Stellar testnet.
- `.stat-strip` with 3 `.stat-chip`s from `KDATA.stats`: SUBSCRIBERS / VOLUME / PAYOUT EVENTS (`.label` + `.stat-value`, one `.stat-delta` "+12 this week" on subscribers).
- Payout summary card: `.label` PAYOUT SPLIT TO DATE, 3 `.alloc-row`s from `KDATA.split` with amounts = pct of `KDATA.stats.volumeXlm` (896 / 256 / 128 XLM), tracks as on subscribe. NO glow here.
- Activity card: `.label` RECENT ACTIVITY, `.feed-row`s from `KDATA.activity`: left = kind (600 weight) + detail (`.t-sub` styling via existing classes or plain 13px secondary span), right = `.feed-when`.
- Contract card: `.label` CONTRACT, `code` chip with `shortHash(KDATA.contractId)` (`title` full), `.pill.ok` TESTNET, `.row.tight` with ghost `.btn` "View on Stellar Expert" linking `KDATA.explorerBase + "/contract/" + KDATA.contractId` (target _blank) and ghost "Latest tx" linking the demo tx.
- Bottom: ghost `.btn` back to benefits.html.

## Screen 5: `partner.html?p=<partner-id>` (Member content preview)

Added 2026-07-05 after the first build round. Reached from a small hyperlink icon (`.icon-link`, external-link SVG) next to the partner name on each benefits.html partner card.

- Guard: if not `K.subscribed`, "Members only" `.card.center` with a `.btn` to subscribe.html.
- Partner header card: `.avatar` + name (from `?p=` id, fallback first partner) + `.badge.unlocked`, hint about on-chain entitlement.
- Content card: `.num-label` (`06 MEMBER CONTENT`), rows from `KDATA.partners[].content` (types: course / video / ebook / link). Each row: `.content-type` mono label, `.content-title`, `.content-meta`, right side ghost `sm` action. Course/video/ebook get a "Preview" toggle revealing a `.preview-pane` (course: `.module-line` list; video: `.media-ph` + play glyph; ebook: skeleton sample lines). Link rows get a dummy "Open" anchor (`href="#"`).
- Ghost "Back to benefits" at the bottom. Shared chrome identical to the other screens.

## Screen 6: `dashboard.html` (Access dashboard)

Added 2026-07-05. The member's single hub for everything the subscription unlocks. Linked from: the footer on every page, index.html's subscribed CTA ("Open member dashboard"), a ghost link on benefits.html's membership card, and partner.html's bottom row.

- Guard: if not `K.subscribed`, "Members only" `.card.center` with a `.btn` to subscribe.html.
- Membership card: same shape as benefits.html's (label, Community Bundle + `.pill.accent` ACTIVE, renew hint, wallet chip).
- `.stat-strip` with 3 `.stat-chip`s computed from KDATA: PARTNERS (partners.length), ITEMS UNLOCKED (sum of content lengths), MEMBER PRICES (listings.length).
- Access library card: `.num-label` (`07 ACCESS LIBRARY`), one `.content-line` row per content item across ALL partners (type label, title, meta prefixed with the partner name), right side ghost `sm` "Open" linking `partner.html?p=<id>`.
- Bottom `.row.tight`: ghost "All benefits" + ghost "On-chain traction".

## Definition of done per screen

- Renders correctly standalone at 520px and at 375px wide (mobile).
- All interactive elements work with the simulated state (connect, pay, reset).
- Zero raw hex, zero em dashes, valid HTML.
- Links between screens use relative hrefs exactly as named above.
