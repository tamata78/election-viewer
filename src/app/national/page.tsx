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

function NationalContent() {
  const [year, setYear] = useState<'2024' | '2026'>('2026');
  const [data, setData] = useState<NationalElectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/data/elections/shugiin_${year}.json`)
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
  }, [year]);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* コントロールパネル */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">年度:</span>
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setYear('2024')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    year === '2024'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  令和6年(2024)
                </button>
                <button
                  onClick={() => setYear('2026')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    year === '2026'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  令和8年(2026)
                </button>
              </div>
            </div>

            <Badge variant="outline" className="ml-auto">
              {year === '2024' ? '2024年10月27日' : '2026年2月8日'} 執行
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
                データファイル（data/elections/shugiin_{year}.json）を配置してください
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
              小選挙区
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
        description="衆議院選挙 全国分析（小選挙区・比例代表）"
      />
      <NationalContent />
    </AppShell>
  );
}
