#![no_std]

//! `komunify` — subscriptions, content registry, read accounting, payouts.
//!
//! Attribution model: per-member (D-009), not shared-pool. Each subscription's
//! post-fee revenue is a budget owned by that member for that epoch, split only
//! across the content that member read. See docs/CONTRACT_SPEC.md §2-3.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short,
    token::TokenClient, Address, BytesN, Env, IntoVal, MuxedAddress, Symbol, TryFromVal, Val, Vec,
};

const MAX_BPS: u32 = 10_000;

// TTL bump constants (~17280 ledgers/day at 5s/ledger).
const DAY_IN_LEDGERS: u32 = 17_280;
const INSTANCE_BUMP: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_THRESHOLD: u32 = INSTANCE_BUMP - DAY_IN_LEDGERS;
const PERSIST_BUMP: u32 = 30 * DAY_IN_LEDGERS;
const PERSIST_THRESHOLD: u32 = PERSIST_BUMP - DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub admin: Address,
    pub token: Address,
    pub platform: Address,
    pub platform_bps: u32,
    pub price: i128,
    pub epoch_secs: u64,
    pub genesis: u64,
}
// NOTE: no period_secs. The epoch IS the billing period (D-009). Subscribing in
// epoch e grants access for epoch e only.

#[contracttype]
#[derive(Clone)]
pub struct Content {
    pub id: u64,
    pub creator: Address,
    pub managers: Vec<Address>,
    pub sha256: BytesN<32>,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct Stats {
    pub total_subs: u64,
    pub total_volume: i128,
    pub total_claimed: i128,
    pub content_count: u64,
    pub manager_count: u32,
}

#[contracttype]
pub enum DataKey {
    Config,
    Stats,
    NextContentId,
    Manager(Address),
    Content(u64),
    Sub(Address),
    Budget(u32, Address),
    MemberReads(u32, Address),
    MemberContents(u32, Address),
    Read(u32, u64, Address),
    ContentReads(u32, u64),
    Settled(u32, Address),
    Accrued(Address),
    Dust,
}

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAdmin = 3,
    NotManager = 4,
    NotContentCreator = 5,
    SubExpired = 6,
    ContentNotFound = 7,
    ContentInactive = 8,
    EpochNotClosed = 9,
    AlreadySettled = 10,
    NothingToClaim = 11,
    InvalidBps = 12,
    InvalidAmount = 13,
    FaucetCooldown = 14, // usdc crate
    AlreadySubscribed = 15,
}

// ----- storage helpers (bump TTL on every persistent read/write) -----

fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_THRESHOLD, INSTANCE_BUMP);
}

fn pget<V: TryFromVal<Env, Val>>(env: &Env, key: &DataKey) -> Option<V> {
    let s = env.storage().persistent();
    let v = s.get(key);
    if v.is_some() {
        s.extend_ttl(key, PERSIST_THRESHOLD, PERSIST_BUMP);
    }
    v
}

fn pset<V: IntoVal<Env, Val>>(env: &Env, key: &DataKey, val: &V) {
    let s = env.storage().persistent();
    s.set(key, val);
    s.extend_ttl(key, PERSIST_THRESHOLD, PERSIST_BUMP);
}

fn load_config(env: &Env) -> Config {
    match env.storage().instance().get(&DataKey::Config) {
        Some(c) => c,
        None => panic_with_error!(env, Error::NotInitialized),
    }
}

fn load_stats(env: &Env) -> Stats {
    env.storage()
        .instance()
        .get(&DataKey::Stats)
        .unwrap_or(Stats {
            total_subs: 0,
            total_volume: 0,
            total_claimed: 0,
            content_count: 0,
            manager_count: 0,
        })
}

fn save_stats(env: &Env, stats: &Stats) {
    env.storage().instance().set(&DataKey::Stats, stats);
}

fn read_accrued(env: &Env, who: &Address) -> i128 {
    pget(env, &DataKey::Accrued(who.clone())).unwrap_or(0)
}

fn add_accrued(env: &Env, who: &Address, amount: i128) {
    if amount == 0 {
        return;
    }
    let cur = read_accrued(env, who);
    pset(env, &DataKey::Accrued(who.clone()), &(cur + amount));
}

fn read_dust(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::Dust).unwrap_or(0)
}

fn add_dust(env: &Env, amount: i128) {
    if amount == 0 {
        return;
    }
    let cur = read_dust(env);
    env.storage().instance().set(&DataKey::Dust, &(cur + amount));
}

fn compute_epoch(cfg: &Config, now: u64) -> u32 {
    if now <= cfg.genesis {
        return 0;
    }
    ((now - cfg.genesis) / cfg.epoch_secs) as u32
}

fn topic_kmf() -> Symbol {
    symbol_short!("kmf")
}

#[contract]
pub struct KomunifyContract;

#[contractimpl]
impl KomunifyContract {
    // ----- mutating -----

    /// One-time. Sets Config, zeroes Stats, NextContentId = 1, genesis = now.
    pub fn init(env: Env, cfg: Config) {
        if env.storage().instance().has(&DataKey::Config) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        if cfg.platform_bps > MAX_BPS {
            panic_with_error!(&env, Error::InvalidBps);
        }
        if cfg.price < 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }
        let mut cfg = cfg;
        cfg.genesis = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Config, &cfg);
        save_stats(
            &env,
            &Stats {
                total_subs: 0,
                total_volume: 0,
                total_claimed: 0,
                content_count: 0,
                manager_count: 0,
            },
        );
        env.storage()
            .instance()
            .set(&DataKey::NextContentId, &1u64);
        env.storage().instance().set(&DataKey::Dust, &0i128);
        bump_instance(&env);
    }

    /// Admin-gated whitelist. require_auth(admin). Adjusts Stats.manager_count.
    pub fn set_manager(env: Env, who: Address, enabled: bool) {
        let cfg = load_config(&env);
        cfg.admin.require_auth();
        bump_instance(&env);
        let current: bool = pget(&env, &DataKey::Manager(who.clone())).unwrap_or(false);
        if current != enabled {
            let mut stats = load_stats(&env);
            if enabled {
                stats.manager_count += 1;
            } else {
                stats.manager_count -= 1;
            }
            save_stats(&env, &stats);
        }
        pset(&env, &DataKey::Manager(who), &enabled);
    }

    /// Manager-gated. require_auth(caller). caller must be a whitelisted manager.
    /// Creates Content { id: next, creator: caller, managers: vec![caller], sha256, active: true }.
    /// Returns the new content id.
    pub fn register_content(env: Env, caller: Address, sha256: BytesN<32>) -> u64 {
        caller.require_auth();
        bump_instance(&env);
        if !Self::is_manager(env.clone(), caller.clone()) {
            panic_with_error!(&env, Error::NotManager);
        }
        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextContentId)
            .unwrap_or(1);
        env.storage()
            .instance()
            .set(&DataKey::NextContentId, &(id + 1));

        let mut managers = Vec::new(&env);
        managers.push_back(caller.clone());
        let content = Content {
            id,
            creator: caller.clone(),
            managers,
            sha256: sha256.clone(),
            active: true,
        };
        pset(&env, &DataKey::Content(id), &content);

        let mut stats = load_stats(&env);
        stats.content_count += 1;
        save_stats(&env, &stats);

        env.events().publish(
            (topic_kmf(), Symbol::new(&env, "content"), caller),
            (id, sha256),
        );
        id
    }

    /// require_auth(creator). Only the content's creator may add co-managers.
    /// `who` must be a whitelisted manager. No-op if already present.
    pub fn add_content_manager(env: Env, creator: Address, content_id: u64, who: Address) {
        creator.require_auth();
        bump_instance(&env);
        let mut content: Content = match pget(&env, &DataKey::Content(content_id)) {
            Some(c) => c,
            None => panic_with_error!(&env, Error::ContentNotFound),
        };
        if content.creator != creator {
            panic_with_error!(&env, Error::NotContentCreator);
        }
        if !Self::is_manager(env.clone(), who.clone()) {
            panic_with_error!(&env, Error::NotManager);
        }
        if content.managers.contains(&who) {
            return;
        }
        content.managers.push_back(who);
        pset(&env, &DataKey::Content(content_id), &content);
    }

    /// require_auth(creator). Sets Content.active. Inactive content cannot be read.
    /// Already-recorded reads still settle normally.
    pub fn set_content_active(env: Env, creator: Address, content_id: u64, active: bool) {
        creator.require_auth();
        bump_instance(&env);
        let mut content: Content = match pget(&env, &DataKey::Content(content_id)) {
            Some(c) => c,
            None => panic_with_error!(&env, Error::ContentNotFound),
        };
        if content.creator != creator {
            panic_with_error!(&env, Error::NotContentCreator);
        }
        content.active = active;
        pset(&env, &DataKey::Content(content_id), &content);
    }

    /// require_auth(member). Errors AlreadySubscribed if Sub(member) == current_epoch().
    /// NOTE: no shared pool. Each member's budget is theirs alone (D-009).
    /// Emits `subscribed`.
    pub fn subscribe(env: Env, member: Address) {
        member.require_auth();
        let cfg = load_config(&env);
        bump_instance(&env);
        let e = compute_epoch(&cfg, env.ledger().timestamp());

        if let Some(sub_epoch) = pget::<u32>(&env, &DataKey::Sub(member.clone())) {
            if sub_epoch == e {
                panic_with_error!(&env, Error::AlreadySubscribed);
            }
        }

        let fee = cfg.price * (cfg.platform_bps as i128) / (MAX_BPS as i128);
        let rest = cfg.price - fee;

        // Pull the subscription price into the contract.
        let token = TokenClient::new(&env, &cfg.token);
        let to: MuxedAddress = env.current_contract_address().into();
        token.transfer(&member, &to, &cfg.price);

        add_accrued(&env, &cfg.platform, fee);
        pset(&env, &DataKey::Budget(e, member.clone()), &rest);
        pset(&env, &DataKey::Sub(member.clone()), &e);

        let mut stats = load_stats(&env);
        stats.total_subs += 1;
        stats.total_volume += cfg.price;
        save_stats(&env, &stats);

        let expires_at = Self::epoch_ends_at(env.clone(), e);
        env.events().publish(
            (topic_kmf(), Symbol::new(&env, "subscribed"), member),
            (cfg.price, expires_at, e),
        );
    }

    /// require_auth(member). Errors SubExpired unless is_active(member).
    /// IDEMPOTENT per (epoch, content, member) — must not error on retry.
    /// Emits `accessed` only on the first read.
    pub fn record_access(env: Env, member: Address, content_id: u64) {
        member.require_auth();
        bump_instance(&env);
        if !Self::is_active(env.clone(), member.clone()) {
            panic_with_error!(&env, Error::SubExpired);
        }
        let content: Content = match pget(&env, &DataKey::Content(content_id)) {
            Some(c) => c,
            None => panic_with_error!(&env, Error::ContentNotFound),
        };
        if !content.active {
            panic_with_error!(&env, Error::ContentInactive);
        }

        let cfg = load_config(&env);
        let e = compute_epoch(&cfg, env.ledger().timestamp());

        // Idempotent per (epoch, content, member).
        let read_key = DataKey::Read(e, content_id, member.clone());
        if pget::<bool>(&env, &read_key).unwrap_or(false) {
            return;
        }
        pset(&env, &read_key, &true);

        let reads: u32 = pget(&env, &DataKey::MemberReads(e, member.clone())).unwrap_or(0);
        pset(&env, &DataKey::MemberReads(e, member.clone()), &(reads + 1));

        let mut contents: Vec<u64> =
            pget(&env, &DataKey::MemberContents(e, member.clone())).unwrap_or(Vec::new(&env));
        contents.push_back(content_id);
        pset(&env, &DataKey::MemberContents(e, member.clone()), &contents);

        let creads: u32 = pget(&env, &DataKey::ContentReads(e, content_id)).unwrap_or(0);
        pset(&env, &DataKey::ContentReads(e, content_id), &(creads + 1));

        env.events().publish(
            (topic_kmf(), Symbol::new(&env, "accessed"), member),
            (content_id, e),
        );
    }

    /// Permissionless. Distributes ONE member's budget for ONE past epoch.
    /// Errors EpochNotClosed if `epoch >= current_epoch()`. Errors AlreadySettled
    /// if Settled(epoch, m). See docs/CONTRACT_SPEC.md §3 for the settlement math.
    /// Emits `settled`.
    pub fn settle_member(env: Env, epoch: u32, m: Address) {
        let cfg = load_config(&env);
        bump_instance(&env);
        let cur = compute_epoch(&cfg, env.ledger().timestamp());
        if epoch >= cur {
            panic_with_error!(&env, Error::EpochNotClosed);
        }
        if pget::<bool>(&env, &DataKey::Settled(epoch, m.clone())).unwrap_or(false) {
            panic_with_error!(&env, Error::AlreadySettled);
        }

        let budget: i128 = pget(&env, &DataKey::Budget(epoch, m.clone())).unwrap_or(0);
        let reads: u32 = pget(&env, &DataKey::MemberReads(epoch, m.clone())).unwrap_or(0);

        if budget == 0 {
            pset(&env, &DataKey::Settled(epoch, m.clone()), &true);
            env.events().publish(
                (topic_kmf(), Symbol::new(&env, "settled"), m),
                (epoch, budget),
            );
            return;
        }

        if reads == 0 {
            // Idle subscriber (D-009): full budget -> platform.
            add_accrued(&env, &cfg.platform, budget);
            pset(&env, &DataKey::Settled(epoch, m.clone()), &true);
            env.events().publish(
                (topic_kmf(), Symbol::new(&env, "settled"), m),
                (epoch, budget),
            );
            return;
        }

        let reads_i = reads as i128;
        let per_content = budget / reads_i;
        let contents: Vec<u64> =
            pget(&env, &DataKey::MemberContents(epoch, m.clone())).unwrap_or(Vec::new(&env));

        let mut dust: i128 = 0;
        for c in contents.iter() {
            let content: Content = pget(&env, &DataKey::Content(c))
                .unwrap_or_else(|| panic_with_error!(&env, Error::ContentNotFound));
            let n = content.managers.len() as i128;
            let per = per_content / n;
            for mgr in content.managers.iter() {
                add_accrued(&env, &mgr, per);
            }
            dust += per_content - per * n;
        }
        // Division remainder across contents.
        dust += budget - per_content * reads_i;
        add_dust(&env, dust);

        pset(&env, &DataKey::Settled(epoch, m.clone()), &true);
        env.events().publish(
            (topic_kmf(), Symbol::new(&env, "settled"), m),
            (epoch, budget),
        );
    }

    /// require_auth(caller). Errors NothingToClaim if Accrued(caller) == 0.
    /// Transfers Accrued(caller) from contract to caller, zeroes it.
    /// The platform address claims its fees through this same function.
    /// Emits `claimed`.
    pub fn claim(env: Env, caller: Address) {
        caller.require_auth();
        let cfg = load_config(&env);
        bump_instance(&env);
        let amount = read_accrued(&env, &caller);
        if amount == 0 {
            panic_with_error!(&env, Error::NothingToClaim);
        }
        pset(&env, &DataKey::Accrued(caller.clone()), &0i128);

        let token = TokenClient::new(&env, &cfg.token);
        let to: MuxedAddress = caller.clone().into();
        token.transfer(&env.current_contract_address(), &to, &amount);

        let mut stats = load_stats(&env);
        stats.total_claimed += amount;
        save_stats(&env, &stats);

        env.events()
            .publish((topic_kmf(), Symbol::new(&env, "claimed"), caller), amount);
    }

    /// require_auth(admin). Transfers Dust to Config.platform, zeroes Dust.
    pub fn claim_dust(env: Env, admin: Address) {
        let cfg = load_config(&env);
        if admin != cfg.admin {
            panic_with_error!(&env, Error::NotAdmin);
        }
        admin.require_auth();
        bump_instance(&env);
        let dust = read_dust(&env);
        if dust == 0 {
            return;
        }
        env.storage().instance().set(&DataKey::Dust, &0i128);
        let token = TokenClient::new(&env, &cfg.token);
        let to: MuxedAddress = cfg.platform.clone().into();
        token.transfer(&env.current_contract_address(), &to, &dust);
    }

    // ----- read-only -----

    pub fn get_config(env: Env) -> Config {
        load_config(&env)
    }

    pub fn get_stats(env: Env) -> Stats {
        load_stats(&env)
    }

    /// (now - genesis) / epoch_secs
    pub fn current_epoch(env: Env) -> u32 {
        let cfg = load_config(&env);
        compute_epoch(&cfg, env.ledger().timestamp())
    }

    pub fn epoch_ends_at(env: Env, epoch: u32) -> u64 {
        let cfg = load_config(&env);
        cfg.genesis + ((epoch as u64) + 1) * cfg.epoch_secs
    }

    pub fn is_manager(env: Env, who: Address) -> bool {
        pget(&env, &DataKey::Manager(who)).unwrap_or(false)
    }

    /// Sub(member) == current_epoch()
    pub fn is_active(env: Env, member: Address) -> bool {
        let cfg = load_config(&env);
        let e = compute_epoch(&cfg, env.ledger().timestamp());
        match pget::<u32>(&env, &DataKey::Sub(member)) {
            Some(sub_epoch) => sub_epoch == e,
            None => false,
        }
    }

    /// epoch_ends_at(Sub(member)); 0 if inactive
    pub fn get_subscription(env: Env, member: Address) -> u64 {
        if !Self::is_active(env.clone(), member.clone()) {
            return 0;
        }
        let sub_epoch: u32 = pget(&env, &DataKey::Sub(member)).unwrap_or(0);
        Self::epoch_ends_at(env, sub_epoch)
    }

    /// Errors ContentNotFound
    pub fn get_content(env: Env, content_id: u64) -> Content {
        match pget(&env, &DataKey::Content(content_id)) {
            Some(c) => c,
            None => panic_with_error!(&env, Error::ContentNotFound),
        }
    }

    pub fn list_content(env: Env, start: u64, limit: u32) -> Vec<Content> {
        let next: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextContentId)
            .unwrap_or(1);
        let mut out = Vec::new(&env);
        let mut id = if start == 0 { 1 } else { start };
        while id < next && (out.len() as u32) < limit {
            if let Some(c) = pget::<Content>(&env, &DataKey::Content(id)) {
                out.push_back(c);
            }
            id += 1;
        }
        out
    }

    pub fn has_read(env: Env, epoch: u32, content_id: u64, member: Address) -> bool {
        pget(&env, &DataKey::Read(epoch, content_id, member)).unwrap_or(false)
    }

    /// Display only, does not drive money.
    pub fn get_content_reads(env: Env, epoch: u32, content_id: u64) -> u32 {
        pget(&env, &DataKey::ContentReads(epoch, content_id)).unwrap_or(0)
    }

    pub fn get_budget(env: Env, epoch: u32, member: Address) -> i128 {
        pget(&env, &DataKey::Budget(epoch, member)).unwrap_or(0)
    }

    pub fn get_member_reads(env: Env, epoch: u32, member: Address) -> u32 {
        pget(&env, &DataKey::MemberReads(epoch, member)).unwrap_or(0)
    }

    pub fn is_settled(env: Env, epoch: u32, member: Address) -> bool {
        pget(&env, &DataKey::Settled(epoch, member)).unwrap_or(false)
    }

    pub fn get_accrued(env: Env, who: Address) -> i128 {
        read_accrued(&env, &who)
    }

    pub fn get_dust(env: Env) -> i128 {
        read_dust(&env)
    }
}

mod test;
