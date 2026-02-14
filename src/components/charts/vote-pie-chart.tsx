'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPartyColor } from '@/constants/parties';
import type { PartyResult } from '@/types/election';
import { formatNumber, formatPercent } from '@/lib/utils';

interface VotePieChartProps {
  data: PartyResult[];
  title?: string;
}

export function VotePieChart({
  data,
  title = '政党別得票率',
}: VotePieChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill: getPartyColor(item.partyName),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="votes"
              nameKey="partyName"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) =>
                `${name} ${formatPercent((percent || 0) * 100)}`
              }
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                formatNumber(value as number),
                name as string,
              ]}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value) => (
                <span className="text-sm">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
