'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { NationalHireiView } from '@/components/election/NationalHireiView';
import { NationalShouView } from '@/components/election/NationalShouView';
import { VoteRateTrendChart } from '@/components/election/VoteRateTrendChart';
import { Calendar, Building, ListOrdered, TrendingUp } from 'lucide-react';
import type { NationalElectionData } from '@/types/national-election';

interface NationalTrendData {
  shugiin_hirei: Array<Record<string, string | number>>;
  sangiin_hirei: Array<Record<string, string | number>>;
}

const TREND_PARTIES = ['自由民主党', '立憲民主党', '公明党', '日本共産党', '日本維新の会', '国民民主党', 'れいわ新選組', '参政党'];

type ElectionType = 'shugiin' | 'sangiin';

const YEAR_OPTIONS: Record<ElectionType, { value: string; label: string }[]> = {
  shugiin: [
    { value: '2017', label: '平成29年(2017)' },
    { value: '2024', label: '令和6年(2024)' },
    { value: '2026', label: '令和8年(2026)' },
  ],
  sangiin: [
    { value: '2019', label: '令和元年(2019)' },
    { value: '2022', label: '令和4年(2022)' },
    { value: '2025', label: '令和7年(2025)' },
  ],
};

const ELECTION_DATES: Record<string, string> = {
  'shugiin_2017': '2017年10月22日',
  'shugiin_2024': '2024年10月27日',
  'shugiin_2026': '2026年2月8日',
  'sangiin_2019': '2019年7月21日',
  'sangiin_2022': '2022年7月10日',
  'sangiin_2025': '2025年7月20日',
};

function NationalContent() {
  const [electionType, setElectionType] = useState<ElectionType>('shugiin');
  const [year, setYear] = useState('2026');
  const [data, setData] = useState<NationalElectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [trendData, setTrendData] = useState<NationalTrendData | null>(null);

  useEffect(() => {
    fetch('/data/elections/national_party_trends.json')
      .then((r) => r.json())
      .then((json) => setTrendData(json as NationalTrendData))
      .catch(console.error);
  }, []);

  // 選挙種別変更時に年度をリセット
  useEffect(() => {
    const options = YEAR_OPTIONS[electionType];
    const validYears = options.map((o) => o.value);
    if (!validYears.includes(year)) {
      setYear(options[options.length - 1].value);
    }
  }, [electionType, year]);

  // year が electionType に対して有効な場合のみフェッチ
  const validYears = YEAR_OPTIONS[electionType].map((o) => o.value);
  const isValidCombination = validYears.includes(year);

  useEffect(() => {
    if (!isValidCombination) return;
    setLoading(true);
    setError(false);
    fetch(`/data/elections/${electionType}_${year}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setError(true);
        setLoading(false);
      });
  }, [electionType, year, isValidCombination]);

  const isSangiin = electionType === 'sangiin';
  const dateKey = `${electionType}_${year}`;
  const districtLabel = isSangiin ? '選挙区' : '小選挙区';

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* コントロールパネル */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* 選挙種別セレクタ */}
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">選挙:</span>
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setElectionType('shugiin')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    electionType === 'shugiin'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  衆議院
                </button>
                <button
                  onClick={() => setElectionType('sangiin')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    electionType === 'sangiin'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  参議院
                </button>
              </div>
            </div>

            {/* 年度セレクタ */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">年度:</span>
              <div className="flex border rounded-lg overflow-hidden">
                {YEAR_OPTIONS[electionType].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setYear(opt.value)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      year === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Badge variant="outline" className="ml-auto">
              {ELECTION_DATES[dateKey] ?? `${year}年`} 執行
            </Badge>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">
                {year}年のデータはまだ用意されていません
              </p>
              <p className="text-sm text-muted-foreground">
                データファイル（data/elections/{electionType}_{year}.json）を配置してください
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
        <Tabs defaultValue="shou" className="space-y-4">
          <TabsList>
            <TabsTrigger value="shou" className="gap-1 md:gap-2">
              <Building className="h-4 w-4 hidden sm:block" />
              {districtLabel}
            </TabsTrigger>
            <TabsTrigger value="hirei" className="gap-1 md:gap-2">
              <ListOrdered className="h-4 w-4 hidden sm:block" />
              比例代表
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shou">
            <NationalShouView
              prefectures={data.shou.prefectures}
              totalSeats={data.shou.totalSeats}
            />
          </TabsContent>

          <TabsContent value="hirei">
            <NationalHireiView
              blocks={data.hirei.blocks}
              totalSeats={data.hirei.totalSeats}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* 得票率推移グラフ（常時表示） */}
      {trendData && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">比例代表 得票率推移</h2>
            <Badge variant="outline" className="text-xs">過去3回分</Badge>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">衆院比例 得票率推移（2017・2021・2024年）</CardTitle>
              </CardHeader>
              <CardContent>
                <VoteRateTrendChart
                  data={trendData.shugiin_hirei.map((d) => ({ ...d, year: String(d.year) }))}
                  parties={TREND_PARTIES}
                  defaultChartType="line"
                  note="総務省「衆議院議員総選挙比例代表結果」"
                  height={280}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">参院比例 得票率推移（2019・2022・2025年）</CardTitle>
              </CardHeader>
              <CardContent>
                <VoteRateTrendChart
                  data={trendData.sangiin_hirei.map((d) => ({ ...d, year: String(d.year) }))}
                  parties={TREND_PARTIES}
                  defaultChartType="line"
                  note="総務省「参議院議員通常選挙比例代表結果」"
                  height={280}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NationalPage() {
  return (
    <AppShell>
      <Header
        title="全国分析"
        description="国政選挙 全国分析（選挙区・比例代表）"
      />
      <NationalContent />
    </AppShell>
  );
}
