'use client';

import { useEffect, useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { JapanTileMap, TileMapPrefectureData, MapColorMode } from '@/components/election/JapanTileMap';
import { VoteRateTrendChart } from '@/components/election/VoteRateTrendChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from 'recharts';
import { getPartyColor } from '@/constants/parties';
import { MapPin, Vote, TrendingUp, TrendingDown, Users, Building, BarChart2 } from 'lucide-react';

type Year = '2023' | '2019' | '2015';

type PrefectureData = TileMapPrefectureData & { note?: string };

interface WardData {
  id: string;
  name: string;
  type: string;
  turnout: number;
  total_seats: number;
  votes_by_party: Record<string, number>;
  winner_count: Record<string, number>;
}

interface TokyoElectionData {
  date: string;
  name: string;
  national_avg_turnout: number;
  wards: WardData[];
  summary: { ku_avg_turnout: number; total_wards: number; total_seats: number };
}

interface TrendDataJson {
  unified_local: Array<Record<string, string | number>>;
  tokyo_ward_hirei: Array<Record<string, string | number>>;
}

const LOCAL_PARTIES = ['自民党', '立憲民主党', '公明党', '共産党', '維新の会', '国民民主党', '無所属・その他'];
const TOKYO_PARTIES = ['自民党', '立憲民主党', '公明党', '共産党', '維新の会', '都民ファースト', '国民民主党', '無所属・その他'];

const YEAR_LABELS: Record<Year, string> = {
  '2023': '(第20回)',
  '2019': '(第19回)',
  '2015': '(第18回)',
};

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  diff,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  diff?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {diff !== undefined && (
          <div className={`flex items-center gap-1 text-xs mt-1 ${diff >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}pt（前回比）
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PrefectureDetail({
  pref,
  prevPref,
  year,
  prevYear,
}: {
  pref: PrefectureData;
  prevPref: PrefectureData | null;
  year: Year;
  prevYear: Year | null;
}) {
  const parties = LOCAL_PARTIES;
  const topParty = parties.reduce((a, b) =>
    (pref.votes_by_party[a] || 0) > (pref.votes_by_party[b] || 0) ? a : b
  );

  const barData = parties
    .map((p) => ({ party: p, rate: pref.votes_by_party[p] || 0, seats: pref.winner_count[p] || 0 }))
    .sort((a, b) => b.rate - a.rate);

  const radarData = prevYear && prevPref
    ? parties.map((p) => ({
        party: p.replace('・その他', '').replace('の会', '').slice(0, 4),
        [year]: pref.votes_by_party[p] || 0,
        [prevYear]: prevPref.votes_by_party[p] || 0,
      }))
    : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="投票率"
          value={`${pref.turnout.toFixed(1)}%`}
          sub={year + '年'}
          icon={Vote}
          diff={prevPref ? pref.turnout - prevPref.turnout : undefined}
        />
        <StatCard
          title="総議席"
          value={`${pref.total_seats}議席`}
          icon={Building}
        />
        <StatCard
          title="第1党"
          value={topParty.replace('・その他', '')}
          sub={`得票率 ${(pref.votes_by_party[topParty] || 0).toFixed(1)}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="地域"
          value={pref.region}
          sub={pref.name}
          icon={MapPin}
        />
      </div>

      {pref.note && (
        <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
          ※ {pref.note}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{pref.name} 政党別得票率</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
              <XAxis type="number" tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
              <YAxis
                type="category"
                dataKey="party"
                width={110}
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => v.replace('・その他', '').replace('の会', '').slice(0, 6)}
              />
              <Tooltip formatter={(v) => [`${(v as number).toFixed(1)}%`, '得票率']} />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.party} fill={getPartyColor(entry.party)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {radarData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{prevYear}年 vs {year}年 比較</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="party" tick={{ fontSize: 10 }} />
                <Radar name={prevYear + '年'} dataKey={prevYear as string} stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                <Radar name={year + '年'} dataKey={year} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">当選人数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {barData.map((entry) => (
              <div
                key={entry.party}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: getPartyColor(entry.party) }}
              >
                <span>{entry.party.replace('・その他', '').replace('の会', '').slice(0, 4)}</span>
                <span className="font-bold">{entry.seats}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TokyoSection({ year, prevYear }: { year: Year; prevYear: Year | null }) {
  const [tokyoData, setTokyoData] = useState<Record<string, TokyoElectionData | null>>({
    '2023': null,
    '2019': null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/data/unified-local-elections/tokyo_ward_details.json')
      .then((r) => r.json())
      .then((json) => {
        setTokyoData({
          '2023': json.elections['2023'] ?? null,
          '2019': json.elections['2019'] ?? null,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentData = tokyoData[year] ?? null;
  const prevData = prevYear ? (tokyoData[prevYear] ?? null) : null;

  const wardComparison = useMemo(() => {
    if (!currentData) return [];
    return [...currentData.wards].sort((a, b) => b.turnout - a.turnout);
  }, [currentData]);

  const partyTotals = useMemo(() => {
    if (!currentData) return [];
    const totals: Record<string, { votes: number; seats: number }> = {};
    currentData.wards.forEach((ward) => {
      TOKYO_PARTIES.forEach((party) => {
        if (!totals[party]) totals[party] = { votes: 0, seats: 0 };
        totals[party].votes += ward.votes_by_party[party] || 0;
        totals[party].seats += ward.winner_count[party] || 0;
      });
    });
    return Object.entries(totals)
      .map(([party, data]) => ({
        party,
        avgRate: data.votes / currentData.wards.length,
        totalSeats: data.seats,
      }))
      .sort((a, b) => b.avgRate - a.avgRate);
  }, [currentData]);

  const otaWard = currentData?.wards.find((w) => w.name === '大田区');
  const tokyoAvgTurnout = currentData?.summary.ku_avg_turnout;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!currentData) {
    return (
      <p className="text-muted-foreground p-4">
        {year}年の東京23区詳細データはありません（東京都は都議会データを参照）
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="23区平均投票率"
          value={`${currentData.summary.ku_avg_turnout.toFixed(1)}%`}
          sub={year + '年'}
          icon={Vote}
          diff={prevData ? currentData.summary.ku_avg_turnout - prevData.summary.ku_avg_turnout : undefined}
        />
        <StatCard
          title="総議席数"
          value={`${currentData.summary.total_seats}議席`}
          sub="特別区議会合計"
          icon={Building}
        />
        <StatCard
          title="大田区投票率"
          value={otaWard ? `${otaWard.turnout.toFixed(1)}%` : '-'}
          sub={`23区平均比 ${otaWard && tokyoAvgTurnout ? (otaWard.turnout - tokyoAvgTurnout > 0 ? '+' : '') + (otaWard.turnout - tokyoAvgTurnout).toFixed(1) + 'pt' : ''}`}
          icon={MapPin}
        />
        <StatCard
          title="第1党（平均得票率）"
          value={partyTotals[0]?.party.slice(0, 4) ?? '-'}
          sub={`${partyTotals[0]?.avgRate.toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">23区 投票率ランキング（{year}年）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {wardComparison.map((ward, i) => {
                const prevWard = prevData?.wards.find((w) => w.id === ward.id);
                const diff = prevWard ? ward.turnout - prevWard.turnout : null;
                const isOta = ward.name === '大田区';
                return (
                  <div
                    key={ward.id}
                    className={`flex items-center gap-3 p-2 rounded-md ${isOta ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700' : 'hover:bg-muted'}`}
                  >
                    <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                    <span className={`flex-1 text-sm font-medium ${isOta ? 'text-yellow-700 dark:text-yellow-400' : ''}`}>
                      {ward.name}
                      {isOta && <Badge className="ml-1 text-xs" variant="outline">大田区</Badge>}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${(ward.turnout / 60) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-12 text-right">{ward.turnout.toFixed(1)}%</span>
                      {diff !== null && (
                        <span className={`text-xs font-mono w-14 text-right ${diff >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                          {diff >= 0 ? '+' : ''}{diff.toFixed(1)}pt
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">23区合計 政党別当選人数（{year}年）</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={partyTotals} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="party"
                  width={100}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.replace('・その他', '').replace('の会', '').slice(0, 6)}
                />
                <Tooltip formatter={(v) => [v, '当選人数']} />
                <Bar dataKey="totalSeats" radius={[0, 4, 4, 0]}>
                  {partyTotals.map((entry) => (
                    <Cell key={entry.party} fill={getPartyColor(entry.party)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {otaWard && (
        <Card className="border-yellow-300 dark:border-yellow-700">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-yellow-600" />
              大田区 詳細（{year}年）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">政党別得票率</p>
                <div className="space-y-1.5">
                  {TOKYO_PARTIES.map((party) => {
                    const rate = otaWard.votes_by_party[party] || 0;
                    const prevOta = prevData?.wards.find((w) => w.name === '大田区');
                    const prevRate = prevOta?.votes_by_party[party] || 0;
                    const diff = rate - prevRate;
                    return (
                      <div key={party} className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getPartyColor(party) }}
                        />
                        <span className="text-xs w-24 flex-shrink-0">{party.replace('・その他', '').slice(0, 6)}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(rate / 35) * 100}%`,
                              backgroundColor: getPartyColor(party),
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono w-10 text-right">{rate.toFixed(1)}%</span>
                        {prevOta && (
                          <span className={`text-xs font-mono w-12 text-right ${diff >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">当選人数（計{otaWard.total_seats}議席）</p>
                <div className="flex flex-wrap gap-2">
                  {TOKYO_PARTIES.map((party) => {
                    const seats = otaWard.winner_count[party] || 0;
                    if (seats === 0) return null;
                    return (
                      <div
                        key={party}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getPartyColor(party) }}
                      >
                        <span>{party.replace('・その他', '').slice(0, 4)}</span>
                        <span className="font-bold">{seats}席</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">23区平均との比較</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div>
                      <span className="text-xs text-muted-foreground">大田区</span>
                      <p className="text-lg font-bold">{otaWard.turnout.toFixed(1)}%</p>
                    </div>
                    <div className="text-muted-foreground">vs</div>
                    <div>
                      <span className="text-xs text-muted-foreground">23区平均</span>
                      <p className="text-lg font-bold">{tokyoAvgTurnout?.toFixed(1)}%</p>
                    </div>
                    <div className={`text-sm font-bold ${otaWard.turnout - (tokyoAvgTurnout ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {otaWard.turnout - (tokyoAvgTurnout ?? 0) >= 0 ? '+' : ''}
                      {(otaWard.turnout - (tokyoAvgTurnout ?? 0)).toFixed(1)}pt
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UnifiedLocalElectionsContent() {
  const [year, setYear] = useState<Year>('2023');
  const [allData, setAllData] = useState<Record<Year, PrefectureData[]>>({ '2023': [], '2019': [], '2015': [] });
  const [loading, setLoading] = useState(true);
  const [selectedPref, setSelectedPref] = useState<PrefectureData | null>(null);
  const [colorMode, setColorMode] = useState<MapColorMode>('turnout');
  const [colorParty, setColorParty] = useState<string>('自民党');
  const [activeTab, setActiveTab] = useState('prefecture');
  const [trendData, setTrendData] = useState<TrendDataJson | null>(null);

  const prevYear: Year | null = year === '2023' ? '2019' : year === '2019' ? '2015' : null;

  useEffect(() => {
    Promise.all([
      fetch('/data/unified-local-elections/prefectures.json').then((r) => r.json()),
      fetch('/data/unified-local-elections/prefectures_2015.json').then((r) => r.json()),
      fetch('/data/elections/national_party_trends.json').then((r) => r.json()),
    ])
      .then(([mainJson, json2015, trendJson]) => {
        setAllData({
          '2023': mainJson.elections['2023']?.prefectures ?? [],
          '2019': mainJson.elections['2019']?.prefectures ?? [],
          '2015': json2015.prefectures ?? [],
        });
        setTrendData(trendJson as TrendDataJson);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentPrefs = allData[year];
  const prevPrefs = prevYear ? allData[prevYear] : [];

  const selectedPrevPref = useMemo(() => {
    if (!selectedPref || !prevYear) return null;
    return prevPrefs.find((p) => p.id === selectedPref.id) ?? null;
  }, [selectedPref, prevPrefs, prevYear]);

  const handlePrefSelect = (pref: TileMapPrefectureData) => {
    setSelectedPref(pref as PrefectureData);
    if (pref.id === '13') {
      setActiveTab('tokyo');
    } else {
      setActiveTab('prefecture');
    }
  };

  const nationalStats = useMemo(() => {
    if (!currentPrefs.length) return null;
    const avgTurnout = currentPrefs.reduce((s, p) => s + p.turnout, 0) / currentPrefs.length;
    const partySeats: Record<string, number> = {};
    currentPrefs.forEach((p) => {
      LOCAL_PARTIES.forEach((party) => {
        partySeats[party] = (partySeats[party] || 0) + (p.winner_count[party] || 0);
      });
    });
    const topParty = Object.entries(partySeats).sort((a, b) => b[1] - a[1])[0];
    return { avgTurnout, partySeats, topParty };
  }, [currentPrefs]);

  const prevNationalStats = useMemo(() => {
    if (!prevPrefs.length) return null;
    return prevPrefs.reduce((s, p) => s + p.turnout, 0) / prevPrefs.length;
  }, [prevPrefs]);

  const nationalPartyData = useMemo(() => {
    if (!currentPrefs.length) return [];
    const totals: Record<string, { rate: number; seats: number; count: number }> = {};
    currentPrefs.forEach((p) => {
      LOCAL_PARTIES.forEach((party) => {
        if (!totals[party]) totals[party] = { rate: 0, seats: 0, count: 0 };
        totals[party].rate += p.votes_by_party[party] || 0;
        totals[party].seats += p.winner_count[party] || 0;
        totals[party].count += 1;
      });
    });
    return Object.entries(totals)
      .map(([party, data]) => ({
        party,
        avgRate: data.rate / data.count,
        totalSeats: data.seats,
      }))
      .sort((a, b) => b.totalSeats - a.totalSeats);
  }, [currentPrefs]);

  const trendParties = ['自民党', '立憲民主党', '公明党', '共産党', '維新の会', '国民民主党'];
  const tokyoTrendParties = ['自民党', '立憲民主党', '公明党', '共産党', '維新の会', '都民ファースト', '国民民主党'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 年度・カラーモードセレクタ */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex border rounded-lg overflow-hidden">
          {(['2023', '2019', '2015'] as Year[]).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                year === y ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              }`}
            >
              {y}年
              <span className="ml-1 text-xs opacity-70">{YEAR_LABELS[y]}</span>
            </button>
          ))}
        </div>
        <Badge variant="outline">統一地方選挙 都道府県議会議員選挙</Badge>
        {prevYear && (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {prevYear}年との比較モード
          </Badge>
        )}
      </div>

      {/* 全国サマリー */}
      {nationalStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="全国平均投票率"
            value={`${nationalStats.avgTurnout.toFixed(1)}%`}
            sub="47都道府県平均"
            icon={Vote}
            diff={prevNationalStats ? nationalStats.avgTurnout - prevNationalStats : undefined}
          />
          <StatCard
            title="第1党（総議席）"
            value={nationalStats.topParty[0].replace('・その他', '')}
            sub={`${nationalStats.topParty[1]}議席`}
            icon={TrendingUp}
          />
          <StatCard
            title="最高投票率"
            value={`${Math.max(...currentPrefs.map((p) => p.turnout)).toFixed(1)}%`}
            sub={currentPrefs.find((p) => p.turnout === Math.max(...currentPrefs.map((p) => p.turnout)))?.name}
            icon={TrendingUp}
          />
          <StatCard
            title="最低投票率"
            value={`${Math.min(...currentPrefs.map((p) => p.turnout)).toFixed(1)}%`}
            sub={currentPrefs.find((p) => p.turnout === Math.min(...currentPrefs.map((p) => p.turnout)))?.name}
            icon={TrendingDown}
          />
        </div>
      )}

      {/* メインコンテンツ: 地図 + 詳細 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 日本地図 */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                インタラクティブ地図（{year}年）
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                都道府県をクリックすると詳細が表示されます。東京をクリックすると23区分析に切り替わります。
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* カラーモード切替 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">色分け:</span>
                {([
                  ['turnout', '投票率'],
                  ['party', '政党別得票率'],
                  ...(prevYear ? [['change', '前回比変化']] as [MapColorMode, string][] : []),
                ] as [MapColorMode, string][]).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setColorMode(mode)}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                      colorMode === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'border hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {colorMode === 'party' && (
                  <select
                    value={colorParty}
                    onChange={(e) => setColorParty(e.target.value)}
                    className="text-xs border rounded px-2 py-1 bg-background"
                  >
                    {LOCAL_PARTIES.filter((p) => p !== '無所属・その他').map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}
              </div>

              <JapanTileMap
                prefectures={currentPrefs}
                selectedId={selectedPref?.id ?? null}
                onSelect={handlePrefSelect}
                colorMode={colorMode}
                colorParty={colorMode === 'party' ? colorParty : undefined}
                prevPrefectures={colorMode === 'change' && prevYear ? prevPrefs : undefined}
              />
            </CardContent>
          </Card>
        </div>

        {/* 都道府県詳細 / 東京都重点 / 全国集計 / 推移グラフ */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="flex flex-wrap gap-1 h-auto">
              <TabsTrigger value="prefecture">
                {selectedPref ? selectedPref.name : '都道府県詳細'}
              </TabsTrigger>
              <TabsTrigger value="tokyo">東京都重点分析</TabsTrigger>
              <TabsTrigger value="national">全国政党集計</TabsTrigger>
              <TabsTrigger value="trend" className="gap-1">
                <BarChart2 className="h-3.5 w-3.5" />
                推移グラフ
              </TabsTrigger>
            </TabsList>

            {/* 都道府県詳細 */}
            <TabsContent value="prefecture">
              {selectedPref ? (
                <PrefectureDetail
                  pref={selectedPref}
                  prevPref={selectedPrevPref}
                  year={year}
                  prevYear={prevYear}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">左の地図から都道府県をクリックしてください</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 東京都重点分析 */}
            <TabsContent value="tokyo">
              <TokyoSection year={year} prevYear={prevYear} />
            </TabsContent>

            {/* 全国政党集計 */}
            <TabsContent value="national" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">全国政党別総議席数（{year}年）</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={nationalPartyData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="party"
                        width={110}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => v.replace('・その他', '').replace('の会', '').slice(0, 6)}
                      />
                      <Tooltip />
                      <Bar dataKey="totalSeats" name="総議席数" radius={[0, 4, 4, 0]}>
                        {nationalPartyData.map((entry) => (
                          <Cell key={entry.party} fill={getPartyColor(entry.party)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">全国政党別平均得票率（{year}年）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {nationalPartyData.map((entry, i) => (
                      <div key={entry.party} className="flex items-center gap-3">
                        <span className="text-muted-foreground text-sm w-4">{i + 1}</span>
                        <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getPartyColor(entry.party) }}
                          />
                          <span className="text-sm truncate">
                            {entry.party.replace('・その他', '').replace('の会', '').slice(0, 5)}
                          </span>
                        </div>
                        <div className="flex-1 bg-muted rounded-full h-3">
                          <div
                            className="h-3 rounded-full"
                            style={{
                              width: `${(entry.avgRate / (nationalPartyData[0]?.avgRate || 1)) * 100}%`,
                              backgroundColor: getPartyColor(entry.party),
                            }}
                          />
                        </div>
                        <span className="text-sm font-mono w-12 text-right">{entry.avgRate.toFixed(1)}%</span>
                        <span className="text-xs text-muted-foreground w-16 text-right">{entry.totalSeats}議席</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 推移グラフ */}
            <TabsContent value="trend" className="space-y-4">
              {trendData ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">統一地方選挙 全国得票率推移（2015・2019・2023年）</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <VoteRateTrendChart
                        data={trendData.unified_local.map((d) => ({ ...d, year: String(d.year) }))}
                        parties={trendParties}
                        defaultChartType="line"
                        note="総務省「統一地方選挙結果調」"
                        height={300}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">東京23区 政党別得票率推移（2015・2019・2023年）</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <VoteRateTrendChart
                        data={trendData.tokyo_ward_hirei.map((d) => ({ ...d, year: String(d.year) }))}
                        parties={tokyoTrendParties}
                        defaultChartType="stacked"
                        note="総務省「統一地方選挙結果調」東京都特別区"
                        height={300}
                      />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <p className="text-muted-foreground">推移データを読み込み中...</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function UnifiedLocalElectionsPage() {
  return (
    <AppShell>
      <Header
        title="統一地方選挙"
        description="都道府県議会議員選挙 インタラクティブ分析（2015年・2019年・2023年）"
      />
      <UnifiedLocalElectionsContent />
    </AppShell>
  );
}
