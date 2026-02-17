'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { ShouPrefectureSummary } from '@/types/national-election';

interface NationalShouViewProps {
  prefectures: ShouPrefectureSummary[];
  totalSeats: number;
}

type ViewMode = 'prefecture' | 'party';

export function NationalShouView({ prefectures, totalSeats }: NationalShouViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('prefecture');
  const [selectedParty, setSelectedParty] = useState<string>('');

  // 全政党リスト
  const allParties = useMemo(() => {
    const partyMap = new Map<string, { seats: number; votes: number }>();
    prefectures.forEach((pref) => {
      pref.partyResults.forEach((pr) => {
        const existing = partyMap.get(pr.party);
        if (existing) {
          existing.seats += pr.seats;
          existing.votes += pr.totalVotes;
        } else {
          partyMap.set(pr.party, { seats: pr.seats, votes: pr.totalVotes });
        }
      });
    });
    return Array.from(partyMap.entries())
      .map(([party, data]) => ({ party, ...data }))
      .sort((a, b) => b.seats - a.seats);
  }, [prefectures]);

  // 都道府県別チャートデータ
  const prefectureChartData = useMemo(() => {
    return prefectures.map((pref) => {
      const entry: Record<string, string | number> = {
        name: pref.prefecture,
        totalDistricts: pref.totalDistricts,
      };
      pref.partyResults.forEach((pr) => {
        entry[pr.party] = pr.seats;
      });
      return entry;
    });
  }, [prefectures]);

  // 政党別都道府県パフォーマンスデータ
  const partyPerformanceData = useMemo(() => {
    if (!selectedParty) return [];
    return prefectures
      .map((pref) => {
        const pr = pref.partyResults.find((r) => r.party === selectedParty);
        return {
          prefecture: pref.prefecture,
          seats: pr?.seats || 0,
          totalDistricts: pref.totalDistricts,
          voteRate: pr?.voteRate || 0,
          totalVotes: pr?.totalVotes || 0,
          winRate: pref.totalDistricts > 0
            ? ((pr?.seats || 0) / pref.totalDistricts) * 100
            : 0,
        };
      })
      .sort((a, b) => b.winRate - a.winRate);
  }, [prefectures, selectedParty]);

  // 全国集計
  const nationalSummary = useMemo(() => {
    const totalDistricts = prefectures.reduce((sum, p) => sum + p.totalDistricts, 0);
    return { totalDistricts };
  }, [prefectures]);

  return (
    <div className="space-y-6">
      {/* ビュー切替 */}
      <div className="flex items-center gap-4">
        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('prefecture')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'prefecture'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            }`}
          >
            都道府県別
          </button>
          <button
            onClick={() => setViewMode('party')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'party'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            }`}
          >
            政党別
          </button>
        </div>

        {viewMode === 'party' && (
          <Select
            value={selectedParty}
            onValueChange={setSelectedParty}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="政党を選択" />
            </SelectTrigger>
            <SelectContent>
              {allParties.map((p) => (
                <SelectItem key={p.party} value={p.party}>
                  {p.party}（{p.seats}議席）
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">小選挙区 総定数</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totalSeats}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">都道府県数</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{prefectures.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">選挙区数</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{nationalSummary.totalDistricts}</span>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'prefecture' ? (
        <>
          {/* 都道府県別 議席スタックバー */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">都道府県別 政党別議席数</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(500, prefectures.length * 24)}>
                <BarChart data={prefectureChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={60}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Legend />
                  {allParties.slice(0, 8).map((p) => (
                    <Bar
                      key={p.party}
                      dataKey={p.party}
                      stackId="a"
                      fill={getPartyColor(p.party)}
                      name={p.party}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 都道府県テーブル */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">都道府県別 詳細データ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>都道府県</TableHead>
                      <TableHead className="text-right">選挙区数</TableHead>
                      {allParties.slice(0, 6).map((p) => (
                        <TableHead key={p.party} className="text-right text-xs">
                          {p.party.length > 4 ? p.party.slice(0, 4) + '…' : p.party}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prefectures.map((pref) => (
                      <TableRow key={pref.prefecture}>
                        <TableCell className="font-medium">{pref.prefecture}</TableCell>
                        <TableCell className="text-right">{pref.totalDistricts}</TableCell>
                        {allParties.slice(0, 6).map((p) => {
                          const pr = pref.partyResults.find((r) => r.party === p.party);
                          return (
                            <TableCell key={p.party} className="text-right">
                              {pr ? (
                                <div>
                                  <span className="font-bold">{pr.seats}</span>
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({formatPercent(pr.voteRate)})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* 政党別ビュー */}
          {!selectedParty ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  政党を選択してください
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 政党パフォーマンスバーチャート */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getPartyColor(selectedParty) }}
                      />
                      {selectedParty} - 都道府県別パフォーマンス
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(400, partyPerformanceData.length * 22)}>
                    <BarChart data={partyPerformanceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis
                        type="category"
                        dataKey="prefecture"
                        width={60}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                                <p className="font-bold mb-2">{label}</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between gap-4">
                                    <span>議席:</span>
                                    <span className="font-mono font-bold">{data.seats} / {data.totalDistricts}</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span>勝率:</span>
                                    <span className="font-mono">{data.winRate.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span>得票率:</span>
                                    <span className="font-mono">{formatPercent(data.voteRate)}</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span>得票数:</span>
                                    <span className="font-mono">{formatNumber(data.totalVotes)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="winRate"
                        name="勝率(%)"
                        fill={getPartyColor(selectedParty)}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 政党パフォーマンステーブル */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{selectedParty} - 都道府県別詳細</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>都道府県</TableHead>
                        <TableHead className="text-right">議席</TableHead>
                        <TableHead className="text-right">選挙区数</TableHead>
                        <TableHead className="text-right">勝率</TableHead>
                        <TableHead className="text-right">得票率</TableHead>
                        <TableHead className="text-right">得票数</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partyPerformanceData.map((d) => (
                        <TableRow key={d.prefecture}>
                          <TableCell className="font-medium">{d.prefecture}</TableCell>
                          <TableCell className="text-right font-bold">{d.seats}</TableCell>
                          <TableCell className="text-right">{d.totalDistricts}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={d.winRate >= 50 ? 'default' : 'outline'}
                            >
                              {d.winRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatPercent(d.voteRate)}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(d.totalVotes)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
