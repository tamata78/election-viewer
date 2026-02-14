'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { SummaryTable } from '@/components/tables/summary-table';
import { PartyBarChart } from '@/components/charts/party-bar-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppState } from '@/components/providers';
import { loadCSVFile } from '@/lib/csv-parser';
import {
  groupByWard,
  calculateWardSummary,
  calculatePartyTotals,
  filterByYear,
} from '@/lib/data-processor';
import { formatNumber, formatPercent } from '@/lib/utils';
import { getPartyColor } from '@/constants/parties';
import type { ElectionResult, WardSummary, PartyResult } from '@/types/election';

function SummaryContent() {
  const { selectedYear, selectedParties } = useAppState();
  const [data, setData] = useState<ElectionResult[]>([]);
  const [wardSummaries, setWardSummaries] = useState<WardSummary[]>([]);
  const [partyTotals, setPartyTotals] = useState<PartyResult[]>([]);
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
    const filteredData = filterByYear(data, selectedYear);

    const grouped = groupByWard(filteredData);
    const summaries = Object.values(grouped)
      .map((wardData) => calculateWardSummary(wardData))
      .filter((s): s is WardSummary => s !== null)
      .sort((a, b) => a.wardName.localeCompare(b.wardName));

    setWardSummaries(summaries);

    const totals = calculatePartyTotals(filteredData);
    setPartyTotals(totals);
  }, [data, selectedYear]);

  const totalVotes = wardSummaries.reduce((sum, w) => sum + w.totalVotes, 0);
  const totalSeats = wardSummaries.reduce((sum, w) => sum + w.seats, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">区市町村数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wardSummaries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総得票数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalVotes)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総議席数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSeats}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">テーブル</TabsTrigger>
          <TabsTrigger value="chart">チャート</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <SummaryTable
            data={wardSummaries}
            title="東京都 区市町村別サマリー"
            selectedParties={selectedParties}
          />
        </TabsContent>

        <TabsContent value="chart">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PartyBarChart
              data={
                selectedParties.length > 0
                  ? partyTotals.filter((p) =>
                      selectedParties.includes(p.partyName)
                    )
                  : partyTotals
              }
              title="政党別得票率"
              dataKey="voteShare"
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">政党別詳細</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partyTotals
                    .filter(
                      (p) =>
                        selectedParties.length === 0 ||
                        selectedParties.includes(p.partyName)
                    )
                    .map((party) => (
                      <div key={party.partyName} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: getPartyColor(party.partyName),
                              }}
                            />
                            <span className="font-medium">{party.partyName}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {party.seats}議席
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${party.voteShare}%`,
                              backgroundColor: getPartyColor(party.partyName),
                            }}
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatPercent(party.voteShare)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(party.votes)}票
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <AppShell>
      <Header
        title="区別サマリー"
        description="東京23区＋多摩地域の区市町村別集計"
      />
      <SummaryContent />
    </AppShell>
  );
}
