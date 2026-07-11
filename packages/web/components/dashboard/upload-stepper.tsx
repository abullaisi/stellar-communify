'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/providers/wallet-provider';
import { useConfirmContent, useUploadContent } from '@/services/content';
import { useRegisterContent } from '@/services/manager';

type Step = 'upload' | 'register' | 'confirm' | 'done';

/**
 * Upload -> register_content -> confirm, shown as a 3-step stepper (DESIGN.md §4.2 STEPPER).
 * Step 1 (blob upload) needs Lane B's `POST /content/upload` — not live yet, so this step will
 * error until that route ships. Step 2 (`register_content`) is a real on-chain call.
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

  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: '1 Upload' },
    { key: 'register', label: '2 Register' },
    { key: 'confirm', label: '3 Confirm' },
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
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
      ) : null}

      {step === 'register' ? (
        <div>
          <p className="hint">Draft hashed as <code>{sha256Hex?.slice(0, 16)}…</code>. Sign register_content.</p>
          <Button type="button" onClick={handleRegister} disabled={register.isPending}>
            {register.isPending ? 'Registering…' : 'Sign register_content'}
          </Button>
        </div>
      ) : null}

      {step === 'confirm' ? (
        <div>
          <p className="hint">Registered as content #{contentId}. Confirm with the API.</p>
          <Button type="button" onClick={handleConfirm} disabled={confirm.isPending}>
            {confirm.isPending ? 'Confirming…' : 'Confirm'}
          </Button>
        </div>
      ) : null}

      {step === 'done' ? <p className="success">Content #{contentId} published.</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
