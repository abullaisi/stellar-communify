# Deploy routes

| Site | Source | Deploy method | Owner notes |
|---|---|---|---|
| `komunify-prototype.pages.dev` | `prototype/` folder in this repo (static HTML) | manual wrangler (command below) | Cloudflare account: Imam's (iabullaisi@gmail.com), account id `04f2a27477cfd3c7032cedf47c428039` |
| `komunify.pages.dev` | `packages/web` (Next.js app, static export: `STATIC_EXPORT=1 bun run build` then deploy `out/`) | manual wrangler: `npx wrangler pages deploy out --project-name=komunify --branch=main --commit-dirty=true` from packages/web | same Cloudflare account. Build fixed 2026-07-15 (workspace-root pin in next.config.ts). /community/[address] ships one placeholder page in the export. |
| `komunify-slides.pages.dev` | external slides folder, NOT in this repo | manual wrangler | same account, deployed 2026-07-09 |

## Prototype deploy

```
CLOUDFLARE_API_TOKEN=<Pages Edit token> \
CLOUDFLARE_ACCOUNT_ID=04f2a27477cfd3c7032cedf47c428039 \
npx wrangler pages deploy prototype --project-name=komunify-prototype --branch=main --commit-dirty=true
```

Note: the token lives outside this repo (Imam's credential store), never commit it.

## Route checklist

After EVERY prototype deploy, verify all of these return 200 on komunify-prototype.pages.dev before calling it done:

- `/` (hero shows "Single subscription." and "Multiple benefits.")
- `/landing/` (original SPLIT landing, title "Komunify: One payment. Every community.")
- `/dashboard.html`, `/benefits.html`, `/traction.html`, `/subscribe.html`, `/partner.html`, `/content.html`
- `/styles.css` and `/app.js` load

## Rules

- The repo `prototype/` folder is the ONLY deploy source for the prototype site. If it is not in the folder, it does not ship. Local-only files must be committed before deploying.
- Deploy only after pushing, so the live site always matches a commit on main.
- If you add a new page or route, add it to the checklist above in the same commit.
