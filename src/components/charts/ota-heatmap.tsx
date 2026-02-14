'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPartyColor } from '@/constants/parties';
import { OTA_DISTRICTS, type OtaDistrictInfo } from '@/constants/ota-district-mapping';
import { formatPercent } from '@/lib/utils';

interface PartyVotes {
  votes: number;
  rate: number;
}

interface DistrictVoteData {
  id: number;
  eligibleVoters: number;
  totalVotes: number;
  invalidVotes: number;
  turnoutRate: number;
  [key: string]: PartyVotes | number;
}

interface OtaHeatmapProps {
  data: DistrictVoteData[];
  selectedParty: string;
  title?: string;
}

// 大田区の投票区を4つのエリアに分けてグリッド配置
const AREA_LAYOUT: Record<string, { gridArea: string; color: string }> = {
  '大森': { gridArea: '1 / 1 / 2 / 2', color: '#3b82f6' },
  '調布': { gridArea: '1 / 2 / 2 / 3', color: '#10b981' },
  '蒲田': { gridArea: '2 / 1 / 3 / 2', color: '#f59e0b' },
  '糀谷・羽田': { gridArea: '2 / 2 / 3 / 3', color: '#ef4444' },
};

export function OtaHeatmap({ data, selectedParty, title = '大田区 投票区別ヒートマップ' }: OtaHeatmapProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<OtaDistrictInfo | null>(null);
  const [hoveredData, setHoveredData] = useState<DistrictVoteData | null>(null);

  const dataMap = useMemo(() => {
    return data.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<number, DistrictVoteData>);
  }, [data]);

  const colorScale = useMemo(() => {
    if (!data.length) return () => '#e5e7eb';

    const values = data.map((d) => {
      const partyData = d[selectedParty] as PartyVotes | undefined;
      return partyData?.rate || 0;
    });
    const min = Math.min(...values);
    const max = Math.max(...values);

    return (value: number) => {
      if (max === min) return getPartyColor(selectedParty);

      const normalized = (value - min) / (max - min);
      const baseColor = getPartyColor(selectedParty);

      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);

      const opacity = 0.2 + normalized * 0.8;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
  }, [data, selectedParty]);

  const districtsByArea = useMemo(() => {
    const grouped: Record<string, OtaDistrictInfo[]> = {
      '大森': [],
      '調布': [],
      '蒲田': [],
      '糀谷・羽田': [],
    };
    OTA_DISTRICTS.forEach((d) => {
      grouped[d.area].push(d);
    });
    return grouped;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* ツールチップ */}
          {hoveredDistrict && hoveredData && (
            <div className="absolute z-50 bg-popover border rounded-lg shadow-lg p-3 pointer-events-none"
              style={{ top: 10, right: 10, minWidth: 200 }}>
              <p className="font-bold text-sm">{hoveredDistrict.name}</p>
              <p className="text-xs text-muted-foreground mb-2">
                {hoveredDistrict.towns.join('、')}
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>選挙区:</span>
                  <span className="font-medium">{hoveredDistrict.senkyoku}</span>
                </div>
                <div className="flex justify-between">
                  <span>{selectedParty} 得票率:</span>
                  <span className="font-bold" style={{ color: getPartyColor(selectedParty) }}>
                    {formatPercent((hoveredData[selectedParty] as PartyVotes)?.rate || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>投票率:</span>
                  <span>{formatPercent(hoveredData.turnoutRate)}</span>
                </div>
              </div>
            </div>
          )}

          {/* グリッドレイアウト */}
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(districtsByArea).map(([area, districts]) => (
              <div key={area} className="border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: AREA_LAYOUT[area].color }}
                  />
                  {area}エリア
                  <span className="text-xs text-muted-foreground">
                    ({districts[0]?.senkyoku})
                  </span>
                </h4>
                <div className="grid grid-cols-6 gap-1">
                  {districts.map((district) => {
                    const districtData = dataMap[district.id];
                    const partyData = districtData?.[selectedParty] as PartyVotes | undefined;
                    const rate = partyData?.rate || 0;
                    const fill = colorScale(rate);

                    return (
                      <div
                        key={district.id}
                        className="aspect-square rounded cursor-pointer transition-all hover:ring-2 hover:ring-primary hover:scale-110 relative group"
                        style={{ backgroundColor: fill }}
                        onMouseEnter={() => {
                          setHoveredDistrict(district);
                          setHoveredData(districtData || null);
                        }}
                        onMouseLeave={() => {
                          setHoveredDistrict(null);
                          setHoveredData(null);
                        }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-medium text-white drop-shadow-md">
                          {district.id}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 凡例 */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div
                className="w-20 h-4 rounded"
                style={{
                  background: `linear-gradient(to right, ${getPartyColor(selectedParty)}33, ${getPartyColor(selectedParty)})`,
                }}
              />
              <span className="text-xs text-muted-foreground">
                {selectedParty}得票率 (低 → 高)
              </span>
            </div>
          </div>

          {/* 選挙区の説明 */}
          <div className="mt-4 flex gap-4 justify-center text-xs text-muted-foreground">
            <span>第4区: 大森・蒲田・糀谷/羽田エリア</span>
            <span>第26区: 調布エリア</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
