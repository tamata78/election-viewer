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
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { getPartyColor } from '@/constants/parties';
import type { DistrictSummary, SortConfig, SortDirection } from '@/types/election';
import { formatNumber, formatPercent } from '@/lib/utils';

interface DistrictTableProps {
  data: DistrictSummary[];
  title?: string;
}

export function DistrictTable({
  data,
  title = '選挙区別結果',
}: DistrictTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'district',
    direction: 'asc',
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const sortedData = [...data].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    switch (sortConfig.key) {
      case 'district':
        return a.district.localeCompare(b.district) * direction;
      case 'totalVotes':
        return (a.totalVotes - b.totalVotes) * direction;
      case 'turnoutRate':
        return (a.turnoutRate - b.turnoutRate) * direction;
      case 'winner':
        const winnerA = a.results.find((r) => r.isWinner)?.partyName || '';
        const winnerB = b.results.find((r) => r.isWinner)?.partyName || '';
        return winnerA.localeCompare(winnerB) * direction;
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

  const toggleExpand = (district: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(district)) {
      newExpanded.delete(district);
    } else {
      newExpanded.add(district);
    }
    setExpandedRows(newExpanded);
  };

  const SortButton = ({ sortKey, children }: { sortKey: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => toggleSort(sortKey)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead>
                <SortButton sortKey="district">選挙区</SortButton>
              </TableHead>
              <TableHead>
                <SortButton sortKey="winner">当選者</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton sortKey="totalVotes">総得票数</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton sortKey="turnoutRate">投票率</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((district) => {
              const winner = district.results.find((r) => r.isWinner);
              const isExpanded = expandedRows.has(district.district);

              return (
                <>
                  <TableRow
                    key={district.district}
                    className="cursor-pointer"
                    onClick={() => toggleExpand(district.district)}
                  >
                    <TableCell>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{district.district}</div>
                        <div className="text-sm text-muted-foreground">
                          {district.regionName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {winner && (
                        <div className="flex items-center gap-2">
                          <Badge
                            style={{
                              backgroundColor: getPartyColor(winner.partyName),
                              color: '#fff',
                            }}
                          >
                            {winner.partyName}
                          </Badge>
                          <span>{winner.candidateName}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(district.totalVotes)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(district.turnoutRate)}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${district.district}-details`}>
                      <TableCell colSpan={5} className="bg-muted/50">
                        <div className="py-2 px-4">
                          <h4 className="text-sm font-medium mb-2">候補者別得票</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {district.results.map((result) => (
                              <div
                                key={result.candidateName}
                                className={`p-2 rounded border ${
                                  result.isWinner
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor: getPartyColor(
                                        result.partyName
                                      ),
                                    }}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {result.partyName}
                                  </span>
                                  {result.isWinner && (
                                    <Badge variant="secondary" className="ml-auto text-xs h-4">
                                      当選
                                    </Badge>
                                  )}
                                </div>
                                <div className="font-medium text-sm">
                                  {result.candidateName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatNumber(result.votes)}票 (
                                  {formatPercent(result.voteShare)})
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
