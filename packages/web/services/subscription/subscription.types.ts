export interface SubscriptionStatus {
  isActive: boolean;
  /** `epoch_ends_at(Sub(member))`, in unix seconds. `0` if inactive. */
  expiresAt: bigint;
}

export interface Config {
  admin: string;
  epochSecs: bigint;
  genesis: bigint;
  platform: string;
  platformBps: number;
  price: bigint;
  token: string;
}
