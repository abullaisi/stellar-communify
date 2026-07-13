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

export function BrandForm({
  initial,
  saving,
  error,
  onSave,
  onCancel,
  submitLabel = 'Save brand',
  savingLabel = 'Saving…',
}: {
  initial: CommunityBrand | null;
  saving: boolean;
  error: string | null;
  onSave: (b: SaveCommunityRequest) => void;
  onCancel?: () => void;
  submitLabel?: string;
  savingLabel?: string;
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
        Set up your community brand: how your published content is presented on your public page.
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
          accept="image/png,image/jpeg,image/webp,image/gif"
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
          {saving ? savingLabel : submitLabel}
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
 * Manager-only brand card on the dashboard. The guided setup now lives on its own page
 * (`/start`, `StartWizard`); here we just show the saved brand with quick edit + view-page
 * actions. A manager who predates the brand step (legacy, no brand saved) is nudged to finish
 * setup on `/start`. Brand is persisted server-side (D-010) for the public community page.
 */
export function CommunityOnboarding({
  wallet,
  brand,
  saving,
  error,
  onSave,
}: {
  wallet: string | null;
  brand: CommunityBrand | null;
  saving: boolean;
  error: string | null;
  onSave: (b: SaveCommunityRequest) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (!brand) {
    return (
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Finish setting up</h2>
        <p className="hint" style={{ marginTop: 0 }}>
          Add your community brand so members can find you and recognize your work.
        </p>
        <Button asChild>
          <Link href="/start">Set up my community</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="card">
      {editing ? (
        <>
          <h2 style={{ marginTop: 0 }}>Edit brand</h2>
          <BrandForm
            initial={brand}
            saving={saving}
            error={error}
            onSave={(b) => {
              onSave(b);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </>
      ) : (
        <div className="row" style={{ alignItems: 'center' }}>
          <div className="row tight" style={{ alignItems: 'center', marginTop: 0 }}>
            {brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo}
                alt={`${brand.name} logo`}
                style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
              />
            ) : null}
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>{brand.name}</p>
              {brand.description ? <span className="label">{brand.description}</span> : null}
            </div>
          </div>
          <div className="row tight" style={{ marginTop: 0 }}>
            {wallet ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/community/${wallet}`} target="_blank" rel="noreferrer">
                  View page
                </Link>
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit brand
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
