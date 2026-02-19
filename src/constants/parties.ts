import type { Party } from '@/types/election';

export const PARTIES: Party[] = [
  { id: 'ldp', name: '自由民主党', shortName: '自民', color: '#e60012' },
  { id: 'cdp', name: '立憲民主党', shortName: '立民', color: '#00509d' },
  { id: 'ishin', name: '日本維新の会', shortName: '維新', color: '#00a651' },
  { id: 'komei', name: '公明党', shortName: '公明', color: '#f39800' },
  { id: 'jcp', name: '日本共産党', shortName: '共産', color: '#c8161d' },
  { id: 'dpfp', name: '国民民主党', shortName: '国民', color: '#ffd700' },
  { id: 'reiwa', name: 'れいわ新選組', shortName: 'れいわ', color: '#ed6d8a' },
  { id: 'sdp', name: '社会民主党', shortName: '社民', color: '#e95295' },
  { id: 'sansei', name: '参政党', shortName: '参政', color: '#ff6b00' },
  { id: 'team-mirai', name: 'チームみらい', shortName: 'みらい', color: '#00bfff' },
  { id: 'kibo', name: '希望の党', shortName: '希望', color: '#00bcd4' },
  { id: 'hosyu', name: '日本保守党', shortName: '保守', color: '#8b4513' },
  { id: 'chudo', name: '中道改革連合', shortName: '中道', color: '#9370db' },
  { id: 'genzei', name: '減税日本・ゆうこく連合', shortName: '減税', color: '#20b2aa' },
  { id: 'ind', name: '無所属', shortName: '無所属', color: '#808080' },
  { id: 'honnin', name: '本人届出', shortName: '本人届出', color: '#666666' },
  { id: 'other', name: 'その他', shortName: 'その他', color: '#cccccc' },
];

export const PARTY_COLOR_MAP: Record<string, string> = PARTIES.reduce(
  (acc, party) => {
    acc[party.name] = party.color;
    acc[party.shortName] = party.color;
    return acc;
  },
  {} as Record<string, string>
);

export function getPartyColor(partyName: string): string {
  return PARTY_COLOR_MAP[partyName] || '#cccccc';
}

export function getPartyByName(name: string): Party | undefined {
  return PARTIES.find(
    (p) => p.name === name || p.shortName === name || p.id === name
  );
}

export const TOKYO_WARDS = [
  '千代田区', '中央区', '港区', '新宿区', '文京区',
  '台東区', '墨田区', '江東区', '品川区', '目黒区',
  '大田区', '世田谷区', '渋谷区', '中野区', '杉並区',
  '豊島区', '北区', '荒川区', '板橋区', '練馬区',
  '足立区', '葛飾区', '江戸川区',
];

export const TAMA_CITIES = [
  '八王子市', '立川市', '武蔵野市', '三鷹市', '青梅市',
  '府中市', '昭島市', '調布市', '町田市', '小金井市',
  '小平市', '日野市', '東村山市', '国分寺市', '国立市',
  '福生市', '狛江市', '東大和市', '清瀬市', '東久留米市',
  '武蔵村山市', '多摩市', '稲城市', '羽村市', 'あきる野市',
  '西東京市',
];

export const YEARS = [2026, 2024, 2021, 2017, 2014];
