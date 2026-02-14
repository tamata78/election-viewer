'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { DistrictTable } from '@/components/tables/district-table';
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
  groupByDistrict,
  calculateDistrictSummary,
  filterByYear,
  filterByRegion,
} from '@/lib/data-processor';
import type { ElectionResult, DistrictSummary } from '@/types/election';

function DistrictsContent() {
  const { selectedYear } = useAppState();
  const [data, setData] = useState<ElectionResult[]>([]);
  const [districtSummaries, setDistrictSummaries] = useState<DistrictSummary[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [otaData, meguroData] = await Promise.all([
          loadCSVFile('/data/2026-ota.csv'),
          loadCSVFile('/data/2026-meguro.csv'),
        ]);
        setData([...otaData, ...meguroData]);
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

    if (selectedRegion && selectedRegion !== 'all') {
      filteredData = filterByRegion(filteredData, selectedRegion);
    }

    const grouped = groupByDistrict(filteredData);
    const summaries = Object.values(grouped)
      .map((districtData) => calculateDistrictSummary(districtData))
      .filter((s): s is DistrictSummary => s !== null);

    setDistrictSummaries(summaries);
  }, [data, selectedYear, selectedRegion]);

  const regions = [...new Set(data.map((d) => d.regionName))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger>
              <SelectValue placeholder="地域を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ての地域</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {districtSummaries.length}件の選挙区
        </p>
      </div>

      <DistrictTable
        data={districtSummaries}
        title={
          selectedRegion && selectedRegion !== 'all'
            ? `${selectedRegion} 選挙区別結果`
            : '大田区・目黒区 選挙区別結果'
        }
      />
    </div>
  );
}

export default function DistrictsPage() {
  return (
    <AppShell>
      <Header
        title="選挙区別一覧"
        description="大田区・目黒区の投票区単位の集計結果"
      />
      <DistrictsContent />
    </AppShell>
  );
}
