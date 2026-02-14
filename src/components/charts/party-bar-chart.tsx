'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPartyColor } from '@/constants/parties';
import type { PartyResult } from '@/types/election';
import { formatNumber, formatPercent } from '@/lib/utils';

interface PartyBarChartProps {
  data: PartyResult[];
  title?: string;
  dataKey?: 'votes' | 'seats' | 'voteShare';
  showLegend?: boolean;
}

export function PartyBarChart({
  data,
  title = '政党別獲得票数',
  dataKey = 'votes',
  showLegend = false,
}: PartyBarChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill: getPartyColor(item.partyName),
  }));

  const formatValue = (value: number) => {
    if (dataKey === 'voteShare') return formatPercent(value);
    return formatNumber(value);
  };

  const getLabel = () => {
    switch (dataKey) {
      case 'votes':
        return '得票数';
      case 'seats':
        return '議席数';
      case 'voteShare':
        return '得票率';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" tickFormatter={formatValue} />
            <YAxis
              type="category"
              dataKey="partyName"
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [formatValue(value as number), getLabel()]}
              labelFormatter={(label) => `${label}`}
            />
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
