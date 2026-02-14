import Papa from 'papaparse';
import type { ElectionResult } from '@/types/election';

interface CSVRow {
  year: string;
  region_type: string;
  region_name: string;
  district: string;
  party_name: string;
  candidate_name: string;
  votes: string;
  eligible_voters: string;
}

export function parseElectionCSV(csvText: string): ElectionResult[] {
  const result = Papa.parse<CSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (result.errors.length > 0) {
    console.error('CSV parsing errors:', result.errors);
  }

  return result.data.map((row) => ({
    year: parseInt(row.year, 10),
    regionType: row.region_type as 'district' | 'ward' | 'city',
    regionName: row.region_name,
    district: row.district,
    partyName: row.party_name,
    candidateName: row.candidate_name,
    votes: parseInt(row.votes, 10) || 0,
    eligibleVoters: parseInt(row.eligible_voters, 10) || 0,
  }));
}

export async function loadCSVFile(url: string): Promise<ElectionResult[]> {
  const response = await fetch(url);
  const text = await response.text();
  return parseElectionCSV(text);
}

export function exportToCSV(data: ElectionResult[]): string {
  const csvData = data.map((row) => ({
    year: row.year,
    region_type: row.regionType,
    region_name: row.regionName,
    district: row.district,
    party_name: row.partyName,
    candidate_name: row.candidateName,
    votes: row.votes,
    eligible_voters: row.eligibleVoters,
  }));

  return Papa.unparse(csvData);
}

export function validateCSVStructure(headers: string[]): {
  valid: boolean;
  missingFields: string[];
} {
  const requiredFields = [
    'year',
    'region_type',
    'region_name',
    'district',
    'party_name',
    'candidate_name',
    'votes',
    'eligible_voters',
  ];

  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
  const missingFields = requiredFields.filter(
    (field) => !normalizedHeaders.includes(field)
  );

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
