'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/providers/wallet-provider';
import { useConfirmContent, useUploadContent } from '@/services/content';
import { useRegisterContent } from '@/services/manager';

type Step = 'upload' | 'register' | 'confirm' | 'done';

/**
 * Upload -> register_content -> confirm, shown as a 3-step stepper (DESIGN.md §4.2 STEPPER).
 * Step 1 uploads the PDF blob (`POST /content/upload`) and hashes it; step 2 signs
 * `register_content` on-chain; step 3 confirms the draft against the chain (`POST /content/:id/confirm`).
 */
export function UploadStepper() {
  const { address } = useWallet();
  const [step, setStep] = useState<Step>('upload');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [sha256Hex, setSha256Hex] = useState<string | null>(null);
  const [contentId, setContentId] = useState<string | null>(null);

  const upload = useUploadContent();
  const register = useRegisterContent();
  const confirm = useConfirmContent();

  async function handleUpload() {
    setError(null);
    if (!file) {
      setError('Choose a PDF file first');
      return;
    }
    try {
      const res = await upload.mutateAsync({ file, title, description });
      setDraftId(res.draftId);
      setSha256Hex(res.sha256);
      setStep('register');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed (is the API running?)');
    }
  }

  async function handleRegister() {
    setError(null);
    if (!address || !sha256Hex) return;
    try {
      const bytes = new Uint8Array(sha256Hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []);
      const id = await register.mutateAsync(bytes);
      setContentId(id.toString());
      setStep('confirm');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'register_content failed');
    }
  }

  async function handleConfirm() {
    setError(null);
    if (!draftId || !contentId) return;
    try {
      await confirm.mutateAsync({ draftId, contentId, txHash: '' });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Confirm failed');
    }
  }

  /** Reset the form so the manager can publish another piece without reloading. */
  function handlePublishAnother() {
    setError(null);
    setTitle('');
    setDescription('');
    setFile(null);
    setDraftId(null);
    setSha256Hex(null);
    setContentId(null);
    setStep('upload');
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: '1 Upload' },
    { key: 'register', label: '2 Sign' },
    { key: 'confirm', label: '3 Publish' },
  ];

  return (
    <section className="card">
      <h2>Publish content</h2>
      <div className="row tight" style={{ marginBottom: 12 }}>
        {steps.map((s) => (
          <span
            key={s.key}
            className={
              step === s.key || (step === 'done' && s.key === 'confirm')
                ? 'pill accent'
                : 'pill'
            }
          >
            {s.label}
          </span>
        ))}
      </div>

      {step === 'upload' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpload();
          }}
        >
          <Label htmlFor="upload-title">
            Title
            <Input id="upload-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Label>
          <Label htmlFor="upload-description">
            Description
            <Textarea
              id="upload-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </Label>
          <Label htmlFor="upload-file">
            PDF file
            <input
              id="upload-file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </Label>
          <Button type="submit" disabled={upload.isPending}>
            <Icon name="upload" size={15} />
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
      ) : null}

      {step === 'register' ? (
        <div>
          <p className="hint">
            Your file is ready and fingerprinted (<code>{sha256Hex?.slice(0, 16)}…</code>). Sign to
            record it on-chain. This proves you’re the author and locks the file so it can’t be
            swapped later.
          </p>
          <Button type="button" onClick={handleRegister} disabled={register.isPending}>
            <Icon name="pen" size={15} />
            {register.isPending ? 'Check your wallet…' : 'Sign & register'}
          </Button>
        </div>
      ) : null}

      {step === 'confirm' ? (
        <div>
          <p className="hint">Almost live. One more click to publish it to your library.</p>
          <Button type="button" onClick={handleConfirm} disabled={confirm.isPending}>
            <Icon name="check" size={15} />
            {confirm.isPending ? 'Publishing…' : 'Publish'}
          </Button>
        </div>
      ) : null}

      {step === 'done' ? (
        <div>
          <p className="success" style={{ marginTop: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Icon name="check" size={14} /> Published on-chain. It’s live in your library.
          </p>
          <div className="row tight">
            <Button type="button" onClick={handlePublishAnother}>
              <Icon name="upload" size={15} /> Publish another
            </Button>
            {address ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/community/${address}`} target="_blank" rel="noreferrer">
                  View public page →
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
