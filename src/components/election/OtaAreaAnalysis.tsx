'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OTA_DISTRICTS, getDistrictById, OTA_AREAS } from '@/constants/ota-district-mapping';
import { calculateDistrictRatio } from '@/lib/election-utils';
import { formatNumber, formatPercent } from '@/lib/utils';
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

interface DistrictData {
  id: number;
  dayOfEligibleVoters: number;  // 当日有権者数
  dayOfVoters: number;          // 当日投票者数
  dayOfTurnoutRate: number;     // 当日投票率
  earlyVoters: number;          // 期日前投票者数
  absenteeVoters: number;       // 不在者投票者数
  totalVoters: number;          // 総投票者数
  totalTurnoutRate: number;     // 総投票率
}

interface OtaAreaAnalysisProps {
  districts2024: DistrictData[];
  districts2026: DistrictData[];
  totalVoters2024: number;
  totalVoters2026: number;
  selectedYear: '2024' | '2026';
}

type SortKey = 'id' | 'ratio' | 'totalTurnoutRate' | 'totalVoters' | 'ratioDiff' | 'dayOfTurnoutRate' | 'earlyVoters';
type SortOrder = 'asc' | 'desc';

export function OtaAreaAnalysis({
  districts2024,
  districts2026,
  totalVoters2024,
  totalVoters2026,
  selectedYear,
}: OtaAreaAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const districts = selectedYear === '2024' ? districts2024 : districts2026;
  const totalVoters = selectedYear === '2024' ? totalVoters2024 : totalVoters2026;

  // 2024年データをマップ化
  const districts2024Map = useMemo(() => {
    return districts2024.reduce((acc, d) => {
      acc[d.id] = d;
      return acc;
    }, {} as Record<number, DistrictData>);
  }, [districts2024]);

  // 2026年データをマップ化
  const districts2026Map = useMemo(() => {
    return districts2026.reduce((acc, d) => {
      acc[d.id] = d;
      return acc;
    }, {} as Record<number, DistrictData>);
  }, [districts2026]);

  const enrichedDistricts = useMemo(() => {
    return districts.map((d) => {
      const info = getDistrictById(d.id);
      const ratio = calculateDistrictRatio(d.totalVoters, totalVoters);

      // 比較用データ
      const d2024 = districts2024Map[d.id];
      const d2026 = districts2026Map[d.id];
      const ratio2024 = d2024 ? calculateDistrictRatio(d2024.totalVoters, totalVoters2024) : 0;
      const ratio2026 = d2026 ? calculateDistrictRatio(d2026.totalVoters, totalVoters2026) : 0;
      const ratioDiff = ratio2026 - ratio2024;

      return {
        ...d,
        info,
        ratio,
        ratio2024,
        ratio2026,
        ratioDiff,
      };
    });
  }, [districts, totalVoters, districts2024Map, districts2026Map, totalVoters2024, totalVoters2026]);

  const filteredAndSortedDistricts = useMemo(() => {
    let result = enrichedDistricts.filter((d) => {
      // エリアフィルター
      if (selectedArea !== 'all' && d.info?.area !== selectedArea) return false;

      // 検索フィルター
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const townMatch = d.info?.towns.some((t) => t.toLowerCase().includes(term));
        const idMatch = d.id.toString().includes(term);
        const nameMatch = d.info?.name.toLowerCase().includes(term);
        if (!townMatch && !idMatch && !nameMatch) return false;
      }

      return true;
    });

    // ソート
    result.sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortKey) {
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        case 'ratio':
          aVal = a.ratio;
          bVal = b.ratio;
          break;
        case 'totalTurnoutRate':
          aVal = a.totalTurnoutRate;
          bVal = b.totalTurnoutRate;
          break;
        case 'dayOfTurnoutRate':
          aVal = a.dayOfTurnoutRate;
          bVal = b.dayOfTurnoutRate;
          break;
        case 'totalVoters':
          aVal = a.totalVoters;
          bVal = b.totalVoters;
          break;
        case 'earlyVoters':
          aVal = a.earlyVoters;
          bVal = b.earlyVoters;
          break;
        case 'ratioDiff':
          aVal = a.ratioDiff;
          bVal = b.ratioDiff;
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [enrichedDistricts, selectedArea, searchTerm, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // エリア別集計
  const areaSummary = useMemo(() => {
    const summary: Record<string, { totalVoters: number; count: number; ratio: number }> = {};

    enrichedDistricts.forEach((d) => {
      const area = d.info?.area || 'その他';
      if (!summary[area]) {
        summary[area] = { totalVoters: 0, count: 0, ratio: 0 };
      }
      summary[area].totalVoters += d.totalVoters;
      summary[area].count += 1;
    });

    Object.keys(summary).forEach((area) => {
      summary[area].ratio = calculateDistrictRatio(summary[area].totalVoters, totalVoters);
    });

    return summary;
  }, [enrichedDistricts, totalVoters]);

  return (
    <div className="space-y-4">
      {/* エリア別サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {OTA_AREAS.map((area) => {
          const data = areaSummary[area];
          return (
            <Card
              key={area}
              className={`cursor-pointer transition-all ${
                selectedArea === area ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedArea(selectedArea === area ? 'all' : area)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="text-sm font-medium">{area}</div>
                <div className="text-2xl font-bold">{formatPercent(data?.ratio || 0)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(data?.totalVoters || 0)}人 / {data?.count || 0}投票区
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* フィルター・検索 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">町名・投票区検索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="町名または投票区番号で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="min-w-[140px]">
              <label className="text-sm font-medium mb-2 block">エリア</label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全エリア</SelectItem>
                  {OTA_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredAndSortedDistricts.length}件 / {districts.length}件
            </div>
          </div>
        </CardContent>
      </Card>

      {/* テーブル */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            投票区別 投票者数一覧（{selectedYear}年）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead
                    className="w-16 cursor-pointer hover:bg-muted"
                    onClick={() => toggleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      投票区
                      {sortKey === 'id' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[120px]">町名</TableHead>
                  <TableHead className="text-right">当日有権者数</TableHead>
                  <TableHead className="text-right">当日投票者数</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted"
                    onClick={() => toggleSort('dayOfTurnoutRate')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      当日投票率
                      {sortKey === 'dayOfTurnoutRate' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted"
                    onClick={() => toggleSort('earlyVoters')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      期日前投票者数
                      {sortKey === 'earlyVoters' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">不在者投票者数</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted"
                    onClick={() => toggleSort('totalVoters')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      総投票者数
                      {sortKey === 'totalVoters' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted"
                    onClick={() => toggleSort('totalTurnoutRate')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      総投票率
                      {sortKey === 'totalTurnoutRate' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted"
                    onClick={() => toggleSort('ratio')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      投票区比率
                      {sortKey === 'ratio' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted"
                    onClick={() => toggleSort('ratioDiff')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      前回比
                      {sortKey === 'ratioDiff' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedDistricts.map((d, index) => {
                  const isTop3 = sortKey === 'ratio' && sortOrder === 'desc' && index < 3;

                  return (
                    <TableRow key={d.id} className={isTop3 ? 'bg-accent/30' : ''}>
                      <TableCell className="font-medium">
                        {isTop3 ? (
                          <Badge
                            className={
                              index === 0
                                ? 'bg-yellow-500'
                                : index === 1
                                ? 'bg-gray-400'
                                : 'bg-amber-600'
                            }
                          >
                            {d.id}
                          </Badge>
                        ) : (
                          <span>第{d.id}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="truncate max-w-[150px]" title={d.info?.towns.join('、')}>
                          {d.info?.towns.slice(0, 2).join('、')}
                          {(d.info?.towns.length || 0) > 2 && '...'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(d.dayOfEligibleVoters)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(d.dayOfVoters)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {d.dayOfTurnoutRate.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(d.earlyVoters)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(d.absenteeVoters)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {formatNumber(d.totalVoters)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {d.totalTurnoutRate.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold text-primary">
                        {d.ratio.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {d.ratioDiff > 0.01 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : d.ratioDiff < -0.01 ? (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          ) : null}
                          <span
                            className={`font-mono text-xs ${
                              d.ratioDiff > 0.01
                                ? 'text-green-600'
                                : d.ratioDiff < -0.01
                                ? 'text-red-600'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {d.ratioDiff > 0 ? '+' : ''}
                            {d.ratioDiff.toFixed(2)}%
                          </span>
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
    </div>
  );
}
