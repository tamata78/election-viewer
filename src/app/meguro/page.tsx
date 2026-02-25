'use client';

import { useEffect, useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import { getPartyColor } from '@/constants/parties';
import { formatNumber, formatPercent } from '@/lib/utils';
import { generatePartyComparison, classifySwing, getSwingColor } from '@/lib/election-utils';
import { Vote, Users, TrendingUp, Award, TrendingDown, Calendar, Minus } from 'lucide-react';

interface CandidateResult {
  party: string;
  candidateName: string;
  votes: number;
  rate: number;
}

interface PartyResult {
  party: string;
  votes: number;
  rate: number;
}

interface ElectionYearData {
  year: number;
  electionDate: string;
  note?: string;
  syosenkyoku: {
    totalVotes: number;
    totalInvalidVotes?: number;
    totalEligibleVoters?: number;
    turnoutRate?: number;
    results: CandidateResult[];
  };
  hirei: {
    totalVotes: number;
    totalInvalidVotes?: number;
    totalEligibleVoters?: number;
    turnoutRate?: number;
    results: PartyResult[];
  } | null;
}

interface MeguroMasterData {
  region: string;
  senkyoku: string;
  years: {
    '2024': ElectionYearData;
    '2026': ElectionYearData;
  };
}

function DeltaBadge({ value, suffix = 'pt' }: { value: number; suffix?: string }) {
  if (Math.abs(value) < 0.01) {
    return <Badge variant="outline" className="text-xs">±0{suffix}</Badge>;
  }
  const isPositive = value > 0;
  return (
    <Badge
      className={`text-xs ${isPositive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}
      variant="outline"
    >
      {isPositive ? <TrendingUp className="h-3 w-3 mr-0.5 inline" /> : <TrendingDown className="h-3 w-3 mr-0.5 inline" />}
      {isPositive ? '+' : ''}{value.toFixed(2)}{suffix}
    </Badge>
  );
}

function CustomBarTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { party: string; rate2024: number; rate2026: number; voteDiff: number; rateDiff: number } }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-bold mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-blue-600">2024年:</span>
            <span className="font-mono">{data.rate2024.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-orange-600">2026年:</span>
            <span className="font-mono">{data.rate2026.toFixed(2)}%</span>
          </div>
          <div className="border-t pt-1 mt-1">
            <div className="flex justify-between gap-4">
              <span>得票率差:</span>
              <span className={`font-mono font-bold ${data.rateDiff > 0 ? 'text-green-600' : data.rateDiff < 0 ? 'text-red-600' : ''}`}>
                {data.rateDiff > 0 ? '+' : ''}{data.rateDiff.toFixed(2)}pt
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function MeguroContent() {
  const [masterData, setMasterData] = useState<MeguroMasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<'2024' | '2026'>('2026');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/data/meguro-election-master.json');
        const data = await res.json();
        setMasterData(data);
      } catch (error) {
        console.error('データの読み込みに失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const data2026 = masterData?.years['2026'];
  const data2024 = masterData?.years['2024'];
  const currentYearData = selectedYear === '2026' ? data2026 : data2024;

  // 小選挙区 比較データ
  const syoComparisonData = useMemo(() => {
    if (!data2024 || !data2026) return [];
    const results2024: PartyResult[] = data2024.syosenkyoku.results.map((r) => ({
      party: r.party,
      votes: r.votes,
      rate: r.rate,
    }));
    const results2026: PartyResult[] = data2026.syosenkyoku.results.map((r) => ({
      party: r.party,
      votes: r.votes,
      rate: r.rate,
    }));
    return generatePartyComparison(results2024, results2026);
  }, [data2024, data2026]);

  // 比例代表 比較データ
  const hireiComparisonData = useMemo(() => {
    if (!data2024?.hirei || !data2026?.hirei) return [];
    return generatePartyComparison(data2024.hirei.results, data2026.hirei.results);
  }, [data2024, data2026]);

  // レーダーチャート用データ
  const radarData = useMemo(() => {
    if (!data2024 || !data2026) return [];
    const allParties = new Set([
      ...data2024.syosenkyoku.results.map((p) => p.party),
      ...data2026.syosenkyoku.results.map((p) => p.party),
    ]);
    return Array.from(allParties).map((party) => {
      const p2024 = data2024.syosenkyoku.results.find((p) => p.party === party);
      const p2026 = data2026.syosenkyoku.results.find((p) => p.party === party);
      return {
        party: party.length > 6 ? party.slice(0, 6) + '...' : party,
        fullParty: party,
        rate2024: p2024?.rate || 0,
        rate2026: p2026?.rate || 0,
      };
    });
  }, [data2024, data2026]);

  // 投票率デルタ（2026 vs 2024）
  const turnoutDelta = useMemo(() => {
    if (!data2026?.syosenkyoku.turnoutRate || !data2024?.syosenkyoku.turnoutRate) return null;
    return data2026.syosenkyoku.turnoutRate - data2024.syosenkyoku.turnoutRate;
  }, [data2024, data2026]);

  // サマリー統計
  const winner = currentYearData
    ? [...currentYearData.syosenkyoku.results].sort((a, b) => b.votes - a.votes)[0]
    : null;

  const winner2024 = data2024
    ? [...data2024.syosenkyoku.results].sort((a, b) => b.votes - a.votes)[0]
    : null;

  const winnerDelta = useMemo(() => {
    if (!winner || !syoComparisonData.length) return null;
    const entry = syoComparisonData.find((d) => d.party === winner.party);
    return entry ? entry.rateDiff : null;
  }, [winner, syoComparisonData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!masterData || !data2026) {
    return <div className="p-6">データの読み込みに失敗しました</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">

      {/* コントロールパネル */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">年度:</span>
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedYear('2024')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedYear === '2024'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  令和6年(2024)
                </button>
                <button
                  onClick={() => setSelectedYear('2026')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedYear === '2026'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  令和8年(2026)
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ① サマリーセクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">有権者数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(currentYearData?.syosenkyoku.totalEligibleVoters || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{selectedYear}年 小選挙区</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">投票率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(currentYearData?.syosenkyoku.turnoutRate || 0)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {selectedYear === '2026' && turnoutDelta !== null && (
                <DeltaBadge value={turnoutDelta} suffix="pt" />
              )}
              {selectedYear === '2026' && (
                <p className="text-xs text-muted-foreground">前回比</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">有効票数</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(currentYearData?.syosenkyoku.totalVotes || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              無効票: {formatNumber(currentYearData?.syosenkyoku.totalInvalidVotes || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">当選者</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{winner?.candidateName || '-'}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{winner?.party}</span>
              <span className="text-xs font-mono">{formatPercent(winner?.rate || 0)}</span>
              {selectedYear === '2026' && winnerDelta !== null && <DeltaBadge value={winnerDelta} />}
            </div>
            {selectedYear === '2026' && winner2024 && (
              <p className="text-xs text-muted-foreground mt-1">
                前回: {winner2024.candidateName}（{winner2024.party}）
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* メインタブ */}
      <Tabs defaultValue="syosenkyoku" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="syosenkyoku">小選挙区</TabsTrigger>
          <TabsTrigger value="hirei">比例代表</TabsTrigger>
          <TabsTrigger value="comparison">2024 vs 2026 比較</TabsTrigger>
        </TabsList>

        {/* 比較グラフセクション */}
        <TabsContent value="comparison" className="space-y-6">
          {/* サマリーカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">小選挙区 総投票数変化</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {formatNumber(data2026.syosenkyoku.totalVotes)}
                  </span>
                  <span className="text-muted-foreground">票</span>
                </div>
                {data2024 && (() => {
                  const diff = data2026.syosenkyoku.totalVotes - data2024.syosenkyoku.totalVotes;
                  const pct = ((diff / data2024.syosenkyoku.totalVotes) * 100).toFixed(1);
                  return (
                    <div className="flex items-center gap-2 mt-1">
                      {diff > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : diff < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-500" />
                      )}
                      <span className={`text-sm font-medium ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {diff > 0 ? '+' : ''}{formatNumber(diff)} ({pct}%)
                      </span>
                      <span className="text-xs text-muted-foreground">前回比</span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">比例代表 総投票数変化</CardTitle>
              </CardHeader>
              <CardContent>
                {data2026.hirei && (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">
                        {formatNumber(data2026.hirei.totalVotes)}
                      </span>
                      <span className="text-muted-foreground">票</span>
                    </div>
                    {data2024?.hirei && (() => {
                      const diff = data2026.hirei!.totalVotes - data2024.hirei!.totalVotes;
                      const pct = ((diff / data2024.hirei!.totalVotes) * 100).toFixed(1);
                      return (
                        <div className="flex items-center gap-2 mt-1">
                          {diff > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : diff < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <Minus className="h-4 w-4 text-gray-500" />
                          )}
                          <span className={`text-sm font-medium ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diff > 0 ? '+' : ''}{formatNumber(diff)} ({pct}%)
                          </span>
                          <span className="text-xs text-muted-foreground">前回比</span>
                        </div>
                      );
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 小選挙区 2024 vs 2026 重ね合わせ棒グラフ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">小選挙区 政党別得票率比較（2024年 vs 2026年）</CardTitle>
              <p className="text-xs text-muted-foreground">
                ※2024年は大選挙区（衆議院総選挙）。目黒区分の推計値。
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={syoComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" domain={[0, 60]} tickFormatter={(v) => `${v}%`} />
                  <YAxis
                    type="category"
                    dataKey="party"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend />
                  <Bar dataKey="rate2024" name="2024年" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="rate2026" name="2026年" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 比例代表 2024 vs 2026 比較棒グラフ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">比例代表 政党別得票率比較（2024年 vs 2026年）</CardTitle>
              <p className="text-xs text-muted-foreground">
                ※2024年は衆議院議員総選挙（比例東京ブロック）、2026年は衆議院議員補欠選挙。
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={hireiComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" domain={[0, 40]} tickFormatter={(v) => `${v}%`} />
                  <YAxis
                    type="category"
                    dataKey="party"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend />
                  <Bar dataKey="rate2024" name="2024年" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="rate2026" name="2026年" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* レーダーチャート + スイング分析 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">小選挙区 得票率比較（レーダー）</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="party" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 60]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="2024年"
                      dataKey="rate2024"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="2026年"
                      dataKey="rate2026"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.3}
                    />
                    <Legend />
                    <Tooltip
                      formatter={(value) => [`${(value as number).toFixed(1)}%`, '']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">政党別スイング分析（小選挙区）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syoComparisonData.map((party) => {
                    const swing = classifySwing(party.rateDiff);
                    const swingColor = getSwingColor(swing);
                    const swingLabel = {
                      surge: '急伸', gain: '増加', stable: '横ばい', loss: '減少', collapse: '急落',
                    }[swing];

                    const candidate2024 = data2024?.syosenkyoku.results.find((p) => p.party === party.party);
                    const candidate2026 = data2026.syosenkyoku.results.find((p) => p.party === party.party);

                    return (
                      <div key={party.party} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getPartyColor(party.party) }}
                            />
                            <div>
                              <span className="font-medium text-sm">{party.party}</span>
                              {(candidate2024?.candidateName || candidate2026?.candidateName) && (
                                <p className="text-xs text-muted-foreground">
                                  {candidate2024?.candidateName && `2024: ${candidate2024.candidateName}`}
                                  {candidate2024?.candidateName && candidate2026?.candidateName && ' → '}
                                  {candidate2026?.candidateName && `2026: ${candidate2026.candidateName}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge style={{ backgroundColor: swingColor, color: '#fff' }}>
                              {swingLabel}
                            </Badge>
                            <span
                              className={`font-mono text-sm font-bold ${
                                party.rateDiff > 0 ? 'text-green-600' : party.rateDiff < 0 ? 'text-red-600' : ''
                              }`}
                            >
                              {party.rateDiff > 0 ? '+' : ''}{party.rateDiff.toFixed(2)}pt
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(Math.abs(party.rateDiff) * 10, 100)}%`,
                                backgroundColor: swingColor,
                                marginLeft: party.rateDiff < 0 ? 'auto' : 0,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>2024: {formatPercent(party.rate2024)}</span>
                          <span>→</span>
                          <span>2026: {formatPercent(party.rate2026)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 比例代表 得票率推移（折れ線） */}
          {data2024?.hirei && data2026.hirei && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">比例代表 得票率推移</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { year: '2024年', ...Object.fromEntries(data2024.hirei.results.map((p) => [p.party, p.rate])) },
                      { year: '2026年', ...Object.fromEntries(data2026.hirei.results.map((p) => [p.party, p.rate])) },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0, 40]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value) => [`${(value as number).toFixed(1)}%`, '']} />
                    <Legend />
                    {[...new Set([...data2024.hirei.results, ...data2026.hirei.results].map((p) => p.party))].slice(0, 6).map((party) => (
                      <Line
                        key={party}
                        type="monotone"
                        dataKey={party}
                        stroke={getPartyColor(party)}
                        strokeWidth={2}
                        dot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ③ 小選挙区タブ */}
        <TabsContent value="syosenkyoku" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 候補者別得票数バーチャート */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">候補者別得票数（{selectedYear}年）</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[...(currentYearData?.syosenkyoku.results || [])].sort((a, b) => b.votes - a.votes)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" tickFormatter={(v) => formatNumber(v)} />
                    <YAxis
                      type="category"
                      dataKey="candidateName"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [formatNumber(value as number), '得票数']}
                    />
                    <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                      {[...(currentYearData?.syosenkyoku.results || [])]
                        .sort((a, b) => b.votes - a.votes)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getPartyColor(entry.party)} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 得票率円グラフ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">得票率（{selectedYear}年）</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={currentYearData?.syosenkyoku.results || []}
                      dataKey="rate"
                      nameKey="candidateName"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ value, percent }) =>
                        (percent || 0) >= 0.03 ? `${Number(value).toFixed(1)}%` : null
                      }
                    >
                      {(currentYearData?.syosenkyoku.results || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPartyColor(entry.party)} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name as string]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        {/* ④ 比例代表タブ */}
        <TabsContent value="hirei" className="space-y-4">
          {currentYearData?.hirei ? (
            <>
              {/* 集計サマリー */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">有権者数</p>
                    <p className="text-xl font-bold">{formatNumber(currentYearData.hirei.totalEligibleVoters || 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">有効票数</p>
                    <p className="text-xl font-bold">{formatNumber(currentYearData.hirei.totalVotes)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">無効票数</p>
                    <p className="text-xl font-bold">{formatNumber(currentYearData.hirei.totalInvalidVotes || 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">政党数</p>
                    <p className="text-xl font-bold">{currentYearData.hirei.results.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* 政党別得票数・得票率 グリッド */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">政党別得票数（{selectedYear}年）</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={360}>
                      <BarChart
                        data={[...(currentYearData.hirei.results)].sort((a, b) => b.votes - a.votes)}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                        <XAxis type="number" tickFormatter={(v) => formatNumber(v)} />
                        <YAxis
                          type="category"
                          dataKey="party"
                          width={130}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value) => [formatNumber(value as number), '得票数']}
                        />
                        <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                          {[...(currentYearData.hirei.results)]
                            .sort((a, b) => b.votes - a.votes)
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getPartyColor(entry.party)} />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">得票率（{selectedYear}年）</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={360}>
                      <PieChart>
                        <Pie
                          data={currentYearData.hirei.results}
                          dataKey="rate"
                          nameKey="party"
                          cx="50%"
                          cy="42%"
                          outerRadius={75}
                          label={({ value, percent }) =>
                            (percent || 0) >= 0.03 ? `${Number(value).toFixed(1)}%` : null
                          }
                        >
                          {currentYearData.hirei.results.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getPartyColor(entry.party)} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name as string]}
                        />
                        <Legend
                          formatter={(value) => <span className="text-xs">{value}</span>}
                          wrapperStyle={{ fontSize: 11 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                比例代表データは準備中です
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MeguroPage() {
  return (
    <AppShell>
      <Header
        title="目黒区 選挙詳細分析"
        description="投票結果・時系列比較ダッシュボード（2024年 vs 2026年）"
      />
      <MeguroContent />
    </AppShell>
  );
}
