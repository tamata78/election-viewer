/**
 * 選挙結果データの型定義
 */

export interface ElectionResult {
  year: number;
  regionType: 'district' | 'ward' | 'city';
  regionName: string;
  district: string;
  partyName: string;
  candidateName: string;
  votes: number;
  eligibleVoters: number;
}

export interface Party {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

export interface DistrictSummary {
  district: string;
  regionName: string;
  totalVotes: number;
  eligibleVoters: number;
  turnoutRate: number;
  results: CandidateResult[];
}

export interface CandidateResult {
  candidateName: string;
  partyName: string;
  votes: number;
  voteShare: number;
  isWinner: boolean;
}

export interface WardSummary {
  wardName: string;
  totalVotes: number;
  eligibleVoters: number;
  turnoutRate: number;
  partyResults: PartyResult[];
  seats: number;
}

export interface PartyResult {
  partyName: string;
  votes: number;
  voteShare: number;
  seats: number;
}

export interface YearComparison {
  year: number;
  partyName: string;
  votes: number;
  voteShare: number;
  seats: number;
  changeFromPrevious?: {
    votes: number;
    voteShare: number;
    seats: number;
  };
}

export interface HeatmapData {
  regionId: string;
  regionName: string;
  value: number;
  partyName?: string;
}

export interface FilterState {
  selectedParties: string[];
  selectedYear: number;
  selectedRegion: string;
  comparisonYear?: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}
