'use client';

import { type ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { AppProvider, useAppState } from '@/components/providers';

function AppShellInner({ children }: { children: ReactNode }) {
  const {
    selectedParties,
    setSelectedParties,
    selectedYear,
    setSelectedYear,
  } = useAppState();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        selectedParties={selectedParties}
        onPartyChange={setSelectedParties}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
      <main className="flex-1 bg-background">{children}</main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <AppShellInner>{children}</AppShellInner>
    </AppProvider>
  );
}
