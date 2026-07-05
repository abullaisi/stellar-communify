#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup() -> (Env, NotesContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(NotesContract, ());
    let client = NotesContractClient::new(&env, &contract_id);
    let owner = Address::generate(&env);
    (env, client, owner)
}

#[test]
fn add_and_get_note() {
    let (env, client, owner) = setup();
    let id = client.add_note(
        &owner,
        &String::from_str(&env, "First"),
        &String::from_str(&env, "hello world"),
    );
    assert_eq!(id, 1);

    let note = client.get_note(&owner, &1);
    assert_eq!(note.id, 1);
    assert_eq!(note.title, String::from_str(&env, "First"));
    assert_eq!(note.content, String::from_str(&env, "hello world"));
    assert_eq!(note.created_at, note.updated_at);
}

#[test]
fn ids_auto_increment_per_owner() {
    let (env, client, owner) = setup();
    let a = client.add_note(&owner, &String::from_str(&env, "A"), &String::from_str(&env, "1"));
    let b = client.add_note(&owner, &String::from_str(&env, "B"), &String::from_str(&env, "2"));
    let c = client.add_note(&owner, &String::from_str(&env, "C"), &String::from_str(&env, "3"));
    assert_eq!((a, b, c), (1, 2, 3));
    assert_eq!(client.list_notes(&owner).len(), 3);
}

#[test]
fn notes_are_scoped_per_owner() {
    let (env, client, owner) = setup();
    let other = Address::generate(&env);
    client.add_note(&owner, &String::from_str(&env, "mine"), &String::from_str(&env, "x"));

    assert_eq!(client.list_notes(&owner).len(), 1);
    assert_eq!(client.list_notes(&other).len(), 0);
}

#[test]
fn update_note_changes_content() {
    let (env, client, owner) = setup();
    let id = client.add_note(&owner, &String::from_str(&env, "t"), &String::from_str(&env, "old"));
    client.update_note(
        &owner,
        &id,
        &String::from_str(&env, "t2"),
        &String::from_str(&env, "new"),
    );

    let note = client.get_note(&owner, &id);
    assert_eq!(note.title, String::from_str(&env, "t2"));
    assert_eq!(note.content, String::from_str(&env, "new"));
}

#[test]
fn delete_note_removes_it() {
    let (env, client, owner) = setup();
    let a = client.add_note(&owner, &String::from_str(&env, "A"), &String::from_str(&env, "1"));
    let b = client.add_note(&owner, &String::from_str(&env, "B"), &String::from_str(&env, "2"));

    client.delete_note(&owner, &a);

    let remaining = client.list_notes(&owner);
    assert_eq!(remaining.len(), 1);
    assert_eq!(remaining.get(0).unwrap().id, b);
}

#[test]
fn update_missing_note_errors() {
    let (env, client, owner) = setup();
    let res = client.try_update_note(
        &owner,
        &99,
        &String::from_str(&env, "x"),
        &String::from_str(&env, "y"),
    );
    assert_eq!(res, Err(Ok(Error::NoteNotFound)));
}

#[test]
fn delete_missing_note_errors() {
    let (_env, client, owner) = setup();
    let res = client.try_delete_note(&owner, &99);
    assert_eq!(res, Err(Ok(Error::NoteNotFound)));
}
