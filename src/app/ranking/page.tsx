'use client';

import { useEffect, useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Cell,
} from 'recharts';
import { getPartyColor } from '@/constants/parties';
import { formatNumber, formatPercent } from '@/lib/utils';
import { ArrowUpDown, Trophy, TrendingUp, TrendingDown } from 'lucide-react';

interface PartyData {
  votes: number;
  rate: number;
}

interface MunicipalityData {
  name: string;
  type: string;
  district?: string;
  totalVotes: number;
  [key: string]: PartyData | string | number | undefined;
}

interface DetailedData {
  electionType: string;
  parties: string[];
  municipalities: MunicipalityData[];
}

const HIREI_PARTIES = [
  '自由民主党', '中道改革連合', 'チームみらい', '国民民主党', '参政党',
  '日本共産党', '日本維新の会', '日本保守党', 'れいわ新選組',
  '社会民主党', '減税日本・ゆうこく連合'
];

const SHOU_PARTIES = [
  '自由民主党', '中道改革連合', '国民民主党', '参政党',
  '日本共産党', '日本維新の会', 'チームみらい', 'れいわ新選組',
  '日本保守党', '減税日本・ゆうこく連合', '本人届出'
];

type ElectionType = 'hirei' | 'shou';

function RankingContent() {
  const [electionType, setElectionType] = useState<ElectionType>('hirei');
  const [hireiData, setHireiData] = useState<DetailedData | null>(null);
  const [shouData, setShouData] = useState<DetailedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedParty, setSelectedParty] = useState<string>('自由民主党');
  const [sortKey, setSortKey] = useState<'votes' | 'rate'>('votes');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'ranking'>('table');

  const data = electionType === 'hirei' ? hireiData : shouData;
  const PARTIES = electionType === 'hirei' ? HIREI_PARTIES : SHOU_PARTIES;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [hireiRes, shouRes] = await Promise.all([
          fetch('/data/tokyo-hirei-detailed.json'),
          fetch('/data/tokyo-shou-detailed.json'),
        ]);
        const [hireiJson, shouJson] = await Promise.all([
          hireiRes.json(),
          shouRes.json(),
        ]);
        setHireiData(hireiJson);
        setShouData(shouJson);
      } catch (error) {
        console.error('データの読み込みに失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const sortedMunicipalities = useMemo(() => {
    if (!data) return [];

    return [...data.municipalities].sort((a, b) => {
      const aParty = a[selectedParty] as PartyData;
      const bParty = b[selectedParty] as PartyData;
      if (!aParty || !bParty) return 0;

      const aVal = sortKey === 'votes' ? aParty.votes : aParty.rate;
      const bVal = sortKey === 'votes' ? bParty.votes : bParty.rate;

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [data, selectedParty, sortKey, sortOrder]);

  const top30 = useMemo(() => sortedMunicipalities.slice(0, 30), [sortedMunicipalities]);

  const toggleSort = (key: 'votes' | 'rate') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6">データの読み込みに失敗しました</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Election Type Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <button
              onClick={() => setElectionType('hirei')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                electionType === 'hirei'
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-muted'
              }`}
            >
              比例代表
            </button>
            <button
              onClick={() => setElectionType('shou')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                electionType === 'shou'
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-muted'
              }`}
            >
              小選挙区
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">政党を選択</label>
              <Select value={selectedParty} onValueChange={setSelectedParty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTIES.map((party) => (
                    <SelectItem key={party} value={party}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getPartyColor(party) }}
                        />
                        {party}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleSort('votes')}
                className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${
                  sortKey === 'votes' ? 'bg-primary text-primary-foreground' : 'border'
                }`}
              >
                票数順
                {sortKey === 'votes' && (
                  sortOrder === 'desc' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => toggleSort('rate')}
                className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${
                  sortKey === 'rate' ? 'bg-primary text-primary-foreground' : 'border'
                }`}
              >
                得票率順
                {sortKey === 'rate' && (
                  sortOrder === 'desc' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 border rounded-md text-sm flex items-center gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortOrder === 'asc' ? '昇順' : '降順'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'ranking')}>
        <TabsList>
          <TabsTrigger value="table">全データテーブル</TabsTrigger>
          <TabsTrigger value="ranking">トップ30ランキング</TabsTrigger>
        </TabsList>

        {/* 全データテーブル */}
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getPartyColor(selectedParty) }}
                />
                {selectedParty} - {electionType === 'hirei' ? '比例代表' : '小選挙区'}開票区別データ（{sortedMunicipalities.length}件）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>開票区名</TableHead>
                      {electionType === 'shou' && <TableHead>選挙区</TableHead>}
                      <TableHead>地域</TableHead>
                      <TableHead className="text-right">全党派票数</TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted"
                        onClick={() => toggleSort('votes')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {selectedParty}票数
                          {sortKey === 'votes' && (
                            sortOrder === 'desc' ? '↓' : '↑'
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted"
                        onClick={() => toggleSort('rate')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          得票率
                          {sortKey === 'rate' && (
                            sortOrder === 'desc' ? '↓' : '↑'
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-48">グラフ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMunicipalities.map((m, index) => {
                      const partyData = m[selectedParty] as PartyData;
                      return (
                        <TableRow key={`${m.name}-${m.district || ''}`}>
                          <TableCell>
                            {index < 3 ? (
                              <Badge
                                className={
                                  index === 0
                                    ? 'bg-yellow-500'
                                    : index === 1
                                    ? 'bg-gray-400'
                                    : 'bg-amber-600'
                                }
                              >
                                {index + 1}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">{index + 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          {electionType === 'shou' && (
                            <TableCell>
                              <Badge variant="secondary">{m.district}</Badge>
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge variant="outline">{m.type}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {formatNumber(m.totalVotes)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {formatNumber(partyData?.votes || 0)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatPercent(partyData?.rate || 0)}
                          </TableCell>
                          <TableCell>
                            <div className="w-full bg-muted rounded-full h-3">
                              <div
                                className="h-3 rounded-full"
                                style={{
                                  width: `${Math.min((partyData?.rate || 0) * 2.5, 100)}%`,
                                  backgroundColor: getPartyColor(selectedParty),
                                }}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* トップ30ランキング */}
        <TabsContent value="ranking" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ランキングチャート */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {selectedParty}（{electionType === 'hirei' ? '比例' : '小選挙区'}） - {sortKey === 'votes' ? '票数' : '得票率'}トップ30
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={700}>
                  <BarChart
                    data={top30.map((m) => ({
                      name: m.name,
                      value: sortKey === 'votes'
                        ? (m[selectedParty] as PartyData)?.votes || 0
                        : (m[selectedParty] as PartyData)?.rate || 0,
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) =>
                        sortKey === 'votes' ? `${(v / 1000).toFixed(0)}千` : `${v.toFixed(1)}%`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        sortKey === 'votes'
                          ? formatNumber(value as number)
                          : formatPercent(value as number),
                        sortKey === 'votes' ? '票数' : '得票率',
                      ]}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {top30.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? '#fbbf24'
                              : index === 1
                              ? '#9ca3af'
                              : index === 2
                              ? '#d97706'
                              : getPartyColor(selectedParty)
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ランキングテーブル */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">詳細ランキング</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">順位</TableHead>
                      <TableHead>開票区名</TableHead>
                      <TableHead className="text-right">票数</TableHead>
                      <TableHead className="text-right">得票率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {top30.map((m, index) => {
                      const partyData = m[selectedParty] as PartyData;
                      return (
                        <TableRow key={`${m.name}-${m.district || ''}`}>
                          <TableCell>
                            {index < 3 ? (
                              <Badge
                                className={
                                  index === 0
                                    ? 'bg-yellow-500'
                                    : index === 1
                                    ? 'bg-gray-400'
                                    : 'bg-amber-600'
                                }
                              >
                                {index + 1}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">{index + 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {m.name}
                              {electionType === 'shou' && m.district && (
                                <Badge variant="secondary" className="text-xs">
                                  {m.district}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {m.type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(partyData?.votes || 0)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatPercent(partyData?.rate || 0)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* 政党別比較 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">全政党の上位開票区比較（{electionType === 'hirei' ? '比例' : '小選挙区'}）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {PARTIES.slice(0, 8).map((party) => {
                  const sorted = [...data.municipalities].sort((a, b) => {
                    const aParty = a[party] as PartyData;
                    const bParty = b[party] as PartyData;
                    return (bParty?.rate || 0) - (aParty?.rate || 0);
                  });
                  const top3 = sorted.slice(0, 3);

                  return (
                    <div key={party} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getPartyColor(party) }}
                        />
                        <span className="font-medium text-sm">{party.slice(0, 6)}</span>
                      </div>
                      <div className="space-y-1">
                        {top3.map((m, i) => {
                          const partyData = m[party] as PartyData;
                          return (
                            <div key={`${m.name}-${m.district || ''}`} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {i + 1}. {m.name.slice(0, 4)}
                              </span>
                              <span className="font-mono">
                                {formatPercent(partyData?.rate || 0)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function RankingPage() {
  return (
    <AppShell>
      <Header
        title="政党別ランキング"
        description="開票区別の政党得票数・得票率ランキング（比例代表・小選挙区切り替え可）"
      />
      <RankingContent />
    </AppShell>
  );
}
