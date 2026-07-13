'use client';

import { useWallet } from '@/providers/wallet-provider';
import { useCommunity, useSaveCommunity } from '@/services/community';

import { CommunityOnboarding } from './community-onboarding';
import { ManagerContentList } from './manager-content-list';
import { UploadStepper } from './upload-stepper';

export function ManagerPanel() {
  const { address } = useWallet();
  const community = useCommunity(address);
  const saveCommunity = useSaveCommunity(address);

  const brand = community.data ?? null;

  return (
    <>
      {community.isLoading ? null : (
        <CommunityOnboarding
          wallet={address}
          brand={brand}
          saving={saveCommunity.isPending}
          error={saveCommunity.isError ? (saveCommunity.error as Error).message : null}
          onSave={(data) => saveCommunity.mutate(data)}
        />
      )}
      {/* Publishing is gated behind a community brand — the onboarding's first step. */}
      {brand ? <UploadStepper /> : null}
      <ManagerContentList />
    </>
  );
}
