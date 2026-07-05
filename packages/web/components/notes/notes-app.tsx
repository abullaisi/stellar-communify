'use client';

import { createContext, useContext, useState } from 'react';
import { ConnectWalletButton } from '@/components/wallet/connect-wallet-button';
import { NetworkGuard } from '@/components/wallet/network-guard';
import { TxDetails } from '@/components/notes/tx-details';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/providers/wallet-provider';
import {
  useCreateNote,
  useDeleteNote,
  useNotes,
  useUpdateNote,
  type Note,
  type TxInfo,
} from '@/services/notes';

function formatDate(unixSeconds: number) {
  if (!unixSeconds) return '';
  return new Date(unixSeconds * 1000).toLocaleString();
}

/** Shares the most recent contract transaction so every action can surface it. */
const TxContext = createContext<(tx: TxInfo) => void>(() => {});
const useReportTx = () => useContext(TxContext);

/** Root notes screen — a single-column card stack per DESIGN.md. */
export function NotesApp() {
  const { isConnected } = useWallet();
  const [lastTx, setLastTx] = useState<TxInfo | null>(null);

  return (
    <>
      <header>
        <div className="logo">Komunify</div>
        <p className="tagline">Your notes, on Stellar.</p>
      </header>

      {isConnected ? (
        <TxContext.Provider value={setLastTx}>
          <section className="card">
            <ConnectWalletButton />
          </section>
          <NetworkGuard />
          {lastTx ? (
            <section className="card">
              <TxDetails tx={lastTx} />
            </section>
          ) : null}
          <NewNoteCard />
          <NotesList />
        </TxContext.Provider>
      ) : (
        <section className="card center">
          <h2>Connect your wallet</h2>
          <p className="hint">Connect Freighter to manage your on-chain notes.</p>
          <ConnectWalletButton />
        </section>
      )}

      <footer>Soroban notes demo · Stellar Testnet</footer>
    </>
  );
}

function NewNoteCard() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createNote = useCreateNote();
  const reportTx = useReportTx();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const res = await createNote.mutateAsync({ title, content });
    if (res.success) {
      if (res.data) reportTx(res.data.tx);
      setTitle('');
      setContent('');
    } else {
      setError(res.error ?? 'Failed to add note');
    }
  }

  return (
    <section className="card">
      <h2>New note</h2>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-title">Title</Label>
          <Input
            id="new-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Grocery list"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-content">Content</Label>
          <Textarea
            id="new-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Milk, eggs, XLM…"
            required
          />
        </div>
        <Button type="submit" disabled={createNote.isPending}>
          {createNote.isPending ? 'Signing…' : 'Add note'}
        </Button>
        {error ? <p className="error">{error}</p> : null}
      </form>
    </section>
  );
}

function NotesList() {
  const { data, isLoading, error } = useNotes();

  if (isLoading) {
    return (
      <section className="card">
        <p className="hint" style={{ margin: 0 }}>
          Loading notes…
        </p>
      </section>
    );
  }

  if (error || (data && !data.success)) {
    return (
      <section className="card">
        <p className="error" style={{ margin: 0 }}>
          {data && !data.success ? data.error : 'Failed to load notes'}
        </p>
      </section>
    );
  }

  const notes = data?.success ? data.data ?? [] : [];

  if (notes.length === 0) {
    return (
      <section className="card center">
        <p className="hint" style={{ margin: 0 }}>
          No notes yet. Add your first one above.
        </p>
      </section>
    );
  }

  return (
    <>
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </>
  );
}

function NoteCard({ note }: { note: Note }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [error, setError] = useState<string | null>(null);

  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const reportTx = useReportTx();
  const busy = updateNote.isPending || deleteNote.isPending;

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const res = await updateNote.mutateAsync({ id: note.id, title, content });
    if (res.success) {
      if (res.data) reportTx(res.data.tx);
      setEditing(false);
    } else {
      setError(res.error ?? 'Failed to update note');
    }
  }

  async function handleDelete() {
    setError(null);
    const res = await deleteNote.mutateAsync(note.id);
    if (res.success) {
      if (res.data) reportTx(res.data.tx);
    } else {
      setError(res.error ?? 'Failed to delete note');
    }
  }

  if (editing) {
    return (
      <section className="card">
        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-title-${note.id}`}>Title</Label>
            <Input
              id={`edit-title-${note.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-content-${note.id}`}>Content</Label>
            <Textarea
              id={`edit-content-${note.id}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div className="row tight">
            <Button type="submit" disabled={busy}>
              {updateNote.isPending ? 'Signing…' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setTitle(note.title);
                setContent(note.content);
              }}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
          {error ? <p className="error">{error}</p> : null}
        </form>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="row">
        <h2 style={{ margin: 0 }}>{note.title}</h2>
        <div className="row tight" style={{ marginTop: 0 }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            disabled={busy}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={busy}
          >
            {deleteNote.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
      <p style={{ margin: '10px 0 12px', whiteSpace: 'pre-wrap' }}>{note.content}</p>
      <span className="label">Updated {formatDate(note.updatedAt)}</span>
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
