'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ElectionResult, FilterState } from '@/types/election';
import { loadCSVFile, parseElectionCSV } from '@/lib/csv-parser';
import {
  filterByParties,
  filterByYear,
  filterByRegion,
} from '@/lib/data-processor';

const DEFAULT_FILTER: FilterState = {
  selectedParties: [],
  selectedYear: 2026,
  selectedRegion: '',
};

export function useElectionData() {
  const [rawData, setRawData] = useState<ElectionResult[]>([]);
  const [filteredData, setFilteredData] = useState<ElectionResult[]>([]);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [otaData, meguroData, tokyoData] = await Promise.all([
          loadCSVFile('/data/2026-ota.csv'),
          loadCSVFile('/data/2026-meguro.csv'),
          loadCSVFile('/data/tokyo-summary.csv'),
        ]);
        const allData = [...otaData, ...meguroData, ...tokyoData];
        setRawData(allData);
        setError(null);
      } catch (err) {
        setError('データの読み込みに失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    let data = rawData;

    if (filter.selectedYear) {
      data = filterByYear(data, filter.selectedYear);
    }

    if (filter.selectedParties.length > 0) {
      data = filterByParties(data, filter.selectedParties);
    }

    if (filter.selectedRegion) {
      data = filterByRegion(data, filter.selectedRegion);
    }

    setFilteredData(data);
  }, [rawData, filter]);

  const importData = useCallback((csvText: string) => {
    try {
      const newData = parseElectionCSV(csvText);
      setRawData((prev) => [...prev, ...newData]);
      return { success: true, count: newData.length };
    } catch (err) {
      return { success: false, error: 'CSVの解析に失敗しました' };
    }
  }, []);

  const setSelectedParties = useCallback((parties: string[]) => {
    setFilter((prev) => ({ ...prev, selectedParties: parties }));
  }, []);

  const setSelectedYear = useCallback((year: number) => {
    setFilter((prev) => ({ ...prev, selectedYear: year }));
  }, []);

  const setSelectedRegion = useCallback((region: string) => {
    setFilter((prev) => ({ ...prev, selectedRegion: region }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilter(DEFAULT_FILTER);
  }, []);

  return {
    data: filteredData,
    rawData,
    loading,
    error,
    filter,
    importData,
    setSelectedParties,
    setSelectedYear,
    setSelectedRegion,
    resetFilters,
  };
}
