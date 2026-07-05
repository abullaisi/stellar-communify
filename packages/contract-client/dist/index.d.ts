import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions, Result } from "@stellar/stellar-sdk/contract";
import type { u32, u64 } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
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
export declare const Errors: {
    1: {
        message: string;
    };
};
export type DataKey = {
    tag: "Counter";
    values: readonly [string];
} | {
    tag: "Note";
    values: readonly [string, u32];
} | {
    tag: "Ids";
    values: readonly [string];
};
export interface Client {
    /**
     * Construct and simulate a add_note transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Add a new note for `owner`. Returns the new note id.
     */
    add_note: ({ owner, title, content }: {
        owner: string;
        title: string;
        content: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u32>>;
    /**
     * Construct and simulate a get_note transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Fetch a single note.
     */
    get_note: ({ owner, id }: {
        owner: string;
        id: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<Note>>>;
    /**
     * Construct and simulate a list_notes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * List all of an owner's notes, in creation order.
     */
    list_notes: ({ owner }: {
        owner: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Array<Note>>>;
    /**
     * Construct and simulate a delete_note transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Delete a note. Owner only.
     */
    delete_note: ({ owner, id }: {
        owner: string;
        id: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>;
    /**
     * Construct and simulate a update_note transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Update an existing note's title and content. Owner only.
     */
    update_note: ({ owner, id, title, content }: {
        owner: string;
        id: u32;
        title: string;
        content: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>;
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
        add_note: (json: string) => AssembledTransaction<number>;
        get_note: (json: string) => AssembledTransaction<Result<Note, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        list_notes: (json: string) => AssembledTransaction<Note[]>;
        delete_note: (json: string) => AssembledTransaction<Result<void, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        update_note: (json: string) => AssembledTransaction<Result<void, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
    };
}
