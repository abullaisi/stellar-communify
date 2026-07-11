'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { CommunityBrand, SaveCommunityRequest } from '@komunify/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MAX_LOGO_BYTES = 512 * 1024; // keep logos small — they're stored as data URLs

/** Reads an image File into a data: URL, rejecting anything too large. */
function readLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Logo must be an image'));
    if (file.size > MAX_LOGO_BYTES) return reject(new Error('Logo must be under 512 KB'));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the logo file'));
    reader.readAsDataURL(file);
  });
}

/** STEPPER (DESIGN §4.2): done = success pill, active = accent pill, pending = plain pill. */
function StepIndicator({ brandDone, publishDone }: { brandDone: boolean; publishDone: boolean }) {
  const steps = [
    { label: '1 Brand', done: brandDone, active: !brandDone },
    { label: '2 Publish', done: publishDone, active: brandDone && !publishDone },
  ];
  return (
    <div className="row tight" style={{ marginBottom: 12 }}>
      {steps.map((s) => (
        <span key={s.label} className={s.done ? 'pill ok' : s.active ? 'pill accent' : 'pill'}>
          {s.label}
        </span>
      ))}
    </div>
  );
}

function BrandForm({
  initial,
  saving,
  error,
  onSave,
  onCancel,
}: {
  initial: CommunityBrand | null;
  saving: boolean;
  error: string | null;
  onSave: (b: SaveCommunityRequest) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [logo, setLogo] = useState<string | null>(initial?.logo ?? null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogo(file: File | undefined) {
    setLocalError(null);
    if (!file) return;
    try {
      setLogo(await readLogo(file));
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Invalid logo');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setLocalError('Community name is required');
      return;
    }
    onSave({ name: name.trim(), description: description.trim(), logo });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="hint" style={{ marginTop: 0 }}>
        Set up your community brand — how your published content is presented on your public page.
        You can edit it anytime.
      </p>
      <Label htmlFor="brand-name">
        Community name
        <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </Label>
      <Label htmlFor="brand-description">
        Description
        <Textarea
          id="brand-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Label>
      <Label htmlFor="brand-logo">
        Logo (optional, image under 512 KB)
        <input
          id="brand-logo"
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleLogo(e.target.files?.[0])}
        />
      </Label>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt="Logo preview"
          style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 'var(--radius-md)', marginBottom: 8 }}
        />
      ) : null}
      <div className="row tight">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save brand'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        ) : null}
      </div>
      {(localError ?? error) ? <p className="error">{localError ?? error}</p> : null}
    </form>
  );
}

/**
 * Manager onboarding (TASK 2, manager-only): a lightweight guided step indicator mirroring the
 * demo script — set your community brand, then publish your first content. Brand is persisted
 * server-side (D-010) so the public community page renders for any visitor. `ManagerPanel` gates
 * the upload stepper behind a saved brand.
 */
export function CommunityOnboarding({
  wallet,
  brand,
  publishDone,
  saving,
  error,
  onSave,
}: {
  wallet: string | null;
  brand: CommunityBrand | null;
  publishDone: boolean;
  saving: boolean;
  error: string | null;
  onSave: (b: SaveCommunityRequest) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="card">
      <h2>Your community</h2>
      <StepIndicator brandDone={!!brand} publishDone={publishDone} />

      {!brand || editing ? (
        <BrandForm
          initial={brand}
          saving={saving}
          error={error}
          onSave={(b) => {
            onSave(b);
            setEditing(false);
          }}
          onCancel={brand ? () => setEditing(false) : undefined}
        />
      ) : (
        <>
          <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="row tight" style={{ alignItems: 'center' }}>
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
                />
              ) : null}
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>{brand.name}</p>
                {brand.description ? <span className="label">{brand.description}</span> : null}
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit brand
            </Button>
          </div>
          {wallet ? (
            <p className="hint" style={{ marginBottom: 0 }}>
              {publishDone ? 'Your community is live. ' : 'Next: publish your first content below. '}
              <Link href={`/community/${wallet}`} target="_blank" rel="noreferrer">
                View public page →
              </Link>
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
