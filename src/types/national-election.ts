/** 比例代表 候補者 */
export interface HireiCandidate {
  rank: number;              // 名簿順位
  name: string;              // 候補者名
  age: number;               // 年齢
  party: string;             // 政党名
  result: '当' | '落' | '比当'; // 当選結果
  votes?: number;            // 小選挙区得票数（重複立候補時）
  winnerVotes?: number;      // 当選者得票数（重複立候補時）
  sekihairitsu?: number;     // 惜敗率（%）
  block: string;             // 比例ブロック名
}

/** 比例代表 政党ブロック別結果 */
export interface HireiPartyBlock {
  party: string;
  block: string;
  seats: number;             // 獲得議席
  votes: number;             // 得票数
  voteRate: number;          // 得票率(%)
  candidates: HireiCandidate[];
}

/** 比例代表 ブロック */
export interface HireiBlock {
  name: string;              // ブロック名（北海道, 東北, ...）
  totalSeats: number;        // 定数
  totalVotes: number;        // 総投票数
  parties: HireiPartyBlock[];
}

/** 小選挙区 候補者 */
export interface ShouCandidate {
  name: string;
  party: string;
  votes: number;
  voteRate: number;
  result: '当' | '落';
  isDualCandidate: boolean;  // 重複立候補
}

/** 小選挙区 選挙区結果 */
export interface ShouDistrict {
  prefecture: string;        // 都道府県
  district: number;          // 区番号
  candidates: ShouCandidate[];
}

/** 小選挙区 都道府県集計 */
export interface ShouPrefectureSummary {
  prefecture: string;
  totalDistricts: number;
  partyResults: {
    party: string;
    seats: number;
    totalVotes: number;
    voteRate: number;
  }[];
}

/** 全国選挙データ（1年分） */
export interface NationalElectionData {
  year: number;
  electionDate: string;
  hirei: {
    totalSeats: number;
    blocks: HireiBlock[];
  };
  shou: {
    totalSeats: number;
    prefectures: ShouPrefectureSummary[];
    districts: ShouDistrict[];
  };
}
