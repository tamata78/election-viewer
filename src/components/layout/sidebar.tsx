'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  FileSpreadsheet,
  Home,
  MapPin,
  Upload,
  Vote,
  Map,
  Trophy,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PARTIES, YEARS } from '@/constants/parties';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  selectedParties: string[];
  onPartyChange: (parties: string[]) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const navItems = [
  { href: '/', label: 'ダッシュボード', icon: Home },
  { href: '/tokyo', label: '東京都全体', icon: Map },
  { href: '/ranking', label: '政党別ランキング', icon: Trophy },
  { href: '/meguro', label: '目黒区結果', icon: Vote },
  { href: '/ota', label: '大田区詳細分析', icon: Building2 },
  { href: '/import', label: 'データ管理', icon: Upload },
];

export function Sidebar({
  selectedParties,
  onPartyChange,
  selectedYear,
  onYearChange,
}: SidebarProps) {
  const pathname = usePathname();

  const toggleParty = (partyName: string) => {
    if (selectedParties.includes(partyName)) {
      onPartyChange(selectedParties.filter((p) => p !== partyName));
    } else {
      onPartyChange([...selectedParties, partyName]);
    }
  };

  const clearParties = () => {
    onPartyChange([]);
  };

  return (
    <aside className="w-64 border-r bg-sidebar min-h-screen flex flex-col">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">選挙分析</span>
        </Link>
      </div>

      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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

      <div className="p-4 border-t space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            選挙年
          </label>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => onYearChange(Number(v))}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              政党フィルター
            </label>
            {selectedParties.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={clearParties}
              >
                クリア
              </Button>
            )}
          </div>
          <div className="mt-2 space-y-1">
            {PARTIES.slice(0, 9).map((party) => {
              const isSelected = selectedParties.includes(party.name);
              return (
                <button
                  key={party.id}
                  onClick={() => toggleParty(party.name)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors text-left',
                    isSelected
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: party.color }}
                  />
                  <span className="flex-1">{party.shortName}</span>
                  {isSelected && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      選択中
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 border-t text-xs text-muted-foreground">
        <p>2026年衆議院選挙</p>
        <p>データ可視化ツール</p>
      </div>
    </aside>
  );
}
