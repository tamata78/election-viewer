'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { NationalHireiView } from '@/components/election/NationalHireiView';
import { NationalShouView } from '@/components/election/NationalShouView';
import { Calendar, Building, ListOrdered } from 'lucide-react';
import type { NationalElectionData } from '@/types/national-election';

type ElectionType = 'shugiin' | 'sangiin';

const YEAR_OPTIONS: Record<ElectionType, { value: string; label: string }[]> = {
  shugiin: [
    { value: '2024', label: '令和6年(2024)' },
    { value: '2026', label: '令和8年(2026)' },
  ],
  sangiin: [
    { value: '2022', label: '令和4年(2022)' },
    { value: '2025', label: '令和7年(2025)' },
  ],
};

const ELECTION_DATES: Record<string, string> = {
  'shugiin_2024': '2024年10月27日',
  'shugiin_2026': '2026年2月8日',
  'sangiin_2022': '2022年7月10日',
  'sangiin_2025': '2025年7月20日',
};

function NationalContent() {
  const [electionType, setElectionType] = useState<ElectionType>('shugiin');
  const [year, setYear] = useState('2026');
  const [data, setData] = useState<NationalElectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
