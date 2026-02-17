'use client';

import { type ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { AppProvider, useAppState } from '@/components/providers';

function AppShellInner({ children }: { children: ReactNode }) {
  const { sidebarOpen, closeSidebar } = useAppState();

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <main className="flex-1 min-w-0 bg-background">
        {children}
      </main>
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
