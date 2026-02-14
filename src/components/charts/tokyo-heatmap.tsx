'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPartyColor } from '@/constants/parties';
import type { HeatmapData } from '@/types/election';
import { formatPercent } from '@/lib/utils';

interface TokyoHeatmapProps {
  data: HeatmapData[];
  title?: string;
  selectedParty?: string;
}

// 東京23区の簡易SVGマップデータ
const TOKYO_WARDS_PATHS: Record<string, { path: string; cx: number; cy: number }> = {
  '千代田区': { path: 'M200,180 L220,175 L235,190 L225,210 L205,205 Z', cx: 215, cy: 192 },
  '中央区': { path: 'M220,200 L245,195 L255,220 L235,230 L220,215 Z', cx: 237, cy: 212 },
  '港区': { path: 'M195,210 L220,205 L230,235 L205,245 L185,230 Z', cx: 207, cy: 225 },
  '新宿区': { path: 'M175,165 L200,160 L210,185 L195,200 L170,190 Z', cx: 190, cy: 180 },
  '文京区': { path: 'M195,150 L220,145 L230,170 L215,185 L190,175 Z', cx: 210, cy: 165 },
  '台東区': { path: 'M230,155 L255,150 L265,175 L250,190 L225,180 Z', cx: 245, cy: 170 },
  '墨田区': { path: 'M260,160 L285,155 L295,185 L275,200 L255,185 Z', cx: 275, cy: 177 },
  '江東区': { path: 'M265,195 L295,190 L310,230 L280,250 L255,225 Z', cx: 280, cy: 220 },
  '品川区': { path: 'M185,240 L215,235 L225,270 L200,285 L175,265 Z', cx: 200, cy: 260 },
  '目黒区': { path: 'M160,235 L185,230 L195,260 L175,275 L150,260 Z', cx: 172, cy: 252 },
  '大田区': { path: 'M150,270 L190,265 L210,310 L170,330 L135,300 Z', cx: 170, cy: 295 },
  '世田谷区': { path: 'M100,230 L150,225 L165,275 L130,295 L85,270 Z', cx: 125, cy: 258 },
  '渋谷区': { path: 'M155,200 L180,195 L190,225 L170,240 L145,225 Z', cx: 167, cy: 217 },
  '中野区': { path: 'M140,175 L165,170 L175,195 L160,210 L135,200 Z', cx: 155, cy: 190 },
  '杉並区': { path: 'M100,175 L140,170 L150,210 L120,230 L85,205 Z', cx: 120, cy: 198 },
  '豊島区': { path: 'M170,145 L195,140 L205,165 L190,180 L165,170 Z', cx: 185, cy: 160 },
  '北区': { path: 'M180,115 L210,110 L225,145 L205,160 L175,145 Z', cx: 198, cy: 135 },
  '荒川区': { path: 'M220,125 L250,120 L260,150 L245,165 L215,155 Z', cx: 240, cy: 142 },
  '板橋区': { path: 'M130,110 L175,105 L185,145 L155,165 L115,145 Z', cx: 150, cy: 132 },
  '練馬区': { path: 'M80,120 L130,115 L145,165 L105,185 L60,155 Z', cx: 105, cy: 148 },
  '足立区': { path: 'M220,80 L275,75 L295,125 L265,155 L215,135 Z', cx: 255, cy: 112 },
  '葛飾区': { path: 'M280,90 L320,85 L335,135 L305,160 L275,130 Z', cx: 305, cy: 120 },
  '江戸川区': { path: 'M300,150 L340,145 L360,210 L325,240 L290,195 Z', cx: 325, cy: 185 },
};

export function TokyoHeatmap({
  data,
  title = '東京都区別ヒートマップ',
  selectedParty,
}: TokyoHeatmapProps) {
  const colorScale = useMemo(() => {
    if (!data.length) return () => '#e5e7eb';

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return (value: number) => {
      if (max === min) return selectedParty ? getPartyColor(selectedParty) : '#3b82f6';

      const normalized = (value - min) / (max - min);
      const baseColor = selectedParty ? getPartyColor(selectedParty) : '#3b82f6';

      // Convert hex to RGB and create opacity-based gradient
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);

      const opacity = 0.2 + normalized * 0.8;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
  }, [data, selectedParty]);

  const dataMap = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        acc[item.regionName] = item;
        return acc;
      },
      {} as Record<string, HeatmapData>
    );
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg viewBox="40 60 340 300" className="w-full h-auto max-h-[400px]">
            {Object.entries(TOKYO_WARDS_PATHS).map(([ward, { path, cx, cy }]) => {
              const wardData = dataMap[ward];
              const value = wardData?.value || 0;
              const fill = colorScale(value);

              return (
                <g key={ward} className="cursor-pointer group">
                  <path
                    d={path}
                    fill={fill}
                    stroke="#fff"
                    strokeWidth="1.5"
                    className="transition-all duration-200 group-hover:stroke-2 group-hover:stroke-gray-800"
                  />
                  <title>
                    {ward}: {formatPercent(value)}
                  </title>
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[8px] fill-gray-700 pointer-events-none font-medium"
                  >
                    {ward.replace('区', '')}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{
                  background: selectedParty
                    ? `linear-gradient(to right, ${getPartyColor(selectedParty)}33, ${getPartyColor(selectedParty)})`
                    : 'linear-gradient(to right, #3b82f633, #3b82f6)',
                }}
              />
              <span className="text-xs text-muted-foreground">
                {selectedParty ? `${selectedParty}得票率` : '投票率'} (低 → 高)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
