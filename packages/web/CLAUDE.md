# CLAUDE.md — Frontend (`@komunify/web`)

This file provides guidance to Claude Code when working in this package.

## Project Overview

Next.js 15 frontend with App Router, TanStack Query, Tailwind CSS, and shadcn/ui. Part of the
`komunify` monorepo — one app, one `/dashboard` route that renders a member or manager panel
based on `is_manager(wallet)` (D-006). `/` stays a stub; the landing page is out of scope for
the MVP. See `docs/PLAN.md` for the full architecture and `DESIGN.md` for the visual system.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript strict mode
- **Styling**: Tailwind CSS + shadcn/ui, re-skinned to the `DESIGN.md` token set (D-007)
- **Data Fetching**: TanStack Query (React Query v5)
- **Wallet**: Freighter (`@stellar/freighter-api`) via `providers/wallet-provider.tsx`
- **Auth**: wallet-signature session (D-001) — no better-auth, no password
- **HTTP**: Custom `ApiClient` in `services/api/client.ts`
- **Contracts**: `@komunify/contract-client` — generated, namespaced `Komunify` / `Usdc` clients

## Development Commands

```bash
pnpm dev          # Start dev server on http://localhost:3000
pnpm build        # Production build
pnpm typecheck    # Type checking
pnpm lint         # ESLint
```

## Project Structure

```
app/
├── layout.tsx          # Root layout (wraps with QueryProvider + WalletProvider)
├── page.tsx             # Stub — landing page is out of scope
└── dashboard/           # Member / manager panel, role from is_manager(wallet) (D-006)

components/
├── wallet/              # ConnectWalletButton, NetworkGuard
└── ui/                  # shadcn/ui primitives, re-skinned per DESIGN.md (D-007)

lib/
├── utils.ts             # cn() utility (clsx + tailwind-merge)
└── stellar.ts            # Runtime network config + komunify/usdc contract ids from env

providers/
├── query-provider.tsx   # TanStack Query setup + ReactQueryDevtools
└── wallet-provider.tsx  # <WalletProvider> + useWallet() (Freighter connect/disconnect)

services/
├── api/
│   ├── client.ts        # ApiClient — fetch wrapper with credentials: 'include'
│   └── endpoints.ts      # API_ENDPOINTS constant
├── auth/         challenge → signMessage → verify → kmf_session cookie
├── subscription/ price, isActive, expiresAt, subscribe(), faucet()
├── content/       list, upload, register, recordAccess, download
├── manager/       myContent, reads, accrued, claim(), settleContent()
└── traction/      GET /stats
```

> The wallet address keys every React Query call — switching accounts in Freighter must
> invalidate everything. See `providers/wallet-provider.tsx`.

## Architecture Patterns

### Adding a new API service

Follow the 4-file pattern in `services/`:

```
services/posts/
├── posts.types.ts    # TypeScript interfaces
├── posts.queries.ts  # React Query key factory
├── posts.service.ts  # Static service class with API calls
├── posts.hook.ts     # React Query hooks
└── index.ts          # Barrel export
```

**types.ts**
```typescript
export interface Post { id: string; title: string; }
export interface CreatePostInput { title: string; }
```

**queries.ts**
```typescript
export const postKeys = {
  all: ['posts'] as const,
  list: (params?: object) => [...postKeys.all, 'list', params] as const,
  detail: (id: string) => [...postKeys.all, 'detail', id] as const,
};
```

**service.ts**
```typescript
import { ApiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

export class PostService {
  static async getAll() { return ApiClient.get('/posts'); }
  static async create(data: CreatePostInput) { return ApiClient.post('/posts', data); }
}
```

**hook.ts**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePosts() {
  return useQuery({ queryKey: postKeys.list(), queryFn: PostService.getAll });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: PostService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.all }),
  });
}
```

For domains that call the contract directly (`subscription`, `content` writes, `manager`),
the service wraps a `Komunify.Client` / `Usdc.Client` from `@komunify/contract-client`
instead of `ApiClient`; reads simulate over RPC with no wallet, writes sign via Freighter.
See `lib/stellar.ts` for the network/contract-id config and `providers/wallet-provider.tsx`
for `useWallet()`.

### Wallet-signature auth (D-001)

```typescript
'use client';
import { useWallet } from '@/providers/wallet-provider';
import { useAuth } from '@/services/auth';

export function SignInButton() {
  const { address, connect } = useWallet();
  const { signIn, isAuthenticated } = useAuth();

  if (isAuthenticated) return null;
  return <button onClick={() => (address ? signIn() : connect())}>Sign in</button>;
}
```

`signIn()` calls `POST /auth/challenge`, prompts Freighter's `signMessage(nonce)`, then
`POST /auth/verify` — the server sets the `kmf_session` cookie. No tokens are stored
client-side. See `docs/API_SPEC.md` §1 and `docs/DECISIONS.md` D-001 for the exact flow and
the Freighter `signMessage` byte-encoding gotcha.

### Adding shadcn/ui components

```bash
npx shadcn add button
npx shadcn add input
npx shadcn add dialog
# Components are placed in components/ui/ — re-skin to DESIGN.md tokens before using (D-007).
# A component rendering default shadcn colors is a bug.
```

### Client vs Server components

- Default: Server Components (no `'use client'`)
- Add `'use client'` when using: hooks, event handlers, browser APIs, TanStack Query, wallet state
- Keep data fetching in Server Components where possible for performance

### Environment variables

- `NEXT_PUBLIC_API_URL` — backend API URL (exposed to browser)
- `NEXT_PUBLIC_KOMUNIFY_CONTRACT_ID` / `NEXT_PUBLIC_USDC_CONTRACT_ID` — deployed contract ids
- All other secrets must NOT be prefixed with `NEXT_PUBLIC_`

## Type Sharing

Import shared types from the monorepo shared package:

```typescript
import type { ContentListItem } from '@komunify/shared';
import { ContentListItemSchema } from '@komunify/shared';
```

## Best Practices

- Use `@/` path alias for all imports (configured in tsconfig.json)
- Never store session tokens manually — the `kmf_session` cookie is HTTP-only
- Use `useQuery` for reads, `useMutation` for writes
- Keep React Query cache keys in `*.queries.ts` files, prefixed by wallet address
- Use `cn()` from `@/lib/utils` for conditional class merging
- A component rendering default shadcn colors is a bug (D-007)
