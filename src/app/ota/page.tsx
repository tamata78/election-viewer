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
import { OtaAreaAnalysis } from '@/components/election/OtaAreaAnalysis';
import { OtaTimeComparison } from '@/components/election/OtaTimeComparison';
import { formatNumber, formatPercent } from '@/lib/utils';
import { Vote, Users, TrendingUp, MapPin, Calendar, BarChart3 } from 'lucide-react';

interface PartyResult {
  party: string;
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

function OtaContent() {
  const [data, setData] = useState<ElectionMasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<'2024' | '2026'>('2026');
  const [selectedSenkyoku, setSelectedSenkyoku] = useState<'4区' | '26区' | 'all'>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/data/ota-election-master.json');
        const jsonData = await res.json();
        setData(jsonData);
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
      // 4区と26区を結合
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

  // 政党別結果をマージ
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

  // サマリー統計
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

  // 総投票者数の計算
  const totalVoters2024 = useMemo(() => {
    if (!senkyokuData) return 0;
    return senkyokuData['2024'].districts.reduce((sum, d) => sum + d.totalVoters, 0);
  }, [senkyokuData]);

  const totalVoters2026 = useMemo(() => {
    if (!senkyokuData) return 0;
    return senkyokuData['2026'].districts.reduce((sum, d) => sum + d.totalVoters, 0);
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
    <div className="p-6 space-y-6">
      {/* コントロールパネル */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">年度:</span>
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedYear('2024')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedYear === '2024'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  令和6年(2024)
                </button>
                <button
                  onClick={() => setSelectedYear('2026')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
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

      {/* 統計カード */}
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
            <p className="text-xs text-muted-foreground">{selectedYear}年</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均総投票率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(summary?.avgTurnout || 0)}</div>
            <p className="text-xs text-muted-foreground">全投票区平均</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総投票者数</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary?.totalVoters || 0)}</div>
            <p className="text-xs text-muted-foreground">小選挙区</p>
          </CardContent>
        </Card>
      </div>

      {/* メインタブ */}
      <Tabs defaultValue="area" className="space-y-4">
        <TabsList>
          <TabsTrigger value="area" className="gap-2">
            <MapPin className="h-4 w-4" />
            投票区別分析
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            時系列比較
          </TabsTrigger>
        </TabsList>

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

        {/* 時系列比較タブ */}
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
