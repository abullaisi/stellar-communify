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
    2: { message: "NotInitialized" },
    13: { message: "NegativeAmount" },
    14: { message: "FaucetCooldown" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAwAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAIAAAAAAAAADk5lZ2F0aXZlQW1vdW50AAAAAAANAAAAAAAAAA5GYXVjZXRDb29sZG93bgAAAAAADg==",
            "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAAHQmFsYW5jZQAAAAABAAAAEwAAAAEAAAAAAAAACUFsbG93YW5jZQAAAAAAAAEAAAfQAAAADEFsbG93YW5jZUtleQAAAAEAAAAAAAAACEZhdWNldEF0AAAAAQAAABM=",
            "AAAAAAAAAAAAAAAEYnVybgAAAAIAAAAAAAAABGZyb20AAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
            "AAAAAAAAACZPbmUtdGltZSBzZXR1cC4gYWRtaW4gbWF5IG1pbnQgZnJlZWx5LgAAAAAABGluaXQAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAA",
            "AAAAAAAAACBBZG1pbiBtaW50LiByZXF1aXJlX2F1dGgoYWRtaW4pLgAAAARtaW50AAAAAgAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
            "AAAAAAAAAAAAAAAEbmFtZQAAAAAAAAABAAAAEA==",
            "AAAAAQAAAAAAAAAAAAAADEFsbG93YW5jZUtleQAAAAIAAAAAAAAABGZyb20AAAATAAAAAAAAAAdzcGVuZGVyAAAAABM=",
            "AAAAAAAAALFPcGVuIHRlc3RuZXQgZmF1Y2V0LiByZXF1aXJlX2F1dGgoY2FsbGVyKS4KTWludHMgRkFVQ0VUX0FNT1VOVCAoNTAwXzAwMDAwMDAgPSA1MDAgVVNEQyBhdCA3ZHApIHRvIGNhbGxlci4KUGFuaWNzIHdpdGggRXJyb3I6OkZhdWNldENvb2xkb3duIGlmIGNhbGxlZCBhZ2FpbiB3aXRoaW4gODY0MDAgc2Vjb25kcy4AAAAAAAAGZmF1Y2V0AAAAAAABAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAA",
            "AAAAAAAAAAAAAAAGc3ltYm9sAAAAAAAAAAAAAQAAABA=",
            "AAAAAAAAAAAAAAAHYXBwcm92ZQAAAAAEAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWV4cGlyYXRpb25fbGVkZ2VyAAAAAAAABAAAAAA=",
            "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAABAAAAAAAAAAJpZAAAAAAAEwAAAAEAAAAL",
            "AAAAAQAAAAAAAAAAAAAADkFsbG93YW5jZVZhbHVlAAAAAAACAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWV4cGlyYXRpb25fbGVkZ2VyAAAAAAAABA==",
            "AAAAAAAAAAAAAAAIZGVjaW1hbHMAAAAAAAAAAQAAAAQ=",
            "AAAAAAAAAAAAAAAIdHJhbnNmZXIAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABQAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
            "AAAAAAAAAAAAAAAJYWxsb3dhbmNlAAAAAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAEAAAAL",
            "AAAAAAAAAAAAAAAJYnVybl9mcm9tAAAAAAAAAwAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
            "AAAAAAAAAAAAAAANdHJhbnNmZXJfZnJvbQAAAAAAAAQAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
            "AAAAAAAAAEBVbml4IHNlY29uZHMgd2hlbiBgd2hvYCBtYXkgbmV4dCBjYWxsIGZhdWNldCgpLiAwIGlmIG5ldmVyIHVzZWQuAAAAE2ZhdWNldF9hdmFpbGFibGVfYXQAAAAAAQAAAAAAAAADd2hvAAAAABMAAAABAAAABg=="]), options);
        this.options = options;
    }
    fromJSON = {
        burn: (this.txFromJSON),
        init: (this.txFromJSON),
        mint: (this.txFromJSON),
        name: (this.txFromJSON),
        faucet: (this.txFromJSON),
        symbol: (this.txFromJSON),
        approve: (this.txFromJSON),
        balance: (this.txFromJSON),
        decimals: (this.txFromJSON),
        transfer: (this.txFromJSON),
        allowance: (this.txFromJSON),
        burn_from: (this.txFromJSON),
        transfer_from: (this.txFromJSON),
        faucet_available_at: (this.txFromJSON)
    };
}
