import type { ReactNode } from 'react';

import { AppSidenav } from '@/components/app-shell/app-sidenav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidenav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
