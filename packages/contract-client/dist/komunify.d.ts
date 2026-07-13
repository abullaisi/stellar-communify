import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u32, u64, i128 } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const Errors: {
    1: {
        message: string;
    };
    2: {
        message: string;
    };
    3: {
        message: string;
    };
    4: {
        message: string;
    };
    5: {
        message: string;
    };
    6: {
        message: string;
    };
    7: {
        message: string;
    };
    8: {
        message: string;
    };
    9: {
        message: string;
    };
    10: {
        message: string;
    };
    11: {
        message: string;
    };
    12: {
        message: string;
    };
    13: {
        message: string;
    };
    14: {
        message: string;
    };
    15: {
        message: string;
    };
};
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
export type DataKey = {
    tag: "Config";
    values: void;
} | {
    tag: "Stats";
    values: void;
} | {
    tag: "EpochBase";
    values: void;
} | {
    tag: "NextContentId";
    values: void;
} | {
    tag: "Manager";
    values: readonly [string];
} | {
    tag: "Content";
    values: readonly [u64];
} | {
    tag: "Sub";
    values: readonly [string];
} | {
    tag: "Budget";
    values: readonly [u32, string];
} | {
    tag: "MemberReads";
    values: readonly [u32, string];
} | {
    tag: "MemberContents";
    values: readonly [u32, string];
} | {
    tag: "Read";
    values: readonly [u32, u64, string];
} | {
    tag: "ContentReads";
    values: readonly [u32, u64];
} | {
    tag: "Settled";
    values: readonly [u32, string];
} | {
    tag: "Accrued";
    values: readonly [string];
} | {
    tag: "Dust";
    values: void;
};
export interface Client {
    /**
     * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * One-time. Sets Config, zeroes Stats, NextContentId = 1, genesis = now.
     */
    init: ({ cfg }: {
        cfg: Config;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * require_auth(caller). Errors NothingToClaim if Accrued(caller) == 0.
     * Transfers Accrued(caller) from contract to caller, zeroes it.
     * The platform address claims its fees through this same function.
     * Emits `claimed`.
     */
    claim: ({ caller }: {
        caller: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_dust transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_dust: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a has_read transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    has_read: ({ epoch, content_id, member }: {
        epoch: u32;
        content_id: u64;
        member: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>;
    /**
     * Construct and simulate a get_stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_stats: (options?: MethodOptions) => Promise<AssembledTransaction<Stats>>;
    /**
     * Construct and simulate a is_active transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Sub(member) == current_epoch()
     */
    is_active: ({ member }: {
        member: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>;
    /**
     * Construct and simulate a subscribe transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * require_auth(member). Errors AlreadySubscribed if Sub(member) == current_epoch().
     * NOTE: no shared pool. Each member's budget is theirs alone (D-009).
     * Emits `subscribed`.
     */
    subscribe: ({ member }: {
        member: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a claim_dust transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * require_auth(admin). Transfers Dust to Config.platform, zeroes Dust.
     */
    claim_dust: ({ admin }: {
        admin: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_budget transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_budget: ({ epoch, member }: {
        epoch: u32;
        member: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_config: (options?: MethodOptions) => Promise<AssembledTransaction<Config>>;
    /**
     * Construct and simulate a is_manager transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    is_manager: ({ who }: {
        who: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>;
    /**
     * Construct and simulate a is_settled transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    is_settled: ({ epoch, member }: {
        epoch: u32;
        member: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>;
    /**
     * Construct and simulate a get_accrued transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_accrued: ({ who }: {
        who: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_content transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Errors ContentNotFound
     */
    get_content: ({ content_id }: {
        content_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Content>>;
    /**
     * Construct and simulate a set_manager transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Permissionless self-service (D-011). require_auth(who): a wallet toggles only its OWN
     * manager status — enable to start publishing, disable to resign. No admin gate; `who`
     * can never be forced by anyone else, and no one but `who` can touch it. Adjusts
     * Stats.manager_count.
     */
    set_manager: ({ who, enabled }: {
        who: string;
        enabled: boolean;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a list_content transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    list_content: ({ start, limit }: {
        start: u64;
        limit: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Array<Content>>>;
    /**
     * Construct and simulate a current_epoch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * (now - genesis) / epoch_secs
     */
    current_epoch: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>;
    /**
     * Construct and simulate a epoch_ends_at transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    epoch_ends_at: ({ epoch }: {
        epoch: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
    /**
     * Construct and simulate a record_access transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * require_auth(member). Errors SubExpired unless is_active(member).
     * IDEMPOTENT per (epoch, content, member) — must not error on retry.
     * Emits `accessed` only on the first read.
     */
    record_access: ({ member, content_id }: {
        member: string;
        content_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a settle_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Permissionless. Distributes ONE member's budget for ONE past epoch.
     * Errors EpochNotClosed if `epoch >= current_epoch()`. Errors AlreadySettled
     * if Settled(epoch, m). See docs/CONTRACT_SPEC.md §3 for the settlement math.
     * Emits `settled`.
     */
    settle_member: ({ epoch, m }: {
        epoch: u32;
        m: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_member_reads transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_member_reads: ({ epoch, member }: {
        epoch: u32;
        member: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u32>>;
    /**
     * Construct and simulate a get_subscription transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * epoch_ends_at(Sub(member)); 0 if inactive
     */
    get_subscription: ({ member }: {
        member: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
    /**
     * Construct and simulate a register_content transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Manager-gated. require_auth(caller). caller must be a whitelisted manager.
     * Creates Content { id: next, creator: caller, managers: vec![caller], sha256, active: true }.
     * Returns the new content id.
     */
    register_content: ({ caller, sha256 }: {
        caller: string;
        sha256: Buffer;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
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
    force_close_epoch: ({ admin }: {
        admin: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_content_reads transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Display only, does not drive money.
     */
    get_content_reads: ({ epoch, content_id }: {
        epoch: u32;
        content_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u32>>;
    /**
     * Construct and simulate a set_content_active transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * require_auth(creator). Sets Content.active. Inactive content cannot be read.
     * Already-recorded reads still settle normally.
     */
    set_content_active: ({ creator, content_id, active }: {
        creator: string;
        content_id: u64;
        active: boolean;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a add_content_manager transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * require_auth(creator). Only the content's creator may add co-managers.
     * `who` must be a whitelisted manager. No-op if already present.
     */
    add_content_manager: ({ creator, content_id, who }: {
        creator: string;
        content_id: u64;
        who: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        init: (json: string) => AssembledTransaction<null>;
        claim: (json: string) => AssembledTransaction<null>;
        get_dust: (json: string) => AssembledTransaction<bigint>;
        has_read: (json: string) => AssembledTransaction<boolean>;
        get_stats: (json: string) => AssembledTransaction<Stats>;
        is_active: (json: string) => AssembledTransaction<boolean>;
        subscribe: (json: string) => AssembledTransaction<null>;
        claim_dust: (json: string) => AssembledTransaction<null>;
        get_budget: (json: string) => AssembledTransaction<bigint>;
        get_config: (json: string) => AssembledTransaction<Config>;
        is_manager: (json: string) => AssembledTransaction<boolean>;
        is_settled: (json: string) => AssembledTransaction<boolean>;
        get_accrued: (json: string) => AssembledTransaction<bigint>;
        get_content: (json: string) => AssembledTransaction<Content>;
        set_manager: (json: string) => AssembledTransaction<null>;
        list_content: (json: string) => AssembledTransaction<Content[]>;
        current_epoch: (json: string) => AssembledTransaction<number>;
        epoch_ends_at: (json: string) => AssembledTransaction<bigint>;
        record_access: (json: string) => AssembledTransaction<null>;
        settle_member: (json: string) => AssembledTransaction<null>;
        get_member_reads: (json: string) => AssembledTransaction<number>;
        get_subscription: (json: string) => AssembledTransaction<bigint>;
        register_content: (json: string) => AssembledTransaction<bigint>;
        force_close_epoch: (json: string) => AssembledTransaction<null>;
        get_content_reads: (json: string) => AssembledTransaction<number>;
        set_content_active: (json: string) => AssembledTransaction<null>;
        add_content_manager: (json: string) => AssembledTransaction<null>;
    };
}
