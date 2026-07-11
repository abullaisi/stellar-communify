#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::StellarAssetClient,
    Address, BytesN, Env,
};

const EPOCH_SECS: u64 = 300;
const BPS: u32 = 1000; // 10%

struct Setup<'a> {
    env: Env,
    client: KomunifyContractClient<'a>,
    token: StellarAssetClient<'a>,
    admin: Address,
    platform: Address,
    price: i128,
}

fn setup(price: i128, bps: u32) -> Setup<'static> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let platform = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(token_admin);
    let token_addr = sac.address();
    let token = StellarAssetClient::new(&env, &token_addr);

    let id = env.register(KomunifyContract, ());
    let client = KomunifyContractClient::new(&env, &id);
    client.init(&Config {
        admin: admin.clone(),
        token: token_addr,
        platform: platform.clone(),
        platform_bps: bps,
        price,
        epoch_secs: EPOCH_SECS,
        genesis: 0,
    });

    Setup {
        env,
        client,
        token,
        admin,
        platform,
        price,
    }
}

fn sha(env: &Env, seed: u8) -> BytesN<32> {
    BytesN::from_array(env, &[seed; 32])
}

/// Fund + subscribe a member in the current epoch.
fn fund_and_subscribe(s: &Setup, member: &Address) {
    s.token.mint(member, &(s.price * 10));
    s.client.subscribe(member);
}

fn advance_to_epoch(s: &Setup, epoch: u32) {
    s.env
        .ledger()
        .with_mut(|l| l.timestamp = (epoch as u64) * EPOCH_SECS);
}

fn budget_for(price: i128, bps: u32) -> i128 {
    price - price * (bps as i128) / 10_000
}

// 1. One member reads two contents (one manager each), even budget -> budget/2 each.
#[test]
fn t01_even_split_two_single_manager_contents() {
    let s = setup(100_0000000, BPS); // budget = 90_0000000, per_content = 45_0000000
    let mgr_a = Address::generate(&s.env);
    let mgr_b = Address::generate(&s.env);
    s.client.set_manager(&mgr_a, &true);
    s.client.set_manager(&mgr_b, &true);
    let c_a = s.client.register_content(&mgr_a, &sha(&s.env, 1));
    let c_b = s.client.register_content(&mgr_b, &sha(&s.env, 2));

    let member = Address::generate(&s.env);
    fund_and_subscribe(&s, &member);
    s.client.record_access(&member, &c_a);
    s.client.record_access(&member, &c_b);

    advance_to_epoch(&s, 1);
    s.client.settle_member(&0, &member);

    let half = budget_for(s.price, BPS) / 2;
    assert_eq!(s.client.get_accrued(&mgr_a), half);
    assert_eq!(s.client.get_accrued(&mgr_b), half);
    assert_eq!(s.client.get_dust(), 0);
}

// 2. Two contents, budget not divisible by 2 -> floor each, remainder in Dust.
#[test]
fn t02_indivisible_budget_remainder_to_dust() {
    let s = setup(100_0000001, BPS); // budget = 900000001 (odd)
    let mgr_a = Address::generate(&s.env);
    let mgr_b = Address::generate(&s.env);
    s.client.set_manager(&mgr_a, &true);
    s.client.set_manager(&mgr_b, &true);
    let c_a = s.client.register_content(&mgr_a, &sha(&s.env, 1));
    let c_b = s.client.register_content(&mgr_b, &sha(&s.env, 2));

    let member = Address::generate(&s.env);
    fund_and_subscribe(&s, &member);
    s.client.record_access(&member, &c_a);
    s.client.record_access(&member, &c_b);

    advance_to_epoch(&s, 1);
    s.client.settle_member(&0, &member);

    let budget = budget_for(s.price, BPS);
    let half = budget / 2;
    assert_eq!(s.client.get_accrued(&mgr_a), half);
    assert_eq!(s.client.get_accrued(&mgr_b), half);
    assert_eq!(s.client.get_dust(), budget - half * 2);
}

// 3. One content with two managers, odd per_content -> per_content/2 each, remainder Dust.
#[test]
fn t03_two_managers_odd_per_content() {
    let s = setup(100_0000001, BPS); // budget odd, reads=1 -> per_content = budget (odd)
    let mgr_a = Address::generate(&s.env);
    let mgr_b = Address::generate(&s.env);
    s.client.set_manager(&mgr_a, &true);
    s.client.set_manager(&mgr_b, &true);
    let c = s.client.register_content(&mgr_a, &sha(&s.env, 1));
    s.client.add_content_manager(&mgr_a, &c, &mgr_b);

    let member = Address::generate(&s.env);
    fund_and_subscribe(&s, &member);
    s.client.record_access(&member, &c);

    advance_to_epoch(&s, 1);
    s.client.settle_member(&0, &member);

    let budget = budget_for(s.price, BPS); // per_content == budget (reads=1)
    let half = budget / 2;
    assert_eq!(s.client.get_accrued(&mgr_a), half);
    assert_eq!(s.client.get_accrued(&mgr_b), half);
    assert_eq!(s.client.get_dust(), budget - half * 2);
}

// 4. settle_member twice -> AlreadySettled.
#[test]
fn t04_double_settle_errors() {
    let s = setup(100_0000000, BPS);
    let member = Address::generate(&s.env);
    fund_and_subscribe(&s, &member);
    advance_to_epoch(&s, 1);
    s.client.settle_member(&0, &member);
    assert_eq!(
        s.client.try_settle_member(&0, &member),
        Err(Ok(Error::AlreadySettled.into()))
    );
}

// 5. settle_member on the current epoch -> EpochNotClosed.
#[test]
fn t05_settle_current_epoch_errors() {
    let s = setup(100_0000000, BPS);
    let member = Address::generate(&s.env);
    fund_and_subscribe(&s, &member);
    // still in epoch 0
    assert_eq!(
        s.client.try_settle_member(&0, &member),
        Err(Ok(Error::EpochNotClosed.into()))
    );
}

// 6. record_access twice -> counters increment once, content id present once.
#[test]
fn t06_record_access_idempotent() {
    let s = setup(100_0000000, BPS);
    let mgr = Address::generate(&s.env);
    s.client.set_manager(&mgr, &true);
    let c = s.client.register_content(&mgr, &sha(&s.env, 1));
    let member = Address::generate(&s.env);
    fund_and_subscribe(&s, &member);

    s.client.record_access(&member, &c);
    s.client.record_access(&member, &c);

    assert_eq!(s.client.get_member_reads(&0, &member), 1);
    assert_eq!(s.client.get_content_reads(&0, &c), 1);
    assert!(s.client.has_read(&0, &c, &member));
}

// 7. record_access with an expired subscription -> SubExpired.
#[test]
fn t07_record_access_expired_sub() {
    let s = setup(100_0000000, BPS);
    let mgr = Address::generate(&s.env);
    s.client.set_manager(&mgr, &true);
    let c = s.client.register_content(&mgr, &sha(&s.env, 1));
    let member = Address::generate(&s.env);
    fund_and_subscribe(&s, &member); // subscribed to epoch 0

    advance_to_epoch(&s, 1); // now epoch 1, sub is expired
    assert_eq!(
        s.client.try_record_access(&member, &c),
        Err(Ok(Error::SubExpired.into()))
    );
}

// 8. subscribe twice same epoch -> AlreadySubscribed; later epoch succeeds.
#[test]
fn t08_double_subscribe_then_later_epoch() {
    let s = setup(100_0000000, BPS);
    let member = Address::generate(&s.env);
    s.token.mint(&member, &(s.price * 10));
    s.client.subscribe(&member);
    assert_eq!(
        s.client.try_subscribe(&member),
        Err(Ok(Error::AlreadySubscribed.into()))
    );

    advance_to_epoch(&s, 1);
    s.client.subscribe(&member); // succeeds, grants epoch 1
    assert!(s.client.is_active(&member));
    assert_eq!(s.client.get_budget(&1, &member), budget_for(s.price, BPS));
}

// 9. Idle member -> full budget to platform, managers get nothing.
#[test]
fn t09_idle_member_budget_to_platform() {
    let s = setup(100_0000000, BPS);
    let member = Address::generate(&s.env);
    fund_and_subscribe(&s, &member); // no reads

    let platform_before = s.client.get_accrued(&s.platform);
    advance_to_epoch(&s, 1);
    s.client.settle_member(&0, &member);

    let budget = budget_for(s.price, BPS);
    assert_eq!(
        s.client.get_accrued(&s.platform) - platform_before,
        budget
    );
    assert_eq!(s.client.get_dust(), 0);
}

// 10. Conservation: sum(Accrued deltas) + Dust delta == sum(Budget). ACCEPTANCE GATE.
#[test]
fn t10_conservation() {
    let s = setup(100_0000000, BPS);
    let mgr_x = Address::generate(&s.env);
    let mgr_y = Address::generate(&s.env);
    s.client.set_manager(&mgr_x, &true);
    s.client.set_manager(&mgr_y, &true);
    let c_a = s.client.register_content(&mgr_x, &sha(&s.env, 1));
    let c_b = s.client.register_content(&mgr_y, &sha(&s.env, 2));

    let m1 = Address::generate(&s.env);
    let m2 = Address::generate(&s.env);
    let m3 = Address::generate(&s.env);
    for m in [&m1, &m2, &m3] {
        fund_and_subscribe(&s, m);
    }
    s.client.record_access(&m1, &c_a);
    s.client.record_access(&m2, &c_a);
    s.client.record_access(&m2, &c_b);
    // m3 idle

    let sum_budget = s.client.get_budget(&0, &m1)
        + s.client.get_budget(&0, &m2)
        + s.client.get_budget(&0, &m3);

    // Snapshot every sink AFTER subscribes, BEFORE settlement.
    let before = s.client.get_accrued(&s.platform)
        + s.client.get_accrued(&mgr_x)
        + s.client.get_accrued(&mgr_y)
        + s.client.get_dust();

    advance_to_epoch(&s, 1);
    for m in [&m1, &m2, &m3] {
        s.client.settle_member(&0, m);
    }

    let after = s.client.get_accrued(&s.platform)
        + s.client.get_accrued(&mgr_x)
        + s.client.get_accrued(&mgr_y)
        + s.client.get_dust();

    assert_eq!(after - before, sum_budget);
}

// 11. Sybil property: attacker gains price*(1-bps); net down exactly the platform fee. GATE.
#[test]
fn t11_sybil_property() {
    let s = setup(100_0000000, BPS);
    let attacker_mgr = Address::generate(&s.env);
    s.client.set_manager(&attacker_mgr, &true);
    let c = s.client.register_content(&attacker_mgr, &sha(&s.env, 1)); // single manager

    let alt = Address::generate(&s.env); // attacker's alt wallet
    fund_and_subscribe(&s, &alt);
    s.client.record_access(&alt, &c);

    advance_to_epoch(&s, 1);
    s.client.settle_member(&0, &alt);

    let budget = budget_for(s.price, BPS);
    let fee = s.price - budget;
    // The attacker's manager address captured exactly the post-fee budget.
    assert_eq!(s.client.get_accrued(&attacker_mgr), budget);
    // Net across the attacker entity (mgr gains budget, alt paid price) = -fee.
    assert_eq!(s.client.get_accrued(&attacker_mgr) - s.price, -fee);
}

// 12. Admin gate on set_manager: a non-admin cannot whitelist.
// NOTE: set_manager has no `caller` param (frozen signature); its gate is
// require_auth(config.admin). A non-admin path is an auth failure (panic), not a
// returned NotAdmin. We assert the gate holds by withholding the admin's auth.
#[test]
#[should_panic]
fn t12_set_manager_non_admin() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let non_admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_addr = env.register_stellar_asset_contract_v2(token_admin).address();
    let id = env.register(KomunifyContract, ());
    let client = KomunifyContractClient::new(&env, &id);
    client.init(&Config {
        admin: admin.clone(),
        token: token_addr,
        platform: Address::generate(&env),
        platform_bps: BPS,
        price: 100_0000000,
        epoch_secs: EPOCH_SECS,
        genesis: 0,
    });
    // Authorize only a non-admin address; the admin never signs.
    env.mock_auths(&[]);
    let who = Address::generate(&env);
    let _ = non_admin;
    client.set_manager(&who, &true); // require_auth(admin) fails -> panic
}

// 13. register_content from a non-manager -> NotManager.
#[test]
fn t13_register_content_non_manager() {
    let s = setup(100_0000000, BPS);
    let not_mgr = Address::generate(&s.env);
    assert_eq!(
        s.client.try_register_content(&not_mgr, &sha(&s.env, 1)),
        Err(Ok(Error::NotManager.into()))
    );
}

// 14. claim with zero accrued -> NothingToClaim.
#[test]
fn t14_claim_nothing() {
    let s = setup(100_0000000, BPS);
    let who = Address::generate(&s.env);
    assert_eq!(s.client.try_claim(&who), Err(Ok(Error::NothingToClaim.into())));
}

// Extra: claim pays out accrued and moves tokens.
#[test]
fn claim_pays_out() {
    let s = setup(100_0000000, BPS);
    let mgr = Address::generate(&s.env);
    s.client.set_manager(&mgr, &true);
    let c = s.client.register_content(&mgr, &sha(&s.env, 1));
    let member = Address::generate(&s.env);
    fund_and_subscribe(&s, &member);
    s.client.record_access(&member, &c);
    advance_to_epoch(&s, 1);
    s.client.settle_member(&0, &member);

    let token = soroban_sdk::token::TokenClient::new(&s.env, &s.token.address);
    let accrued = s.client.get_accrued(&mgr);
    s.client.claim(&mgr);
    assert_eq!(token.balance(&mgr), accrued);
    assert_eq!(s.client.get_accrued(&mgr), 0);
    assert_eq!(s.client.get_stats().total_claimed, accrued);
}
