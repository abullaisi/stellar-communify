# @komunify/contract-client

**Generated** TypeScript bindings for the Komunify `notes` Soroban contract —
the on-chain "ABI" that lets the frontend and backend call the contract type-safely.

> ⚠️ `src/index.ts` is generated. Do **not** edit it by hand. Only `package.json`,
> `tsconfig.json`, and this README are hand-maintained.

## Regenerating

After changing the contract, from the repo root:

```bash
bun contract:build      # compile the contract to Wasm
bun contract:bindings   # regenerate src/index.ts from the Wasm and rebuild dist/
```

`bun contract:bindings` writes only `src/index.ts` (preserving this package's scoped
`package.json`) and rebuilds `dist/`, which is what consumers import.

## Usage

This package is generated from the Wasm spec, so it has no baked-in `networks` constant.
Construct a `Client` with the network + deployed contract id yourself. In the web app,
use the ready-made factory instead:

```ts
import { getNotesClient } from '@/lib/notes-client';

// read-only (no wallet needed)
const client = getNotesClient();
const notes = (await client.list_notes({ owner: publicKey })).result;

// state-changing (signs via Freighter)
const signed = getNotesClient(publicKey);
const tx = await signed.add_note({ owner: publicKey, title: 'Hi', content: 'Yo' });
const { result: newId } = await tx.signAndSend();
```
