'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface AppState {
  selectedParties: string[];
  selectedYear: number;
  setSelectedParties: (parties: string[]) => void;
  setSelectedYear: (year: number) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(2026);

  return (
    <AppContext.Provider
      value={{
        selectedParties,
        selectedYear,
        setSelectedParties,
        setSelectedYear,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}
