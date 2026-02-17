'use client';

import { Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/components/providers';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { openSidebar } = useAppState();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={openSidebar}
            className="md:hidden p-1.5 -ml-1.5 rounded-md hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-semibold truncate">{title}</h1>
            {description && (
              <p className="text-xs md:text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="検索..."
              className="w-48 md:w-64 pl-8"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
