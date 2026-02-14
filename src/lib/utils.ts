import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ja-JP');
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculateVoteShare(votes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0;
  return (votes / totalVotes) * 100;
}

export function calculateTurnoutRate(
  totalVotes: number,
  eligibleVoters: number
): number {
  if (eligibleVoters === 0) return 0;
  return (totalVotes / eligibleVoters) * 100;
}
