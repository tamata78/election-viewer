'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts';
import { getPartyColor } from '@/constants/parties';

export interface TrendEntry {
  year: string;
  name?: string;
  [party: string]: string | number | undefined;
}

type ChartType = 'line' | 'stacked' | 'grouped';

interface VoteRateTrendChartProps {
  data: TrendEntry[];
  parties: string[];
  title?: string;
  defaultChartType?: ChartType;
  note?: string;
  height?: number;
  showDataLabels?: boolean;
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
  payload: TrendEntry;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const sorted = [...payload]
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value);

  const yearEntry = payload[0]?.payload;
  const displayLabel = yearEntry?.name ? `${label}（${yearEntry.name}）` : label;

  return (
    <div className="bg-background/95 border rounded-lg shadow-xl p-3 text-sm min-w-[200px]">
      <p className="font-bold text-sm mb-2 text-foreground border-b pb-1">{displayLabel}</p>
      {sorted.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground text-xs">
              {(entry.dataKey as string).replace('・その他', '').replace('の会', '').slice(0, 6)}
            </span>
          </div>
          <span className="font-bold text-base tabular-nums" style={{ color: entry.color }}>
            {entry.value.toFixed(1)}%
          </span>
        </div>
      ))}
      <p className="text-xs text-muted-foreground mt-2 pt-1 border-t">
        合計: {sorted.reduce((s, e) => s + e.value, 0).toFixed(1)}%
      </p>
    </div>
  );
}

function LegendFormatter(value: string) {
  return (
    <span className="text-xs">
      {value.replace('・その他', '').replace('の会', '').slice(0, 6)}
    </span>
  );
}

export function VoteRateTrendChart({
  data,
  parties,
  title,
  defaultChartType = 'line',
  note,
  height = 320,
}: VoteRateTrendChartProps) {
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);

  const chartButtons: [ChartType, string][] = [
    ['line', '折れ線'],
    ['stacked', '積み上げバー'],
    ['grouped', 'グループバー'],
  ];

  const commonAxisProps = {
    style: { fontSize: 11 },
  };

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
      )}

      {/* Chart type toggle */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground mr-1">表示:</span>
        {chartButtons.map(([type, label]) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              chartType === type
                ? 'bg-primary text-primary-foreground'
                : 'border hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'line' ? (
          <LineChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
            <XAxis dataKey="year" {...commonAxisProps} />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              domain={[0, 50]}
              {...commonAxisProps}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={LegendFormatter} wrapperStyle={{ fontSize: 11 }} />
            {parties.map((party) => (
              <Line
                key={party}
                type="monotone"
                dataKey={party}
                stroke={getPartyColor(party)}
                strokeWidth={2.5}
                dot={{ r: 5, strokeWidth: 1, stroke: '#fff' }}
                activeDot={{ r: 7 }}
                connectNulls
              />
            ))}
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
            <XAxis dataKey="year" {...commonAxisProps} />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              domain={[0, chartType === 'stacked' ? 100 : 60]}
              {...commonAxisProps}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={LegendFormatter} wrapperStyle={{ fontSize: 11 }} />
            {parties.map((party) => (
              <Bar
                key={party}
                dataKey={party}
                fill={getPartyColor(party)}
                stackId={chartType === 'stacked' ? 'stack' : undefined}
                radius={chartType === 'grouped' ? [2, 2, 0, 0] : undefined}
                maxBarSize={chartType === 'grouped' ? 18 : undefined}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>

      {note && (
        <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
          ※ 出典: {note}
        </p>
      )}
    </div>
  );
}
