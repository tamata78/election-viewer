'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { getPartyColor } from '@/constants/parties';
import type { WardSummary, SortConfig } from '@/types/election';
import { formatNumber, formatPercent } from '@/lib/utils';

interface SummaryTableProps {
  data: WardSummary[];
  title?: string;
  selectedParties?: string[];
}

export function SummaryTable({
  data,
  title = '区市町村別サマリー',
  selectedParties = [],
}: SummaryTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'wardName',
    direction: 'asc',
  });

  const sortedData = [...data].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    switch (sortConfig.key) {
      case 'wardName':
        return a.wardName.localeCompare(b.wardName) * direction;
      case 'totalVotes':
        return (a.totalVotes - b.totalVotes) * direction;
      case 'turnoutRate':
        return (a.turnoutRate - b.turnoutRate) * direction;
      case 'seats':
        return (a.seats - b.seats) * direction;
      default:
        return 0;
    }
  });

  const toggleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortButton = ({ sortKey, children }: { sortKey: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => toggleSort(sortKey)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  const getTopParty = (ward: WardSummary) => {
    const filtered =
      selectedParties.length > 0
        ? ward.partyResults.filter((p) => selectedParties.includes(p.partyName))
        : ward.partyResults;
    return filtered.length > 0 ? filtered[0] : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton sortKey="wardName">区市町村</SortButton>
              </TableHead>
              <TableHead>第1党</TableHead>
              <TableHead className="text-right">
                <SortButton sortKey="totalVotes">総得票数</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton sortKey="turnoutRate">投票率</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton sortKey="seats">議席</SortButton>
              </TableHead>
              <TableHead>政党別得票率</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((ward) => {
              const topParty = getTopParty(ward);
              const displayParties =
                selectedParties.length > 0
                  ? ward.partyResults.filter((p) =>
                      selectedParties.includes(p.partyName)
                    )
                  : ward.partyResults.slice(0, 5);

              return (
                <TableRow key={ward.wardName}>
                  <TableCell className="font-medium">{ward.wardName}</TableCell>
                  <TableCell>
                    {topParty && (
                      <Badge
                        style={{
                          backgroundColor: getPartyColor(topParty.partyName),
                          color: '#fff',
                        }}
                      >
                        {topParty.partyName}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(ward.totalVotes)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(ward.turnoutRate)}
                  </TableCell>
                  <TableCell className="text-right">{ward.seats}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {displayParties.map((party) => (
                        <div
                          key={party.partyName}
                          className="relative group"
                          style={{ width: `${Math.max(party.voteShare, 5)}%`, minWidth: '24px' }}
                        >
                          <div
                            className="h-4 rounded"
                            style={{
                              backgroundColor: getPartyColor(party.partyName),
                            }}
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow z-10 whitespace-nowrap">
                            {party.partyName}: {formatPercent(party.voteShare)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
