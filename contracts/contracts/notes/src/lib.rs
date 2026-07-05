#![no_std]

//! Komunify notes — a minimal per-owner note manager on Soroban.
//!
//! Each note belongs to an owner address. Only the owner can add, update, or delete
//! their own notes (enforced with `require_auth`). Note ids auto-increment per owner.
//! Reads (`get_note`, `list_notes`) are open and need no authorization.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, vec, Address, Env, String, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NoteNotFound = 1,
}

/// A single note owned by an address.
#[contracttype]
#[derive(Clone)]
pub struct Note {
    pub id: u32,
    pub title: String,
    pub content: String,
    /// Ledger timestamp (unix seconds) when the note was created.
    pub created_at: u64,
    /// Ledger timestamp (unix seconds) of the last update.
    pub updated_at: u64,
}

#[contracttype]
pub enum DataKey {
    /// Last-used note id for an owner (0 = none yet).
    Counter(Address),
    /// A note record keyed by (owner, note id).
    Note(Address, u32),
    /// Ordered list of an owner's note ids, for `list_notes`.
    Ids(Address),
}

#[contract]
pub struct NotesContract;

#[contractimpl]
impl NotesContract {
    /// Add a new note for `owner`. Returns the new note id.
    pub fn add_note(env: Env, owner: Address, title: String, content: String) -> u32 {
        owner.require_auth();

        let id = Self::next_id(&env, &owner);
        let now = env.ledger().timestamp();
        let note = Note {
            id,
            title,
            content,
            created_at: now,
            updated_at: now,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Note(owner.clone(), id), &note);

        let mut ids = Self::ids(&env, &owner);
        ids.push_back(id);
        env.storage().persistent().set(&DataKey::Ids(owner.clone()), &ids);
        env.storage().persistent().set(&DataKey::Counter(owner), &id);

        id
    }

    /// Update an existing note's title and content. Owner only.
    pub fn update_note(
        env: Env,
        owner: Address,
        id: u32,
        title: String,
        content: String,
    ) -> Result<(), Error> {
        owner.require_auth();

        let mut note: Note = env
            .storage()
            .persistent()
            .get(&DataKey::Note(owner.clone(), id))
            .ok_or(Error::NoteNotFound)?;

        note.title = title;
        note.content = content;
        note.updated_at = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Note(owner, id), &note);
        Ok(())
    }

    /// Delete a note. Owner only.
    pub fn delete_note(env: Env, owner: Address, id: u32) -> Result<(), Error> {
        owner.require_auth();

        let key = DataKey::Note(owner.clone(), id);
        if !env.storage().persistent().has(&key) {
            return Err(Error::NoteNotFound);
        }
        env.storage().persistent().remove(&key);

        // Drop the id from the owner's index.
        let ids = Self::ids(&env, &owner);
        let mut next = vec![&env];
        for existing in ids.iter() {
            if existing != id {
                next.push_back(existing);
            }
        }
        env.storage().persistent().set(&DataKey::Ids(owner), &next);
        Ok(())
    }

    /// Fetch a single note.
    pub fn get_note(env: Env, owner: Address, id: u32) -> Result<Note, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Note(owner, id))
            .ok_or(Error::NoteNotFound)
    }

    /// List all of an owner's notes, in creation order.
    pub fn list_notes(env: Env, owner: Address) -> Vec<Note> {
        let ids = Self::ids(&env, &owner);
        let mut notes = vec![&env];
        for id in ids.iter() {
            if let Some(note) = env
                .storage()
                .persistent()
                .get::<_, Note>(&DataKey::Note(owner.clone(), id))
            {
                notes.push_back(note);
            }
        }
        notes
    }

    // ----- internal helpers -----

    fn next_id(env: &Env, owner: &Address) -> u32 {
        let last = env
            .storage()
            .persistent()
            .get::<_, u32>(&DataKey::Counter(owner.clone()))
            .unwrap_or(0);
        last + 1
    }

    fn ids(env: &Env, owner: &Address) -> Vec<u32> {
        env.storage()
            .persistent()
            .get(&DataKey::Ids(owner.clone()))
            .unwrap_or_else(|| vec![env])
    }
}

mod test;
