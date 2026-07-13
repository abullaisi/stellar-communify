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




export const Errors = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"NotAdmin"},
  4: {message:"NotManager"},
  5: {message:"NotContentCreator"},
  6: {message:"SubExpired"},
  7: {message:"ContentNotFound"},
  8: {message:"ContentInactive"},
  9: {message:"EpochNotClosed"},
  10: {message:"AlreadySettled"},
  11: {message:"NothingToClaim"},
  12: {message:"InvalidBps"},
  13: {message:"InvalidAmount"},
  14: {message:"FaucetCooldown"},
  15: {message:"AlreadySubscribed"}
}


export interface Stats {
  content_count: u64;
  manager_count: u32;
  total_claimed: i128;
  total_subs: u64;
  total_volume: i128;
}


export interface Config {
  admin: string;
  epoch_secs: u64;
  genesis: u64;
  platform: string;
  platform_bps: u32;
  price: i128;
  token: string;
}


export interface Content {
  active: boolean;
  creator: string;
  id: u64;
  managers: Array<string>;
  sha256: Buffer;
}

export type DataKey = {tag: "Config", values: void} | {tag: "Stats", values: void} | {tag: "EpochBase", values: void} | {tag: "NextContentId", values: void} | {tag: "Manager", values: readonly [string]} | {tag: "Content", values: readonly [u64]} | {tag: "Sub", values: readonly [string]} | {tag: "Budget", values: readonly [u32, string]} | {tag: "MemberReads", values: readonly [u32, string]} | {tag: "MemberContents", values: readonly [u32, string]} | {tag: "Read", values: readonly [u32, u64, string]} | {tag: "ContentReads", values: readonly [u32, u64]} | {tag: "Settled", values: readonly [u32, string]} | {tag: "Accrued", values: readonly [string]} | {tag: "Dust", values: void};

export interface Client {
  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * One-time. Sets Config, zeroes Stats, NextContentId = 1, genesis = now.
   */
  init: ({cfg}: {cfg: Config}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * require_auth(caller). Errors NothingToClaim if Accrued(caller) == 0.
   * Transfers Accrued(caller) from contract to caller, zeroes it.
   * The platform address claims its fees through this same function.
   * Emits `claimed`.
   */
  claim: ({caller}: {caller: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_dust transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_dust: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a has_read transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  has_read: ({epoch, content_id, member}: {epoch: u32, content_id: u64, member: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_stats: (options?: MethodOptions) => Promise<AssembledTransaction<Stats>>

  /**
   * Construct and simulate a is_active transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Sub(member) == current_epoch()
   */
  is_active: ({member}: {member: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a subscribe transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * require_auth(member). Errors AlreadySubscribed if Sub(member) == current_epoch().
   * NOTE: no shared pool. Each member's budget is theirs alone (D-009).
   * Emits `subscribed`.
   */
  subscribe: ({member}: {member: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a claim_dust transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * require_auth(admin). Transfers Dust to Config.platform, zeroes Dust.
   */
  claim_dust: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_budget transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_budget: ({epoch, member}: {epoch: u32, member: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_config: (options?: MethodOptions) => Promise<AssembledTransaction<Config>>

  /**
   * Construct and simulate a is_manager transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_manager: ({who}: {who: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a is_settled transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_settled: ({epoch, member}: {epoch: u32, member: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_accrued transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_accrued: ({who}: {who: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_content transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Errors ContentNotFound
   */
  get_content: ({content_id}: {content_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Content>>

  /**
   * Construct and simulate a set_manager transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless self-service (D-011). require_auth(who): a wallet toggles only its OWN
   * manager status — enable to start publishing, disable to resign. No admin gate; `who`
   * can never be forced by anyone else, and no one but `who` can touch it. Adjusts
   * Stats.manager_count.
   */
  set_manager: ({who, enabled}: {who: string, enabled: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a list_content transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  list_content: ({start, limit}: {start: u64, limit: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Content>>>

  /**
   * Construct and simulate a current_epoch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * (now - genesis) / epoch_secs
   */
  current_epoch: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a epoch_ends_at transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  epoch_ends_at: ({epoch}: {epoch: u32}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a record_access transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * require_auth(member). Errors SubExpired unless is_active(member).
   * IDEMPOTENT per (epoch, content, member) — must not error on retry.
   * Emits `accessed` only on the first read.
   */
  record_access: ({member, content_id}: {member: string, content_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a settle_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless. Distributes ONE member's budget for ONE past epoch.
   * Errors EpochNotClosed if `epoch >= current_epoch()`. Errors AlreadySettled
   * if Settled(epoch, m). See docs/CONTRACT_SPEC.md §3 for the settlement math.
   * Emits `settled`.
   */
  settle_member: ({epoch, m}: {epoch: u32, m: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_member_reads transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_member_reads: ({epoch, member}: {epoch: u32, member: string}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_subscription transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * epoch_ends_at(Sub(member)); 0 if inactive
   */
  get_subscription: ({member}: {member: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a register_content transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Manager-gated. require_auth(caller). caller must be a whitelisted manager.
   * Creates Content { id: next, creator: caller, managers: vec![caller], sha256, active: true }.
   * Returns the new content id.
   */
  register_content: ({caller, sha256}: {caller: string, sha256: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a force_close_epoch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * require_auth(admin). Ends the current epoch immediately: it becomes closed
   * (so `settle_member`/`claim` can drain it) and a fresh epoch of the same
   * `epoch_secs` starts now. Does NOT distribute — distribution stays the
   * existing per-member pull (`settle_member`), same as a natural boundary.
   * 
   * Operator/demo tool: run a real billing epoch (e.g. 30 days) but force a
   * close on demand to show settlement live. Epoch numbers stay strictly
   * monotonic and no existing epoch's state is renumbered. Emits `epoch_closed`.
   */
  force_close_epoch: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_content_reads transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Display only, does not drive money.
   */
  get_content_reads: ({epoch, content_id}: {epoch: u32, content_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a set_content_active transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * require_auth(creator). Sets Content.active. Inactive content cannot be read.
   * Already-recorded reads still settle normally.
   */
  set_content_active: ({creator, content_id, active}: {creator: string, content_id: u64, active: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a add_content_manager transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * require_auth(creator). Only the content's creator may add co-managers.
   * `who` must be a whitelisted manager. No-op if already present.
   */
  add_content_manager: ({creator, content_id, who}: {creator: string, content_id: u64, who: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

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
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADwAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAAAAAAAAITm90QWRtaW4AAAADAAAAAAAAAApOb3RNYW5hZ2VyAAAAAAAEAAAAAAAAABFOb3RDb250ZW50Q3JlYXRvcgAAAAAAAAUAAAAAAAAAClN1YkV4cGlyZWQAAAAAAAYAAAAAAAAAD0NvbnRlbnROb3RGb3VuZAAAAAAHAAAAAAAAAA9Db250ZW50SW5hY3RpdmUAAAAACAAAAAAAAAAORXBvY2hOb3RDbG9zZWQAAAAAAAkAAAAAAAAADkFscmVhZHlTZXR0bGVkAAAAAAAKAAAAAAAAAA5Ob3RoaW5nVG9DbGFpbQAAAAAACwAAAAAAAAAKSW52YWxpZEJwcwAAAAAADAAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAA0AAAAAAAAADkZhdWNldENvb2xkb3duAAAAAAAOAAAAAAAAABFBbHJlYWR5U3Vic2NyaWJlZAAAAAAAAA8=",
        "AAAAAQAAAAAAAAAAAAAABVN0YXRzAAAAAAAABQAAAAAAAAANY29udGVudF9jb3VudAAAAAAAAAYAAAAAAAAADW1hbmFnZXJfY291bnQAAAAAAAAEAAAAAAAAAA10b3RhbF9jbGFpbWVkAAAAAAAACwAAAAAAAAAKdG90YWxfc3VicwAAAAAABgAAAAAAAAAMdG90YWxfdm9sdW1lAAAACw==",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAABwAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAplcG9jaF9zZWNzAAAAAAAGAAAAAAAAAAdnZW5lc2lzAAAAAAYAAAAAAAAACHBsYXRmb3JtAAAAEwAAAAAAAAAMcGxhdGZvcm1fYnBzAAAABAAAAAAAAAAFcHJpY2UAAAAAAAALAAAAAAAAAAV0b2tlbgAAAAAAABM=",
        "AAAAAQAAAAAAAAAAAAAAB0NvbnRlbnQAAAAABQAAAAAAAAAGYWN0aXZlAAAAAAABAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAhtYW5hZ2VycwAAA+oAAAATAAAAAAAAAAZzaGEyNTYAAAAAA+4AAAAg",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAADwAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAAAAAAAAAAAFU3RhdHMAAAAAAAAAAAAAAAAAAAlFcG9jaEJhc2UAAAAAAAAAAAAAAAAAAA1OZXh0Q29udGVudElkAAAAAAAAAQAAAAAAAAAHTWFuYWdlcgAAAAABAAAAEwAAAAEAAAAAAAAAB0NvbnRlbnQAAAAAAQAAAAYAAAABAAAAAAAAAANTdWIAAAAAAQAAABMAAAABAAAAAAAAAAZCdWRnZXQAAAAAAAIAAAAEAAAAEwAAAAEAAAAAAAAAC01lbWJlclJlYWRzAAAAAAIAAAAEAAAAEwAAAAEAAAAAAAAADk1lbWJlckNvbnRlbnRzAAAAAAACAAAABAAAABMAAAABAAAAAAAAAARSZWFkAAAAAwAAAAQAAAAGAAAAEwAAAAEAAAAAAAAADENvbnRlbnRSZWFkcwAAAAIAAAAEAAAABgAAAAEAAAAAAAAAB1NldHRsZWQAAAAAAgAAAAQAAAATAAAAAQAAAAAAAAAHQWNjcnVlZAAAAAABAAAAEwAAAAAAAAAAAAAABER1c3Q=",
        "AAAAAAAAAEZPbmUtdGltZS4gU2V0cyBDb25maWcsIHplcm9lcyBTdGF0cywgTmV4dENvbnRlbnRJZCA9IDEsIGdlbmVzaXMgPSBub3cuAAAAAAAEaW5pdAAAAAEAAAAAAAAAA2NmZwAAAAfQAAAABkNvbmZpZwAAAAAAAA==",
        "AAAAAAAAANRyZXF1aXJlX2F1dGgoY2FsbGVyKS4gRXJyb3JzIE5vdGhpbmdUb0NsYWltIGlmIEFjY3J1ZWQoY2FsbGVyKSA9PSAwLgpUcmFuc2ZlcnMgQWNjcnVlZChjYWxsZXIpIGZyb20gY29udHJhY3QgdG8gY2FsbGVyLCB6ZXJvZXMgaXQuClRoZSBwbGF0Zm9ybSBhZGRyZXNzIGNsYWltcyBpdHMgZmVlcyB0aHJvdWdoIHRoaXMgc2FtZSBmdW5jdGlvbi4KRW1pdHMgYGNsYWltZWRgLgAAAAVjbGFpbQAAAAAAAAEAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAIZ2V0X2R1c3QAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAIaGFzX3JlYWQAAAADAAAAAAAAAAVlcG9jaAAAAAAAAAQAAAAAAAAACmNvbnRlbnRfaWQAAAAAAAYAAAAAAAAABm1lbWJlcgAAAAAAEwAAAAEAAAAB",
        "AAAAAAAAAAAAAAAJZ2V0X3N0YXRzAAAAAAAAAAAAAAEAAAfQAAAABVN0YXRzAAAA",
        "AAAAAAAAAB5TdWIobWVtYmVyKSA9PSBjdXJyZW50X2Vwb2NoKCkAAAAAAAlpc19hY3RpdmUAAAAAAAABAAAAAAAAAAZtZW1iZXIAAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAKlyZXF1aXJlX2F1dGgobWVtYmVyKS4gRXJyb3JzIEFscmVhZHlTdWJzY3JpYmVkIGlmIFN1YihtZW1iZXIpID09IGN1cnJlbnRfZXBvY2goKS4KTk9URTogbm8gc2hhcmVkIHBvb2wuIEVhY2ggbWVtYmVyJ3MgYnVkZ2V0IGlzIHRoZWlycyBhbG9uZSAoRC0wMDkpLgpFbWl0cyBgc3Vic2NyaWJlZGAuAAAAAAAACXN1YnNjcmliZQAAAAAAAAEAAAAAAAAABm1lbWJlcgAAAAAAEwAAAAA=",
        "AAAAAAAAAERyZXF1aXJlX2F1dGgoYWRtaW4pLiBUcmFuc2ZlcnMgRHVzdCB0byBDb25maWcucGxhdGZvcm0sIHplcm9lcyBEdXN0LgAAAApjbGFpbV9kdXN0AAAAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAKZ2V0X2J1ZGdldAAAAAAAAgAAAAAAAAAFZXBvY2gAAAAAAAAEAAAAAAAAAAZtZW1iZXIAAAAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAAKZ2V0X2NvbmZpZwAAAAAAAAAAAAEAAAfQAAAABkNvbmZpZwAA",
        "AAAAAAAAAAAAAAAKaXNfbWFuYWdlcgAAAAAAAQAAAAAAAAADd2hvAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAKaXNfc2V0dGxlZAAAAAAAAgAAAAAAAAAFZXBvY2gAAAAAAAAEAAAAAAAAAAZtZW1iZXIAAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAALZ2V0X2FjY3J1ZWQAAAAAAQAAAAAAAAADd2hvAAAAABMAAAABAAAACw==",
        "AAAAAAAAABZFcnJvcnMgQ29udGVudE5vdEZvdW5kAAAAAAALZ2V0X2NvbnRlbnQAAAAAAQAAAAAAAAAKY29udGVudF9pZAAAAAAABgAAAAEAAAfQAAAAB0NvbnRlbnQA",
        "AAAAAAAAARBQZXJtaXNzaW9ubGVzcyBzZWxmLXNlcnZpY2UgKEQtMDExKS4gcmVxdWlyZV9hdXRoKHdobyk6IGEgd2FsbGV0IHRvZ2dsZXMgb25seSBpdHMgT1dOCm1hbmFnZXIgc3RhdHVzIOKAlCBlbmFibGUgdG8gc3RhcnQgcHVibGlzaGluZywgZGlzYWJsZSB0byByZXNpZ24uIE5vIGFkbWluIGdhdGU7IGB3aG9gCmNhbiBuZXZlciBiZSBmb3JjZWQgYnkgYW55b25lIGVsc2UsIGFuZCBubyBvbmUgYnV0IGB3aG9gIGNhbiB0b3VjaCBpdC4gQWRqdXN0cwpTdGF0cy5tYW5hZ2VyX2NvdW50LgAAAAtzZXRfbWFuYWdlcgAAAAACAAAAAAAAAAN3aG8AAAAAEwAAAAAAAAAHZW5hYmxlZAAAAAABAAAAAA==",
        "AAAAAAAAAAAAAAAMbGlzdF9jb250ZW50AAAAAgAAAAAAAAAFc3RhcnQAAAAAAAAGAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6gAAB9AAAAAHQ29udGVudAA=",
        "AAAAAAAAABwobm93IC0gZ2VuZXNpcykgLyBlcG9jaF9zZWNzAAAADWN1cnJlbnRfZXBvY2gAAAAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAANZXBvY2hfZW5kc19hdAAAAAAAAAEAAAAAAAAABWVwb2NoAAAAAAAABAAAAAEAAAAG",
        "AAAAAAAAAK9yZXF1aXJlX2F1dGgobWVtYmVyKS4gRXJyb3JzIFN1YkV4cGlyZWQgdW5sZXNzIGlzX2FjdGl2ZShtZW1iZXIpLgpJREVNUE9URU5UIHBlciAoZXBvY2gsIGNvbnRlbnQsIG1lbWJlcikg4oCUIG11c3Qgbm90IGVycm9yIG9uIHJldHJ5LgpFbWl0cyBgYWNjZXNzZWRgIG9ubHkgb24gdGhlIGZpcnN0IHJlYWQuAAAAAA1yZWNvcmRfYWNjZXNzAAAAAAAAAgAAAAAAAAAGbWVtYmVyAAAAAAATAAAAAAAAAApjb250ZW50X2lkAAAAAAAGAAAAAA==",
        "AAAAAAAAAOxQZXJtaXNzaW9ubGVzcy4gRGlzdHJpYnV0ZXMgT05FIG1lbWJlcidzIGJ1ZGdldCBmb3IgT05FIHBhc3QgZXBvY2guCkVycm9ycyBFcG9jaE5vdENsb3NlZCBpZiBgZXBvY2ggPj0gY3VycmVudF9lcG9jaCgpYC4gRXJyb3JzIEFscmVhZHlTZXR0bGVkCmlmIFNldHRsZWQoZXBvY2gsIG0pLiBTZWUgZG9jcy9DT05UUkFDVF9TUEVDLm1kIMKnMyBmb3IgdGhlIHNldHRsZW1lbnQgbWF0aC4KRW1pdHMgYHNldHRsZWRgLgAAAA1zZXR0bGVfbWVtYmVyAAAAAAAAAgAAAAAAAAAFZXBvY2gAAAAAAAAEAAAAAAAAAAFtAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAQZ2V0X21lbWJlcl9yZWFkcwAAAAIAAAAAAAAABWVwb2NoAAAAAAAABAAAAAAAAAAGbWVtYmVyAAAAAAATAAAAAQAAAAQ=",
        "AAAAAAAAACllcG9jaF9lbmRzX2F0KFN1YihtZW1iZXIpKTsgMCBpZiBpbmFjdGl2ZQAAAAAAABBnZXRfc3Vic2NyaXB0aW9uAAAAAQAAAAAAAAAGbWVtYmVyAAAAAAATAAAAAQAAAAY=",
        "AAAAAAAAAMNNYW5hZ2VyLWdhdGVkLiByZXF1aXJlX2F1dGgoY2FsbGVyKS4gY2FsbGVyIG11c3QgYmUgYSB3aGl0ZWxpc3RlZCBtYW5hZ2VyLgpDcmVhdGVzIENvbnRlbnQgeyBpZDogbmV4dCwgY3JlYXRvcjogY2FsbGVyLCBtYW5hZ2VyczogdmVjIVtjYWxsZXJdLCBzaGEyNTYsIGFjdGl2ZTogdHJ1ZSB9LgpSZXR1cm5zIHRoZSBuZXcgY29udGVudCBpZC4AAAAAEHJlZ2lzdGVyX2NvbnRlbnQAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAABnNoYTI1NgAAAAAD7gAAACAAAAABAAAABg==",
        "AAAAAAAAAf1yZXF1aXJlX2F1dGgoYWRtaW4pLiBFbmRzIHRoZSBjdXJyZW50IGVwb2NoIGltbWVkaWF0ZWx5OiBpdCBiZWNvbWVzIGNsb3NlZAooc28gYHNldHRsZV9tZW1iZXJgL2BjbGFpbWAgY2FuIGRyYWluIGl0KSBhbmQgYSBmcmVzaCBlcG9jaCBvZiB0aGUgc2FtZQpgZXBvY2hfc2Vjc2Agc3RhcnRzIG5vdy4gRG9lcyBOT1QgZGlzdHJpYnV0ZSDigJQgZGlzdHJpYnV0aW9uIHN0YXlzIHRoZQpleGlzdGluZyBwZXItbWVtYmVyIHB1bGwgKGBzZXR0bGVfbWVtYmVyYCksIHNhbWUgYXMgYSBuYXR1cmFsIGJvdW5kYXJ5LgoKT3BlcmF0b3IvZGVtbyB0b29sOiBydW4gYSByZWFsIGJpbGxpbmcgZXBvY2ggKGUuZy4gMzAgZGF5cykgYnV0IGZvcmNlIGEKY2xvc2Ugb24gZGVtYW5kIHRvIHNob3cgc2V0dGxlbWVudCBsaXZlLiBFcG9jaCBudW1iZXJzIHN0YXkgc3RyaWN0bHkKbW9ub3RvbmljIGFuZCBubyBleGlzdGluZyBlcG9jaCdzIHN0YXRlIGlzIHJlbnVtYmVyZWQuIEVtaXRzIGBlcG9jaF9jbG9zZWRgLgAAAAAAABFmb3JjZV9jbG9zZV9lcG9jaAAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAACNEaXNwbGF5IG9ubHksIGRvZXMgbm90IGRyaXZlIG1vbmV5LgAAAAARZ2V0X2NvbnRlbnRfcmVhZHMAAAAAAAACAAAAAAAAAAVlcG9jaAAAAAAAAAQAAAAAAAAACmNvbnRlbnRfaWQAAAAAAAYAAAABAAAABA==",
        "AAAAAAAAAHpyZXF1aXJlX2F1dGgoY3JlYXRvcikuIFNldHMgQ29udGVudC5hY3RpdmUuIEluYWN0aXZlIGNvbnRlbnQgY2Fubm90IGJlIHJlYWQuCkFscmVhZHktcmVjb3JkZWQgcmVhZHMgc3RpbGwgc2V0dGxlIG5vcm1hbGx5LgAAAAAAEnNldF9jb250ZW50X2FjdGl2ZQAAAAAAAwAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAApjb250ZW50X2lkAAAAAAAGAAAAAAAAAAZhY3RpdmUAAAAAAAEAAAAA",
        "AAAAAAAAAIVyZXF1aXJlX2F1dGgoY3JlYXRvcikuIE9ubHkgdGhlIGNvbnRlbnQncyBjcmVhdG9yIG1heSBhZGQgY28tbWFuYWdlcnMuCmB3aG9gIG11c3QgYmUgYSB3aGl0ZWxpc3RlZCBtYW5hZ2VyLiBOby1vcCBpZiBhbHJlYWR5IHByZXNlbnQuAAAAAAAAE2FkZF9jb250ZW50X21hbmFnZXIAAAAAAwAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAApjb250ZW50X2lkAAAAAAAGAAAAAAAAAAN3aG8AAAAAEwAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<null>,
        claim: this.txFromJSON<null>,
        get_dust: this.txFromJSON<i128>,
        has_read: this.txFromJSON<boolean>,
        get_stats: this.txFromJSON<Stats>,
        is_active: this.txFromJSON<boolean>,
        subscribe: this.txFromJSON<null>,
        claim_dust: this.txFromJSON<null>,
        get_budget: this.txFromJSON<i128>,
        get_config: this.txFromJSON<Config>,
        is_manager: this.txFromJSON<boolean>,
        is_settled: this.txFromJSON<boolean>,
        get_accrued: this.txFromJSON<i128>,
        get_content: this.txFromJSON<Content>,
        set_manager: this.txFromJSON<null>,
        list_content: this.txFromJSON<Array<Content>>,
        current_epoch: this.txFromJSON<u32>,
        epoch_ends_at: this.txFromJSON<u64>,
        record_access: this.txFromJSON<null>,
        settle_member: this.txFromJSON<null>,
        get_member_reads: this.txFromJSON<u32>,
        get_subscription: this.txFromJSON<u64>,
        register_content: this.txFromJSON<u64>,
        force_close_epoch: this.txFromJSON<null>,
        get_content_reads: this.txFromJSON<u32>,
        set_content_active: this.txFromJSON<null>,
        add_content_manager: this.txFromJSON<null>
  }
}