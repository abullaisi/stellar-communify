#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::TokenClient,
    Address, Env,
};

fn setup(env: &Env) -> (Address, UsdcContractClient<'_>) {
    let admin = Address::generate(env);
    let id = env.register(UsdcContract, ());
    let client = UsdcContractClient::new(env, &id);
    client.init(&admin);
    (admin, client)
}

#[test]
fn metadata() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    let token = TokenClient::new(&env, &client.address);
    assert_eq!(token.decimals(), 7);
    assert_eq!(token.symbol(), String::from_str(&env, "USDC"));
    assert_eq!(token.name(), String::from_str(&env, "Komunify Test USDC"));
}

#[test]
fn mint_and_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let (_admin, client) = setup(&env);
    let user = Address::generate(&env);
    client.mint(&user, &1_000_0000000);
    let token = TokenClient::new(&env, &client.address);
    assert_eq!(token.balance(&user), 1_000_0000000);
}

#[test]
fn faucet_pays_and_sets_cooldown() {
    let env = Env::default();
    env.mock_all_auths();
    let (_admin, client) = setup(&env);
    let user = Address::generate(&env);
    assert_eq!(client.faucet_available_at(&user), 0);
    client.faucet(&user);
    let token = TokenClient::new(&env, &client.address);
    assert_eq!(token.balance(&user), FAUCET_AMOUNT);
    assert_eq!(
        client.faucet_available_at(&user),
        env.ledger().timestamp() + FAUCET_COOLDOWN_SECS
    );
}

#[test]
#[should_panic]
fn faucet_cooldown_blocks_second_call() {
    let env = Env::default();
    env.mock_all_auths();
    let (_admin, client) = setup(&env);
    let user = Address::generate(&env);
    client.faucet(&user);
    client.faucet(&user); // within cooldown -> panic
}

#[test]
fn faucet_available_after_cooldown() {
    let env = Env::default();
    env.mock_all_auths();
    let (_admin, client) = setup(&env);
    let user = Address::generate(&env);
    client.faucet(&user);
    env.ledger().with_mut(|l| l.timestamp += FAUCET_COOLDOWN_SECS);
    client.faucet(&user);
    let token = TokenClient::new(&env, &client.address);
    assert_eq!(token.balance(&user), FAUCET_AMOUNT * 2);
}

#[test]
fn transfer_moves_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let (_admin, client) = setup(&env);
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    client.mint(&a, &100_0000000);
    let token = TokenClient::new(&env, &client.address);
    token.transfer(&a, &b, &40_0000000);
    assert_eq!(token.balance(&a), 60_0000000);
    assert_eq!(token.balance(&b), 40_0000000);
}

#[test]
fn approve_and_transfer_from() {
    let env = Env::default();
    env.mock_all_auths();
    let (_admin, client) = setup(&env);
    let a = Address::generate(&env);
    let spender = Address::generate(&env);
    let c = Address::generate(&env);
    client.mint(&a, &100_0000000);
    let token = TokenClient::new(&env, &client.address);
    token.approve(&a, &spender, &50_0000000, &10_000);
    assert_eq!(token.allowance(&a, &spender), 50_0000000);
    token.transfer_from(&spender, &a, &c, &30_0000000);
    assert_eq!(token.balance(&c), 30_0000000);
    assert_eq!(token.allowance(&a, &spender), 20_0000000);
}
