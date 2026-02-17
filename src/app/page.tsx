'use client';

import { useEffect, useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { getPartyColor } from '@/constants/parties';
import { formatNumber, formatPercent } from '@/lib/utils';
import { Vote, Users, TrendingUp, TrendingDown, MapPin, Search, Trophy, ArrowUpDown } from 'lucide-react';

type ElectionYear = '2024' | '2026';

interface MunicipalityData {
  name: string;
  type: string;
  votes: Record<string, number>;
  total: number;
}

interface HireiData {
  electionType: string;
  electionDate: string;
  parties: { id: number; name: string }[];
  total: Record<string, number>;
  municipalities: MunicipalityData[];
}

interface PartyVoteData {
  votes: number;
  rate: number;
  seats?: number;
}

interface SyosenkyokuMunicipality {
  name: string;
  district: string;
  type: string;
  totalVotes: number;
  [partyName: string]: string | number | PartyVoteData;
}

interface SyosenkyokuData {
  electionType: string;
  electionDate: string;
  parties: string[];
  total: {
    totalVotes: number;
    [partyName: string]: number | PartyVoteData;
  };
  municipalities: SyosenkyokuMunicipality[];
}

interface CandidateData {
  party: string;
  candidate: string;
  votes: number;
  winner?: boolean;
}

interface ConstituencyData {
  district: string;
  areas: string[];
  candidates: CandidateData[];
  totalVotes: number;
}

interface SyosenkyokuCandidateData {
  electionType: string;
  electionDate: string;
  constituencies: ConstituencyData[];
}

// Ranking types
interface RankingPartyData {
  votes: number;
  rate: number;
}

interface RankingMunicipalityData {
  name: string;
  type: string;
  district?: string;
  totalVotes: number;
  [key: string]: RankingPartyData | string | number | undefined;
}

interface RankingDetailedData {
  electionType: string;
  parties: string[];
  municipalities: RankingMunicipalityData[];
}

const PARTY_ORDER_2026 = [
  '自由民主党',
  '中道改革連合',
  'チームみらい',
  '国民民主党',
  '参政党',
  '日本共産党',
  '日本維新の会',
  '日本保守党',
  'れいわ新選組',
  '減税日本・ゆうこく連合',
  '社会民主党',
];

const PARTY_ORDER_2024 = [
  '自由民主党',
  '立憲民主党',
  '日本維新の会',
  '公明党',
  '日本共産党',
  '国民民主党',
  'れいわ新選組',
  '社会民主党',
  '参政党',
  '日本保守党',
];

const RANKING_HIREI_PARTIES = [
  '自由民主党', '中道改革連合', 'チームみらい', '国民民主党', '参政党',
  '日本共産党', '日本維新の会', '日本保守党', 'れいわ新選組',
  '社会民主党', '減税日本・ゆうこく連合'
];

const RANKING_SHOU_PARTIES = [
  '自由民主党', '中道改革連合', '国民民主党', '参政党',
  '日本共産党', '日本維新の会', 'チームみらい', 'れいわ新選組',
  '日本保守党', '減税日本・ゆうこく連合', '本人届出'
];

function TokyoContent() {
  const [selectedYear, setSelectedYear] = useState<ElectionYear>('2026');
  const [electionType, setElectionType] = useState<'hirei' | 'syosenkyoku'>('hirei');
  const [hireiData, setHireiData] = useState<HireiData | null>(null);
  const [syosenkyokuData, setSyosenkyokuData] = useState<SyosenkyokuData | null>(null);
  const [syosenkyokuCandidateData, setSyosenkyokuCandidateData] = useState<SyosenkyokuCandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegionType, setSelectedRegionType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [displayMode, setDisplayMode] = useState<'votes' | 'rate'>('votes');

  // Ranking state
  const [rankingHireiData, setRankingHireiData] = useState<RankingDetailedData | null>(null);
  const [rankingShouData, setRankingShouData] = useState<RankingDetailedData | null>(null);
  const [rankingElectionType, setRankingElectionType] = useState<'hirei' | 'shou'>('hirei');
  const [selectedParty, setSelectedParty] = useState<string>('自由民主党');
  const [rankingSortKey, setRankingSortKey] = useState<'votes' | 'rate'>('votes');
  const [rankingSortOrder, setRankingSortOrder] = useState<'asc' | 'desc'>('desc');
  const [rankingViewMode, setRankingViewMode] = useState<'table' | 'ranking'>('table');

  const PARTY_ORDER = selectedYear === '2026' ? PARTY_ORDER_2026 : PARTY_ORDER_2024;
  const rankingData = rankingElectionType === 'hirei' ? rankingHireiData : rankingShouData;
  const RANKING_PARTIES = rankingElectionType === 'hirei' ? RANKING_HIREI_PARTIES : RANKING_SHOU_PARTIES;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const hireiFile = selectedYear === '2026'
          ? '/data/tokyo-hirei-all.json'
          : '/data/tokyo-hirei-2024.json';
        const syosenkyokuFile = selectedYear === '2026'
          ? '/data/tokyo-syosenkyoku-2026.json'
          : '/data/tokyo-syosenkyoku-2024.json';
        const syosenkyokuCandidateFile = '/data/tokyo-syosenkyoku.json';

        const [hireiRes, syosenkyokuRes, candidateRes, rankingHireiRes, rankingShouRes] = await Promise.all([
          fetch(hireiFile),
          fetch(syosenkyokuFile),
          selectedYear === '2026' ? fetch(syosenkyokuCandidateFile) : Promise.resolve(null),
          fetch('/data/tokyo-hirei-detailed.json'),
          fetch('/data/tokyo-shou-detailed.json'),
        ]);

        if (hireiRes.ok) {
          const hireiJson = await hireiRes.json();
          setHireiData(hireiJson);
        }

        if (syosenkyokuRes.ok) {
          const syosenkyokuJson = await syosenkyokuRes.json();
          setSyosenkyokuData(syosenkyokuJson);
        }

        if (candidateRes && candidateRes.ok) {
          const candidateJson = await candidateRes.json();
          setSyosenkyokuCandidateData(candidateJson);
        }

        if (rankingHireiRes.ok) {
          const rankingHireiJson = await rankingHireiRes.json();
          setRankingHireiData(rankingHireiJson);
        }

        if (rankingShouRes.ok) {
          const rankingShouJson = await rankingShouRes.json();
          setRankingShouData(rankingShouJson);
        }
      } catch (error) {
        console.error('データの読み込みに失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedYear]);

  const filteredHireiMunicipalities = useMemo(() => {
    if (!hireiData) return [];

    let filtered = hireiData.municipalities;

    if (searchTerm) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRegionType !== 'all') {
      filtered = filtered.filter((m) => m.type === selectedRegionType);
    }

    return filtered.sort((a, b) => {
      let aVal: number, bVal: number;
      if (sortBy === 'total') {
        aVal = a.total;
        bVal = b.total;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        aVal = a.votes[sortBy] || 0;
        bVal = b.votes[sortBy] || 0;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [hireiData, searchTerm, selectedRegionType, sortBy, sortOrder]);

  const hireiPartyTotals = useMemo(() => {
    if (!hireiData) return [];

    return PARTY_ORDER.map((party) => ({
      party,
      votes: hireiData.total[party] || 0,
      voteShare: ((hireiData.total[party] || 0) / hireiData.total['合計']) * 100,
    })).sort((a, b) => b.votes - a.votes);
  }, [hireiData, PARTY_ORDER]);

  const syosenkyokuPartyTotals = useMemo(() => {
    if (!syosenkyokuData) return [];

    const parties = syosenkyokuData.parties || PARTY_ORDER;
    const total = syosenkyokuData.total;
    const totalVotes = typeof total.totalVotes === 'number' ? total.totalVotes : 0;

    return parties.map((party) => {
      const partyData = total[party];
      if (typeof partyData === 'object' && partyData !== null) {
        return {
          party,
          votes: partyData.votes || 0,
          voteShare: partyData.rate || 0,
          seats: partyData.seats || 0,
        };
      }
      return { party, votes: 0, voteShare: 0, seats: 0 };
    }).sort((a, b) => b.votes - a.votes);
  }, [syosenkyokuData, PARTY_ORDER]);

  const syosenkyokuSeats = useMemo(() => {
    if (!syosenkyokuCandidateData) return {};

    const seats: Record<string, number> = {};
    syosenkyokuCandidateData.constituencies.forEach((c) => {
      c.candidates.forEach((candidate) => {
        if (candidate.winner) {
          seats[candidate.party] = (seats[candidate.party] || 0) + 1;
        }
      });
    });
    return seats;
  }, [syosenkyokuCandidateData]);

  const filteredSyosenkyokuMunicipalities = useMemo(() => {
    if (!syosenkyokuData) return [];

    let filtered = syosenkyokuData.municipalities;

    if (searchTerm) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRegionType !== 'all') {
      filtered = filtered.filter((m) => m.type === selectedRegionType);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'total' || sortBy === 'totalVotes') {
        const aVal = a.totalVotes;
        const bVal = b.totalVotes;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const aData = a[sortBy];
        const bData = b[sortBy];
        const aVal = typeof aData === 'object' && aData !== null ? (aData as PartyVoteData).votes : 0;
        const bVal = typeof bData === 'object' && bData !== null ? (bData as PartyVoteData).votes : 0;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });
  }, [syosenkyokuData, searchTerm, selectedRegionType, sortBy, sortOrder]);

  // Ranking computed values
  const rankingSortedMunicipalities = useMemo(() => {
    if (!rankingData) return [];

    return [...rankingData.municipalities].sort((a, b) => {
      const aParty = a[selectedParty] as RankingPartyData;
      const bParty = b[selectedParty] as RankingPartyData;
      if (!aParty || !bParty) return 0;

      const aVal = rankingSortKey === 'votes' ? aParty.votes : aParty.rate;
      const bVal = rankingSortKey === 'votes' ? bParty.votes : bParty.rate;

      return rankingSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [rankingData, selectedParty, rankingSortKey, rankingSortOrder]);

  const rankingTop30 = useMemo(() => rankingSortedMunicipalities.slice(0, 30), [rankingSortedMunicipalities]);

  const toggleRankingSort = (key: 'votes' | 'rate') => {
    if (rankingSortKey === key) {
      setRankingSortOrder(rankingSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setRankingSortKey(key);
      setRankingSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const currentData = electionType === 'hirei' ? hireiData : syosenkyokuData;
  const currentPartyTotals = electionType === 'hirei' ? hireiPartyTotals : syosenkyokuPartyTotals;

  if (!currentData) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Tabs value={selectedYear} onValueChange={(v) => setSelectedYear(v as ElectionYear)}>
            <TabsList>
              <TabsTrigger value="2024">2024年</TabsTrigger>
              <TabsTrigger value="2026">2026年</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <p className="text-muted-foreground">
          {selectedYear}年のデータが見つかりません。データファイルを確認してください。
        </p>
      </div>
    );
  }

  const hireiTotalVotes = hireiData?.total['合計'] || 0;
  const hireiTopParty = hireiPartyTotals[0];
  const hireiKubuTotal = hireiData?.municipalities
    .filter((m) => m.type === '区部')
    .reduce((sum, m) => sum + m.total, 0) || 0;
  const hireiShibuTotal = hireiData?.municipalities
    .filter((m) => m.type === '市部')
    .reduce((sum, m) => sum + m.total, 0) || 0;

  const syosenkyokuTotalVotes = typeof syosenkyokuData?.total?.totalVotes === 'number'
    ? syosenkyokuData.total.totalVotes : 0;
  const syosenkyokuTopParty = syosenkyokuPartyTotals[0];
  const syosenkyokuKubuTotal = syosenkyokuData?.municipalities
    .filter((m) => m.type === '区部')
    .reduce((sum, m) => sum + m.totalVotes, 0) || 0;
  const syosenkyokuShibuTotal = syosenkyokuData?.municipalities
    .filter((m) => m.type === '市部')
    .reduce((sum, m) => sum + m.totalVotes, 0) || 0;

  const totalVotes = electionType === 'hirei' ? hireiTotalVotes : syosenkyokuTotalVotes;
  const topParty = electionType === 'hirei' ? hireiTopParty : syosenkyokuTopParty;
  const kubuTotal = electionType === 'hirei' ? hireiKubuTotal : syosenkyokuKubuTotal;
  const shibuTotal = electionType === 'hirei' ? hireiShibuTotal : syosenkyokuShibuTotal;

  const electionDateText = selectedYear === '2026'
    ? '令和8年2月8日執行'
    : '令和6年10月27日執行';

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Year Selection and Election Type */}
      <div className="flex flex-wrap gap-4 items-center">
        <Tabs value={selectedYear} onValueChange={(v) => setSelectedYear(v as ElectionYear)}>
          <TabsList>
            <TabsTrigger value="2024">2024年</TabsTrigger>
            <TabsTrigger value="2026">2026年</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={electionType} onValueChange={(v) => setElectionType(v as 'hirei' | 'syosenkyoku')}>
          <TabsList>
            <TabsTrigger value="hirei">比例代表</TabsTrigger>
            <TabsTrigger value="syosenkyoku">小選挙区</TabsTrigger>
          </TabsList>
        </Tabs>
        <Badge variant="outline" className="text-sm">
          {electionDateText}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総得票数</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalVotes)}</div>
            <p className="text-xs text-muted-foreground">{electionType === 'hirei' ? '比例代表' : '小選挙区'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">第1党</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topParty?.party}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(topParty?.votes || 0)}票 ({formatPercent(topParty?.voteShare || 0)})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">区部票数</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(kubuTotal)}</div>
            <p className="text-xs text-muted-foreground">23区</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">市部票数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(shibuTotal)}</div>
            <p className="text-xs text-muted-foreground">多摩地域</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="party" className="space-y-4">
        <TabsList>
          <TabsTrigger value="party">政党別集計</TabsTrigger>
          <TabsTrigger value="municipality">区市町村別</TabsTrigger>
          <TabsTrigger value="ranking">政党別ランキング</TabsTrigger>
        </TabsList>

        {/* 政党別集計 Tab */}
        <TabsContent value="party" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 政党別得票数バーチャート */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  政党別得票数（{electionType === 'hirei' ? '比例代表' : '小選挙区'}）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={currentPartyTotals} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                    <YAxis
                      type="category"
                      dataKey="party"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value) => [formatNumber(value as number), '得票数']}
                    />
                    <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                      {currentPartyTotals.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPartyColor(entry.party)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 円グラフ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">得票率</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={currentPartyTotals.slice(0, 8)}
                      dataKey="votes"
                      nameKey="party"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }) =>
                        `${(name as string).slice(0, 4)} ${formatPercent((percent || 0) * 100)}`
                      }
                      labelLine={false}
                    >
                      {currentPartyTotals.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPartyColor(entry.party)} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        formatNumber(value as number),
                        name as string,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 政党別詳細テーブル */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">政党別得票詳細</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">順位</TableHead>
                    <TableHead>政党名</TableHead>
                    <TableHead className="text-right">得票数</TableHead>
                    <TableHead className="text-right">得票率</TableHead>
                    {electionType === 'syosenkyoku' && (
                      <TableHead className="text-right">当選人数</TableHead>
                    )}
                    <TableHead className="w-64">グラフ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPartyTotals.map((party, index) => {
                    const partySeats = 'seats' in party ? (party.seats as number) : 0;
                    const seats: number = electionType === 'syosenkyoku'
                      ? (partySeats > 0 ? partySeats : (syosenkyokuSeats[party.party] || 0))
                      : 0;
                    return (
                      <TableRow key={party.party}>
                        <TableCell>
                          {index < 3 ? (
                            <Badge
                              className={
                                index === 0
                                  ? 'bg-yellow-500'
                                  : index === 1
                                  ? 'bg-gray-400'
                                  : 'bg-amber-600'
                              }
                            >
                              {index + 1}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{index + 1}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getPartyColor(party.party) }}
                            />
                            <span className="font-medium">{party.party}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(party.votes)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatPercent(party.voteShare)}
                        </TableCell>
                        {electionType === 'syosenkyoku' && (
                          <TableCell className="text-right font-mono font-bold">
                            {seats > 0 ? seats : '-'}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div
                              className="h-3 rounded-full"
                              style={{
                                width: `${currentPartyTotals[0]?.voteShare ? (party.voteShare / currentPartyTotals[0].voteShare) * 100 : 0}%`,
                                backgroundColor: getPartyColor(party.party),
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 区市町村別 Tab */}
        <TabsContent value="municipality" className="space-y-4">
          {/* フィルター */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="区市町村名で検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={selectedRegionType} onValueChange={setSelectedRegionType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="地域タイプ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="区部">区部（23区）</SelectItem>
                    <SelectItem value="市部">市部</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="並び替え" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">総得票数</SelectItem>
                    <SelectItem value="name">名前</SelectItem>
                    <SelectItem value="自由民主党">自民党票</SelectItem>
                    {selectedYear === '2026' && (
                      <>
                        <SelectItem value="中道改革連合">中道改革票</SelectItem>
                        <SelectItem value="チームみらい">みらい票</SelectItem>
                      </>
                    )}
                    {selectedYear === '2024' && (
                      <>
                        <SelectItem value="立憲民主党">立憲票</SelectItem>
                        <SelectItem value="公明党">公明票</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  {sortOrder === 'asc' ? '昇順' : '降順'}
                </button>
                <Select value={displayMode} onValueChange={(v) => setDisplayMode(v as 'votes' | 'rate')}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="表示形式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="votes">得票数</SelectItem>
                    <SelectItem value="rate">得票率</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 区市町村別テーブル */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                区市町村別{displayMode === 'votes' ? '得票数' : '得票率'}（{electionType === 'hirei' ? filteredHireiMunicipalities.length : filteredSyosenkyokuMunicipalities.length}件）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {electionType === 'hirei' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">区市町村</TableHead>
                        <TableHead className="text-right">総票数</TableHead>
                        {hireiData?.parties.map((p) => (
                          <TableHead key={p.id} className="text-right text-xs" style={{ color: getPartyColor(p.name) }}>
                            {p.name.replace('日本', '').replace('民主党', '').replace('新選組', '').replace('でつくる党', '').slice(0, 4)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHireiMunicipalities.map((m) => {
                        const topPartyInArea = Object.entries(m.votes).sort(
                          ([, a], [, b]) => b - a
                        )[0];
                        return (
                          <TableRow key={m.name}>
                            <TableCell className="sticky left-0 bg-background font-medium">
                              <div className="flex items-center gap-2">
                                {m.name}
                                <Badge variant="outline" className="text-xs">
                                  {m.type}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatNumber(m.total)}
                            </TableCell>
                            {hireiData?.parties.map((p) => {
                              const votes = m.votes[p.name] || 0;
                              const rate = m.total > 0 ? (votes / m.total) * 100 : 0;
                              const isTop = topPartyInArea[0] === p.name;
                              return (
                                <TableCell
                                  key={p.id}
                                  className={`text-right font-mono text-xs ${isTop ? 'font-bold' : ''}`}
                                  style={isTop ? { backgroundColor: `${getPartyColor(p.name)}20` } : {}}
                                >
                                  {displayMode === 'votes' ? formatNumber(votes) : `${rate.toFixed(1)}%`}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">区市町村</TableHead>
                        <TableHead>選挙区</TableHead>
                        <TableHead className="text-right">総票数</TableHead>
                        {syosenkyokuData?.parties.map((partyName) => (
                          <TableHead key={partyName} className="text-right text-xs" style={{ color: getPartyColor(partyName) }}>
                            {partyName.replace('日本', '').replace('民主党', '').replace('新選組', '').replace('でつくる党', '').replace('・ゆうこく連合', '').slice(0, 4)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSyosenkyokuMunicipalities.map((m) => {
                        const getVotes = (partyName: string) => {
                          const data = m[partyName];
                          if (typeof data === 'object' && data !== null) {
                            return (data as PartyVoteData).votes || 0;
                          }
                          return 0;
                        };
                        const getRate = (partyName: string) => {
                          const data = m[partyName];
                          if (typeof data === 'object' && data !== null) {
                            return (data as PartyVoteData).rate || 0;
                          }
                          return 0;
                        };
                        const topParty = syosenkyokuData?.parties.reduce((max, p) => {
                          return getVotes(p) > getVotes(max) ? p : max;
                        }, syosenkyokuData.parties[0]);
                        return (
                          <TableRow key={m.name}>
                            <TableCell className="sticky left-0 bg-background font-medium">
                              <div className="flex items-center gap-2">
                                {m.name}
                                <Badge variant="outline" className="text-xs">
                                  {m.type}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {m.district}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatNumber(m.totalVotes)}
                            </TableCell>
                            {syosenkyokuData?.parties.map((partyName) => {
                              const votes = getVotes(partyName);
                              const rate = getRate(partyName);
                              const isTop = topParty === partyName && votes > 0;
                              return (
                                <TableCell
                                  key={partyName}
                                  className={`text-right font-mono text-xs ${isTop ? 'font-bold' : ''}`}
                                  style={isTop ? { backgroundColor: `${getPartyColor(partyName)}20` } : {}}
                                >
                                  {displayMode === 'votes' ? formatNumber(votes) : `${rate.toFixed(1)}%`}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 区市町村別棒グラフ（上位10） */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                区市町村別{displayMode === 'votes' ? '得票数' : '得票率'}（上位10）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                {electionType === 'hirei' ? (
                  <BarChart
                    data={filteredHireiMunicipalities.slice(0, 10).map((m) => {
                      const result: Record<string, string | number> = { name: m.name };
                      hireiData?.parties.forEach((p) => {
                        const votes = m.votes[p.name] || 0;
                        const rate = m.total > 0 ? (votes / m.total) * 100 : 0;
                        result[p.name] = displayMode === 'votes' ? votes : rate;
                      });
                      return result;
                    })}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => displayMode === 'votes' ? `${(v / 10000).toFixed(0)}万` : `${v.toFixed(0)}%`}
                      domain={displayMode === 'rate' ? [0, 100] : undefined}
                    />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) =>
                        displayMode === 'votes' ? formatNumber(value as number) : `${(value as number).toFixed(1)}%`
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {hireiData?.parties.map((p) => (
                      <Bar key={p.id} dataKey={p.name} stackId="a" fill={getPartyColor(p.name)} />
                    ))}
                  </BarChart>
                ) : (
                  <BarChart
                    data={filteredSyosenkyokuMunicipalities.slice(0, 10).map((m) => {
                      const result: Record<string, string | number> = { name: m.name };
                      syosenkyokuData?.parties.forEach((partyName) => {
                        const data = m[partyName];
                        if (typeof data === 'object' && data !== null) {
                          const pData = data as PartyVoteData;
                          result[partyName] = displayMode === 'votes' ? (pData.votes || 0) : (pData.rate || 0);
                        } else {
                          result[partyName] = 0;
                        }
                      });
                      return result;
                    })}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => displayMode === 'votes' ? `${(v / 10000).toFixed(0)}万` : `${v.toFixed(0)}%`}
                      domain={displayMode === 'rate' ? [0, 100] : undefined}
                    />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) =>
                        displayMode === 'votes' ? formatNumber(value as number) : `${(value as number).toFixed(1)}%`
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {syosenkyokuData?.parties.map((partyName) => (
                      <Bar key={partyName} dataKey={partyName} stackId="a" fill={getPartyColor(partyName)} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 政党別ランキング Tab */}
        <TabsContent value="ranking" className="space-y-4">
          {/* Election Type Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setRankingElectionType('hirei')}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                    rankingElectionType === 'hirei'
                      ? 'bg-primary text-primary-foreground'
                      : 'border hover:bg-muted'
                  }`}
                >
                  比例代表
                </button>
                <button
                  onClick={() => setRankingElectionType('shou')}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                    rankingElectionType === 'shou'
                      ? 'bg-primary text-primary-foreground'
                      : 'border hover:bg-muted'
                  }`}
                >
                  小選挙区
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">政党を選択</label>
                  <Select value={selectedParty} onValueChange={setSelectedParty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RANKING_PARTIES.map((party) => (
                        <SelectItem key={party} value={party}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getPartyColor(party) }}
                            />
                            {party}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleRankingSort('votes')}
                    className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${
                      rankingSortKey === 'votes' ? 'bg-primary text-primary-foreground' : 'border'
                    }`}
                  >
                    票数順
                    {rankingSortKey === 'votes' && (
                      rankingSortOrder === 'desc' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleRankingSort('rate')}
                    className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${
                      rankingSortKey === 'rate' ? 'bg-primary text-primary-foreground' : 'border'
                    }`}
                  >
                    得票率順
                    {rankingSortKey === 'rate' && (
                      rankingSortOrder === 'desc' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setRankingSortOrder(rankingSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 border rounded-md text-sm flex items-center gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {rankingSortOrder === 'asc' ? '昇順' : '降順'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {rankingData && (
            <Tabs value={rankingViewMode} onValueChange={(v) => setRankingViewMode(v as 'table' | 'ranking')}>
              <TabsList>
                <TabsTrigger value="table">全データテーブル</TabsTrigger>
                <TabsTrigger value="ranking">トップ30ランキング</TabsTrigger>
              </TabsList>

              {/* 全データテーブル */}
              <TabsContent value="table" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getPartyColor(selectedParty) }}
                      />
                      {selectedParty} - {rankingElectionType === 'hirei' ? '比例代表' : '小選挙区'}開票区別データ（{rankingSortedMunicipalities.length}件）
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>開票区名</TableHead>
                            {rankingElectionType === 'shou' && <TableHead>選挙区</TableHead>}
                            <TableHead>地域</TableHead>
                            <TableHead className="text-right">全党派票数</TableHead>
                            <TableHead
                              className="text-right cursor-pointer hover:bg-muted"
                              onClick={() => toggleRankingSort('votes')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                {selectedParty}票数
                                {rankingSortKey === 'votes' && (
                                  rankingSortOrder === 'desc' ? '↓' : '↑'
                                )}
                              </div>
                            </TableHead>
                            <TableHead
                              className="text-right cursor-pointer hover:bg-muted"
                              onClick={() => toggleRankingSort('rate')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                得票率
                                {rankingSortKey === 'rate' && (
                                  rankingSortOrder === 'desc' ? '↓' : '↑'
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="w-48">グラフ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rankingSortedMunicipalities.map((m, index) => {
                            const partyData = m[selectedParty] as RankingPartyData;
                            return (
                              <TableRow key={`${m.name}-${m.district || ''}`}>
                                <TableCell>
                                  {index < 3 ? (
                                    <Badge
                                      className={
                                        index === 0
                                          ? 'bg-yellow-500'
                                          : index === 1
                                          ? 'bg-gray-400'
                                          : 'bg-amber-600'
                                      }
                                    >
                                      {index + 1}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">{index + 1}</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">{m.name}</TableCell>
                                {rankingElectionType === 'shou' && (
                                  <TableCell>
                                    <Badge variant="secondary">{m.district}</Badge>
                                  </TableCell>
                                )}
                                <TableCell>
                                  <Badge variant="outline">{m.type}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-muted-foreground">
                                  {formatNumber(m.totalVotes)}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold">
                                  {formatNumber(partyData?.votes || 0)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatPercent(partyData?.rate || 0)}
                                </TableCell>
                                <TableCell>
                                  <div className="w-full bg-muted rounded-full h-3">
                                    <div
                                      className="h-3 rounded-full"
                                      style={{
                                        width: `${Math.min((partyData?.rate || 0) * 2.5, 100)}%`,
                                        backgroundColor: getPartyColor(selectedParty),
                                      }}
                                    />
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
              </TabsContent>

              {/* トップ30ランキング */}
              <TabsContent value="ranking" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* ランキングチャート */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        {selectedParty}（{rankingElectionType === 'hirei' ? '比例' : '小選挙区'}） - {rankingSortKey === 'votes' ? '票数' : '得票率'}トップ30
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={700}>
                        <BarChart
                          data={rankingTop30.map((m) => ({
                            name: m.name,
                            value: rankingSortKey === 'votes'
                              ? (m[selectedParty] as RankingPartyData)?.votes || 0
                              : (m[selectedParty] as RankingPartyData)?.rate || 0,
                          }))}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                          <XAxis
                            type="number"
                            tickFormatter={(v) =>
                              rankingSortKey === 'votes' ? `${(v / 1000).toFixed(0)}千` : `${v.toFixed(1)}%`
                            }
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={80}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(value) => [
                              rankingSortKey === 'votes'
                                ? formatNumber(value as number)
                                : formatPercent(value as number),
                              rankingSortKey === 'votes' ? '票数' : '得票率',
                            ]}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {rankingTop30.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  index === 0
                                    ? '#fbbf24'
                                    : index === 1
                                    ? '#9ca3af'
                                    : index === 2
                                    ? '#d97706'
                                    : getPartyColor(selectedParty)
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* ランキングテーブル */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">詳細ランキング</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">順位</TableHead>
                            <TableHead>開票区名</TableHead>
                            <TableHead className="text-right">票数</TableHead>
                            <TableHead className="text-right">得票率</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rankingTop30.map((m, index) => {
                            const partyData = m[selectedParty] as RankingPartyData;
                            return (
                              <TableRow key={`${m.name}-${m.district || ''}`}>
                                <TableCell>
                                  {index < 3 ? (
                                    <Badge
                                      className={
                                        index === 0
                                          ? 'bg-yellow-500'
                                          : index === 1
                                          ? 'bg-gray-400'
                                          : 'bg-amber-600'
                                      }
                                    >
                                      {index + 1}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">{index + 1}</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {m.name}
                                    {rankingElectionType === 'shou' && m.district && (
                                      <Badge variant="secondary" className="text-xs">
                                        {m.district}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {m.type}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatNumber(partyData?.votes || 0)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatPercent(partyData?.rate || 0)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* 政党別比較 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">全政党の上位開票区比較（{rankingElectionType === 'hirei' ? '比例' : '小選挙区'}）</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {RANKING_PARTIES.slice(0, 8).map((party) => {
                        const sorted = [...rankingData.municipalities].sort((a, b) => {
                          const aParty = a[party] as RankingPartyData;
                          const bParty = b[party] as RankingPartyData;
                          return (bParty?.rate || 0) - (aParty?.rate || 0);
                        });
                        const top3 = sorted.slice(0, 3);

                        return (
                          <div key={party} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getPartyColor(party) }}
                              />
                              <span className="font-medium text-sm">{party.slice(0, 6)}</span>
                            </div>
                            <div className="space-y-1">
                              {top3.map((m, i) => {
                                const partyData = m[party] as RankingPartyData;
                                return (
                                  <div key={`${m.name}-${m.district || ''}`} className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      {i + 1}. {m.name.slice(0, 4)}
                                    </span>
                                    <span className="font-mono">
                                      {formatPercent(partyData?.rate || 0)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TokyoPage() {
  return (
    <AppShell>
      <Header
        title="東京都 選挙結果"
        description="衆議院議員選挙（2024年・2026年）"
      />
      <TokyoContent />
    </AppShell>
  );
}
