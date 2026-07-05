import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
if (typeof window !== "undefined") {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const Errors = {
    1: { message: "NoteNotFound" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAQAAACJBIHNpbmdsZSBub3RlIG93bmVkIGJ5IGFuIGFkZHJlc3MuAAAAAAAAAAAABE5vdGUAAAAFAAAAAAAAAAdjb250ZW50AAAAABAAAAA6TGVkZ2VyIHRpbWVzdGFtcCAodW5peCBzZWNvbmRzKSB3aGVuIHRoZSBub3RlIHdhcyBjcmVhdGVkLgAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAAAmlkAAAAAAAEAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAzTGVkZ2VyIHRpbWVzdGFtcCAodW5peCBzZWNvbmRzKSBvZiB0aGUgbGFzdCB1cGRhdGUuAAAAAAp1cGRhdGVkX2F0AAAAAAAG",
            "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAQAAAAAAAAAMTm90ZU5vdEZvdW5kAAAAAQ==",
            "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAEAAAAuTGFzdC11c2VkIG5vdGUgaWQgZm9yIGFuIG93bmVyICgwID0gbm9uZSB5ZXQpLgAAAAAAB0NvdW50ZXIAAAAAAQAAABMAAAABAAAAKEEgbm90ZSByZWNvcmQga2V5ZWQgYnkgKG93bmVyLCBub3RlIGlkKS4AAAAETm90ZQAAAAIAAAATAAAABAAAAAEAAAA2T3JkZXJlZCBsaXN0IG9mIGFuIG93bmVyJ3Mgbm90ZSBpZHMsIGZvciBgbGlzdF9ub3Rlc2AuAAAAAAADSWRzAAAAAAEAAAAT",
            "AAAAAAAAADRBZGQgYSBuZXcgbm90ZSBmb3IgYG93bmVyYC4gUmV0dXJucyB0aGUgbmV3IG5vdGUgaWQuAAAACGFkZF9ub3RlAAAAAwAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAAB2NvbnRlbnQAAAAAEAAAAAEAAAAE",
            "AAAAAAAAABRGZXRjaCBhIHNpbmdsZSBub3RlLgAAAAhnZXRfbm90ZQAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAACaWQAAAAAAAQAAAABAAAD6QAAB9AAAAAETm90ZQAAAAM=",
            "AAAAAAAAADBMaXN0IGFsbCBvZiBhbiBvd25lcidzIG5vdGVzLCBpbiBjcmVhdGlvbiBvcmRlci4AAAAKbGlzdF9ub3RlcwAAAAAAAQAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAA+oAAAfQAAAABE5vdGU=",
            "AAAAAAAAABpEZWxldGUgYSBub3RlLiBPd25lciBvbmx5LgAAAAAAC2RlbGV0ZV9ub3RlAAAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAACaWQAAAAAAAQAAAABAAAD6QAAAAIAAAAD",
            "AAAAAAAAADhVcGRhdGUgYW4gZXhpc3Rpbmcgbm90ZSdzIHRpdGxlIGFuZCBjb250ZW50LiBPd25lciBvbmx5LgAAAAt1cGRhdGVfbm90ZQAAAAAEAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAAAmlkAAAAAAAEAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAAB2NvbnRlbnQAAAAAEAAAAAEAAAPpAAAAAgAAAAM="]), options);
        this.options = options;
    }
    fromJSON = {
        add_note: (this.txFromJSON),
        get_note: (this.txFromJSON),
        list_notes: (this.txFromJSON),
        delete_note: (this.txFromJSON),
        update_note: (this.txFromJSON)
    };
}
