# @komunify/contract-client

**Generated** TypeScript bindings for the two Komunify Soroban contracts — the
on-chain "ABI" that lets the frontend and backend call the contracts type-safely.

> ⚠️ `src/komunify.ts` and `src/usdc.ts` are generated. Do **not** edit them by hand.
> `src/index.ts` (the barrel), `package.json`, `tsconfig.json`, and this README are
> hand-maintained.

## Regenerating

After changing a contract, from the repo root:

```bash
bun contract:build      # compile both contracts to Wasm
bun contract:bindings   # regenerate src/{komunify,usdc}.ts from the Wasm and rebuild dist/
```

`bun contract:bindings` (== `make bindings`) writes only `src/komunify.ts` and
`src/usdc.ts` (preserving `src/index.ts` and this package's scoped `package.json`)
and rebuilds `dist/`, which is what consumers import.

## Usage

This package is generated from the Wasm spec, so it has no baked-in `networks`
constant. Construct a client with the network + deployed contract id yourself. Both
generated clients are re-exported under distinct namespaces from `src/index.ts`:

```ts
import { Komunify, Usdc } from '@komunify/contract-client';

const komunify = new Komunify.Client({ contractId, networkPassphrase, rpcUrl, publicKey, signTransaction });
const usdc = new Usdc.Client({ contractId: usdcContractId, networkPassphrase, rpcUrl, publicKey, signTransaction });
```

In the web app, use the ready-made factories in `lib/` instead of constructing
clients directly (see `packages/web/CLAUDE.md`).
