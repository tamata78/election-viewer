import type {
  ElectionResult,
  DistrictSummary,
  WardSummary,
  PartyResult,
  CandidateResult,
  HeatmapData,
} from '@/types/election';
import { calculateVoteShare, calculateTurnoutRate } from './utils';

export function groupByDistrict(
  data: ElectionResult[]
): Record<string, ElectionResult[]> {
  return data.reduce(
    (acc, item) => {
      const key = `${item.regionName}-${item.district}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, ElectionResult[]>
  );
}

export function groupByWard(
  data: ElectionResult[]
): Record<string, ElectionResult[]> {
  return data.reduce(
    (acc, item) => {
      if (!acc[item.regionName]) {
        acc[item.regionName] = [];
      }
      acc[item.regionName].push(item);
      return acc;
    },
    {} as Record<string, ElectionResult[]>
  );
}

export function groupByParty(
  data: ElectionResult[]
): Record<string, ElectionResult[]> {
  return data.reduce(
    (acc, item) => {
      if (!acc[item.partyName]) {
        acc[item.partyName] = [];
      }
      acc[item.partyName].push(item);
      return acc;
    },
    {} as Record<string, ElectionResult[]>
  );
}

export function calculateDistrictSummary(
  districtData: ElectionResult[]
): DistrictSummary | null {
  if (districtData.length === 0) return null;

  const first = districtData[0];
  const totalVotes = districtData.reduce((sum, d) => sum + d.votes, 0);
  const eligibleVoters = first.eligibleVoters;

  const results: CandidateResult[] = districtData
    .map((d) => ({
      candidateName: d.candidateName,
      partyName: d.partyName,
      votes: d.votes,
      voteShare: calculateVoteShare(d.votes, totalVotes),
      isWinner: false,
    }))
    .sort((a, b) => b.votes - a.votes);

  if (results.length > 0) {
    results[0].isWinner = true;
  }

  return {
    district: first.district,
    regionName: first.regionName,
    totalVotes,
    eligibleVoters,
    turnoutRate: calculateTurnoutRate(totalVotes, eligibleVoters),
    results,
  };
}

export function calculateWardSummary(
  wardData: ElectionResult[]
): WardSummary | null {
  if (wardData.length === 0) return null;

  const wardName = wardData[0].regionName;
  const totalVotes = wardData.reduce((sum, d) => sum + d.votes, 0);

  // Get unique eligible voters per district to avoid double counting
  const districtEligibleVoters = new Map<string, number>();
  wardData.forEach((d) => {
    districtEligibleVoters.set(d.district, d.eligibleVoters);
  });
  const eligibleVoters = Array.from(districtEligibleVoters.values()).reduce(
    (sum, v) => sum + v,
    0
  );

  // Group by party
  const partyGroups = groupByParty(wardData);
  const partyResults: PartyResult[] = Object.entries(partyGroups)
    .map(([partyName, partyData]) => {
      const votes = partyData.reduce((sum, d) => sum + d.votes, 0);
      // Count seats (winners in each district)
      const districts = new Set(partyData.map((d) => d.district));
      let seats = 0;
      districts.forEach((district) => {
        const districtData = wardData.filter((d) => d.district === district);
        const winner = districtData.reduce((max, d) =>
          d.votes > max.votes ? d : max
        );
        if (winner.partyName === partyName) {
          seats++;
        }
      });

      return {
        partyName,
        votes,
        voteShare: calculateVoteShare(votes, totalVotes),
        seats,
      };
    })
    .sort((a, b) => b.votes - a.votes);

  const totalSeats = partyResults.reduce((sum, p) => sum + p.seats, 0);

  return {
    wardName,
    totalVotes,
    eligibleVoters,
    turnoutRate: calculateTurnoutRate(totalVotes, eligibleVoters),
    partyResults,
    seats: totalSeats,
  };
}

export function calculatePartyTotals(
  data: ElectionResult[]
): PartyResult[] {
  const totalVotes = data.reduce((sum, d) => sum + d.votes, 0);
  const partyGroups = groupByParty(data);

  return Object.entries(partyGroups)
    .map(([partyName, partyData]) => {
      const votes = partyData.reduce((sum, d) => sum + d.votes, 0);

      // Count seats
      const districtGroups = groupByDistrict(data);
      let seats = 0;
      Object.values(districtGroups).forEach((districtData) => {
        const winner = districtData.reduce((max, d) =>
          d.votes > max.votes ? d : max
        );
        if (winner.partyName === partyName) {
          seats++;
        }
      });

      return {
        partyName,
        votes,
        voteShare: calculateVoteShare(votes, totalVotes),
        seats,
      };
    })
    .sort((a, b) => b.votes - a.votes);
}

export function generateHeatmapData(
  data: ElectionResult[],
  targetParty?: string
): HeatmapData[] {
  const wardGroups = groupByWard(data);

  return Object.entries(wardGroups).map(([wardName, wardData]) => {
    const totalVotes = wardData.reduce((sum, d) => sum + d.votes, 0);

    let value: number;
    if (targetParty) {
      const partyVotes = wardData
        .filter((d) => d.partyName === targetParty)
        .reduce((sum, d) => sum + d.votes, 0);
      value = calculateVoteShare(partyVotes, totalVotes);
    } else {
      // Default: turnout rate
      const eligibleVoters = wardData[0]?.eligibleVoters || 0;
      value = calculateTurnoutRate(totalVotes, eligibleVoters);
    }

    return {
      regionId: wardName,
      regionName: wardName,
      value,
      partyName: targetParty,
    };
  });
}

export function filterByParties(
  data: ElectionResult[],
  partyNames: string[]
): ElectionResult[] {
  if (partyNames.length === 0) return data;
  return data.filter((d) => partyNames.includes(d.partyName));
}

export function filterByYear(
  data: ElectionResult[],
  year: number
): ElectionResult[] {
  return data.filter((d) => d.year === year);
}

export function filterByRegion(
  data: ElectionResult[],
  regionName: string
): ElectionResult[] {
  if (!regionName) return data;
  return data.filter((d) => d.regionName === regionName);
}
