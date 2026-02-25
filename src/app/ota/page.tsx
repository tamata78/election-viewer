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
} from 'recharts';
import { OtaAreaAnalysis } from '@/components/election/OtaAreaAnalysis';
import { OtaTimeComparison } from '@/components/election/OtaTimeComparison';
import { getPartyColor } from '@/constants/parties';
import { generatePartyComparison } from '@/lib/election-utils';
import { formatNumber, formatPercent } from '@/lib/utils';
import {
  Vote, Users, TrendingUp, TrendingDown, MapPin, Calendar, BarChart3,
} from 'lucide-react';

interface PartyResult {
  party: string;
  candidateName?: string;
  votes: number;
  rate: number;
}

interface DistrictData {
  id: number;
  dayOfEligibleVoters: number;
  dayOfVoters: number;
  dayOfTurnoutRate: number;
  earlyVoters: number;
  absenteeVoters: number;
  totalVoters: number;
  totalTurnoutRate: number;
}

interface YearData {
  year: number;
  electionDate: string;
  syosenkyoku: {
    totalVotes: number;
    results: PartyResult[];
  };
  hirei: {
    totalVotes: number;
    results: PartyResult[];
  };
  districts: DistrictData[];
}

interface SenkyokuData {
  years: {
    [key: string]: YearData;
  };
}

interface ElectionMasterData {
  region: string;
  data: {
    '4区': SenkyokuData;
    '26区': SenkyokuData;
  };
}

interface GenderYearData {
  maleEligible: number;
  femaleEligible: number;
  maleVoters: number;
  femaleVoters: number;
  maleTurnout: number;
  femaleTurnout: number;
  totalTurnout: number;
}

interface GenderTurnoutData {
  '4区': { '2024': GenderYearData; '2026': GenderYearData };
  '26区': { '2024': GenderYearData; '2026': GenderYearData };
}

export function OtaContent() {
  const [data, setData] = useState<ElectionMasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<'2024' | '2026'>('2026');
  const [selectedSenkyoku, setSelectedSenkyoku] = useState<'4区' | '26区' | 'all'>('all');
  const [genderTurnoutData, setGenderTurnoutData] = useState<GenderTurnoutData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mainRes, genderRes] = await Promise.all([
          fetch('/data/ota-election-master.json'),
          fetch('/data/ota-gender-turnout.json'),
        ]);
        const jsonData = await mainRes.json();
        const genderData = await genderRes.json();
        setData(jsonData);
        setGenderTurnoutData(genderData);
      } catch (error) {
        console.error('データの読み込みに失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 選択された選挙区のデータを取得
  const senkyokuData = useMemo(() => {
    if (!data) return null;

    if (selectedSenkyoku === 'all') {
      const ku4 = data.data['4区'];
      const ku26 = data.data['26区'];

      return {
        '2024': {
          syosenkyoku: {
            totalVotes:
              ku4.years['2024'].syosenkyoku.totalVotes +
              ku26.years['2024'].syosenkyoku.totalVotes,
            results: mergePartyResults(
              ku4.years['2024'].syosenkyoku.results,
              ku26.years['2024'].syosenkyoku.results
            ),
          },
          hirei: {
            totalVotes:
              ku4.years['2024'].hirei.totalVotes + ku26.years['2024'].hirei.totalVotes,
            results: mergePartyResults(
              ku4.years['2024'].hirei.results,
              ku26.years['2024'].hirei.results
            ),
          },
          districts: [...ku4.years['2024'].districts, ...ku26.years['2024'].districts],
        },
        '2026': {
          syosenkyoku: {
            totalVotes:
              ku4.years['2026'].syosenkyoku.totalVotes +
              ku26.years['2026'].syosenkyoku.totalVotes,
            results: mergePartyResults(
              ku4.years['2026'].syosenkyoku.results,
              ku26.years['2026'].syosenkyoku.results
            ),
          },
          hirei: {
            totalVotes:
              ku4.years['2026'].hirei.totalVotes + ku26.years['2026'].hirei.totalVotes,
            results: mergePartyResults(
              ku4.years['2026'].hirei.results,
              ku26.years['2026'].hirei.results
            ),
          },
          districts: [...ku4.years['2026'].districts, ...ku26.years['2026'].districts],
        },
      };
    }

    const ku = data.data[selectedSenkyoku];
    return {
      '2024': {
        syosenkyoku: ku.years['2024'].syosenkyoku,
        hirei: ku.years['2024'].hirei,
        districts: ku.years['2024'].districts,
      },
      '2026': {
        syosenkyoku: ku.years['2026'].syosenkyoku,
        hirei: ku.years['2026'].hirei,
        districts: ku.years['2026'].districts,
      },
    };
  }, [data, selectedSenkyoku]);

  function mergePartyResults(results1: PartyResult[], results2: PartyResult[]): PartyResult[] {
    const partyMap = new Map<string, { votes: number; rate: number }>();

    [...results1, ...results2].forEach((p) => {
      const existing = partyMap.get(p.party);
      if (existing) {
        existing.votes += p.votes;
      } else {
        partyMap.set(p.party, { votes: p.votes, rate: 0 });
      }
    });

    const totalVotes = Array.from(partyMap.values()).reduce((sum, p) => sum + p.votes, 0);

    return Array.from(partyMap.entries())
      .map(([party, data]) => ({
        party,
        votes: data.votes,
        rate: (data.votes / totalVotes) * 100,
      }))
      .sort((a, b) => b.votes - a.votes);
  }

  const summary = useMemo(() => {
    if (!senkyokuData) return null;
    const current = senkyokuData[selectedYear];
    const totalDistricts = current.districts.length;
    const totalEligible = current.districts.reduce((sum, d) => sum + d.dayOfEligibleVoters, 0);
    const totalVoters = current.districts.reduce((sum, d) => sum + d.totalVoters, 0);
    const avgTurnout =
      current.districts.reduce((sum, d) => sum + d.totalTurnoutRate, 0) / totalDistricts;
    return { totalDistricts, totalEligible, totalVoters, avgTurnout };
  }, [senkyokuData, selectedYear]);

  const totalVoters2024 = useMemo(() => {
    if (!senkyokuData) return 0;
    return senkyokuData['2024'].districts.reduce((sum, d) => sum + d.totalVoters, 0);
  }, [senkyokuData]);

  const totalVoters2026 = useMemo(() => {
    if (!senkyokuData) return 0;
    return senkyokuData['2026'].districts.reduce((sum, d) => sum + d.totalVoters, 0);
  }, [senkyokuData]);

  const summaryDelta = useMemo(() => {
    if (!senkyokuData || selectedYear !== '2026') return null;
    const d2024 = senkyokuData['2024'];
    const d2026 = senkyokuData['2026'];
    const eligible2024 = d2024.districts.reduce((s, d) => s + d.dayOfEligibleVoters, 0);
    const eligible2026 = d2026.districts.reduce((s, d) => s + d.dayOfEligibleVoters, 0);
    const turnout2024 =
      d2024.districts.reduce((s, d) => s + d.totalTurnoutRate, 0) / d2024.districts.length;
    const turnout2026 =
      d2026.districts.reduce((s, d) => s + d.totalTurnoutRate, 0) / d2026.districts.length;
    return {
      eligibleDelta: eligible2026 - eligible2024,
      turnoutDelta: turnout2026 - turnout2024,
      votersDelta: totalVoters2026 - totalVoters2024,
    };
  }, [senkyokuData, selectedYear, totalVoters2024, totalVoters2026]);

  // 男女別投票率データ
  const genderData2024 = useMemo((): GenderYearData | null => {
    if (!genderTurnoutData) return null;
    if (selectedSenkyoku === 'all') {
      const ku4 = genderTurnoutData['4区']['2024'];
      const ku26 = genderTurnoutData['26区']['2024'];
      const mE = ku4.maleEligible + ku26.maleEligible;
      const fE = ku4.femaleEligible + ku26.femaleEligible;
      const mV = ku4.maleVoters + ku26.maleVoters;
      const fV = ku4.femaleVoters + ku26.femaleVoters;
      return {
        maleEligible: mE, femaleEligible: fE,
        maleVoters: mV, femaleVoters: fV,
        maleTurnout: (mV / mE) * 100,
        femaleTurnout: (fV / fE) * 100,
        totalTurnout: ((mV + fV) / (mE + fE)) * 100,
      };
    }
    return genderTurnoutData[selectedSenkyoku]['2024'];
  }, [genderTurnoutData, selectedSenkyoku]);

  const genderData2026 = useMemo((): GenderYearData | null => {
    if (!genderTurnoutData) return null;
    if (selectedSenkyoku === 'all') {
      const ku4 = genderTurnoutData['4区']['2026'];
      const ku26 = genderTurnoutData['26区']['2026'];
      const mE = ku4.maleEligible + ku26.maleEligible;
      const fE = ku4.femaleEligible + ku26.femaleEligible;
      const mV = ku4.maleVoters + ku26.maleVoters;
      const fV = ku4.femaleVoters + ku26.femaleVoters;
      return {
        maleEligible: mE, femaleEligible: fE,
        maleVoters: mV, femaleVoters: fV,
        maleTurnout: (mV / mE) * 100,
        femaleTurnout: (fV / fE) * 100,
        totalTurnout: ((mV + fV) / (mE + fE)) * 100,
      };
    }
    return genderTurnoutData[selectedSenkyoku]['2026'];
  }, [genderTurnoutData, selectedSenkyoku]);

  // 小選挙区 比較データ（スイング分析用）
  const syoComparisonData = useMemo(() => {
    if (!senkyokuData) return [];
    return generatePartyComparison(
      senkyokuData['2024'].syosenkyoku.results,
      senkyokuData['2026'].syosenkyoku.results
    );
  }, [senkyokuData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data || !senkyokuData) {
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

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">選挙区:</span>
              <Select
                value={selectedSenkyoku}
                onValueChange={(v) => setSelectedSenkyoku(v as '4区' | '26区' | 'all')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全選挙区</SelectItem>
                  <SelectItem value="4区">東京4区</SelectItem>
                  <SelectItem value="26区">東京26区</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="ml-auto">
              {selectedYear === '2024' ? '2024年10月27日' : '2026年2月8日'} 執行
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">投票区数</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalDistricts}</div>
            <p className="text-xs text-muted-foreground">
              {selectedSenkyoku === 'all' ? '4区・26区合計' : `東京${selectedSenkyoku}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">当日有権者数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary?.totalEligible || 0)}</div>
            <div className="flex items-center gap-2 mt-1">
              {summaryDelta && (
                <span className={`text-xs font-medium ${summaryDelta.eligibleDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summaryDelta.eligibleDelta >= 0 ? '+' : ''}{formatNumber(summaryDelta.eligibleDelta)}人
                </span>
              )}
              <p className="text-xs text-muted-foreground">{summaryDelta ? '前回比' : `${selectedYear}年`}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均総投票率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(summary?.avgTurnout || 0)}</div>
            <div className="flex items-center gap-2 mt-1">
              {summaryDelta && (
                <span className={`text-xs font-medium flex items-center gap-0.5 ${summaryDelta.turnoutDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summaryDelta.turnoutDelta >= 0
                    ? <TrendingUp className="h-3 w-3" />
                    : <TrendingDown className="h-3 w-3" />}
                  {summaryDelta.turnoutDelta >= 0 ? '+' : ''}{summaryDelta.turnoutDelta.toFixed(2)}pt
                </span>
              )}
              <p className="text-xs text-muted-foreground">全投票区平均</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総投票者数</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary?.totalVoters || 0)}</div>
            <div className="flex items-center gap-2 mt-1">
              {summaryDelta && (
                <span className={`text-xs font-medium ${summaryDelta.votersDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summaryDelta.votersDelta >= 0 ? '+' : ''}{formatNumber(summaryDelta.votersDelta)}票
                </span>
              )}
              <p className="text-xs text-muted-foreground">小選挙区</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* メインタブ（目黒区と同じ順序） */}
      <Tabs defaultValue="syosenkyoku" className="space-y-4">
        <TabsList>
          <TabsTrigger value="syosenkyoku">小選挙区</TabsTrigger>
          <TabsTrigger value="hirei">比例代表</TabsTrigger>
          <TabsTrigger value="comparison" className="gap-1 md:gap-2">
            <BarChart3 className="h-4 w-4 hidden sm:block" />
            2024 vs 2026 比較
          </TabsTrigger>
          <TabsTrigger value="area" className="gap-1 md:gap-2">
            <MapPin className="h-4 w-4 hidden sm:block" />
            投票区別分析
          </TabsTrigger>
        </TabsList>

        {/* 小選挙区タブ */}
        <TabsContent value="syosenkyoku" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  政党別得票数（{selectedYear}年 / {selectedSenkyoku === 'all' ? '全選挙区' : `東京${selectedSenkyoku}`}）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[...senkyokuData[selectedYear].syosenkyoku.results].sort(
                      (a, b) => b.votes - a.votes
                    )}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" tickFormatter={(v) => formatNumber(v)} />
                    <YAxis
                      type="category"
                      dataKey={selectedSenkyoku === '26区' ? 'candidateName' : 'party'}
                      width={110}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={(value) => [formatNumber(value as number), '得票数']} />
                    <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                      {[...senkyokuData[selectedYear].syosenkyoku.results]
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
                <CardTitle className="text-base">
                  得票率（{selectedYear}年 / {selectedSenkyoku === 'all' ? '全選挙区' : `東京${selectedSenkyoku}`}）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={senkyokuData[selectedYear].syosenkyoku.results}
                      dataKey="rate"
                      nameKey="party"
                      cx="50%"
                      cy="45%"
                      outerRadius={85}
                      label={({ value, percent }) =>
                        (percent || 0) >= 0.03 ? `${Number(value).toFixed(1)}%` : null
                      }
                    >
                      {senkyokuData[selectedYear].syosenkyoku.results.map((entry, index) => (
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
        </TabsContent>

        {/* 比例代表タブ */}
        <TabsContent value="hirei" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  政党別得票数（比例代表 {selectedYear}年 / {selectedSenkyoku === 'all' ? '全選挙区' : `東京${selectedSenkyoku}`}）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={[...senkyokuData[selectedYear].hirei.results].sort(
                      (a, b) => b.votes - a.votes
                    )}
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
                    <Tooltip formatter={(value) => [formatNumber(value as number), '得票数']} />
                    <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                      {[...senkyokuData[selectedYear].hirei.results]
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
                <CardTitle className="text-base">
                  得票率（比例代表 {selectedYear}年 / {selectedSenkyoku === 'all' ? '全選挙区' : `東京${selectedSenkyoku}`}）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>
                    <Pie
                      data={senkyokuData[selectedYear].hirei.results}
                      dataKey="rate"
                      nameKey="party"
                      cx="50%"
                      cy="40%"
                      outerRadius={75}
                      label={({ value, percent }) =>
                        (percent || 0) >= 0.03 ? `${Number(value).toFixed(1)}%` : null
                      }
                    >
                      {senkyokuData[selectedYear].hirei.results.map((entry, index) => (
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
        </TabsContent>

        {/* 2024 vs 2026 比較タブ */}
        <TabsContent value="comparison">
          <OtaTimeComparison
            syosenkyoku2024={senkyokuData['2024'].syosenkyoku.results}
            syosenkyoku2026={senkyokuData['2026'].syosenkyoku.results}
            hirei2024={senkyokuData['2024'].hirei.results}
            hirei2026={senkyokuData['2026'].hirei.results}
            totalVotesSyo2024={senkyokuData['2024'].syosenkyoku.totalVotes}
            totalVotesSyo2026={senkyokuData['2026'].syosenkyoku.totalVotes}
            totalVotesHirei2024={senkyokuData['2024'].hirei.totalVotes}
            totalVotesHirei2026={senkyokuData['2026'].hirei.totalVotes}
            districts2024={senkyokuData['2024'].districts}
            districts2026={senkyokuData['2026'].districts}
            genderData2024={genderData2024}
            genderData2026={genderData2026}
          />
        </TabsContent>

        {/* 投票区別分析タブ */}
        <TabsContent value="area">
          <OtaAreaAnalysis
            districts2024={senkyokuData['2024'].districts}
            districts2026={senkyokuData['2026'].districts}
            totalVoters2024={totalVoters2024}
            totalVoters2026={totalVoters2026}
            selectedYear={selectedYear}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function OtaPage() {
  return (
    <AppShell>
      <Header
        title="大田区 選挙詳細分析"
        description="投票区別・時系列比較ダッシュボード（2024年 vs 2026年）"
      />
      <OtaContent />
    </AppShell>
  );
}
