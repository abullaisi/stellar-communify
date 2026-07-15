# DESIGN.md -- Komunify

> **Sync Rule:** This file exists in two locations and must stay identical.
> - **Repo:** `/Users/imam/Documents/stellar-hackathon/DESIGN.md` (lives next to the code)
> - **CTX project:** `products/komunify/DESIGN.md` (lives in PM context)
>
> When editing, update BOTH files. If they diverge, the repo copy is canonical.

> **Read this file before editing ANY UI code in this project.**
> This is the single source of truth for visual patterns.
> If your edit contradicts this file, your edit is wrong.

Komunify is a community subscription payments dApp on Stellar (hackathon MVP). One subscription unlocks partner-community benefits, a Soroban contract splits revenue between partners, and an on-chain dashboard shows traction. PRD by Faris. Team spelling vote pending: Komunify vs Komunify.

Token structure and component taxonomy are adapted from the **AGENTIC DESIGN SYSTEM v1.1** by agenticui.net (Figma community file): semantic BACKGROUND / CONTENT / BORDER / INPUT / BUTTON token groups, primitive ramps to be added later.

---

## 0. Design System First -- The Rule

Before implementing **any** UI element (input, button, card, pill, form, stat, badge, modal, etc.), check the system in this order:

1. **CSS custom properties + named classes in `src/App.css`.** If a token or class matches, use it.
2. **Section 4 of this file.** If a component spec exists, follow it exactly.
3. **`/docs.html` live specimen.** The visual reference, including the three `data-theme` candidate palette preview blocks.
4. **`grep` across the `src/` tree.** If an inline pattern is reused in 2+ places, flag it for promotion to `App.css`.

### When a match is found: STOP and ask

> "We already have [X] in [location]. Use that pattern, or create a new variant?"

Do NOT silently pull in an external kit (Tailwind template, Shadcn, a random dApp UI, another hackathon repo) as a default. External patterns are input, not source of truth.

### When no match exists: propose as new

> "No existing match. I'll add this as a new [X]. It should go in: [App.css named class / component-local style]."

After implementing:
- Add a live demo to `/docs.html`
- Add a spec entry to Section 4 of this file
- If reusable, promote it to a named class in `src/App.css`

### When modifying an existing component: flag propagation scope

- **Named class in `App.css`:** change once, every usage in `App.jsx` (and future screens) updates.
- **Component-local pattern:** `grep` the `src/` tree for the pattern, show the list, ask "Apply to all N instances?" Better: promote to a named class first.

### After implementing: propose hierarchy propagation

Every new or modified component ripples across the atomic hierarchy: **tokens > atoms > molecules > organisms**. Before declaring a task done, walk the hierarchy and surface impact at every level.

**1. Token level (colors, radius, spacing, typography):**
Does this introduce a new raw value that should become a token?
> "The new partner-benefit card wants a 10px radius. Our radius scale is 6 / 9 / 14 / 999. Snap to `--radius-md` (9px) or `--radius-lg` (14px), or is a new step really justified?"

**2. Atom level (single elements: button, input, pill, label, code chip):**
Does this affect the atom itself as a reusable element?
> "The unlocked-state badge is a new pill variant. Options: add `.pill.accent` (accent tint background) globally, or keep it one-off in the benefit card."

**3. Molecule level (small combos: wallet row, balance block, send form, split row):**
Which molecules use this atom today? What changes for them?
> "Changing `--color-content-accent` touches: primary button fill, logo first letter, input focus border, and the planned Pay CTA and unlocked badge. N molecules affected."

**4. Organism level (full cards and screens: connect card, balance card, contribution card, dashboard):**
Which larger sections contain these molecules? Any layout side effects?
> "The split-allocation row lives inside the planned Subscription card and the Dashboard. Adding a progress cell changes row height in both."

**Ask explicitly, offer choices. Do NOT propagate silently.** The team decides scope.

**If propagating:** update tokens in `App.css` + Section 2-3 of this file, then atoms in `App.css`, then molecule usage in JSX, then verify against `/docs.html`.

### AI-readiness adoption status (the 10 Laws, audited 2026-07-05)

Adopted now: Law 1 semantic naming (classes and components, no Frame-74 equivalents), Law 3 three-tier token plan (semantic live, see Section 2), Law 5 atomic composition, Law 6 variant props match code props (Section 4.3 vocabulary, lowercased in React), Law 8 named slots (header, footer, actions, leading-visual, trailing-actions, children), Law 10 machine rules (`.claude/rules/design-system.md` auto-loads these constraints every session).
Adopted when Figma work starts: Law 2 (Figma Variables for everything), Law 7 (auto-layout everywhere, 8 layout rules).
Post-hackathon: Law 4 (DTCG `.tokens.json` with `$description`), Law 9 (Code Connect).
Audit checklist for reviews: the AI-Ready vs AI-Hostile table in the Design Systems Manual (hardcoded values, monoliths, mixed variant axes, generic names are the four we can violate in code; check every PR against them).

### Exception

If the team explicitly says "copy the modal from Stellar Wallets Kit" or "use pattern X from Y", skip the check-first ask. External patterns become input by direction only, never by default. The propagation check still applies after implementation.

---

## 1. Visual Theme & Atmosphere

> ## THEME: SPLIT v4, ADOPTED 2026-07-05
>
> The working theme is **SPLIT v4**, implemented from the combined brand board (gpt-1 minimal mark composed into the gpt-2 board via i2i on Flora). All color values in Section 2 are SAMPLED from that board render, not estimated. STEMPEL and RASI are archived alternates in Section 2.
>
> **Accent revision (2026-07-05, later the same day):** the action accent is brightened from the board-sampled amber `#e5a84a` to vivid yellow `#fad657`, per Imam's direction. Reference: animations.dev, whose live `--brand` CSS token is exactly `#fad657` (verified from the site's shipped stylesheet, not estimated). Section 2 carries the brightened values; every other sampled color is unchanged. The board render below stays the reference for composition, mark geometry, and atmosphere: its amber reads as the mark's material color on the board, while the UI accent is the brighter yellow.
>
> **Finalized brand board (Flora v4 combine, node output `99306dfc`):**
>
> ![Komunify SPLIT v4 combined brand board](brand/komunify-split-v4-board.png)
>
> Asset locations: repo `brand/komunify-split-v4-board.png` (served copy at `packages/dapp/public/brand/`), local mirror `~/Documents/komunify-docs/brand/`, source canvas `prj_ns715xkhbjdb11sgxy4nfs5qg589zb6z` ([media URL](https://media.flora.ai/node-inputs/2026/7/5/anonymous/99306dfc-c2a2-4710-a9a7-8d2d0f46d1b8.png)).
> **The entire theme layer stays isolated in CSS custom properties.** Any future re-theme remains a variable swap in `:root`, not a refactor. Do not hardcode any hex value in a component; raw colors outside the token block are theme debt.
> **Tailwind v3 alpha trap (found 2026-07-15, three bugs in one day):** never write a slash-opacity modifier on an arbitrary `var()` color (`border-[var(--x)]/35`, `ring-[var(--x)]/25`, `text-[var(--x)]/[0.06]`). Tailwind v3 cannot compile it and silently falls back to defaults: gray-200 borders, blue-500 rings, inherited text color. Write `border-[color-mix(in_srgb,var(--x)_35%,transparent)]` instead. This applies until the app moves to Tailwind v4.
> Board-derived motifs sanctioned for use: (1) numbered section labels with a gold number and uppercase sans text ("01 LOGO" pattern; sans per the 2026-07-15 mono rule), (2) the two-tone headline (line one cream, line two gold, per "One payment. / Every community."), (3) the gold flow-glow (`rgba(250,214,87,0.35)`) reserved EXCLUSIVELY for the split-flow visual, never for buttons or decoration, (4) the hero medallion core glyph is the official Stellar symbol in black (`packages/web/public/stellar-symbol.png`, sourced from Wikimedia Commons `File:Stellar_Symbol.png`, adopted 2026-07-15); it replaces the earlier double-circle mark everywhere on the landing. Do not redraw the double circle; reference the asset with the `NEXT_PUBLIC_BASE_PATH` prefix, (5) section eyebrows are borderless pills (updated 2026-07-15, per Imam): accent-tint background at 6 percent, gold dot, UPPERCASE gold text at 11px with 0.2em tracking, rounded-full, and NO border ring. Copy stays short: 2 to 4 words per phrase, cut filler words before adding width (the hero badge is the reference for maximum length). The earlier gold 35 percent border is retired on every eyebrow, (7, added 2026-07-15 per Imam) the brand logo lockup on every surface (landing, prototype, deck, dApp) is the mark image (`logo-mark.png`, 26 to 32px tall) followed by the KOMUNIFY wordmark in one horizontal row: uppercase, 0.15em letter-spacing, `--color-content-primary`, 10 to 12px gap. Never stack the mark above the text, never render a text-only wordmark with a gold first letter: the gold K lives in the mark image, (6) primary gold CTAs are pill buttons with a trailing circular icon chip: label plus a `w-8 h-8 rounded-full bg-black/10` arrow chip that nudges on hover ("Start now" is the reference; adopted for all solid-gold CTAs 2026-07-15). Secondary and outline buttons carry no icon at all: label only (tightened 2026-07-15, per Imam; the earlier inline-arrow allowance is retired).

Komunify handles other people's subscription money. The register is dark, calm, financial trust. A warm true-black canvas (board-sampled, deliberately not blue-tinted), elevated card surfaces one step lighter, quiet borders, and exactly one accent (bright yellow-gold `#fad657`) doing all the work: the primary action, the logo mark's first letter, the input focus ring. Success, warning, and danger colors appear only as status feedback, never as decoration.

The app is a single centered 520px column (`.shell`) of stacked cards. Density is moderate: 20px card padding, 16px gaps, generous line-height. Hierarchy comes from type weight and the UPPERCASE label signature, not from extra colors or heavy shadows. Numbers (balances, amounts) always render tabular so digits align.

**Key characteristics:**

- Dark by default, `color-scheme: dark` set at `:root`
- One accent color; everything else is neutral or status feedback
- Mono uppercase micro-labels over clean sans body (Agentic DS signature; serif headings NOT adopted in v0, reconsider if STEMPEL wins the vote)
- Single-column card stack, no nav, no sidebar (hackathon MVP scope)
- Restrained motion: hover brightness only today, see Section 5

---

## 2. Color Palette & Roles

> **Light mode documented (2026-07-14):** `:root[data-theme="light"]` in `styles.css` overrides the semantic tokens for the light theme. Light values are now recorded alongside dark values in the tables below. See "The accent split" for the two-token accent rule: text deepens in light mode, fills stay vivid in both themes.

### Token architecture (three-tier plan, per the Design Systems Manual)

Naming follows the Design Systems Manual (agenticui.net) tier formats. Reference: CTX `research/frameworks-ux-product-design/design-systems-manual/` (naming cheat sheet + three-tier token architecture).

| Tier | Format | Status here |
|------|--------|-------------|
| Primitive | `{category}-{scale}` (e.g. `--color-gold-500`) | PENDING the brand vote. Primitive ramps land with the winning palette; semantic tokens then alias to them. |
| Semantic | `{category}-{role}-{modifier}` (e.g. `--color-bg-primary`, `--color-content-accent`) | LIVE. This is the tier the app and this file use. Category is front-loaded so tools can parse tier from name. |
| Component | `{component}-{property}-{variant}-{state}` | Not created. Per the manual: only when a component genuinely needs values the semantic tier cannot express. |

Non-color categories already follow `{category}-{scale}`: `--space-1..7`, `--radius-sm/md/lg/full`. Typography is class-based in v0; tokenize when primitives land. Later export target: DTCG `.tokens.json` with `$value`, `$type`, mandatory `$description` per token (post-hackathon).


All tokens live in `:root` in `src/App.css`. The semantic names below are the canonical token names (Agentic DS naming). The "App.css var" column maps to the shorter legacy names currently in the file; when touching the token block, migrate legacy names toward the semantic names rather than adding new short names.

### Backgrounds

| Token | Dark value | Light value | App.css var | Role |
|-------|------------|-------------|-------------|------|
| `--color-bg-primary` | `#0b0b0a` | `#faf6ef` | same | Page background (`body`) |
| `--color-bg-elevated` | `#131311` | `#ffffff` | same | Card surfaces (`.card`) |
| `--color-bg-input` | `#0d0d0b` | `#f2ecdf` | same (promoted 2026-07-05) | Input fields and code chips. Promote to a named var when next touched. |
| `--color-bg-accent` | `#fad657` | `#fad657` | same | Accent fills: primary button background, progress bar fill, status dots. Same value in both themes, see "The accent split" below. |
| `--color-bg-accent-tint` | `rgba(250,214,87,0.12)` | `rgba(214,168,20,0.16)` | same (added 2026-07-05) | Accent-tinted fills (planned unlocked badge, accent pill variant) |
| `--color-bg-success-tint` | `rgba(62,207,142,0.14)` | `rgba(29,138,92,0.12)` | same (promoted 2026-07-05) | Success pill background |
| `--color-bg-warning-tint` | `rgba(255,138,92,0.14)` | `rgba(200,95,46,0.12)` | same (promoted 2026-07-05) | Warning pill background |

### Content

| Token | Dark value | Light value | App.css var | Role |
|-------|------------|-------------|-------------|------|
| `--color-content-primary` | `#ecd9c1` | `#241f15` | same | Body text, headings, ghost button labels |
| `--color-content-secondary` | `#928e85` | `#6e675a` | same | Labels, hints, tagline, footer, form label text |
| `--color-content-accent` | `#fad657` | `#8f6b00` | same | Logo first letter, focus border, accent text and icons. Not fills, see "The accent split" below. |
| `--color-content-on-accent` | `#201607` | `#201607` | same | Text on accent surfaces (primary button label) |
| `--color-content-success` | `#3ecf8e` | `#1d8a5c` | same | Success text, success pill label |
| `--color-content-warning` | `#ff8a5c` | `#b35325` | same | Warning text, warning pill label |
| `--color-content-danger` | `#ff6b6b` | `#c23434` | same | Error text (`.error`) |

### Border

| Token | Dark value | Light value | App.css var | Role |
|-------|------------|-------------|-------------|------|
| `--color-border-medium` | `#262521` | `#e4dcc9` | same | Card borders, input borders, ghost button borders, code chip borders |
| `--color-border-accent` | `#fad657` | `#b08d3e` | same (promoted 2026-07-05) | Focus state border |
| `--color-border-hover` | `#3a362c` | `#cfc5ac` | same | Hover border state |

### Board motifs

| Token | Dark value | Light value | App.css var | Role |
|-------|------------|-------------|-------------|------|
| `--glow-split` | `rgba(250,214,87,0.35)` | `rgba(214,168,20,0.25)` | same | The split-flow glow effect, exclusively. Never for buttons or decoration (see Section 1). |

### The accent split

Komunify uses two accent tokens with different jobs: `--color-content-accent` is for text and icons (the logo's first letter, focus borders, accent labels), and `--color-bg-accent` is for fills (primary button backgrounds, progress bar fills, status dots). The text token deepens to `#8f6b00` in light mode so it stays readable against the light cream background, while the fill token stays the vivid `#fad657` yellow in both themes since a solid fill does not need the same contrast adjustment as text. Never swap them: a fill built from the text-accent token reads washed out in light mode, and text built from the fill-accent token fails contrast in light mode.

### Palette status (updated 2026-07-05)

**SPLIT is the adopted working theme** as of 2026-07-05, implemented from the v4 combined brand board (gpt-1 minimal mark composed into the gpt-2 board via i2i on Flora; hex values SAMPLED from the board render, not estimated). Key sampled anchors: panel dark #0f1110 on #010101 gutters, action gold #e5a84a, mark gold #e8b463, headline cream #e5d1b9, wordmark cream #f1dfca, muted #928e85. **Accent superseded same day:** the in-app action accent is now `#fad657` (brightening pass, see the Section 1 banner); `#e5a84a` stays in this sentence only as the sampling record of what the board render shows. Functional colors (success/warning/danger) are unchanged pending a warm-tone pass. STEMPEL and RASI below are archived alternates, kept for reference and possible sub-brand use.

### Candidate palettes (SPLIT adopted; alternates archived)

Documented for the vote. `split` is the live default. Each renders as a `data-theme` preview block in `/docs.html`. Only the winning column ever lands in `:root`.

| Token | split (current default) | stempel (light) | rasi (dark indigo) |
|-------|------------------------|-----------------|--------------------|
| `--color-bg-primary` | `#0b0b0a` | `#F4EFE6` | `#0E0C1E` |
| `--color-bg-elevated` | `#131311` | `#FDFBF7` | `#171432` |
| `--color-content-primary` | `#ecd9c1` | `#1F2A24` | `#EEEBFF` |
| `--color-content-secondary` | `#928e85` | `#5C685F` | `#8E88B0` |
| `--color-content-accent` | `#fad657` | `#1F4D3A` (forest green) | `#A78BFA` (lilac) |
| `--color-content-on-accent` | `#201607` | `#F4EFE6` | `#14102A` |
| Detail | gold IS the accent | gold detail `#B08D3E` | none |

**DO NOT:**

- Hardcode any hex from these tables in a component. Always go through the custom property.
- Use the accent for decorative fills, borders-for-borders'-sake, or body text. It marks the primary action and focus, nothing else.
- Use success/warning/danger colors outside genuine status feedback.

---

## 3. Typography, Spacing & Radius

### Font stacks

- **Body (sans):** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif`. Set globally on `body`.
- **Mono (blockchain data only):** `ui-monospace, SFMono-Regular, Menlo, monospace`. Reserved exclusively for on-chain data: tx hashes, wallet addresses, contract IDs, raw asset codes. Never for labels, captions, markers, or buttons.
- **Prototype type scale (recording legibility, 2026-07-15, per Imam):** every prototype font size steps up one proper increment, roughly 110% (10 to 11, 11 to 12, 12 to 13, 13 to 14, 14 to 15, 16 to 18, 20 to 22, 22 to 24, 26 to 29, 30 to 33, 40 to 44). Upsize per token; a blanket `zoom` or `transform: scale` on the page is prohibited.
- **Display (serif):** `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`, weight 500 (medium), tight tracking (-0.02em). All headlines and card titles on the landing, pitch deck, and prototype. Heavy sans headlines (700/800) are retired for display text; bold sans stays reserved for the logo wordmark and small inline emphasis. Codified 2026-07-15 from the landing implementation, per Imam.

### Monospace is blockchain data, not decoration (rule updated 2026-07-15)

Monospace renders ONLY on-chain data: tx hashes, wallet addresses, contract IDs, raw asset codes, and similar identifiers. Everything else (micro-labels, section markers, time markers, captions, badges, buttons) is set in the sans stack.

Micro-labels (`.label`) are 12px UPPERCASE with 0.06em tracking in `--color-content-secondary`, set in the sans stack. The uppercase-label-over-sans-body pairing remains the Komunify type signature; the mono treatment is retired from it.

> **Supersedes (2026-07-15, per Imam):** the 2026-07-05 "mono-uppercase-label signature" and its drift note ("do not add new labels in sans"). The reverse now holds: do not set new labels in mono. Mono on anything that is not on-chain data is drift; convert to sans on sight. Numbers (balances, amounts) still render tabular (`font-variant-numeric: tabular-nums`); tabular figures are independent of the mono stack.
> **Propagation pending:** `.label` in the `packages/dapp` `src/App.css` still carries the mono stack from the 2026-07-05 note. Flipping it restyles Jason's dApp UI; needs team signoff per the Section 0 propagation protocol.

### Hierarchy

| Role | Size / Weight | Details | Where |
|------|---------------|---------|-------|
| Display / balance | 30px / 700 | `font-variant-numeric: tabular-nums`, margin 6px 0 10px | `.balance` |
| Logo | 28px / 800 | letter-spacing -0.02em, `::first-letter` in `--color-content-accent` | `.logo` |
| H2 (card titles) | 16px / 600 | margin 0 0 10px | `.card h2` |
| Body md | 14px / 400 | line-height 1.5 | `body`, `.tagline`, inputs, buttons |
| Body sm | 13px / 400 | hints, helper text, error/success messages, form label text | `.hint`, `.error`, `.success`, `label` |
| Label | 12px / 400 | UPPERCASE, letter-spacing 0.06em, `--color-content-secondary`, mono stack | `.label` |
| Pill label | 11px / 700 | inside `.pill` | `.pill` |
| Code | 13px mono | on `--color-bg-input` chip, `--radius-sm` | `code` |
| Footer | 12px | `--color-content-secondary`, centered | `footer` |

### Number display

Always apply `font-variant-numeric: tabular-nums` to balances, amounts, percentages, and any number that can appear in a column (split-allocation rows, dashboard stats). `.balance` already does this; every planned numeric cell must too.

### Spacing scale

Base steps: **4, 8, 12, 16, 20, 32, 48** (px) as `--space-1` through `--space-7`. Current usage: `.row` gap 12, `.shell` gap 16, `.card` padding 20, `.shell` padding 48 / 20 / 32 (top / sides / bottom). New spacing values must snap to this scale; if a design wants an off-scale value, raise it at token level per Section 0.

| Token | Value | Current use |
|-------|-------|-------------|
| `--space-1` | 4px | `.row.tight` margin-top |
| `--space-2` | 8px | `.row.tight` gap, header margin-bottom |
| `--space-3` | 12px | `.row` gap, form gap |
| `--space-4` | 16px | `.shell` gap |
| `--space-5` | 20px | `.card` padding, `.shell` side padding |
| `--space-6` | 32px | `.shell` bottom padding |
| `--space-7` | 48px | `.shell` top padding |

### Radius scale (Agentic DEFAULT-mode shape)

| Token | Value | Where |
|-------|-------|-------|
| `--radius-sm` | 6px | code chips |
| `--radius-md` | 9px | buttons, inputs |
| `--radius-card` | 4px | cards (standard card surface, adopted 2026-07-15; replaces `--radius-lg` for cards) |
| `--radius-lg` | 14px | legacy large-surface step (no card uses it since 2026-07-15) |
| `--radius-full` | 999px | pills |

Five steps after the 2026-07-15 card standard (card < chip < control < large < pill); additions still require a token-level discussion.

### Standard card surface (rule added 2026-07-15, per Imam)

Every card renders the Closing-CTA-derived treatment: `--color-bg-elevated` background, 4px corners (`--radius-card`), and a vertical-fade border instead of a plain outline: 1px transparent border, elevated layer clipped to padding-box, and a border-box gradient `linear-gradient(180deg, var(--color-border-medium), color-mix(in srgb, var(--color-border-medium) 35%, transparent))` so the top edge reads full strength and the bottom fades (updated 2026-07-15, per Imam: the flat 1px border read as plain; the fade matches the footer treatment). Implemented as `.card-standard` in `packages/web/app/globals.css`. No gold-tinted bezel wrappers, no decorative outer rings, no accent-tint card backgrounds. Hover, selected, and scroll-active feedback all use the one gold gradient treatment below; never a flat gold border.

> Retires the double-bezel pattern (outer `p-1.5` accent-tint wrapper around an inner rounded core) previously used on the landing's step, split, partner, and FAQ cards. Scroll- or state-driven border color animation stays, applied directly to the card border. Media frames (hero demo shot) keep their gradient hairline but square to the 4px standard.

**Selected card state (added 2026-07-15, per Imam; precedent: Imam's EveryX variant-c selected cards).** A selected or active card layers gold onto the standard surface using the dual-background technique: `border: 1px solid transparent`, then one background layer clipped to padding-box and one to border-box.
- Border gradient (border-box): `linear-gradient(135deg, rgba(250,214,87,0.55), rgba(250,214,87,0.12) 50%, rgba(250,214,87,0.45))`
- Surface wash (padding-box, over `--color-bg-elevated`): `linear-gradient(180deg, rgba(250,214,87,0.10), rgba(250,214,87,0.03))`
- Radius stays 4px. Implemented as `.card-selected` in `packages/web/app/globals.css`, with `.card-hoverable` providing the same treatment as a `::after` overlay that crossfades in on hover (gradients cannot tween; opacity can). Current consumers: FAQ open item (class toggle), step cards (opacity crossfade driven by scroll activation), partner cards (hover crossfade). Use these classes for any future selected/active/hover card state; do not invent per-section variants.
> **Propagation pending:** the dApp `src/App.css` still styles `.card` with `--radius-lg` (14px). Flipping the dApp restyles Jason's app; needs team signoff per the Section 0 protocol.

---

## 4. Component Stylings

### 4.1 Existing atoms and classes (live in `src/App.css`, used in `src/App.jsx`)

**`.shell`** (layout root)
```
max-width: 520px; margin: 0 auto;
padding: 48px 20px 32px;
display: flex; flex-direction: column; gap: 16px;
```
The single column everything lives in. One `.shell` per page, applied to `<main>`. Do not widen it for new features; dashboard content stacks vertically inside it.

**`.logo` + `.tagline`** (header)
- `.logo`: 28px / 800, letter-spacing -0.02em. `::first-letter` colored `--color-content-accent`. This IS the v0 logo treatment; no image mark.
- `.tagline`: 14px `--color-content-secondary`, margin 6px 0 0.
- `header`: centered, margin-bottom 8px.

**`.card`** (surface)
```
background: --color-bg-elevated; border: 1px solid --color-border-medium;
border-radius: 14px (--radius-lg); padding: 20px;
```
The only surface in the app. Every feature is a card in the shell stack. Variant `.card.center`: text-align center, padding 36px 20px, used for the empty/connect state. Card titles are `h2` (16px / 600).

**`.row` / `.row.tight`** (horizontal layout)
- `.row`: flex, space-between, align center, gap 12. Used for the connected-wallet card (info left, Disconnect right).
- `.row.tight`: justify flex-start, gap 8, margin-top 4. Used for address + pill, and button pairs.

**`.label`** (micro label)
12px UPPERCASE, letter-spacing 0.06em, `--color-content-secondary`. Mono stack per Section 3. Used above the wallet address and the XLM balance. Every stat and field group in planned components gets one.

**`.balance`** (display number)
30px / 700, tabular-nums, margin 6px 0 10px. The pattern for any hero number (subscription price, dashboard volume).

**`.pill` / `.pill.ok` / `.pill.warn`** (status pill)
11px / 700, radius 999px, padding 3px 9px. `.ok`: `--color-bg-success-tint` bg + `--color-content-success` text (used for the TESTNET badge). `.warn`: `--color-bg-warning-tint` bg + `--color-content-warning` text. Planned accent variant for unlocked states uses `--color-bg-accent-tint` + `--color-content-accent` (propose per Section 0 before adding).

**`button`** (primary) and **`button.ghost`** (secondary)
- Primary: `--color-content-accent` bg, `--color-content-on-accent` label, radius 9px, padding 10px 18px, 14px / 700, no border. Hover: `filter: brightness(1.06)`. Disabled: opacity 0.55, `cursor: not-allowed`. One primary action per card maximum (Connect Wallet, Fund with Friendbot, Send XLM today; Pay CTA next).
- Ghost: transparent bg, `--color-content-primary` label, 1px `--color-border-medium` border, weight 600. For secondary actions: Disconnect, Refresh.

**`input` + `label` wrapper** (form field)
- `label`: flex column, gap 5px, 13px `--color-content-secondary`. Wraps the field, label text first.
- `input`: `--color-bg-input` bg, 1px `--color-border-medium`, radius 9px, padding 10px 12px, `--color-content-primary` text, 14px. Focus: outline none, border-color `--color-content-accent` (`--color-border-accent`).
- `form`: flex column, gap 12.

**`code`** (code chip)
13px mono on `--color-bg-input`, 1px `--color-border-medium`, radius 6px, padding 2px 7px. For wallet addresses (shortened) and tx hashes. Always give full values via `title` when truncating.

**`.hint` / `.error` / `.success`** (feedback text)
All 13px. `.hint`: `--color-content-secondary`, margin 8px 0 12px. `.error`: `--color-content-danger`, margin 10px 0 0. `.success`: `--color-content-success`, margin 12px 0 0, links inherit color. Feedback text sits inside the card it belongs to, directly under the triggering control.

**`footer`**
12px `--color-content-secondary`, centered, margin-top 12px, links inherit color. Credits + GitHub link.

### 4.2 Planned components (from Faris PRD, mapped to Agentic DS taxonomy)

Statuses: **live** (in App.css/App.jsx today), **planned** (build per this table, propose per Section 0), **n/a** (Agentic category explicitly out of MVP scope).

| Component | Agentic taxonomy | Status | One-line spec |
|-----------|------------------|--------|---------------|
| Connect / balance / contribution cards | CARD | live | `.card` stack in `.shell`, see 4.1 |
| Status pill | BADGE | live | `.pill.ok` / `.pill.warn`, accent variant pending |
| Subscription card | CARD | planned | `.card` with `.label` ("SUBSCRIPTION"), `.balance`-style price (tabular), one primary Pay CTA |
| Entitlement / benefit card | CARD + BADGE | planned | `.card` per partner benefit; unlocked state = accent-tint BADGE (`--color-bg-accent-tint` + `--color-content-accent`) |
| Split-allocation row | TABLE (cell-type-progress + cell-type-numeric) | planned | `.row` per partner: name (body md), % + amount as numeric cells (13-14px, tabular-nums), progress cell for share |
| Dashboard stat chips | CHIP / stat pattern | planned | `.label` over `.balance`-style number (subscriber count, volume), grouped in a `.card` |
| Partner communities cluster | AVATAR GROUP | planned | Overlapping partner avatars on the subscription and dashboard cards |
| Subscribe flow indicator | STEPPER | planned | connect > pay > unlocked; active step in `--color-content-accent`, done in `--color-content-success`, pending in `--color-content-secondary` |
| Tx status notice | TOAST | planned | pending / success / fail; reuses `.hint` / `.success` / `.error` colors on a `--color-bg-elevated` surface, radius `--radius-md` |
| Tx pending placeholder | SKELETON | planned | Loading blocks on `--color-bg-input`, radius matching the element they replace |
| Wallet select | MODAL | planned | Comes themed from Stellar Wallets Kit; only reconcile its accent with `--color-content-accent`, do not rebuild |
| Funding / traction bar | PROGRESS | planned | Track `--color-bg-input`, fill `--color-content-accent`, radius `--radius-full` |
| Chat | CHAT | n/a | Out of MVP scope |
| AI thinking states | AI STATES | n/a | Out of MVP scope |
| Breadcrumbs | BREADCRUMBS | n/a | Single screen, nothing to crumb |
| Pagination | PAGINATION | n/a | Out of MVP scope |
| File upload | FILE UPLOAD | n/a | Out of MVP scope |

Every planned component, once built: demo in `/docs.html`, spec promoted from this table into a full 4.1-style entry, class in `App.css` if reused.

---

### 4.3 Component naming vocabulary (from the full Agentic DS read, 2026-07-05)

Variant axes follow the Agentic DS conventions. Use these exact axis names and value vocabularies when speccing or building any Komunify component, so Figma, code, and docs speak one language:

| Axis | Meaning | Canonical values (as used across the DS) |
|------|---------|-------------------------------------------|
| `State` | Interaction state only | Default/Enabled, Hover, Focus, Active, Filled, Disabled, Loading |
| `Behavior` | Selection semantics, separate from State | Selected, Unselected, Indeterminate |
| `Type` | Semantic tone or structural kind | Toast + helper text: Info, Success, Warning, Error/Destructive · Breadcrumb: Default, Overflow · Nav: Label, Link |
| `Style` | Visual variant of the same component | Button: Primary, Secondary, Ghost · Tabs: Pill, Rounded, Segmented, Underline |
| `Size` | Scale step | Large, Medium, Small (buttons, inputs, menus) · lg, sm (badges, tooltips) |
| `Expanded` / `Open` / `Selected` | Boolean axes | True, False |
| `Icon position` | Icon placement on buttons | None, Left, Right |
| `Alignment` | Table cell alignment | Left, Center, Right |
| `Progress` | Progress bar fill step | 0, 10, 50, 70, 90, 100 |

Key discipline the DS enforces, and we adopt: **State (interaction) is never mixed with Type (tone) or Behavior (selection).** A toast is `Type=Success`, not `State=Success`. A checkbox is `Behavior=Selected, State=Disabled`, two independent axes. Komunify mappings: entitlement badge = `Behavior=Locked/Unlocked` + `State`; tx toast = `Type=Info/Success/Destructive`; split-row = table `cell-type-numeric` + `cell-type-progress` with `State=Loading` while tx pends.

Read-coverage note: all 26 component pages read at the structure + variant-axis level (plus COLORS, TYPOGRAPHY, STYLE TESTER, PLAYGROUND, MISC structurally). Not deep-read: Icons page contents (2,048 icons; category names only: Commerce, Controls, File, Instruments, Time, Toggle, Operations, Navigation, Status, Technology, AI), SOCIAL BUTTON variant list, and Modal (page carries demo frames, no component set). Visual canvas pixels were not screenshot-audited; naming and structure were.

## 5. Motion

Current state: the only motion in the app is `button:hover { filter: brightness(1.06); }`. That is intentional, not an omission.

Rules for all future motion:

- **Duration:** 150-200ms.
- **Easing:** ease-out.
- **Properties:** opacity and transform only. No animating width, height, colors, or layout properties.
- **No bounce, no pulse, no spring overshoot.** This app moves money; motion must read as confirmation, not celebration.
- Skeleton and progress animations follow the same rule set (opacity shimmer, transform-based fills).
- Anything beyond these bounds is a Section 0 proposal, not a default.

---

## Attribution

Token structure (BACKGROUND / CONTENT / BORDER / INPUT / BUTTON semantic groups) and the component taxonomy in Section 4.2 are adapted from the **AGENTIC DESIGN SYSTEM v1.1** by **agenticui.net** (Figma community file). The mono-uppercase-label signature and the DEFAULT-mode radius shape follow the same system; serif headings from the source system are not adopted in v0.
