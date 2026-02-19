'use client';

import { useState } from 'react';

interface PrefectureData {
  id: string;
  name: string;
  region: string;
  turnout: number;
  votes_by_party: Record<string, number>;
  winner_count: Record<string, number>;
  total_seats: number;
}

interface JapanTileMapProps {
  prefectures: PrefectureData[];
  selectedId: string | null;
  onSelect: (pref: PrefectureData) => void;
  colorKey?: 'turnout' | 'party';
  highlightParty?: string;
}

// 都道府県タイルの配置 (col, row) — 0-indexed
const TILE_POSITIONS: Record<string, { col: number; row: number; short: string }> = {
  '01': { col: 10, row: 1, short: '北海' },
  '02': { col: 9,  row: 2, short: '青森' },
  '03': { col: 10, row: 3, short: '岩手' },
  '04': { col: 9,  row: 3, short: '宮城' },
  '05': { col: 8,  row: 2, short: '秋田' },
  '06': { col: 8,  row: 3, short: '山形' },
  '07': { col: 8,  row: 4, short: '福島' },
  '08': { col: 10, row: 5, short: '茨城' },
  '09': { col: 9,  row: 5, short: '栃木' },
  '10': { col: 8,  row: 5, short: '群馬' },
  '11': { col: 9,  row: 6, short: '埼玉' },
  '12': { col: 10, row: 6, short: '千葉' },
  '13': { col: 9,  row: 7, short: '東京' },
  '14': { col: 9,  row: 8, short: '神奈' },
  '15': { col: 7,  row: 4, short: '新潟' },
  '16': { col: 6,  row: 5, short: '富山' },
  '17': { col: 5,  row: 4, short: '石川' },
  '18': { col: 5,  row: 5, short: '福井' },
  '19': { col: 8,  row: 7, short: '山梨' },
  '20': { col: 7,  row: 6, short: '長野' },
  '21': { col: 6,  row: 6, short: '岐阜' },
  '22': { col: 8,  row: 8, short: '静岡' },
  '23': { col: 6,  row: 7, short: '愛知' },
  '24': { col: 6,  row: 8, short: '三重' },
  '25': { col: 5,  row: 7, short: '滋賀' },
  '26': { col: 5,  row: 8, short: '京都' },
  '27': { col: 5,  row: 9, short: '大阪' },
  '28': { col: 4,  row: 8, short: '兵庫' },
  '29': { col: 6,  row: 9, short: '奈良' },
  '30': { col: 6,  row: 10, short: '和歌' },
  '31': { col: 4,  row: 7, short: '鳥取' },
  '32': { col: 3,  row: 7, short: '島根' },
  '33': { col: 4,  row: 9, short: '岡山' },
  '34': { col: 3,  row: 9, short: '広島' },
  '35': { col: 2,  row: 9, short: '山口' },
  '36': { col: 6,  row: 11, short: '徳島' },
  '37': { col: 5,  row: 11, short: '香川' },
  '38': { col: 4,  row: 11, short: '愛媛' },
  '39': { col: 5,  row: 12, short: '高知' },
  '40': { col: 2,  row: 11, short: '福岡' },
  '41': { col: 1,  row: 12, short: '佐賀' },
  '42': { col: 1,  row: 11, short: '長崎' },
  '43': { col: 2,  row: 12, short: '熊本' },
  '44': { col: 3,  row: 11, short: '大分' },
  '45': { col: 3,  row: 12, short: '宮崎' },
  '46': { col: 2,  row: 13, short: '鹿児' },
  '47': { col: 0,  row: 15, short: '沖縄' },
};

// 投票率に応じた青のグラデーション色を返す
function getTurnoutColor(turnout: number, selected: boolean, highlighted: boolean): string {
  if (selected) return '#1d4ed8'; // blue-700
  if (highlighted) return '#3b82f6'; // blue-500

  if (turnout >= 60) return '#1e3a5f';
  if (turnout >= 55) return '#1e40af';
  if (turnout >= 50) return '#1d4ed8';
  if (turnout >= 45) return '#2563eb';
  if (turnout >= 40) return '#3b82f6';
  if (turnout >= 35) return '#60a5fa';
  return '#93c5fd';
}

const CELL_W = 38;
const CELL_H = 34;
const GAP = 2;
const MAX_COL = 11;
const MAX_ROW = 16;
const MAP_W = MAX_COL * (CELL_W + GAP);
const MAP_H = MAX_ROW * (CELL_H + GAP);

export function JapanTileMap({
  prefectures,
  selectedId,
  onSelect,
  colorKey = 'turnout',
}: JapanTileMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; pref: PrefectureData } | null>(null);

  const prefMap = Object.fromEntries(prefectures.map((p) => [p.id, p]));

  const handleMouseEnter = (
    e: React.MouseEvent<SVGGElement>,
    pref: PrefectureData
  ) => {
    setHoveredId(pref.id);
    const rect = (e.currentTarget.closest('svg') as SVGElement).getBoundingClientRect();
    const svgRect = (e.currentTarget.closest('svg') as SVGElement).getBoundingClientRect();
    const gRect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: gRect.left - svgRect.left + CELL_W / 2,
      y: gRect.top - rect.top,
      pref,
    });
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    setTooltip(null);
  };

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        width="100%"
        style={{ maxWidth: MAP_W, display: 'block', margin: '0 auto' }}
        className="select-none"
      >
        {Object.entries(TILE_POSITIONS).map(([id, pos]) => {
          const pref = prefMap[id];
          if (!pref) return null;

          const x = pos.col * (CELL_W + GAP);
          const y = pos.row * (CELL_H + GAP);
          const isSelected = selectedId === id;
          const isHovered = hoveredId === id;
          const fillColor = getTurnoutColor(pref.turnout, isSelected, isHovered);
          const textColor = pref.turnout >= 40 ? '#fff' : '#1e40af';

          return (
            <g
              key={id}
              transform={`translate(${x}, ${y})`}
              onClick={() => onSelect(pref)}
              onMouseEnter={(e) => handleMouseEnter(e, pref)}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: 'pointer' }}
            >
              <rect
                width={CELL_W}
                height={CELL_H}
                rx={3}
                ry={3}
                fill={fillColor}
                stroke={isSelected ? '#facc15' : isHovered ? '#f8fafc' : 'rgba(255,255,255,0.3)'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.5}
                style={{ transition: 'fill 0.15s' }}
              />
              {/* Prefecture name */}
              <text
                x={CELL_W / 2}
                y={CELL_H / 2 - 3}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontWeight={isSelected ? 'bold' : 'normal'}
                fill={pref.turnout >= 40 ? '#fff' : '#1e3a8a'}
              >
                {pos.short}
              </text>
              {/* Turnout */}
              <text
                x={CELL_W / 2}
                y={CELL_H / 2 + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8}
                fill={pref.turnout >= 40 ? 'rgba(255,255,255,0.85)' : '#2563eb'}
              >
                {pref.turnout.toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <g transform={`translate(${Math.min(tooltip.x - 60, MAP_W - 140)}, ${Math.max(tooltip.y - 80, 4)})`}>
            <rect
              width={130}
              height={72}
              rx={5}
              ry={5}
              fill="#1e293b"
              opacity={0.95}
              stroke="#475569"
              strokeWidth={1}
            />
            <text x={8} y={18} fontSize={11} fontWeight="bold" fill="#f1f5f9">
              {tooltip.pref.name}
            </text>
            <text x={8} y={34} fontSize={10} fill="#94a3b8">
              投票率: {tooltip.pref.turnout.toFixed(1)}%
            </text>
            <text x={8} y={50} fontSize={10} fill="#94a3b8">
              議席: {tooltip.pref.total_seats}
            </text>
            <text x={8} y={65} fontSize={9} fill="#64748b">
              クリックで詳細を表示
            </text>
          </g>
        )}
      </svg>

      {/* 凡例 */}
      <div className="flex items-center gap-2 mt-2 justify-center text-xs text-muted-foreground">
        <span>投票率</span>
        {[
          { color: '#93c5fd', label: '~35%' },
          { color: '#3b82f6', label: '40%' },
          { color: '#2563eb', label: '45%' },
          { color: '#1d4ed8', label: '50%' },
          { color: '#1e40af', label: '55%' },
          { color: '#1e3a5f', label: '60%+' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-0.5">
            <span className="w-4 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
