'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getPartyColor } from '@/constants/parties';
import { formatNumber, formatPercent } from '@/lib/utils';
import { ChevronRight, ChevronLeft, ArrowUpDown } from 'lucide-react';
import type { HireiBlock, HireiPartyBlock, HireiCandidate } from '@/types/national-election';

interface NationalHireiViewProps {
  blocks: HireiBlock[];
  totalSeats: number;
}

type SortKey = 'rank' | 'name' | 'sekihairitsu' | 'votes' | 'result';

export function NationalHireiView({ blocks, totalSeats }: NationalHireiViewProps) {
  const isSingleBlock = blocks.length === 1;
  const [selectedBlock, setSelectedBlock] = useState<string | null>(
    isSingleBlock ? blocks[0].name : null
  );
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortAsc, setSortAsc] = useState(true);

  // blocks が変わったらリセット (選挙種別切り替え対応)
  useEffect(() => {
    if (isSingleBlock) {
      setSelectedBlock(blocks[0].name);
    } else {
      setSelectedBlock(null);
    }
    setSelectedParty(null);
  }, [blocks, isSingleBlock]);

  const currentBlock = useMemo(
    () => blocks.find((b) => b.name === selectedBlock) || null,
    [blocks, selectedBlock]
  );

  const currentPartyBlock = useMemo(
    () => currentBlock?.parties.find((p) => p.party === selectedParty) || null,
    [currentBlock, selectedParty]
  );

  const sortedCandidates = useMemo(() => {
    if (!currentPartyBlock) return [];
    const sorted = [...currentPartyBlock.candidates].sort((a, b) => {
      switch (sortKey) {
        case 'rank':
          return a.rank - b.rank;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'sekihairitsu':
          return (a.sekihairitsu || 0) - (b.sekihairitsu || 0);
        case 'votes':
          return (a.votes || 0) - (b.votes || 0);
        case 'result': {
          const order = { '当': 0, '比当': 1, '落': 2 };
          return order[a.result] - order[b.result];
        }
        default:
          return 0;
      }
    });
    return sortAsc ? sorted : sorted.reverse();
  }, [currentPartyBlock, sortKey, sortAsc]);

  // ブロック別サマリーチャート
  const blockSummaryData = useMemo(() => {
    return blocks.map((block) => {
      const entry: Record<string, string | number> = { name: block.name, totalSeats: block.totalSeats };
      block.parties.forEach((p) => {
        entry[p.party] = p.seats;
      });
      return entry;
    });
  }, [blocks]);

  const allParties = useMemo(() => {
    const parties = new Set<string>();
    blocks.forEach((b) => b.parties.forEach((p) => parties.add(p.party)));
    return Array.from(parties);
  }, [blocks]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'rank');
    }
  };

  const getResultBadgeVariant = (result: HireiCandidate['result']) => {
    switch (result) {
      case '当': return 'default' as const;
      case '比当': return 'secondary' as const;
      case '落': return 'outline' as const;
    }
  };

  // ブロック一覧表示
  if (!selectedBlock) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">比例代表 ブロック別獲得議席</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={blockSummaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                {allParties.slice(0, 8).map((party) => (
                  <Bar
                    key={party}
                    dataKey={party}
                    stackId="a"
                    fill={getPartyColor(party)}
                    name={party}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((block) => (
            <Card
              key={block.name}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedBlock(block.name)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{block.name}ブロック</CardTitle>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold">{block.totalSeats}</span>
                  <span className="text-sm text-muted-foreground">議席</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  総投票数: {formatNumber(block.totalVotes)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {block.parties
                    .filter((p) => p.seats > 0)
                    .sort((a, b) => b.seats - a.seats)
                    .map((p) => (
                      <Badge
                        key={p.party}
                        style={{ backgroundColor: getPartyColor(p.party), color: '#fff' }}
                        className="text-xs"
                      >
                        {p.party.length > 4 ? p.party.slice(0, 4) + '…' : p.party} {p.seats}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ブロック選択 → 政党別結果表示
  if (!selectedParty && currentBlock) {
    return (
      <div className="space-y-6">
        {!isSingleBlock && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedBlock(null)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              ブロック一覧
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{currentBlock.name}ブロック</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">定数</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{currentBlock.totalSeats}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">総投票数</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{formatNumber(currentBlock.totalVotes)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">政党数</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{currentBlock.parties.length}</span>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">政党別結果</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>政党</TableHead>
                  <TableHead className="text-right">獲得議席</TableHead>
                  <TableHead className="text-right">得票数</TableHead>
                  <TableHead className="text-right">得票率</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentBlock.parties
                  .sort((a, b) => b.seats - a.seats || b.votes - a.votes)
                  .map((p) => (
                    <TableRow
                      key={p.party}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedParty(p.party)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getPartyColor(p.party) }}
                          />
                          <span className="font-medium">{p.party}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{p.seats}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(p.votes)}</TableCell>
                      <TableCell className="text-right font-mono">{formatPercent(p.voteRate)}</TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 候補者リスト表示
  if (currentPartyBlock && currentBlock) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          {isSingleBlock ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setSelectedParty(null)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                政党一覧
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{currentPartyBlock.party}</span>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBlock(null)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                ブロック一覧
              </Button>
              <span className="text-muted-foreground">/</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedParty(null)}>
                {currentBlock.name}ブロック
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{currentPartyBlock.party}</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">獲得議席</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{currentPartyBlock.seats}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">得票数</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{formatNumber(currentPartyBlock.votes)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">得票率</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{formatPercent(currentPartyBlock.voteRate)}</span>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">候補者一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('rank')}
                  >
                    <div className="flex items-center gap-1">
                      順位
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      候補者名
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>年齢</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('result')}
                  >
                    <div className="flex items-center gap-1">
                      結果
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort('votes')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      小選挙区得票
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort('sekihairitsu')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      惜敗率
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCandidates.map((c, i) => (
                  <TableRow key={`${c.name}-${i}`}>
                    <TableCell className="font-mono">{c.rank}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.age}</TableCell>
                    <TableCell>
                      <Badge variant={getResultBadgeVariant(c.result)}>
                        {c.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {c.votes ? formatNumber(c.votes) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {c.sekihairitsu ? `${c.sekihairitsu.toFixed(2)}%` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
