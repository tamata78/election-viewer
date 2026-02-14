/**
 * 大田区 投票区・町名マッピングデータ（完全版）
 * 投票区番号と対応する町名（住所）のマスターデータ
 */

export interface OtaDistrictInfo {
  id: number;
  name: string;
  towns: string[];
  senkyoku: '4区' | '26区';
  area: '大森' | '調布' | '蒲田' | '糀谷・羽田';
}

export const OTA_DISTRICTS: OtaDistrictInfo[] = [
  // 東京26区 - 調布エリア（田園調布・雪谷・嶺町・久が原・千束）
  { id: 1, name: '田園調布小学校', towns: ['田園調布1丁目', '田園調布2丁目'], senkyoku: '26区', area: '調布' },
  { id: 2, name: '田園調布特別支援学校', towns: ['田園調布3丁目', '田園調布4丁目', '田園調布5丁目'], senkyoku: '26区', area: '調布' },
  { id: 3, name: '調布大塚小学校', towns: ['雪谷大塚町', '石川町1丁目'], senkyoku: '26区', area: '調布' },
  { id: 4, name: '嶺町特別出張所', towns: ['田園調布南', '田園調布本町'], senkyoku: '26区', area: '調布' },
  { id: 5, name: '東調布第一小学校', towns: ['田園調布1丁目の一部', '東嶺町'], senkyoku: '26区', area: '調布' },
  { id: 6, name: '東調布第三小学校', towns: ['北嶺町', '久が原1丁目'], senkyoku: '26区', area: '調布' },
  { id: 7, name: '嶺町小学校', towns: ['西嶺町', '鵜の木1丁目'], senkyoku: '26区', area: '調布' },
  { id: 8, name: '千鳥小学校', towns: ['千鳥1丁目', '千鳥2丁目', '千鳥3丁目'], senkyoku: '26区', area: '調布' },
  { id: 9, name: '久原小学校', towns: ['久が原2丁目', '久が原3丁目', '久が原4丁目', '久が原5丁目'], senkyoku: '26区', area: '調布' },
  { id: 10, name: '松仙小学校', towns: ['久が原6丁目', '南久が原1丁目', '南久が原2丁目'], senkyoku: '26区', area: '調布' },
  { id: 11, name: '大森第十中学校', towns: ['仲池上1丁目', '仲池上2丁目'], senkyoku: '26区', area: '調布' },
  { id: 12, name: '池雪小学校', towns: ['東雪谷1丁目', '東雪谷2丁目', '東雪谷3丁目', '東雪谷4丁目'], senkyoku: '26区', area: '調布' },
  { id: 13, name: '上池台障害者福祉会館', towns: ['上池台1丁目', '上池台2丁目'], senkyoku: '26区', area: '調布' },
  { id: 14, name: '小池小学校', towns: ['上池台3丁目', '上池台4丁目', '上池台5丁目'], senkyoku: '26区', area: '調布' },
  { id: 15, name: '雪谷小学校', towns: ['南雪谷1丁目', '南雪谷2丁目', '南雪谷3丁目', '南雪谷4丁目', '南雪谷5丁目'], senkyoku: '26区', area: '調布' },
  { id: 16, name: '洗足池小学校', towns: ['南千束1丁目', '南千束2丁目', '南千束3丁目'], senkyoku: '26区', area: '調布' },
  { id: 17, name: '赤松小学校', towns: ['北千束1丁目', '北千束2丁目'], senkyoku: '26区', area: '調布' },
  { id: 18, name: '清水窪小学校', towns: ['北千束3丁目', '石川町2丁目'], senkyoku: '26区', area: '調布' },

  // 東京4区 - 大森エリア
  { id: 19, name: '大森第四小学校', towns: ['大森北1丁目', '大森北2丁目', '大森本町1丁目'], senkyoku: '4区', area: '大森' },
  { id: 20, name: '中富小学校', towns: ['大森本町2丁目', '平和の森公園'], senkyoku: '4区', area: '大森' },
  { id: 21, name: '大森第一小学校', towns: ['大森南1丁目', '大森南2丁目', '大森南3丁目', '大森南4丁目', '大森南5丁目'], senkyoku: '4区', area: '大森' },
  { id: 22, name: '大森東小学校', towns: ['大森東1丁目', '大森東2丁目'], senkyoku: '4区', area: '大森' },
  { id: 23, name: '大森第五小学校', towns: ['大森東3丁目', '大森東4丁目', '大森東5丁目'], senkyoku: '4区', area: '大森' },
  { id: 24, name: '開桜小学校', towns: ['大森西1丁目', '大森西2丁目'], senkyoku: '4区', area: '大森' },
  { id: 25, name: '大森第八中学校', towns: ['大森西3丁目', '大森西4丁目'], senkyoku: '4区', area: '大森' },
  { id: 26, name: '大森第三小学校', towns: ['大森西5丁目', '大森西6丁目'], senkyoku: '4区', area: '大森' },
  { id: 27, name: '大森第二中学校', towns: ['大森西7丁目', '大森北3丁目'], senkyoku: '4区', area: '大森' },
  { id: 28, name: '入新井第一小学校', towns: ['大森北4丁目', '大森北5丁目', '大森北6丁目'], senkyoku: '4区', area: '大森' },
  { id: 29, name: '山王小学校', towns: ['山王1丁目', '山王2丁目', '山王3丁目'], senkyoku: '4区', area: '大森' },
  { id: 30, name: '馬込第二小学校', towns: ['山王4丁目', '中央1丁目'], senkyoku: '4区', area: '大森' },
  { id: 31, name: '馬込小学校', towns: ['南馬込1丁目', '南馬込2丁目'], senkyoku: '4区', area: '大森' },
  { id: 32, name: '馬込第三小学校', towns: ['南馬込3丁目', '南馬込4丁目'], senkyoku: '4区', area: '大森' },
  { id: 33, name: '貝塚中学校', towns: ['南馬込5丁目', '南馬込6丁目'], senkyoku: '4区', area: '大森' },
  { id: 34, name: '梅田小学校', towns: ['中央2丁目', '中央3丁目', '中央4丁目'], senkyoku: '4区', area: '大森' },
  { id: 35, name: '池上会館', towns: ['池上1丁目', '池上2丁目', '池上3丁目'], senkyoku: '4区', area: '大森' },
  { id: 36, name: '徳持小学校', towns: ['池上4丁目', '池上5丁目', '池上6丁目'], senkyoku: '4区', area: '大森' },
  { id: 37, name: '池上第二小学校', towns: ['池上7丁目', '池上8丁目'], senkyoku: '4区', area: '大森' },
  { id: 38, name: '入新井第四小学校', towns: ['中央5丁目', '中央6丁目'], senkyoku: '4区', area: '大森' },
  { id: 39, name: '大森第三中学校', towns: ['中央7丁目', '中央8丁目'], senkyoku: '4区', area: '大森' },
  { id: 40, name: '入新井第二小学校', towns: ['大森中1丁目', '大森中2丁目', '大森中3丁目'], senkyoku: '4区', area: '大森' },

  // 東京4区 - 蒲田エリア
  { id: 41, name: '東蒲小学校', towns: ['東蒲田1丁目', '東蒲田2丁目'], senkyoku: '4区', area: '蒲田' },
  { id: 42, name: '南蒲小学校', towns: ['南蒲田1丁目', '南蒲田2丁目', '南蒲田3丁目'], senkyoku: '4区', area: '蒲田' },
  { id: 43, name: '北蒲広場', towns: ['蒲田1丁目', '蒲田2丁目', '蒲田3丁目'], senkyoku: '4区', area: '蒲田' },
  { id: 44, name: '蒲田小学校', towns: ['蒲田4丁目', '蒲田5丁目'], senkyoku: '4区', area: '蒲田' },
  { id: 45, name: '新宿小学校', towns: ['蒲田本町1丁目', '蒲田本町2丁目'], senkyoku: '4区', area: '蒲田' },

  // 東京4区 - 糀谷・羽田エリア
  { id: 46, name: '北糀谷小学校', towns: ['北糀谷1丁目', '北糀谷2丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 47, name: '糀谷小学校', towns: ['西糀谷1丁目', '西糀谷2丁目', '西糀谷3丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 48, name: '東糀谷小学校', towns: ['東糀谷1丁目', '東糀谷2丁目', '東糀谷3丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 49, name: 'コミュニティセンター羽田旭', towns: ['羽田旭町', '羽田1丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 50, name: '羽田小学校', towns: ['羽田2丁目', '羽田3丁目', '羽田4丁目', '羽田5丁目', '羽田6丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 51, name: '萩中小学校', towns: ['萩中1丁目', '萩中2丁目', '萩中3丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 52, name: '中萩中小学校', towns: ['本羽田1丁目', '本羽田2丁目', '本羽田3丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 53, name: '出雲小学校', towns: ['東六郷1丁目', '南六郷1丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 54, name: '東六郷小学校', towns: ['東六郷2丁目', '東六郷3丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 55, name: '南六郷小学校', towns: ['南六郷2丁目', '南六郷3丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 56, name: '仲六郷小学校', towns: ['仲六郷1丁目', '仲六郷2丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 57, name: '六郷小学校', towns: ['仲六郷3丁目', '仲六郷4丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 58, name: '高畑小学校', towns: ['西六郷1丁目', '西六郷2丁目'], senkyoku: '4区', area: '糀谷・羽田' },
  { id: 59, name: '西六郷小学校', towns: ['西六郷3丁目', '西六郷4丁目'], senkyoku: '4区', area: '糀谷・羽田' },

  // 東京4区 - 蒲田エリア（西蒲田・新蒲田・矢口）
  { id: 60, name: 'おなづか小学校', towns: ['西蒲田1丁目', '西蒲田2丁目', '西蒲田3丁目'], senkyoku: '4区', area: '蒲田' },
  { id: 61, name: '蓮沼中学校', towns: ['西蒲田6丁目', '西蒲田7丁目'], senkyoku: '4区', area: '蒲田' },
  { id: 62, name: '相生小学校', towns: ['西蒲田4丁目', '西蒲田5丁目'], senkyoku: '4区', area: '蒲田' },
  { id: 63, name: '御園中学校', towns: ['西蒲田8丁目', '新蒲田1丁目'], senkyoku: '4区', area: '蒲田' },
  { id: 64, name: '道塚小学校', towns: ['新蒲田2丁目', '新蒲田3丁目'], senkyoku: '4区', area: '蒲田' },
  { id: 65, name: '矢口東小学校', towns: ['東矢口1丁目', '東矢口2丁目', '東矢口3丁目'], senkyoku: '4区', area: '蒲田' },
  { id: 66, name: '矢口小学校', towns: ['矢口1丁目', '矢口2丁目', '矢口3丁目'], senkyoku: '4区', area: '蒲田' },

  // 東京26区 - 調布エリア（多摩川・下丸子・鵜の木）
  { id: 67, name: '多摩川小学校', towns: ['多摩川1丁目', '多摩川2丁目'], senkyoku: '26区', area: '調布' },
  { id: 68, name: '矢口西小学校', towns: ['千鳥1丁目の一部', '下丸子1丁目', '下丸子2丁目'], senkyoku: '26区', area: '調布' },
  { id: 69, name: '大田区民プラザ', towns: ['下丸子3丁目', '下丸子4丁目'], senkyoku: '26区', area: '調布' },
  { id: 70, name: '矢口中学校', towns: ['鵜の木2丁目', '鵜の木3丁目'], senkyoku: '26区', area: '調布' },
];

export const OTA_DISTRICT_MAP = OTA_DISTRICTS.reduce(
  (acc, district) => {
    acc[district.id] = district;
    return acc;
  },
  {} as Record<number, OtaDistrictInfo>
);

export function getDistrictById(id: number): OtaDistrictInfo | undefined {
  return OTA_DISTRICT_MAP[id];
}

export function getDistrictsBySenkyoku(senkyoku: '4区' | '26区'): OtaDistrictInfo[] {
  return OTA_DISTRICTS.filter((d) => d.senkyoku === senkyoku);
}

export function getDistrictsByArea(area: string): OtaDistrictInfo[] {
  return OTA_DISTRICTS.filter((d) => d.area === area);
}

export const OTA_AREAS = ['大森', '調布', '蒲田', '糀谷・羽田'] as const;
export type OtaArea = (typeof OTA_AREAS)[number];
