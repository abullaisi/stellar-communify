# Komunify Prototype -- Screen Spec (build brief)

Clickable static-HTML prototype of the Komunify MVP (Faris PRD v2.0), 4 screens following the PRD demo script: connect wallet > choose subscription > sign payment > entitlement activation > payout split > traction dashboard.

Sources of truth (read before building):
- `/Users/imam/Documents/stellar-hackathon/DESIGN.md` (SPLIT v4 theme, component specs, motion rules)
- `styles.css` in this folder (ALL classes you may use; do not invent CSS)
- `app.js` in this folder (state + data: `K`, `KDATA`, `shortAddr`, `shortHash`, `fmtXlm`)

## Hard rules (violations = rejected)

1. **No raw hex colors, no new CSS files.** If a screen truly needs a local style, max ~15 lines in a `<style>` block using ONLY the CSS custom properties, with a comment `/* candidate for promotion */`.
2. **No em dashes (the long dash character) anywhere in copy.** Use periods, commas, or colons.
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
- **Revised 2026-07-16 (Faris round-2 review): the Automatic Split card is removed.** The pay flow ends at the subscription card and the tx status area. Fee shares are not shown as a fixed split on this screen; they are dynamic and set by each community's DAO (see Screen 8 below).
- Contract line: no longer shown on this screen (it lived on the removed split card). Contract identity now surfaces on traction.html.
- Tx status area (hidden until Pay is clicked):
  - Pending: `.toast.pending` with dot, `t-msg` "Confirming on Stellar testnet", `t-sub` "Waiting for signature and ledger close".
  - Success (`K.subscribe` callback): swap to `.toast.tx-success` with `t-msg` "Subscription active", `t-sub` "Auto-split on-chain, shares set by DAO governance" plus the tx hash `code` chip (`shortHash(KDATA.demoTxHash)`, `title` full hash) linking to `KDATA.explorerBase + "/tx/" + KDATA.demoTxHash`. Then reveal (`.fade-in`) a primary `.btn.block` "See what you unlocked" to benefits.html. Update the stepper to all done. Disable the Pay button after success ("Subscribed" label).
- If already subscribed on load, show the success state directly.

## Screen 3: `benefits.html` (Member dashboard / entitlements + listing)

PRD 7.1 + 7.2 acceptance: entitlement record visible; dashboard shows unlocked partner benefits; subscribers see discounted pricing.

- Guard: if not `K.subscribed`, single `.card.center`: "No active subscription yet", `.btn` to subscribe.html (hide the rest).
- **Removed 2026-07-16 (Faris round-2 review):** the Connect/Pay/Unlocked stepper card that used to render at the top of this screen (all-done state) is gone. It duplicated the payment flow's own stepper on subscribe.html once the user had already arrived here as a subscriber.
- Membership card: `.label` MEMBERSHIP, `.row` with "Community Bundle" (16px/600, use `h2`) + `.pill.accent` ACTIVE, `.hint` "Renews Aug 5, 2026 · entitlement recorded on-chain", address `code` chip.
- One card per partner (3 cards) from `KDATA.partners`: `.row` header with `.avatar` + partner name (`h2`) + a quiet status text ("Unlocked", plain `.content-meta`, no pill/badge shape per the 2026-07-16 review), then each benefit as a `.benefit-line` (benefit text left, `.pill.ok` INCLUDED right).
- Listing card: `.num-label` (`04 MEMBER PRICES`), one sentence: partner items at subscriber prices, on Stellar. Per `KDATA.listings` a `.benefit-line`: left = item name (13px) + `.hint`-style sub-line (kind · partner, margins tightened via existing classes), right = `.price-was` (fmtXlm priceXlm) + `.price-now` (fmtXlm memberPriceXlm) side by side in a `.row.tight`.
- Bottom `.row.tight`: primary `.btn` "View on-chain traction" to dao.html (2026-07-16 review: traction now lives inside the DAO profile, see Screen 8).

## Screen 4: `traction.html` (Redirect, superseded 2026-07-16)

**Restructured per the Faris round-2 review (Bahasa doc): "Pindahkan halaman Traction ke DAO (List of DAO) -> Select DAO -> Profile DAO (Profiles, Packages, Traction, Proposals) -> View Traction or View Proposal."** Traction is no longer its own page. It now lives inside each DAO's profile (see Screen 8, Traction tab), reached via the DAO list.

`traction.html` is kept only as a thin redirect so old links keep working: `<meta http-equiv="refresh" content="0; url=dao.html">` plus a `location.replace("dao.html")` fallback and a visible `.btn` link, in case refresh is blocked. It carries no stats, no DAOS card, no stepper. Every nav "Traction" link across the prototype (sidenav MEMBER group, topbar funnel nav, dashboard/benefits CTA buttons) now points straight to `dao.html` instead of routing through the redirect.

## Screen 5: `partner.html?p=<partner-id>` (Member content preview)

Added 2026-07-05 after the first build round. Reached from a small hyperlink icon (`.icon-link`, external-link SVG) next to the partner name on each benefits.html partner card.

- Guard: if not `K.subscribed`, "Members only" `.card.center` with a `.btn` to subscribe.html.
- Partner header card: `.avatar` + name (from `?p=` id, fallback first partner) + a quiet status text ("Unlocked", plain `.content-meta`, no pill/badge shape per the 2026-07-16 review), hint about on-chain entitlement.
- Content card: `.num-label` (`06 MEMBER CONTENT`), rows from `KDATA.partners[].content` (types: course / video / ebook / link). Each row: `.content-type` mono label, `.content-title`, `.content-meta`, right side action. Non-link rows use a primary `.btn.sm` "ACCESS" (2026-07-16 review: replaces the ghost "Open" link). Link rows keep ghost `sm` "Open ↗" to the external URL.
- Ghost "Back to benefits" at the bottom. Shared chrome identical to the other screens.

## Screen 6: `dashboard.html` (Access dashboard)

Added 2026-07-05. The member's single hub for everything the subscription unlocks. Linked from: the footer on every page, index.html's subscribed CTA ("Open member dashboard"), a ghost link on benefits.html's membership card, and partner.html's bottom row.

- Guard: if not `K.subscribed`, "Members only" `.card.center` with a `.btn` to subscribe.html.
- Membership card: same shape as benefits.html's (label, Community Bundle + `.pill.accent` ACTIVE, renew hint, wallet chip).
- `.stat-strip` with 3 `.stat-chip`s computed from KDATA: PARTNERS (partners.length), ITEMS UNLOCKED (sum of content lengths), MEMBER PRICES (listings.length).
- Access library card: `.num-label` (`07 ACCESS LIBRARY`), one `.content-line` row per content item across ALL partners (type label, title, meta prefixed with the partner name), right side action: primary `.btn.sm` "ACCESS" for non-link items (2026-07-16 review), ghost `sm` "Open ↗" for link items.
- The "CONTINUE WHERE YOU LEFT OFF" hero card keeps its `.progress`/`.fill` bar (a 2026-07-16 first-pass removal of this bar was reverted: Faris's review screenshot was of the Connect/Pay/Unlocked **stepper**, not this learning-progress bar; see the correction below).
- **Corrected 2026-07-16 (Faris round-2 review, second pass):** the review's crossed-out screenshot was the Connect/Pay/Unlocked stepper strip rendering on post-subscribe app pages, not the `.progress`/`.fill` bars on this screen or on content.html. Those two `.progress` bars are restored as originally specced. The stepper itself never appeared on dashboard.html.
- Bottom `.row.tight`: ghost "All benefits" + ghost "On-chain traction".

## Mobbin-pattern revisions (2026-07-09, from the Figma inspiration board)

Reference: Figma file Komunify, page "Inspiration", section MOBBIN INSPIRATION. Implemented:

- **dashboard.html**: "CONTINUE WHERE YOU LEFT OFF" hero card above the library (Uxcel home pattern): content-type label, item title, partner + % viewed, `.progress` bar, primary Resume CTA to the item's partner page. Library is now grouped by partner (Coinbase learning-rewards pattern): `.lib-group` per partner with avatar + name + "N items included" header; item meta no longer repeats the partner name.
- **partner.html**: records engagement to `K.lastViewed` (on load if unset for this partner; on every Preview open, pct +15 capped 85, new item starts at 25). Course previews show `.mod-dot` completion circles per module (Uxcel lesson pattern) driven by `content[].done`, plus "X of Y modules done" meta.
- **benefits.html**: benefit rows are title + one-line description (Reddit Premium pattern); `KDATA.partners[].benefits` is now `{t, d}` objects.
- **traction.html**: activity feed rows carry member address chips and a right-aligned reward column (+N XLM) with the timestamp below (OpenSea Voyages pattern); `KDATA.activity` gained `addr` and `reward`.
- **styles.css additions**: `.progress`/`.fill` (the DESIGN.md 4.2 PROGRESS spec), `.lib-group`/`.lib-head`, `.mod-dot`(.done), `.feed-right`/`.feed-reward`.
- Gamification refs (Duolingo/leagues) intentionally NOT implemented: out of MVP scope.

## Disconnect (2026-07-09)

app.js injects a Disconnect link (`.disconnect-link`, quiet secondary that warms to `--color-content-danger` on hover) next to whichever wallet chip is shown: the sidenav foot on app pages (after the chip, before Reset demo) and the topbar on funnel pages. Calls `K.disconnect()` (clears wallet + subscription) then redirects to index.html, which shows the fresh connect state. Guarded by `#disconnect-btn`: index.html has its own disconnect control in the connect card, so no duplicate is injected there.

## Light + dark mode (2026-07-09)

Two themes, one token contract. Dark is the brand default; `:root[data-theme="light"]` overrides the full token set (warm cream surfaces, white cards). The accent is SPLIT in two tokens: `--color-content-accent` is the TEXT accent (vivid #fad657 in dark; deep gold #8f6b00 in light for contrast) and `--color-bg-accent` is the FILL accent (vivid #fad657 in both modes: buttons, progress fills, done dots, lit step lines). Never use the text accent as a fill or vice versa. Theme persists in `k_theme` (a device preference: NOT cleared by Reset demo), applied to `<html data-theme>` at app.js load. app.js injects a `#theme-toggle` ghost button into the topbar nav (funnel pages) and the sidenav foot (app pages); the label names the target mode.

## Typography + tile consistency (2026-07-09)

**Monospace scope:** Geist Mono is limited to the `code` chip only (blockchain identifiers: wallet address, contract ID, tx hash). All casual chrome (labels, num-labels, nav, timestamps, badges, stepper, percentages, avatars) is Geist sans. This overrides the DESIGN.md "mono-uppercase-label signature" for the prototype, per Imam: no mono for casual text. Uppercase + tracking are kept; only the face changed.

**Content tiles unified to icons:** every content tile (course/video/ebook/link) uses one treatment: a Feather line icon in a type-tinted tile (gold=course, orange=video, green=ebook, neutral=link), matching the external-link/WhatsApp row. Themeable via currentColor. The Magnific stock photos were removed from rendering for consistency but the files stay in `assets/` for possible later use on a single surface (e.g. content-detail hero only). `KDATA...thumb` fields remain in the data but are unused by `contentThumb()`.

## Nav icons + mobile drawer (2026-07-09)

**Nav icons:** MEMBER nav items carry Feather monoline icons (grid/Dashboard, gift/Benefits, trending-up/Traction), injected by app.js via an href->icon map so they inherit `currentColor` (gold in the active state, theme-aware). Partner nav items keep their letter avatars. NOTE: Magnific's icon catalog is flat multicolor PNG (Flaticon-style), which cannot recolor for the active state or flip with the theme, so it is wrong for nav chrome; Feather SVG is the sanctioned icon set for UI chrome. Magnific stays the source for photographic thumbnails.

**Mobile nav (supersedes the old wrapped-strip fallback):** under 900px the sidenav becomes an off-canvas drawer (`position: fixed`, `translateX(-100%)`, slides in on `body.nav-open`). app.js injects a sticky `.mobile-topbar` (hamburger + logo) at the top of `.app-main` and a `.nav-overlay` scrim; the hamburger toggles the drawer, the overlay and any nav-item tap close it. Injected only on app-shell pages (`.app` + `.sidenav` present); funnel pages keep their topbar. Respects prefers-reduced-motion.

## App shell with sidenav (2026-07-09, third pass)

Member-area pages (dashboard, benefits, partner, content, traction) use the app shell (Uxcel/Coinbase pattern): `.app` flex row = `.sidenav` (232px, sticky, full height) + `.app-main` containing the `.shell`. Sidenav: logo, MEMBER nav group (Dashboard/Benefits/Traction, `.nav-item.active` on the current page), PARTNERS nav group rendered by app.js from KDATA (avatar + name, active when `?p=` matches), foot with `#side-wallet` chip + Reset demo + Prototype label. Funnel pages (index, subscribe) keep the `.topbar` chrome: they are the marketing/onboarding surface, not the app. Page footers no longer carry the reset link (it lives in the sidenav on app pages). Under 900px the sidenav collapses to a top strip (fallback only).

## Feature build-out (2026-07-09, second pass: real flows, not previews)

The Mobbin patterns are now working features, not visual dressing. New state layer in app.js (all localStorage, cleared by Reset demo): `k_progress` (per-item progress keyed `pid:idx`; courses store `doneModules[]`, video/ebook store `pct`), `k_owned` (purchased listing indexes), `k_act` (personal activity log, capped 8), `k_last` is now `{pid, idx}`.

- **content.html?p=<pid>&i=<idx>** (Screen 7, `08 <TYPE>` num-label): the real content detail page. Rail: partner mini card (with a quiet "Unlocked" status text, no pill, per the 2026-07-16 review), PROGRESS card (`stat`-size pct + `.progress` bar + modules-done text; a first-pass 2026-07-16 removal of this card was reverted, see the correction under Screen 6), CERTIFICATE card for courses (LOCKED until every module done, then EARNED, Uxcel pattern), back links. Body by type: course = module rows with `.mod-dot` + Mark done/Undo buttons; video = `.media-ph` player placeholder + Mark watched; ebook = sample skeleton + Mark as read. Every completion logs to the activity feed; finishing all modules logs "Certificate earned" once.
- **partner.html**: preview panes REMOVED. Content rows now link to content.html (courses show live `N/M done` from the progress store) via a primary `.btn.sm` "ACCESS" (2026-07-16 review). Link rows unchanged. The `?open` param is gone.
- **dashboard.html**: hero reads real progress (courses: "N of M modules done"; CTA flips Resume→Review at 100%) and links to content.html. Library rows link to content.html. New MY ACTIVITY card in the rail: last 5 personal events with `timeAgo` stamps, empty-state hint.
- **Corrected 2026-07-16 (Faris round-2 review, second pass):** the Connect/Pay/Unlocked stepper strip is what the review actually flagged for removal, not the learning-progress bars above. The stepper is removed from post-subscribe app pages (benefits.html; it never appeared on dashboard/content/partner/traction/dao) and stays on subscribe.html, which owns the payment flow's own progress.
- **benefits.html**: member-price listings have a working buy flow: Buy → "Confirming…" (1.2s) → OWNED pill, persisted in `k_owned`, "Purchased" logged to activity.
- **subscribe.html**: a real payment logs "Subscribed" to the activity feed.
- **?demo=sub** now seeds `{pid:"dwb", idx:0}`, module 1 done, and two activity entries so captures look lived-in.

## Screen 8: `dao.html` (Traction-to-DAO flow, restructured 2026-07-16)

Restructured per Faris round-2 review, then corrected against the review doc's screenshots (second pass, same day): "Pindahkan halaman Traction ke DAO (List of DAO) -> Select DAO -> Profile DAO (Profiles, Packages, Traction, Proposals) -> View Traction or View Proposal." DAO votes is no longer a single flat form, it is a per-community DAO with a profile, and traction.html's content now lives inside it (Screen 4 is a redirect, see above). Reached from the sidenav "Traction" and "DAO votes" nav items (list mode) and every "View on-chain traction" / "On-chain traction" CTA across the prototype.

- **List mode** (`dao.html`, no `?dao=` param): DAOS card listing every `KDATA.partners` entry as a DAO (avatar + "{name} DAO" + ghost `sm` "View DAO" linking `dao.html?dao=<id>`). Reuses the `.dao-proposal` row shape.
- **Detail mode** (`dao.html?dao=<partner-id>`): dao-head card retitles to "{name} DAO". A tab row (`.pill.tab-btn`, one `.active` at a time) switches four panels:
  - **Profile:** partner name + member count, manager wallet `code` chip (simulated, `KDATA.demoAddress`).
  - **Packages:** that DAO's `KDATA.partners[].content` items, type + title + meta.
  - **Traction** (full traction.html content, moved here 2026-07-16 second pass): `.stat-strip` (SUBSCRIBERS / VOLUME / PAYOUT EVENTS from `KDATA.stats`), PAYOUT SPLIT TO DATE card (4 `.alloc-row`s from `KDATA.split`, relabeled "Community A / Community B / Community C / Platform Fee" at a 45/30/15/10 mix, simulated), RECENT ACTIVITY card (`KDATA.activity` feed rows), CONTRACT card (contract `code` chip, TESTNET pill, Stellar Expert + latest tx links). No stepper.
  - **Proposals:** the existing OPEN PROPOSALS / NEW PROPOSAL / HISTORY sections and `K.daoProposals` / `K.voteDaoProposal` mechanics, nested under this tab. Proposals are shared across all DAOs in this pass (not yet filtered per-DAO).
  - Ghost `.btn` "All DAOs" at the bottom links back to `dao.html` (list mode).

**New proposal form (restructured 2026-07-16, five-tier listing spec):**

- **Pool type** is a five-tier listing selector (`.pool-chip` pills): Freebies ($1 listing fee, 0% platform fee), Bronze ($1, 10%), Silver ($5, 5%), Gold ($10, 2%), Platinum ($20, 0.5%). Bronze is preselected. A `.hint` line under the selector shows the chosen tier's listing fee and platform fee. Selecting Freebies locks Price to a disabled "Free" input with a hint that Freebies packages are always free. All fees are simulated, no real payments move.
- **Distribution scheme** replaces the old Owner/Manager/Platform rows with one editable row per community partner (default: one partner from `KDATA.partners`, 90%) plus a fixed Platform row that auto-fills from the selected tier's platform fee and cannot be edited by hand. A ghost "Add partner" button adds another partner row with a `<select>` sourced from `KDATA.partners`. A live total line reuses the `.error`/`.success` feedback pattern: partner percentages plus the platform fee must equal 100, and Submit is disabled while the total is off. Default state is one partner at 90% plus Bronze's 10% platform fee.

## Definition of done per screen

- Renders correctly standalone at 520px and at 375px wide (mobile).
- All interactive elements work with the simulated state (connect, pay, reset).
- Zero raw hex, zero em dashes, valid HTML.
- Links between screens use relative hrefs exactly as named above.
