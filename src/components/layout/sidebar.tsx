'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileSpreadsheet,
  Vote,
  Map,
  Building2,
  Globe,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/national', label: '全国分析', icon: Globe },
  { href: '/', label: '東京都全体', icon: Map },
  { href: '/meguro', label: '目黒区分析', icon: Vote },
  { href: '/ota', label: '大田区分析', icon: Building2 },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'w-64 border-r bg-sidebar min-h-screen max-h-screen overflow-y-auto flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out',
        // Mobile: fixed drawer
        'fixed z-50 md:relative md:z-auto',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">選挙分析</span>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded-md hover:bg-sidebar-accent/50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t text-xs text-muted-foreground">
        <p>2026年衆議院選挙</p>
        <p>データ可視化ツール</p>
      </div>
    </aside>
  );
}
