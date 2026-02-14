'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import { getPartyColor } from '@/constants/parties';
import { generatePartyComparison, classifySwing, getSwingColor } from '@/lib/election-utils';
import { formatNumber, formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PartyResult {
  party: string;
  votes: number;
  rate: number;
}

interface OtaTimeComparisonProps {
  syosenkyoku2024: PartyResult[];
  syosenkyoku2026: PartyResult[];
  hirei2024: PartyResult[];
  hirei2026: PartyResult[];
  totalVotesSyo2024: number;
  totalVotesSyo2026: number;
  totalVotesHirei2024: number;
  totalVotesHirei2026: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    payload: {
      party: string;
      votes2024: number;
      votes2026: number;
      rate2024: number;
      rate2026: number;
      voteDiff: number;
      rateDiff: number;
    };
  }>;
  label?: string;
}

const CustomBarTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-bold mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-blue-600">2024年:</span>
            <span className="font-mono">{data.rate2024.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-orange-600">2026年:</span>
            <span className="font-mono">{data.rate2026.toFixed(2)}%</span>
          </div>
          <div className="border-t pt-1 mt-1">
            <div className="flex justify-between gap-4">
              <span>得票数差:</span>
              <span
                className={`font-mono ${
                  data.voteDiff > 0
                    ? 'text-green-600'
                    : data.voteDiff < 0
                    ? 'text-red-600'
                    : ''
                }`}
              >
                {data.voteDiff > 0 ? '+' : ''}
                {formatNumber(data.voteDiff)}票
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>得票率差:</span>
              <span
                className={`font-mono font-bold ${
                  data.rateDiff > 0
                    ? 'text-green-600'
                    : data.rateDiff < 0
                    ? 'text-red-600'
                    : ''
                }`}
              >
                {data.rateDiff > 0 ? '+' : ''}
                {data.rateDiff.toFixed(2)}pt
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function OtaTimeComparison({
  syosenkyoku2024,
  syosenkyoku2026,
  hirei2024,
  hirei2026,
  totalVotesSyo2024,
  totalVotesSyo2026,
  totalVotesHirei2024,
  totalVotesHirei2026,
}: OtaTimeComparisonProps) {
  // 小選挙区の比較データ
  const syoComparisonData = useMemo(
    () => generatePartyComparison(syosenkyoku2024, syosenkyoku2026),
    [syosenkyoku2024, syosenkyoku2026]
  );

  // 比例代表の比較データ
  const hireiComparisonData = useMemo(
    () => generatePartyComparison(hirei2024, hirei2026),
    [hirei2024, hirei2026]
  );

  // レーダーチャート用データ
  const radarData = useMemo(() => {
    const allParties = new Set([
      ...syosenkyoku2024.map((p) => p.party),
      ...syosenkyoku2026.map((p) => p.party),
    ]);

    return Array.from(allParties).map((party) => {
      const p2024 = syosenkyoku2024.find((p) => p.party === party);
      const p2026 = syosenkyoku2026.find((p) => p.party === party);
      return {
        party: party.length > 6 ? party.slice(0, 6) + '...' : party,
        fullParty: party,
        rate2024: p2024?.rate || 0,
        rate2026: p2026?.rate || 0,
      };
    });
  }, [syosenkyoku2024, syosenkyoku2026]);

  // 投票数変化サマリー
  const voteSummary = useMemo(() => {
    const syoDiff = totalVotesSyo2026 - totalVotesSyo2024;
    const hireiDiff = totalVotesHirei2026 - totalVotesHirei2024;
    return {
      syoDiff,
      syoPercent: ((syoDiff / totalVotesSyo2024) * 100).toFixed(1),
      hireiDiff,
      hireiPercent: ((hireiDiff / totalVotesHirei2024) * 100).toFixed(1),
    };
  }, [totalVotesSyo2024, totalVotesSyo2026, totalVotesHirei2024, totalVotesHirei2026]);

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">小選挙区 総投票数変化</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {formatNumber(totalVotesSyo2026)}
              </span>
              <span className="text-muted-foreground">票</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {Number(voteSummary.syoDiff) > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : Number(voteSummary.syoDiff) < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4 text-gray-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  Number(voteSummary.syoDiff) > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Number(voteSummary.syoDiff) > 0 ? '+' : ''}
                {formatNumber(voteSummary.syoDiff)} ({voteSummary.syoPercent}%)
              </span>
              <span className="text-xs text-muted-foreground">前回比</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">比例代表 総投票数変化</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {formatNumber(totalVotesHirei2026)}
              </span>
              <span className="text-muted-foreground">票</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {Number(voteSummary.hireiDiff) > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : Number(voteSummary.hireiDiff) < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4 text-gray-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  Number(voteSummary.hireiDiff) > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Number(voteSummary.hireiDiff) > 0 ? '+' : ''}
                {formatNumber(voteSummary.hireiDiff)} ({voteSummary.hireiPercent}%)
              </span>
              <span className="text-xs text-muted-foreground">前回比</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 小選挙区 政党別比較 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">小選挙区 政党別得票率比較（2024年 vs 2026年）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={syoComparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
              <XAxis type="number" domain={[0, 60]} tickFormatter={(v) => `${v}%`} />
              <YAxis
                type="category"
                dataKey="party"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend />
              <Bar dataKey="rate2024" name="2024年" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="rate2026" name="2026年" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 比例代表 政党別比較 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">比例代表 政党別得票率比較（2024年 vs 2026年）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={hireiComparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
              <XAxis type="number" domain={[0, 40]} tickFormatter={(v) => `${v}%`} />
              <YAxis
                type="category"
                dataKey="party"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend />
              <Bar dataKey="rate2024" name="2024年" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="rate2026" name="2026年" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* レーダーチャート */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">小選挙区 得票率比較（レーダー）</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="party" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 60]} tick={{ fontSize: 10 }} />
                <Radar
                  name="2024年"
                  dataKey="rate2024"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Radar
                  name="2026年"
                  dataKey="rate2026"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip
                  formatter={(value) => [
                    `${(value as number).toFixed(1)}%`,
                    '',
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* スイング分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">政党別スイング分析（小選挙区）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syoComparisonData.map((party) => {
                const swing = classifySwing(party.rateDiff);
                const swingColor = getSwingColor(swing);
                const swingLabel = {
                  surge: '急伸',
                  gain: '増加',
                  stable: '横ばい',
                  loss: '減少',
                  collapse: '急落',
                }[swing];

                return (
                  <div key={party.party} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getPartyColor(party.party) }}
                        />
                        <span className="font-medium text-sm">{party.party}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          style={{ backgroundColor: swingColor, color: '#fff' }}
                        >
                          {swingLabel}
                        </Badge>
                        <span
                          className={`font-mono text-sm font-bold ${
                            party.rateDiff > 0
                              ? 'text-green-600'
                              : party.rateDiff < 0
                              ? 'text-red-600'
                              : ''
                          }`}
                        >
                          {party.rateDiff > 0 ? '+' : ''}
                          {party.rateDiff.toFixed(2)}pt
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(Math.abs(party.rateDiff) * 10, 100)}%`,
                            backgroundColor: swingColor,
                            marginLeft: party.rateDiff < 0 ? 'auto' : 0,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>2024: {formatPercent(party.rate2024)}</span>
                      <span>2026: {formatPercent(party.rate2026)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 得票率推移（折れ線） */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">比例代表 得票率推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={[
                { year: '2024年', ...Object.fromEntries(hirei2024.map((p) => [p.party, p.rate])) },
                { year: '2026年', ...Object.fromEntries(hirei2026.map((p) => [p.party, p.rate])) },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 40]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => [`${(value as number).toFixed(1)}%`, '']} />
              <Legend />
              {[...new Set([...hirei2024, ...hirei2026].map((p) => p.party))].slice(0, 6).map((party) => (
                <Line
                  key={party}
                  type="monotone"
                  dataKey={party}
                  stroke={getPartyColor(party)}
                  strokeWidth={2}
                  dot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
