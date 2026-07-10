#![no_std]

//! `usdc` — mock SEP-41 token for Komunify testnet demos (D-002).
//!
//! Implements `soroban_sdk::token::TokenInterface` in full, plus an open testnet
//! `faucet()` rate-limited to once per 24h per address. See docs/CONTRACT_SPEC.md §1.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token::TokenInterface,
    Address, Env, MuxedAddress, String,
};

/// Fixed faucet payout: 500 USDC at 7 decimal places.
pub const FAUCET_AMOUNT: i128 = 500_0000000;
/// Faucet cooldown, in seconds.
pub const FAUCET_COOLDOWN_SECS: u64 = 86_400;

const DECIMALS: u32 = 7;

// TTL bump constants (~17280 ledgers/day at 5s/ledger).
const DAY_IN_LEDGERS: u32 = 17_280;
const INSTANCE_BUMP: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_THRESHOLD: u32 = INSTANCE_BUMP - DAY_IN_LEDGERS;
const PERSIST_BUMP: u32 = 30 * DAY_IN_LEDGERS;
const PERSIST_THRESHOLD: u32 = PERSIST_BUMP - DAY_IN_LEDGERS;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 2,
    NegativeAmount = 13,
    FaucetCooldown = 14,
}

#[contracttype]
#[derive(Clone)]
pub struct AllowanceKey {
    pub from: Address,
    pub spender: Address,
}

#[contracttype]
#[derive(Clone)]
pub struct AllowanceValue {
    pub amount: i128,
    pub expiration_ledger: u32,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Balance(Address),
    Allowance(AllowanceKey),
    FaucetAt(Address),
}

#[contract]
pub struct UsdcContract;

fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_THRESHOLD, INSTANCE_BUMP);
}

fn read_balance(env: &Env, id: &Address) -> i128 {
    let key = DataKey::Balance(id.clone());
    if let Some(b) = env.storage().persistent().get::<_, i128>(&key) {
        env.storage()
            .persistent()
            .extend_ttl(&key, PERSIST_THRESHOLD, PERSIST_BUMP);
        b
    } else {
        0
    }
}

fn write_balance(env: &Env, id: &Address, amount: i128) {
    let key = DataKey::Balance(id.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSIST_THRESHOLD, PERSIST_BUMP);
}

fn read_allowance(env: &Env, from: &Address, spender: &Address) -> AllowanceValue {
    let key = DataKey::Allowance(AllowanceKey {
        from: from.clone(),
        spender: spender.clone(),
    });
    if let Some(v) = env.storage().temporary().get::<_, AllowanceValue>(&key) {
        if v.expiration_ledger < env.ledger().sequence() {
            AllowanceValue {
                amount: 0,
                expiration_ledger: v.expiration_ledger,
            }
        } else {
            v
        }
    } else {
        AllowanceValue {
            amount: 0,
            expiration_ledger: 0,
        }
    }
}

fn write_allowance(
    env: &Env,
    from: &Address,
    spender: &Address,
    amount: i128,
    expiration_ledger: u32,
) {
    let key = DataKey::Allowance(AllowanceKey {
        from: from.clone(),
        spender: spender.clone(),
    });
    if amount > 0 && expiration_ledger < env.ledger().sequence() {
        panic!("expiration_ledger is in the past");
    }
    env.storage().temporary().set(
        &key,
        &AllowanceValue {
            amount,
            expiration_ledger,
        },
    );
    if amount > 0 {
        let live_for = expiration_ledger
            .checked_sub(env.ledger().sequence())
            .unwrap();
        env.storage()
            .temporary()
            .extend_ttl(&key, live_for, live_for);
    }
}

fn spend_allowance(env: &Env, from: &Address, spender: &Address, amount: i128) {
    let allowance = read_allowance(env, from, spender);
    if allowance.amount < amount {
        panic!("insufficient allowance");
    }
    if amount > 0 {
        write_allowance(
            env,
            from,
            spender,
            allowance.amount - amount,
            allowance.expiration_ledger,
        );
    }
}

fn check_nonneg(amount: i128) {
    if amount < 0 {
        panic_with_error(Error::NegativeAmount);
    }
}

fn panic_with_error(e: Error) -> ! {
    panic!("{}", match e {
        Error::NotInitialized => "not initialized",
        Error::NegativeAmount => "negative amount",
        Error::FaucetCooldown => "faucet cooldown",
    })
}

fn mint_to(env: &Env, to: &Address, amount: i128) {
    let balance = read_balance(env, to);
    write_balance(env, to, balance + amount);
    env.events().publish(
        (symbol_short!("mint"), to.clone()),
        amount,
    );
}

#[contractimpl]
impl UsdcContract {
    /// One-time setup. admin may mint freely.
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        bump_instance(&env);
    }

    /// Admin mint. require_auth(admin).
    pub fn mint(env: Env, to: Address, amount: i128) {
        check_nonneg(amount);
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error(Error::NotInitialized));
        admin.require_auth();
        bump_instance(&env);
        mint_to(&env, &to, amount);
    }

    /// Open testnet faucet. require_auth(caller).
    /// Mints FAUCET_AMOUNT (500_0000000 = 500 USDC at 7dp) to caller.
    /// Panics with Error::FaucetCooldown if called again within 86400 seconds.
    pub fn faucet(env: Env, caller: Address) {
        caller.require_auth();
        let now = env.ledger().timestamp();
        let key = DataKey::FaucetAt(caller.clone());
        let available_at: u64 = env.storage().persistent().get(&key).unwrap_or(0);
        if now < available_at {
            panic_with_error(Error::FaucetCooldown);
        }
        let next = now + FAUCET_COOLDOWN_SECS;
        env.storage().persistent().set(&key, &next);
        env.storage()
            .persistent()
            .extend_ttl(&key, PERSIST_THRESHOLD, PERSIST_BUMP);
        bump_instance(&env);
        mint_to(&env, &caller, FAUCET_AMOUNT);
    }

    /// Unix seconds when `who` may next call faucet(). 0 if never used.
    pub fn faucet_available_at(env: Env, who: Address) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::FaucetAt(who))
            .unwrap_or(0)
    }
}

#[contractimpl]
impl TokenInterface for UsdcContract {
    fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        bump_instance(&env);
        read_allowance(&env, &from, &spender).amount
    }

    fn approve(env: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        from.require_auth();
        check_nonneg(amount);
        bump_instance(&env);
        write_allowance(&env, &from, &spender, amount, expiration_ledger);
        env.events().publish(
            (symbol_short!("approve"), from, spender),
            (amount, expiration_ledger),
        );
    }

    fn balance(env: Env, id: Address) -> i128 {
        bump_instance(&env);
        read_balance(&env, &id)
    }

    fn transfer(env: Env, from: Address, to: MuxedAddress, amount: i128) {
        from.require_auth();
        check_nonneg(amount);
        bump_instance(&env);
        let to_addr = to.address();
        let from_balance = read_balance(&env, &from);
        if from_balance < amount {
            panic!("insufficient balance");
        }
        write_balance(&env, &from, from_balance - amount);
        let to_balance = read_balance(&env, &to_addr);
        write_balance(&env, &to_addr, to_balance + amount);
        env.events()
            .publish((symbol_short!("transfer"), from, to_addr), amount);
    }

    fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        check_nonneg(amount);
        bump_instance(&env);
        spend_allowance(&env, &from, &spender, amount);
        let from_balance = read_balance(&env, &from);
        if from_balance < amount {
            panic!("insufficient balance");
        }
        write_balance(&env, &from, from_balance - amount);
        let to_balance = read_balance(&env, &to);
        write_balance(&env, &to, to_balance + amount);
        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
    }

    fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        check_nonneg(amount);
        bump_instance(&env);
        let balance = read_balance(&env, &from);
        if balance < amount {
            panic!("insufficient balance");
        }
        write_balance(&env, &from, balance - amount);
        env.events()
            .publish((symbol_short!("burn"), from), amount);
    }

    fn burn_from(env: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();
        check_nonneg(amount);
        bump_instance(&env);
        spend_allowance(&env, &from, &spender, amount);
        let balance = read_balance(&env, &from);
        if balance < amount {
            panic!("insufficient balance");
        }
        write_balance(&env, &from, balance - amount);
        env.events()
            .publish((symbol_short!("burn"), from), amount);
    }

    fn decimals(_env: Env) -> u32 {
        DECIMALS
    }

    fn name(env: Env) -> String {
        String::from_str(&env, "Komunify Test USDC")
    }

    fn symbol(env: Env) -> String {
        String::from_str(&env, "USDC")
    }
}

mod test;
