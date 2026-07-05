import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}





/**
 * A single note owned by an address.
 */
export interface Note {
  content: string;
  /**
 * Ledger timestamp (unix seconds) when the note was created.
 */
created_at: u64;
  id: u32;
  title: string;
  /**
 * Ledger timestamp (unix seconds) of the last update.
 */
updated_at: u64;
}

export const Errors = {
  1: {message:"NoteNotFound"}
}

export type DataKey = {tag: "Counter", values: readonly [string]} | {tag: "Note", values: readonly [string, u32]} | {tag: "Ids", values: readonly [string]};

export interface Client {
  /**
   * Construct and simulate a add_note transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Add a new note for `owner`. Returns the new note id.
   */
  add_note: ({owner, title, content}: {owner: string, title: string, content: string}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_note transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Fetch a single note.
   */
  get_note: ({owner, id}: {owner: string, id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Note>>>

  /**
   * Construct and simulate a list_notes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * List all of an owner's notes, in creation order.
   */
  list_notes: ({owner}: {owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Note>>>

  /**
   * Construct and simulate a delete_note transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Delete a note. Owner only.
   */
  delete_note: ({owner, id}: {owner: string, id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a update_note transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update an existing note's title and content. Owner only.
   */
  update_note: ({owner, id, title, content}: {owner: string, id: u32, title: string, content: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAACJBIHNpbmdsZSBub3RlIG93bmVkIGJ5IGFuIGFkZHJlc3MuAAAAAAAAAAAABE5vdGUAAAAFAAAAAAAAAAdjb250ZW50AAAAABAAAAA6TGVkZ2VyIHRpbWVzdGFtcCAodW5peCBzZWNvbmRzKSB3aGVuIHRoZSBub3RlIHdhcyBjcmVhdGVkLgAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAAAmlkAAAAAAAEAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAzTGVkZ2VyIHRpbWVzdGFtcCAodW5peCBzZWNvbmRzKSBvZiB0aGUgbGFzdCB1cGRhdGUuAAAAAAp1cGRhdGVkX2F0AAAAAAAG",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAQAAAAAAAAAMTm90ZU5vdEZvdW5kAAAAAQ==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAEAAAAuTGFzdC11c2VkIG5vdGUgaWQgZm9yIGFuIG93bmVyICgwID0gbm9uZSB5ZXQpLgAAAAAAB0NvdW50ZXIAAAAAAQAAABMAAAABAAAAKEEgbm90ZSByZWNvcmQga2V5ZWQgYnkgKG93bmVyLCBub3RlIGlkKS4AAAAETm90ZQAAAAIAAAATAAAABAAAAAEAAAA2T3JkZXJlZCBsaXN0IG9mIGFuIG93bmVyJ3Mgbm90ZSBpZHMsIGZvciBgbGlzdF9ub3Rlc2AuAAAAAAADSWRzAAAAAAEAAAAT",
        "AAAAAAAAADRBZGQgYSBuZXcgbm90ZSBmb3IgYG93bmVyYC4gUmV0dXJucyB0aGUgbmV3IG5vdGUgaWQuAAAACGFkZF9ub3RlAAAAAwAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAAB2NvbnRlbnQAAAAAEAAAAAEAAAAE",
        "AAAAAAAAABRGZXRjaCBhIHNpbmdsZSBub3RlLgAAAAhnZXRfbm90ZQAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAACaWQAAAAAAAQAAAABAAAD6QAAB9AAAAAETm90ZQAAAAM=",
        "AAAAAAAAADBMaXN0IGFsbCBvZiBhbiBvd25lcidzIG5vdGVzLCBpbiBjcmVhdGlvbiBvcmRlci4AAAAKbGlzdF9ub3RlcwAAAAAAAQAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAA+oAAAfQAAAABE5vdGU=",
        "AAAAAAAAABpEZWxldGUgYSBub3RlLiBPd25lciBvbmx5LgAAAAAAC2RlbGV0ZV9ub3RlAAAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAACaWQAAAAAAAQAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAADhVcGRhdGUgYW4gZXhpc3Rpbmcgbm90ZSdzIHRpdGxlIGFuZCBjb250ZW50LiBPd25lciBvbmx5LgAAAAt1cGRhdGVfbm90ZQAAAAAEAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAAAmlkAAAAAAAEAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAAB2NvbnRlbnQAAAAAEAAAAAEAAAPpAAAAAgAAAAM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    add_note: this.txFromJSON<u32>,
        get_note: this.txFromJSON<Result<Note>>,
        list_notes: this.txFromJSON<Array<Note>>,
        delete_note: this.txFromJSON<Result<void>>,
        update_note: this.txFromJSON<Result<void>>
  }
}