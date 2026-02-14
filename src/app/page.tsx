'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { PartyBarChart } from '@/components/charts/party-bar-chart';
import { VotePieChart } from '@/components/charts/vote-pie-chart';
import { TokyoHeatmap } from '@/components/charts/tokyo-heatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppState } from '@/components/providers';
import { loadCSVFile } from '@/lib/csv-parser';
import {
  calculatePartyTotals,
  generateHeatmapData,
  filterByYear,
} from '@/lib/data-processor';
import { formatNumber, formatPercent } from '@/lib/utils';
import { PARTIES } from '@/constants/parties';
import type { ElectionResult, PartyResult, HeatmapData } from '@/types/election';
import { BarChart3, Users, Vote, TrendingUp } from 'lucide-react';

function DashboardContent() {
  const { selectedYear, selectedParties } = useAppState();
  const [data, setData] = useState<ElectionResult[]>([]);
  const [partyTotals, setPartyTotals] = useState<PartyResult[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [selectedHeatmapParty, setSelectedHeatmapParty] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const csvData = await loadCSVFile('/data/tokyo-summary.csv');
        setData(csvData);
      } catch (error) {
        console.error('データの読み込みに失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let filteredData = filterByYear(data, selectedYear);

    const totals = calculatePartyTotals(filteredData);
    const filteredTotals = selectedParties.length > 0
      ? totals.filter(t => selectedParties.includes(t.partyName))
      : totals;
    setPartyTotals(filteredTotals);

    const heatmap = generateHeatmapData(
      filteredData,
      selectedHeatmapParty || undefined
    );
    setHeatmapData(heatmap);
  }, [data, selectedYear, selectedParties, selectedHeatmapParty]);

  const totalVotes = partyTotals.reduce((sum, p) => sum + p.votes, 0);
  const totalSeats = partyTotals.reduce((sum, p) => sum + p.seats, 0);
  const topParty = partyTotals[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総得票数</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalVotes)}</div>
            <p className="text-xs text-muted-foreground">東京都全体</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総議席数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSeats}</div>
            <p className="text-xs text-muted-foreground">小選挙区</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">第1党</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topParty?.partyName || '-'}</div>
            <p className="text-xs text-muted-foreground">
              {topParty ? `${formatPercent(topParty.voteShare)} / ${topParty.seats}議席` : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">政党数</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partyTotals.length}</div>
            <p className="text-xs text-muted-foreground">議席獲得政党</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="bar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bar">棒グラフ</TabsTrigger>
          <TabsTrigger value="pie">円グラフ</TabsTrigger>
          <TabsTrigger value="map">ヒートマップ</TabsTrigger>
        </TabsList>

        <TabsContent value="bar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PartyBarChart
              data={partyTotals}
              title="政党別得票数"
              dataKey="votes"
            />
            <PartyBarChart
              data={partyTotals}
              title="政党別議席数"
              dataKey="seats"
            />
          </div>
        </TabsContent>

        <TabsContent value="pie">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <VotePieChart data={partyTotals} title="政党別得票率" />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">政党別データ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {partyTotals.map((party) => (
                    <div
                      key={party.partyName}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              PARTIES.find((p) => p.name === party.partyName)
                                ?.color || '#ccc',
                          }}
                        />
                        <span className="font-medium">{party.partyName}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(party.votes)}票 ({formatPercent(party.voteShare)})
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="map">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TokyoHeatmap
                data={heatmapData}
                title={
                  selectedHeatmapParty
                    ? `${selectedHeatmapParty} 得票率分布`
                    : '投票率分布'
                }
                selectedParty={selectedHeatmapParty}
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">表示する政党</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={selectedHeatmapParty}
                  onValueChange={setSelectedHeatmapParty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="政党を選択（投票率表示）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">投票率</SelectItem>
                    {PARTIES.slice(0, 9).map((party) => (
                      <SelectItem key={party.id} value={party.name}>
                        {party.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  政党を選択すると、その政党の区別得票率がヒートマップに表示されます。
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <Header
        title="ダッシュボード"
        description="2026年衆議院選挙 東京都の結果概要"
      />
      <DashboardContent />
    </AppShell>
  );
}
