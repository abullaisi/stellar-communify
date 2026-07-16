import { AppShell } from '@/components/app-shell/app-shell';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function DashboardPage() {
  return (
    <AppShell><main className="shell"><DashboardShell /></main></AppShell>
  );
}
