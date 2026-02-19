#!/usr/bin/env python3
"""
令和4年7月10日執行 第26回参議院議員通常選挙 全国データ変換スクリプト
総務省Excelファイル → NationalElectionData JSON

使用ファイル (temp_excel/ 配下):
  sangiin26_000825827.xls  党派別得票数（比例代表）
  sangiin26_000825825.xls  党派別当選人数（比例代表、選挙区）
  sangiin26_000825826.xls  都道府県別当選人数（選挙区）
  sangiin26_000825834.xls  都道府県別得票数（選挙区）
  sangiin26_000825839.xls  都道府県別有効投票数（選挙区）
"""
import xlrd
import json
import re

BASE = '/Users/tamata78/work/election-viewer/temp_excel'
OUTPUT = '/Users/tamata78/work/election-viewer/public/data/elections/sangiin_2022.json'

# ── 47都道府県 (標準順、000825834.xls の並び順) ──────────────────────────────
PREFS_47 = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
    '岐阜県', '静岡県', '愛知県', '三重県',
    '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県',
    '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

# 合区マッピング (個別県名 → 合区名)
MERGE = {
    '鳥取県': '鳥取県・島根県',
    '島根県': '鳥取県・島根県',
    '徳島県': '徳島県・高知県',
    '高知県': '徳島県・高知県',
}

# 45選挙区 (合区適用後の並び順、000825826.xls の並び)
SENKYOKU_45 = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
    '岐阜県', '静岡県', '愛知県', '三重県',
    '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県・島根県', '岡山県', '広島県', '山口県',
    '徳島県・高知県', '香川県', '愛媛県',
    '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]


def safe_num(val):
    """セル値を数値に変換 (カンマ・全角スペース・空白除去)"""
    if val is None or val == '':
        return 0
    if isinstance(val, (int, float)):
        return int(round(val)) if abs(val - round(val)) < 0.5 else val
    s = str(val).replace(',', '').replace('　', '').strip()
    s = re.sub(r'[^\d.\-]', '', s)
    if not s:
        return 0
    try:
        return int(round(float(s)))
    except ValueError:
        return 0


def safe_rate(val):
    if val is None or val == '':
        return 0.0
    try:
        return round(float(str(val).strip()), 2)
    except (ValueError, TypeError):
        return 0.0


def clean_party(name):
    """政党名から注記 (※1 等) を除去"""
    return re.sub(r'\s*※\d+.*$', '', str(name)).strip()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. 比例代表 得票数
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def extract_hirei_votes():
    """
    000825827.xls から今回（令和4年）の政党別得票数・得票率を取得。
    構造 (0-indexed):
      Section1 row2: party headers [区分, 自民, 立憲, 維新, 公明, 国民, 共産, れいわ]
      Section1 row5: 今回の得票数 (cols 1-7)
      Section1 row7: 今回の得票率 (cols 1-7)
      Section2 row16: [区分, 社民, NHK, 参政, 幸福, ごぼう, 日本第一, くにもり]
      Section2 row18: 今回の得票数
      Section2 row20: 今回の得票率
      Section3 row35: [区分, 維新政党・新風, ...]
      Section3 row37: 今回の得票数
    """
    wb = xlrd.open_workbook(f'{BASE}/sangiin26_000825827.xls', encoding_override='shift_jis')
    sh = wb.sheet_by_index(0)

    def get_row(r):
        return [sh.cell(r, c).value for c in range(sh.ncols)]

    result = {}

    # Section 1 (0-indexed rows)
    headers1 = [clean_party(sh.cell(3, c).value) for c in range(1, 8)]   # row4
    votes1   = get_row(5)   # row6 今回
    rates1   = get_row(7)   # row8 今回の得票率
    for i, party in enumerate(headers1):
        result[party] = {
            'votes':    safe_num(votes1[i + 1]),
            'voteRate': safe_rate(rates1[i + 1]),
            'seats':    0,
        }

    # Section 2 (0-indexed rows 16, 18, 20)
    headers2 = [clean_party(sh.cell(16, c).value) for c in range(1, 8)]  # row17
    votes2   = get_row(18)  # row19 今回
    rates2   = get_row(20)  # row21 今回の得票率
    for i, party in enumerate(headers2):
        result[party] = {
            'votes':    safe_num(votes2[i + 1]),
            'voteRate': safe_rate(rates2[i + 1]),
            'seats':    0,
        }

    # Section 3 (0-indexed rows 35, 37, 39) — 維新政党・新風 のみ有効
    headers3 = [clean_party(sh.cell(35, c).value) for c in range(1, 3)]  # row36
    votes3   = get_row(37)  # row38 今回
    rates3   = get_row(39)  # row40 今回の得票率
    for i, party in enumerate(headers3):
        v = safe_num(votes3[i + 1])
        if v > 0 and party and party not in ('合　計', '合計', ''):
            result[party] = {
                'votes':    v,
                'voteRate': safe_rate(rates3[i + 1]),
                'seats':    0,
            }

    # 総投票数
    total_votes = safe_num(sh.cell(37, 5).value)  # 合計列

    return result, total_votes


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. 比例代表 当選人数
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def extract_hirei_seats():
    """
    000825825.xls から比例代表 計行の当選人数を取得。
    Row5 header: [区分, '', 男, 女, 計(自民), 男, 女, 計(立憲), ...]
    Row9  (比例代表 計): cols 4,7,10,13,16,19 = 自民,立憲,維新,公明,国民,共産
    Row26 (れいわ〜の比例代表 計): cols 4,7,10,13 = れいわ,社民,NHK,参政
    """
    wb = xlrd.open_workbook(f'{BASE}/sangiin26_000825825.xls', encoding_override='shift_jis')
    sh = wb.sheet_by_index(0)

    def cell(r, c):
        return sh.cell(r, c).value

    def seats(r, col):
        return safe_num(cell(r, col))

    # Section1 ヘッダー行(row3 0-indexed=2): 自民,立憲,維新,公明,国民,共産,れいわ,社民
    # 比例代表 計 = row9 (0-indexed=8)
    r1 = 8  # 0-indexed
    s = {
        '自由民主党': seats(r1, 4),
        '立憲民主党': seats(r1, 7),
        '日本維新の会': seats(r1, 10),
        '公明党': seats(r1, 13),
        '国民民主党': seats(r1, 16),
        '日本共産党': seats(r1, 19),
    }

    # Section2 ヘッダー(row20=0-indexed19): れいわ,社民,NHK,参政,...
    # 比例代表 計 = row26 (0-indexed=25)
    r2 = 25
    s.update({
        'れいわ新選組': seats(r2, 4),
        '社会民主党': seats(r2, 7),
        'ＮＨＫ党': seats(r2, 10),
        '参政党': seats(r2, 13),
    })

    return s


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. 選挙区 都道府県別当選人数 (000825826.xls)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def extract_senkyoku_seats():
    """
    都道府県 × 政党 の当選人数。
    各セクション:
      col1=定数, party_k_計=col(5+4k)  (k=0,1,...7)
    Section1 (rows 5-49, 0-indexed): 自民,立憲,維新,公明,国民,共産,れいわ,社民
    Section2 (rows 55-99, 0-indexed): NHK,参政,幸福,ごぼう,日本第一,くにもり,維新政党,諸派
    Section3 (rows 104-149, 0-indexed): 無所属(のみ注目), 合計
    """
    wb = xlrd.open_workbook(f'{BASE}/sangiin26_000825826.xls', encoding_override='shift_jis')
    sh = wb.sheet_by_index(0)

    # セクション1の政党リスト (col2,6,10,14,18,22,26,30 がそれぞれ始点)
    sec1_parties = ['自由民主党', '立憲民主党', '日本維新の会', '公明党',
                    '国民民主党', '日本共産党', 'れいわ新選組', '社会民主党']
    sec2_parties = ['ＮＨＫ党', '参政党', '幸福実現党', 'ごぼうの党',
                    '日本第一党', '新党くにもり', '維新政党・新風', '諸派']
    sec3_parties = ['無所属']  # 第3セクションは無所属のみ注目

    # 定数・当選人数を格納 {pref: {定数: n, party: n, ...}}
    pref_data = {p: {'定数': 0} for p in SENKYOKU_45}

    def read_section(row_start, parties):
        """
        row_start: 45都道府県の最初の行 (0-indexed)
        各行: col0=都道府県名, col1=定数, col(5+4k)=party[k]計
        """
        for i, pref in enumerate(SENKYOKU_45):
            r = row_start + i
            if r >= sh.nrows:
                break
            row = [sh.cell(r, c).value for c in range(sh.ncols)]
            # 定数は Section1 のみ取得 (文字列 '4(1)' → 数値部分の合計)
            if row_start == 5:  # sec1 starts here
                teisuu_raw = str(row[1]).strip()
                nums = re.findall(r'\d+', teisuu_raw)
                pref_data[pref]['定数'] = sum(int(n) for n in nums)

            for k, party in enumerate(parties):
                col = 5 + 4 * k
                if col < len(row):
                    v = safe_num(row[col])
                    pref_data[pref][party] = pref_data[pref].get(party, 0) + v

    # セクション1: rows 5-49 (0-indexed)
    read_section(5, sec1_parties)
    # セクション2: rows 55-99 (0-indexed)  ← 52=計, 53=blank, 54=header, 55 starts data
    # 実際の行番号を確認するため: Section1 header=row2(0-indexed), data=rows5-49, 計=50, blank=51, Section2 header=52
    # Section2 の data 開始は header+3 = 52+3 = 55
    read_section(55, sec2_parties)
    # セクション3: header=102(0-indexed), data=rows105-149
    read_section(105, sec3_parties)

    return pref_data


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. 選挙区 都道府県別得票数 (000825834.xls)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def extract_senkyoku_votes():
    """
    各セクション: party1_計=col3, party2_計=col6
    47都道府県データ → 合区をマージして45選挙区に変換
    """
    wb = xlrd.open_workbook(f'{BASE}/sangiin26_000825834.xls', encoding_override='shift_jis')
    sh = wb.sheet_by_index(0)

    # セクション (0-indexed header row → (party1, party2))
    sections = [
        (2,   '自由民主党',   '立憲民主党'),
        (58,  '日本維新の会', '公明党'),
        (114, '国民民主党',   '日本共産党'),
        (170, 'れいわ新選組', '社会民主党'),
        (226, 'ＮＨＫ党',    '参政党'),
        (282, '幸福実現党',   '日本第一党'),
        (338, '新党くにもり', '維新政党・新風'),
        (394, '諸派',         '無所属'),
    ]

    # {pref: {party: votes}}
    votes_47 = {p: {} for p in PREFS_47}

    for (header_row, p1, p2) in sections:
        # 都道府県データは header_row+3 〜 header_row+49 (0-indexed)
        data_start = header_row + 3
        for i, pref in enumerate(PREFS_47):
            r = data_start + i
            if r >= sh.nrows:
                break
            v1 = safe_num(sh.cell(r, 3).value)  # party1 計
            v2 = safe_num(sh.cell(r, 6).value)  # party2 計
            if v1 > 0:
                votes_47[pref][p1] = votes_47[pref].get(p1, 0) + v1
            if v2 > 0:
                votes_47[pref][p2] = votes_47[pref].get(p2, 0) + v2

    # 合区マージ → 45選挙区
    votes_45 = {p: {} for p in SENKYOKU_45}
    for pref47, pdata in votes_47.items():
        target = MERGE.get(pref47, pref47)
        if target not in votes_45:
            continue
        for party, v in pdata.items():
            votes_45[target][party] = votes_45[target].get(party, 0) + v

    return votes_45


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. 選挙区 都道府県別有効投票数 (000825839.xls)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def extract_valid_votes():
    """
    col2=有効投票数, rows5-51(0-indexed)=47都道府県
    rows54-55(再掲)=合区の有効投票数 (鳥取・島根, 徳島・高知)
    """
    wb = xlrd.open_workbook(f'{BASE}/sangiin26_000825839.xls', encoding_override='shift_jis')
    sh = wb.sheet_by_index(0)

    valid_47 = {}
    for i, pref in enumerate(PREFS_47):
        r = 4 + i  # row5 (0-indexed 4) が 北海道
        valid_47[pref] = safe_num(sh.cell(r, 2).value)

    # 合区は再掲行を使用
    valid_45 = {}
    for pref47 in PREFS_47:
        target = MERGE.get(pref47, pref47)
        if target in ('鳥取県・島根県', '徳島県・高知県'):
            continue  # 後で再掲から入れる
        valid_45[target] = valid_47[pref47]

    # 再掲: row55=鳥取・島根 (0-indexed 54), row56=徳島・高知 (0-indexed 55)
    valid_45['鳥取県・島根県'] = safe_num(sh.cell(54, 2).value)
    valid_45['徳島県・高知県'] = safe_num(sh.cell(55, 2).value)

    return valid_45


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def main():
    print('Loading Excel files...')

    # ── 比例代表 ────────────────────────────────────────────────
    print('比例代表 得票数...')
    hirei_votes, hirei_total_votes = extract_hirei_votes()

    print('比例代表 当選人数...')
    hirei_seats = extract_hirei_seats()

    # 当選人数をマージ
    for party, seats in hirei_seats.items():
        if party in hirei_votes:
            hirei_votes[party]['seats'] = seats
        else:
            print(f'  WARN: 比例 {party} は得票データなし')

    # 比例代表 parties リスト (得票あり or 議席あり)
    hirei_parties = []
    for name, data in hirei_votes.items():
        if data['votes'] > 0 or data['seats'] > 0:
            hirei_parties.append({
                'party':    name,
                'block':    '全国',
                'seats':    data['seats'],
                'votes':    data['votes'],
                'voteRate': data['voteRate'],
                'candidates': [],
            })
    hirei_parties.sort(key=lambda x: (-x['seats'], -x['votes']))

    hirei_total_seats = sum(p['seats'] for p in hirei_parties)
    hirei_block = {
        'name':       '全国',
        'totalSeats': hirei_total_seats,
        'totalVotes': hirei_total_votes,
        'parties':    hirei_parties,
    }

    # ── 選挙区 ────────────────────────────────────────────────
    print('選挙区 当選人数...')
    seats_data = extract_senkyoku_seats()

    print('選挙区 得票数...')
    votes_data = extract_senkyoku_votes()

    print('選挙区 有効投票数...')
    valid_data = extract_valid_votes()

    # 都道府県別まとめ
    prefectures = []
    for pref in SENKYOKU_45:
        sd = seats_data[pref]
        vd = votes_data[pref]
        total_valid = valid_data.get(pref, 0)

        teisuu = sd.get('定数', 0)

        # 全政党の得票 or 議席
        all_parties = set(sd.keys()) | set(vd.keys())
        all_parties.discard('定数')

        party_results = []
        for party in all_parties:
            s = sd.get(party, 0)
            v = vd.get(party, 0)
            if s == 0 and v == 0:
                continue
            rate = round(v / total_valid * 100, 2) if total_valid > 0 else 0.0
            party_results.append({
                'party':      party,
                'seats':      s,
                'totalVotes': v,
                'voteRate':   rate,
            })

        party_results.sort(key=lambda x: (-x['seats'], -x['totalVotes']))
        prefectures.append({
            'prefecture':   pref,
            'totalDistricts': teisuu,
            'partyResults': party_results,
        })

    total_senkyoku_seats = sum(p['totalDistricts'] for p in prefectures)

    # ── JSON 出力 ────────────────────────────────────────────────
    data = {
        'year':         2022,
        'electionDate': '2022-07-10',
        'hirei': {
            'totalSeats': hirei_total_seats,
            'blocks':     [hirei_block],
        },
        'shou': {
            'totalSeats': total_senkyoku_seats,
            'prefectures': prefectures,
            'districts':   [],
        },
    }

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'\nOutput: {OUTPUT}')
    print(f'比例代表: {hirei_total_seats} 議席, 総得票 {hirei_total_votes:,}')
    print(f'選挙区:   {total_senkyoku_seats} 定数, {len(prefectures)} 選挙区')

    # ── バリデーション ────────────────────────────────────────
    print('\n=== 比例代表 結果 ===')
    for p in hirei_parties:
        if p['seats'] > 0 or p['votes'] > 100000:
            print(f"  {p['party']}: {p['seats']}席, {p['votes']:,}票 ({p['voteRate']}%)")

    print('\n=== 選挙区 当選者合計 ===')
    party_totals = {}
    for pref_data in prefectures:
        for r in pref_data['partyResults']:
            party_totals[r['party']] = party_totals.get(r['party'], 0) + r['seats']
    for party, s in sorted(party_totals.items(), key=lambda x: -x[1]):
        if s > 0:
            print(f'  {party}: {s}')

    senkyoku_check = sum(party_totals.values())
    print(f'\n選挙区 当選者合計: {senkyoku_check} (定数 {total_senkyoku_seats})')
    if hirei_total_seats != 50:
        print(f'WARN: 比例代表 議席合計 = {hirei_total_seats} (期待値 50)')
    else:
        print('比例代表: OK (50議席)')


if __name__ == '__main__':
    main()
