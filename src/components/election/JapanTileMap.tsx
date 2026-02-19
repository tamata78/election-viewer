'use client';

import { useState } from 'react';

export interface TileMapPrefectureData {
  id: string;
  name: string;
  region: string;
  turnout: number;
  votes_by_party: Record<string, number>;
  winner_count: Record<string, number>;
  total_seats: number;
}

export type MapColorMode = 'turnout' | 'party' | 'change';

interface JapanTileMapProps {
  prefectures: TileMapPrefectureData[];
  selectedId: string | null;
  onSelect: (pref: TileMapPrefectureData) => void;
  colorMode?: MapColorMode;
  colorParty?: string;
  prevPrefectures?: TileMapPrefectureData[];
}

// 都道府県タイル配置 (col, row) — 0-indexed
const TILE_POSITIONS: Record<string, { col: number; row: number; short: string }> = {
  '01': { col: 10, row: 1,  short: '北海' },
  '02': { col: 9,  row: 2,  short: '青森' },
  '03': { col: 10, row: 3,  short: '岩手' },
  '04': { col: 9,  row: 3,  short: '宮城' },
  '05': { col: 8,  row: 2,  short: '秋田' },
  '06': { col: 8,  row: 3,  short: '山形' },
  '07': { col: 8,  row: 4,  short: '福島' },
  '08': { col: 10, row: 5,  short: '茨城' },
  '09': { col: 9,  row: 5,  short: '栃木' },
  '10': { col: 8,  row: 5,  short: '群馬' },
  '11': { col: 9,  row: 6,  short: '埼玉' },
  '12': { col: 10, row: 6,  short: '千葉' },
  '13': { col: 9,  row: 7,  short: '東京' },
  '14': { col: 9,  row: 8,  short: '神奈' },
  '15': { col: 7,  row: 4,  short: '新潟' },
  '16': { col: 6,  row: 5,  short: '富山' },
  '17': { col: 5,  row: 4,  short: '石川' },
  '18': { col: 5,  row: 5,  short: '福井' },
  '19': { col: 8,  row: 7,  short: '山梨' },
  '20': { col: 7,  row: 6,  short: '長野' },
  '21': { col: 6,  row: 6,  short: '岐阜' },
  '22': { col: 8,  row: 8,  short: '静岡' },
  '23': { col: 6,  row: 7,  short: '愛知' },
  '24': { col: 6,  row: 8,  short: '三重' },
  '25': { col: 5,  row: 7,  short: '滋賀' },
  '26': { col: 5,  row: 8,  short: '京都' },
  '27': { col: 5,  row: 9,  short: '大阪' },
  '28': { col: 4,  row: 8,  short: '兵庫' },
  '29': { col: 6,  row: 9,  short: '奈良' },
  '30': { col: 6,  row: 10, short: '和歌' },
  '31': { col: 4,  row: 7,  short: '鳥取' },
  '32': { col: 3,  row: 7,  short: '島根' },
  '33': { col: 4,  row: 9,  short: '岡山' },
  '34': { col: 3,  row: 9,  short: '広島' },
  '35': { col: 2,  row: 9,  short: '山口' },
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

// HEX → RGBA with opacity
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// 投票率ヒートマップ（青系）
function getTurnoutColor(turnout: number): string {
  if (turnout >= 60) return '#1e3a5f';
  if (turnout >= 55) return '#1e40af';
  if (turnout >= 50) return '#1d4ed8';
  if (turnout >= 45) return '#2563eb';
  if (turnout >= 40) return '#3b82f6';
  if (turnout >= 35) return '#60a5fa';
  return '#93c5fd';
}

// 得票率 → 政党カラーのopacity
function getPartyRateColor(rate: number, partyHex: string): string {
  const alpha = Math.min(0.25 + (rate / 55) * 0.75, 1);
  return hexToRgba(partyHex, alpha);
}

// 前回比変化 → 緑/赤グラデーション
function getChangeColor(diff: number): string {
  if (diff >= 4)  return '#14532d';  // dark green
  if (diff >= 2)  return '#16a34a';
  if (diff >= 0)  return '#4ade80';  // light green
  if (diff >= -2) return '#fca5a5';  // light red
  if (diff >= -4) return '#dc2626';
  return '#7f1d1d';                  // dark red
}

// 政党名→簡易HEX
const PARTY_COLOR_MAP: Record<string, string> = {
  '自民党': '#e60012',
  '立憲民主党': '#00509d',
  '公明党': '#f39800',
  '共産党': '#c8161d',
  '維新の会': '#00a651',
  '国民民主党': '#ffd700',
  '都民ファースト': '#ff69b4',
  '無所属・その他': '#808080',
};

function getPartyHex(partyName: string): string {
  return PARTY_COLOR_MAP[partyName] ?? '#808080';
}

function isLightColor(hex: string): boolean {
  if (!hex.startsWith('#') || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140;
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
  colorMode = 'turnout',
  colorParty = '自民党',
  prevPrefectures,
}: JapanTileMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; pref: TileMapPrefectureData; diff: number | null;
  } | null>(null);

  const prefMap = Object.fromEntries(prefectures.map((p) => [p.id, p]));
  const prevPrefMap = prevPrefectures
    ? Object.fromEntries(prevPrefectures.map((p) => [p.id, p]))
    : {};

  const getCellColor = (pref: TileMapPrefectureData, isSelected: boolean, isHovered: boolean): string => {
    if (isSelected) return '#1d4ed8';
    if (isHovered) return '#60a5fa';

    if (colorMode === 'turnout') return getTurnoutColor(pref.turnout);

    if (colorMode === 'party') {
      const rate = pref.votes_by_party[colorParty] ?? 0;
      const hex = getPartyHex(colorParty);
      return getPartyRateColor(rate, hex);
    }

    if (colorMode === 'change') {
      const prev = prevPrefMap[pref.id];
      if (!prev) return getTurnoutColor(pref.turnout);
      const diff = pref.turnout - prev.turnout;
      return getChangeColor(diff);
    }

    return getTurnoutColor(pref.turnout);
  };

  const getTextColor = (bgColor: string, isSelected: boolean): string => {
    if (isSelected) return '#fff';
    // パーティモードで薄い色の場合は暗色テキスト
    if (colorMode === 'party' && bgColor.startsWith('rgba')) {
      const alpha = parseFloat(bgColor.split(',')[3] ?? '1');
      return alpha < 0.5 ? '#1e3a8a' : '#fff';
    }
    return isLightColor(bgColor) ? '#1e3a8a' : '#fff';
  };

  const handleMouseEnter = (
    e: React.MouseEvent<SVGGElement>,
    pref: TileMapPrefectureData
  ) => {
    setHoveredId(pref.id);
    const svgRect = (e.currentTarget.closest('svg') as SVGElement).getBoundingClientRect();
    const gRect = e.currentTarget.getBoundingClientRect();
    const prev = prevPrefMap[pref.id];
    const diff = prev ? pref.turnout - prev.turnout : null;
    setTooltip({
      x: gRect.left - svgRect.left + CELL_W / 2,
      y: gRect.top - svgRect.top,
      pref,
      diff,
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
          const fillColor = getCellColor(pref, isSelected, isHovered);
          const txtColor = getTextColor(fillColor, isSelected);

          // 変化量の表示テキスト
          const prev = prevPrefMap[id];
          let subText = `${pref.turnout.toFixed(1)}%`;
          if (colorMode === 'party') {
            const rate = pref.votes_by_party[colorParty] ?? 0;
            subText = `${rate.toFixed(1)}%`;
          } else if (colorMode === 'change' && prev) {
            const diff = pref.turnout - prev.turnout;
            subText = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`;
          }

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
                stroke={
                  isSelected
                    ? '#facc15'
                    : isHovered
                    ? '#f8fafc'
                    : 'rgba(255,255,255,0.25)'
                }
                strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.5}
                style={{ transition: 'fill 0.12s' }}
              />
              <text
                x={CELL_W / 2}
                y={CELL_H / 2 - 3}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontWeight={isSelected ? 'bold' : 'normal'}
                fill={txtColor}
              >
                {pos.short}
              </text>
              <text
                x={CELL_W / 2}
                y={CELL_H / 2 + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8}
                fill={txtColor}
                opacity={0.85}
              >
                {subText}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const tx = Math.min(tooltip.x - 70, MAP_W - 150);
          const ty = Math.max(tooltip.y - 90, 4);
          const rate = colorMode === 'party'
            ? (tooltip.pref.votes_by_party[colorParty] ?? 0)
            : null;
          return (
            <g transform={`translate(${tx}, ${ty})`}>
              <rect width={140} height={colorMode === 'change' ? 80 : 72} rx={5} ry={5}
                fill="#1e293b" opacity={0.95} stroke="#475569" strokeWidth={1} />
              <text x={8} y={18} fontSize={11} fontWeight="bold" fill="#f1f5f9">
                {tooltip.pref.name}
              </text>
              <text x={8} y={34} fontSize={10} fill="#94a3b8">
                投票率: {tooltip.pref.turnout.toFixed(1)}%
              </text>
              {rate !== null && (
                <text x={8} y={50} fontSize={10} fill="#94a3b8">
                  {colorParty.slice(0, 5)}: {rate.toFixed(1)}%
                </text>
              )}
              {colorMode === 'change' && tooltip.diff !== null && (
                <text x={8} y={50} fontSize={10}
                  fill={tooltip.diff >= 0 ? '#4ade80' : '#f87171'}>
                  前回比: {tooltip.diff >= 0 ? '+' : ''}{tooltip.diff.toFixed(1)}pt
                </text>
              )}
              <text x={8} y={colorMode !== 'turnout' ? 65 : 50} fontSize={9} fill="#64748b">
                議席: {tooltip.pref.total_seats} / クリックで詳細
              </text>
            </g>
          );
        })()}
      </svg>

      {/* 凡例 */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2 justify-center text-xs text-muted-foreground">
        {colorMode === 'turnout' && (
          <>
            <span className="mr-1">投票率</span>
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
          </>
        )}
        {colorMode === 'party' && (
          <>
            <span className="mr-1">{colorParty}得票率</span>
            {[10, 20, 30, 40, 50].map((v) => (
              <div key={v} className="flex items-center gap-0.5">
                <span
                  className="w-4 h-3 rounded-sm inline-block"
                  style={{ backgroundColor: getPartyRateColor(v, getPartyHex(colorParty)) }}
                />
                <span>{v}%</span>
              </div>
            ))}
          </>
        )}
        {colorMode === 'change' && (
          <>
            <span className="mr-1">前回比（投票率）</span>
            {[
              { color: '#14532d', label: '+4%↑' },
              { color: '#16a34a', label: '+2%' },
              { color: '#4ade80', label: '±0' },
              { color: '#fca5a5', label: '-2%' },
              { color: '#dc2626', label: '-4%↓' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-0.5">
                <span className="w-4 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
