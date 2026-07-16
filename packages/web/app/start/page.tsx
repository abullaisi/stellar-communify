import { AppShell } from '@/components/app-shell/app-shell';
import { StartWizard } from '@/components/onboarding/start-wizard';

export default function StartPage() {
  return (
    <AppShell><main className="shell"><StartWizard /></main></AppShell>
  );
}
