'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import { Vote, Users, TrendingUp, Award } from 'lucide-react';

interface SyosenkyokuCandidate {
  number: number;
  party: string;
  candidate: string;
  votes: number;
  voteShare: number;
}

interface SyosenkyokuData {
  electionType: string;
  region: string;
  electionDate: string;
  totalVoters: number;
  totalVotes: number;
  invalidVotes: number;
  candidates: SyosenkyokuCandidate[];
}

interface HireiParty {
  number: number;
  party: string;
  votes: number;
  voteShare: number;
}

interface HireiData {
  electionType: string;
  region: string;
  electionDate: string;
  totalVoters: number;
  totalVotes: number;
  invalidVotes: number;
  parties: HireiParty[];
}

function MeguroContent() {
  const [syosenkyoku, setSyosenkyoku] = useState<SyosenkyokuData | null>(null);
  const [hirei, setHirei] = useState<HireiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [syoRes, hireiRes] = await Promise.all([
          fetch('/data/meguro-syosenkyoku.json'),
          fetch('/data/meguro-hirei.json'),
        ]);
        const syoData = await syoRes.json();
        const hireiData = await hireiRes.json();
        setSyosenkyoku(syoData);
        setHirei(hireiData);
      } catch (error) {
        console.error('データの読み込みに失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const sortedCandidates = syosenkyoku
    ? [...syosenkyoku.candidates].sort((a, b) => b.votes - a.votes)
    : [];
  const winner = sortedCandidates[0];

  const sortedParties = hirei
    ? [...hirei.parties].sort((a, b) => b.votes - a.votes)
    : [];

  const turnoutRate = syosenkyoku
    ? ((syosenkyoku.totalVotes + syosenkyoku.invalidVotes) / syosenkyoku.totalVoters) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">投票者数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(syosenkyoku?.totalVoters || 0)}
            </div>
            <p className="text-xs text-muted-foreground">有権者数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">投票率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(turnoutRate)}</div>
            <p className="text-xs text-muted-foreground">小選挙区</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">有効票数</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(syosenkyoku?.totalVotes || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              無効票: {formatNumber(syosenkyoku?.invalidVotes || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">当選者</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winner?.candidate || '-'}</div>
            <p className="text-xs text-muted-foreground">
              {winner?.party} / {formatPercent(winner?.voteShare || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="syosenkyoku" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="syosenkyoku">小選挙区</TabsTrigger>
          <TabsTrigger value="hirei">比例代表</TabsTrigger>
        </TabsList>

        {/* 小選挙区 Tab */}
        <TabsContent value="syosenkyoku" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 候補者別得票数バーチャート */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">候補者別得票数</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedCandidates} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" tickFormatter={(v) => formatNumber(v)} />
                    <YAxis
                      type="category"
                      dataKey="candidate"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [formatNumber(value as number), '得票数']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                      {sortedCandidates.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPartyColor(entry.party)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 得票率円グラフ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">得票率</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sortedCandidates}
                      dataKey="votes"
                      nameKey="candidate"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        `${(name as string).split(' ')[0]} ${formatPercent((percent || 0) * 100)}`
                      }
                      labelLine={false}
                    >
                      {sortedCandidates.map((entry, index) => (
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

          {/* 候補者テーブル */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">開票結果一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">順位</TableHead>
                    <TableHead>候補者名</TableHead>
                    <TableHead>政党</TableHead>
                    <TableHead className="text-right">得票数</TableHead>
                    <TableHead className="text-right">得票率</TableHead>
                    <TableHead className="w-48">グラフ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCandidates.map((candidate, index) => (
                    <TableRow key={candidate.number}>
                      <TableCell>
                        {index === 0 ? (
                          <Badge className="bg-yellow-500">1</Badge>
                        ) : (
                          <span className="text-muted-foreground">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {candidate.candidate}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getPartyColor(candidate.party) }}
                          />
                          {candidate.party}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(candidate.votes)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatPercent(candidate.voteShare)}
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${candidate.voteShare}%`,
                              backgroundColor: getPartyColor(candidate.party),
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 比例代表 Tab */}
        <TabsContent value="hirei" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 政党別得票数バーチャート */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">政党別得票数</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={sortedParties} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" tickFormatter={(v) => formatNumber(v)} />
                    <YAxis
                      type="category"
                      dataKey="party"
                      width={140}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value) => [formatNumber(value as number), '得票数']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                      {sortedParties.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPartyColor(entry.party)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 政党別詳細 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">政党別詳細</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedParties.map((party, index) => (
                    <div key={party.number} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getPartyColor(party.party) }}
                          />
                          <span className="font-medium text-sm">{party.party}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {index === 0 && <Badge className="mr-2 bg-yellow-500">1位</Badge>}
                          {formatPercent(party.voteShare)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(party.voteShare / sortedParties[0].voteShare) * 100}%`,
                            backgroundColor: getPartyColor(party.party),
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(party.votes)}票
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 政党テーブル */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">開票結果一覧（比例代表）</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">順位</TableHead>
                    <TableHead>政党名</TableHead>
                    <TableHead className="text-right">得票数</TableHead>
                    <TableHead className="text-right">得票率</TableHead>
                    <TableHead className="w-48">グラフ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedParties.map((party, index) => (
                    <TableRow key={party.number}>
                      <TableCell>
                        {index === 0 ? (
                          <Badge className="bg-yellow-500">1</Badge>
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
                      <TableCell>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${party.voteShare}%`,
                              backgroundColor: getPartyColor(party.party),
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 比例代表の集計情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">集計情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">投票者数</p>
                  <p className="text-lg font-bold">{formatNumber(hirei?.totalVoters || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">有効票数</p>
                  <p className="text-lg font-bold">{formatNumber(hirei?.totalVotes || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">無効票数</p>
                  <p className="text-lg font-bold">{formatNumber(hirei?.invalidVotes || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">政党数</p>
                  <p className="text-lg font-bold">{hirei?.parties.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MeguroPage() {
  return (
    <AppShell>
      <Header
        title="目黒区 選挙結果"
        description="令和8年2月8日執行 衆議院議員選挙"
      />
      <MeguroContent />
    </AppShell>
  );
}
