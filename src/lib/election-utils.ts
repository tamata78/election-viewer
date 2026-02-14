/**
 * 選挙データ分析ユーティリティ
 */

export interface PartyResult {
  party: string;
  votes: number;
  rate: number;
}

export interface DistrictData {
  id: number;
  totalVotes: number;
  invalidVotes: number;
  eligibleVoters: number;
  turnoutRate: number;
}

export interface YearData {
  year: number;
  electionDate: string;
  syosenkyoku: {
    totalVotes: number;
    results: PartyResult[];
  };
  hirei: {
    totalVotes: number;
    results: PartyResult[];
  };
  districts: DistrictData[];
}

export interface ElectionMasterData {
  region: string;
  senkyoku: '4区' | '26区';
  years: {
    [key: string]: YearData;
  };
}

/**
 * 投票区の得票比率を計算
 */
export function calculateDistrictRatio(
  districtVotes: number,
  totalVotes: number
): number {
  if (totalVotes === 0) return 0;
  return (districtVotes / totalVotes) * 100;
}

/**
 * 2年間の得票数の差分を計算
 */
export function calculateVoteDifference(
  currentVotes: number,
  previousVotes: number
): { difference: number; percentage: number } {
  const difference = currentVotes - previousVotes;
  const percentage = previousVotes === 0 ? 0 : (difference / previousVotes) * 100;
  return { difference, percentage };
}

/**
 * 政党別の年次比較データを生成
 */
export function generatePartyComparison(
  year2024: PartyResult[],
  year2026: PartyResult[]
): Array<{
  party: string;
  votes2024: number;
  votes2026: number;
  rate2024: number;
  rate2026: number;
  voteDiff: number;
  rateDiff: number;
}> {
  const partyMap = new Map<string, {
    votes2024: number;
    votes2026: number;
    rate2024: number;
    rate2026: number;
  }>();

  year2024.forEach((p) => {
    partyMap.set(p.party, {
      votes2024: p.votes,
      votes2026: 0,
      rate2024: p.rate,
      rate2026: 0,
    });
  });

  year2026.forEach((p) => {
    const existing = partyMap.get(p.party);
    if (existing) {
      existing.votes2026 = p.votes;
      existing.rate2026 = p.rate;
    } else {
      partyMap.set(p.party, {
        votes2024: 0,
        votes2026: p.votes,
        rate2024: 0,
        rate2026: p.rate,
      });
    }
  });

  return Array.from(partyMap.entries())
    .map(([party, data]) => ({
      party,
      ...data,
      voteDiff: data.votes2026 - data.votes2024,
      rateDiff: data.rate2026 - data.rate2024,
    }))
    .sort((a, b) => b.votes2026 - a.votes2026);
}

/**
 * 投票区データを集計
 */
export function aggregateDistrictData(districts: DistrictData[]): {
  totalVotes: number;
  totalEligible: number;
  totalInvalid: number;
  avgTurnout: number;
} {
  const totalVotes = districts.reduce((sum, d) => sum + d.totalVotes, 0);
  const totalEligible = districts.reduce((sum, d) => sum + d.eligibleVoters, 0);
  const totalInvalid = districts.reduce((sum, d) => sum + d.invalidVotes, 0);
  const avgTurnout = districts.reduce((sum, d) => sum + d.turnoutRate, 0) / districts.length;

  return { totalVotes, totalEligible, totalInvalid, avgTurnout };
}

/**
 * スイング（支持率変動）の分類
 */
export function classifySwing(rateDiff: number): 'surge' | 'gain' | 'stable' | 'loss' | 'collapse' {
  if (rateDiff >= 5) return 'surge';
  if (rateDiff >= 2) return 'gain';
  if (rateDiff >= -2) return 'stable';
  if (rateDiff >= -5) return 'loss';
  return 'collapse';
}

/**
 * スイングの色を取得
 */
export function getSwingColor(swing: ReturnType<typeof classifySwing>): string {
  const colors = {
    surge: '#22c55e',
    gain: '#86efac',
    stable: '#9ca3af',
    loss: '#fca5a5',
    collapse: '#ef4444',
  };
  return colors[swing];
}
