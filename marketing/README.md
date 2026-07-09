# Marketing surfaces

The presentation and marketing artifacts for Komunify. These are **separate from the real dApp** (that lives in `packages/dapp` and is the judged live demo). Nothing in here is deployed by CI; these ship manually to their own Cloudflare Pages projects.

All three are zero-dependency static HTML (Tailwind CDN + Google Fonts + Font Awesome CDN, inline styles). SPLIT v4 theme, Geist fonts, vivid-yellow accent. No build step, just open the HTML.

| Artifact | Path | Open | Live URL |
|---|---|---|---|
| Landing page | `marketing/prototype/landing/` | `landing/index.html` | https://komunify-prototype.pages.dev/landing/ |
| Clickable prototype (simulated data) | `marketing/prototype/` | `index.html` | https://komunify-prototype.pages.dev |
| Pitch deck | `marketing/deck/` | `index.html` | https://komunify-slides.pages.dev |

## Notes

- **The landing page lives inside the prototype folder on purpose.** It reuses the prototype's `styles.css` and `assets/` (via `../styles.css`, `../assets/`), so it must stay at `prototype/landing/`. That mirrors how it deploys (`/landing/` subpath of the prototype site).
- **Deck navigation:** arrow keys / space / click zones / scroll wheel. Fixed 1280x720 stage scaled to the viewport.
- **Prototype data is simulated** (subscriber counts, volume, tx hashes are illustrative). The real on-chain flow is the dApp at https://komunify.pages.dev.
- **Deploy (manual, not CI):**
  - Prototype + landing: `npx wrangler pages deploy marketing/prototype --project-name=komunify-prototype`
  - Deck: `npx wrangler pages deploy marketing/deck --project-name=komunify-slides`
- Content backups (verbatim copy for both landing and deck) live in Imam's PM workspace; ping Imam if you need the source copy separate from the HTML.
