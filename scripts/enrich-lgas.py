#!/usr/bin/env python3
"""
Enriches src/content/localGovernments.json with:
  - LGA.population2006  — 2006 NPC census (U.S. Census Bureau / HDX, CC BY)
  - LGA.constituency    — House of Representatives federal constituency
  - State.councilStatus — elected | caretaker | contested | unknown
  - State.electionDate  — ISO date of last LGA election (when known)

Usage:
  python3 scripts/enrich-lgas.py <path/to/nigeria_uscb.xlsx> <path/to/nigeria_lga_districts.sql>
"""

import sys, json, re, zipfile, unicodedata
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

WARDS_URL = 'https://raw.githubusercontent.com/temikeezy/nigeria-geojson-data/main/data/lgas-with-wards.json'

# Wards JSON state name differs from our JSON state name
WARD_STATE_ALIASES = {
    'nasarawa': 'Nassarawa',
}

# Wards JSON LGA name differs from our JSON LGA name
# Maps norm(our_lga) → exact_wards_json_lga_name
WARD_LGA_ALIASES = {
    # FCT
    'abuja':                    'Municipal',
    # Niger
    'munya':                    'Muya',
    'kontagora':                'Kontogur',
    # Benue
    'otukpo':                   'Oturkpo',
    # Gombe
    'shongom':                  'Shomgom',
    'yamaltu/deba':             'Yalmatu / Deba',
    # Jigawa
    'kiri kasama':              'Kirika Samma',
    'malam madori':             'Malam Mado',
    # Kogi
    'ogori/magongo':            'Ogori Magongo',
    # Yobe
    'bursari':                  'Borsari',
    # Katsina
    'dutsin-ma':                'Dutsin-M',
    'kankia':                   'Kankiya',
    'katsina':                  'Katsina (K)',
    # Kano
    'garun malam':              'Garum Mallam',
    'tudun wada':               'Tundun Wada',
    # Sokoto
    'tambuwal':                 'Tambawal',
    'tangaza':                  'Tangazar',
    'gwadabawa':                'Gwadabaw',
    'wamako':                   'Wamakko',
    # Kebbi
    'aliero':                   'Aleiro',
    'koko/besse':               'Koko/Bes',
    # Zamfara
    'birnin magaji/kiyaw':      'Birnin Magaji',
    # Adamawa
    'girei':                    'Girie',
    'toungo':                   'Teungo',
    # Bauchi
    'ganjuwa':                  'Gamjuwa',
    # Plateau
    "qua'an pan":               "Qua'anpa",
    # Nasarawa (LGA spellings differ even after state alias)
    'nasarawa egon':            'Nassarawa Egon',
    # Abia
    'obi ngwa':                 'Oboma Ngwa',
    # Ebonyi
    'abakaliki':                'Abakalik',
    # Enugu
    'enugu south':              'EnuguSou',
    'igbo etiti':               'Igbo-Eti',
    # Imo
    'ihitte/uboma':             'Ihitte-Uboma Isinweke',
    'onuimo':                   'Unuimo',
    # Delta (heavily abbreviated in wards JSON)
    'aniocha north':            'AniochaN',
    'aniocha south':            'AniochaS',
    'ethiope east':             'EthiopeE',
    'ika north east':           'IkaNorth',
    'isoko north':              'IsokoNor',
    'isoko south':              'IsokoSou',
    # Edo (truncated / typo in wards JSON)
    'esan central':             'Esan Centtral',
    'orhionmwon':               'Orhionmw',
    # Akwa Ibom
    'urue offong/oruko':        'Urue Offong|Oruko',
    # Cross River
    'calabar municipal':        'Calabar Municipality',
    # Rivers
    'abua-odual':               'Abua/Odu',
    'akuku-toru':               'Akukutor',
    'andoni':                   'Andoni/Odual',
    'emohua':                   'Emuoha',
    'ogba/egbema/ndoni':        'Ogba/Egbema/Andoni',
    'omuma':                    'Omumma',
    # Ekiti
    'gbonyin':                  'Gboyin',
    # Lagos
    'badagry':                  'Badagary',
    'somolu':                   'Shomolu',
    'ifako-ijaiye':             'Ifako/Ijaye',
    # Ogun (renamed from Egbado)
    'yewa north':               'Egbado North',
    'yewa south':               'Egbado South',
    # Oyo
    'oorelope':                 'Orelope',
    # Osun
    'aiyedire':                 'Ayedire',
    'atakunmosa east':          'Atakumosa East',
    'atakunmosa west':          'Atakumosa West',
    'ilesa east':               'Ilesha East',
    'ilesa west':               'Ilesha West',
}

# Spelling differences between our JSON LGA names and the XLSX names.
# Maps norm(json_name) → xlsx_name (as it appears verbatim in XLSX).
CENSUS_ALIASES = {
    'pategi':             'PATIGI',
    'munya':              'MUYA',
    'damban':             'DAMBAM',
    'biriniwa':           'BIRNIWA',
    'kiri kasama':        'KIRI KASAMMA',
    'danko-wasagu':       'WASAGU/DANKO',    # word order reversed in XLSX
    'osisioma':           'OSISIOMA NGWA',
    'ezinihitte mbaise':  'EZINIHITTE',
    'calabar municipal':  'CALABAR',
    'emohua':             'EMUOHA',
    'ifako-ijaiye':       'IFAKO-IJAYE',
    'aiyedire':           'AYEDIRE',
    'ilesa east':         'ILESHA EAST',
    'ilesa west':         'ILESHA WEST',
    'ogbomosho north':    'OGBOMOSO NORTH',
    'ogbomosho south':    'OGBOMOSO SOUTH',
    'nasarawa':           'NASSARAWA',      # Kano LGA (not Nasarawa state)
}

# ── Election status (state-level, sourced from research Nov 2026) ─────────────
# Sources: ICIR, ShineYourEye, Premium Times, Channels TV — see research notes.
ELECTION_STATUS = {
    'Abia':                      {'status': 'elected',   'date': '2024-11'},
    'Adamawa':                   {'status': 'elected',   'date': '2024'},
    'Akwa Ibom':                 {'status': 'elected',   'date': '2024-10-26'},
    'Anambra':                   {'status': 'elected',   'date': '2024'},
    'Bauchi':                    {'status': 'elected',   'date': '2024-08-19'},
    'Bayelsa':                   {'status': 'caretaker', 'date': None},
    'Benue':                     {'status': 'elected',   'date': '2024-11-16'},
    'Borno':                     {'status': 'elected',   'date': '2024-01-20'},
    'Cross River':               {'status': 'elected',   'date': '2024'},
    'Delta':                     {'status': 'elected',   'date': '2024-07-13'},
    'Ebonyi':                    {'status': 'elected',   'date': '2024'},
    'Edo':                       {'status': 'contested', 'date': None},
    'Ekiti':                     {'status': 'unknown',   'date': None},
    'Enugu':                     {'status': 'elected',   'date': '2024'},
    'Federal Capital Territory': {'status': 'elected',   'date': '2026-02-21'},
    'Gombe':                     {'status': 'elected',   'date': '2024'},
    'Imo':                       {'status': 'elected',   'date': '2024-09-21'},
    'Jigawa':                    {'status': 'elected',   'date': '2024-10'},
    'Kaduna':                    {'status': 'elected',   'date': '2024-10-19'},
    'Kano':                      {'status': 'elected',   'date': '2024-10-24'},
    'Katsina':                   {'status': 'elected',   'date': '2025-02-15'},
    'Kebbi':                     {'status': 'elected',   'date': '2024-08-31'},
    'Kogi':                      {'status': 'elected',   'date': '2024-10-09'},
    'Kwara':                     {'status': 'elected',   'date': '2024-09-21'},
    'Lagos':                     {'status': 'elected',   'date': '2025-07-12'},
    'Nasarawa':                  {'status': 'elected',   'date': '2024-11'},
    'Niger':                     {'status': 'elected',   'date': '2025-11-01'},
    'Ogun':                      {'status': 'elected',   'date': '2024-11'},
    'Ondo':                      {'status': 'elected',   'date': '2025-01-18'},
    'Osun':                      {'status': 'elected',   'date': '2025-02-22'},
    'Oyo':                       {'status': 'elected',   'date': '2024'},
    'Plateau':                   {'status': 'elected',   'date': '2024-10-09'},
    'Rivers':                    {'status': 'elected',   'date': '2025-08-30'},
    'Sokoto':                    {'status': 'elected',   'date': '2024'},
    'Taraba':                    {'status': 'elected',   'date': '2024-11-18'},
    'Yobe':                      {'status': 'unknown',   'date': None},
    'Zamfara':                   {'status': 'caretaker', 'date': None},
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def norm(s):
    """Lowercase, trim, collapse spaces."""
    return re.sub(r'\s+', ' ', s.strip().lower())

def strip_all(s):
    """Aggressive norm: remove hyphens, slashes, apostrophes (straight + curly), spaces."""
    return re.sub(r"[\s\-/'‘’‚‛]", '', s.lower())

def match_lga(state_name, lga_name, lookup):
    """Try exact (state, lga) then strip-punctuation variants."""
    sn = norm(state_name)
    k  = norm(lga_name)
    if (sn, k) in lookup:
        return lookup[(sn, k)]
    # strip apostrophes/hyphens in lga name
    k2 = re.sub(r"['\-]", ' ', k)
    k2 = re.sub(r'\s+', ' ', k2).strip()
    if (sn, k2) in lookup:
        return lookup[(sn, k2)]
    # strip_all variant
    k3 = strip_all(lga_name)
    for (s, l), v in lookup.items():
        if s == sn and strip_all(l) == k3:
            return v
    return None

# ── Fetch wards JSON → ward count map ────────────────────────────────────────

def parse_wards():
    """Download lgas-with-wards.json; return {(norm_state, norm_lga): ward_count}."""
    print('Fetching ward data from GitHub…')
    with urllib.request.urlopen(WARDS_URL, timeout=30) as r:
        raw = json.loads(r.read().decode('utf-8'))

    ward_map = {}
    for state_name, lgas in raw.items():
        sn = norm(state_name)
        for lga_name, wards in lgas.items():
            ward_map[(sn, norm(lga_name))] = len(wards)

    total_wards = sum(ward_map.values())
    print(f'Wards: {len(ward_map)} LGAs, {total_wards} total wards')
    return ward_map

def match_wards(state_name, lga_name, ward_map):
    """Look up ward count with state alias + LGA alias fallback."""
    sn = norm(state_name)
    k  = norm(lga_name)
    # Resolve state alias (e.g. 'nasarawa' → 'nassarawa')
    sn_resolved = norm(WARD_STATE_ALIASES.get(sn, state_name))
    # Resolve LGA alias (e.g. 'abuja' → 'Municipal')
    k_resolved = norm(WARD_LGA_ALIASES.get(k, lga_name))

    for skey in {sn, sn_resolved}:
        for lkey in {k, k_resolved}:
            if (skey, lkey) in ward_map:
                return ward_map[(skey, lkey)]
        # strip_all fallback on unresolved lga key
        k2 = strip_all(lga_name)
        for (s, l), v in ward_map.items():
            if s == skey and strip_all(l) == k2:
                return v
    return None

# ── Parse SQL → constituency map ──────────────────────────────────────────────

def parse_constituencies(sql_path):
    sql = Path(sql_path).read_text(encoding='utf-8')

    # Extract state_tbl rows: (state_id, state_name)
    state_section = sql[sql.index('INSERT INTO `state_tbl`'):]
    state_ids = {}  # state_id → norm(state_name)
    for m in re.finditer(r"\((\d+),\s*'([^']+)'\)", state_section.split(';')[0]):
        state_ids[int(m.group(1))] = norm(m.group(2))

    # Extract representative_district rows: (id, state_id, name)
    rep_section = sql[sql.index('representative_district_tbl'):]
    districts = {}  # id → (state_id, name)
    for m in re.finditer(r"\((\d+),\s*(\d+),\s*'([^']+)'\)", rep_section):
        districts[int(m.group(1))] = (int(m.group(2)), m.group(3))

    # Extract lga_tbl rows: (lga_id, state_id, sen_id, rep_id, lga_name)
    # Key by (norm_state, norm_lga) to avoid cross-state name collisions.
    # Validate: only include mappings where the district's state == the LGA's state.
    # The source SQL has systematic rep_id errors for ~14 states; those entries are dropped.
    lga_section = sql[sql.index('INSERT INTO `lga_tbl`'):]
    lga_map = {}   # (norm_state, norm_lga) → constituency_name
    for m in re.finditer(r"\((\d+),\s*(\d+),\s*\d+,\s*(\d+),\s*'([^']+)'\)", lga_section):
        state_id = int(m.group(2))
        rep_id   = int(m.group(3))
        lga_name = m.group(4)
        rep_state_id, rep_name = districts.get(rep_id, (0, ''))
        if rep_state_id != state_id:
            continue  # cross-state assignment — data error in source SQL
        state_norm = state_ids.get(state_id, '')
        lga_map[(state_norm, norm(lga_name))] = rep_name

    print(f'SQL: {len(lga_map)} LGAs → {len(districts)} constituencies')
    return lga_map

# ── Parse XLSX Age-Sex sheet → census population map ─────────────────────────

def parse_census(xlsx_path):
    """Returns (census_map, census_map2).
    census_map:  norm(state|lga)        → population
    census_map2: strip_all(state|lga)   → population (handles hyphen/slash variants)
    """
    census_map = {}
    census_map2 = {}

    with zipfile.ZipFile(xlsx_path) as zf:
        # shared strings
        ss_xml = zf.read('xl/sharedStrings.xml').decode('utf-8')
        ss_root = ET.fromstring(ss_xml)
        NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
        strings = []
        for si in ss_root.findall(f'{{{NS}}}si'):
            t = si.find(f'{{{NS}}}t')
            if t is not None:
                strings.append(t.text or '')
            else:
                parts = [r.find(f'{{{NS}}}t') for r in si.findall(f'.//{{{NS}}}r')]
                strings.append(''.join(p.text or '' for p in parts if p is not None))

        # find Age-Sex sheet index
        wb_xml = zf.read('xl/workbook.xml').decode('utf-8')
        wb_root = ET.fromstring(wb_xml)
        sheet_names = [s.get('name') for s in wb_root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet')]
        sheet_idx = sheet_names.index('Age-Sex') + 1

        ws_xml = zf.read(f'xl/worksheets/sheet{sheet_idx}.xml').decode('utf-8')
        ws_root = ET.fromstring(ws_xml)

    def col_letter_to_idx(col):
        n = 0
        for ch in col:
            n = n * 26 + (ord(ch) - 64)
        return n - 1

    # Known column positions (0-based, confirmed from header inspection):
    # Age-Sex sheet: 0:AREA_NAME (LGA name), 4:ADM1_NAME (state), 6:ADM_LEVEL, 12:BTOTL
    # Note: col 2 (GEO_MATCH) holds geo codes in this sheet, NOT the LGA name.
    COL_AREA_NAME  = 0
    COL_ADM1       = 4
    COL_ADM_LEVEL  = 6
    COL_BTOTL      = 12

    count = 0
    for row in ws_root.findall(f'.//{{{NS}}}row'):
        row_num = int(row.get('r', 0))
        if row_num < 3:
            continue

        cells = {}
        for c in row.findall(f'{{{NS}}}c'):
            col_ref = re.match(r'([A-Z]+)', c.get('r', '')).group(1)
            ci = col_letter_to_idx(col_ref)
            v = c.find(f'{{{NS}}}v')
            if v is None:
                cells[ci] = ''
                continue
            if c.get('t') == 's':
                cells[ci] = strings[int(v.text)]
            else:
                cells[ci] = v.text or ''

        adm_level = cells.get(COL_ADM_LEVEL, '')
        if adm_level != '2':
            continue

        lga_name_raw = cells.get(COL_AREA_NAME, '').strip()  # e.g. "ABA NORTH"
        adm1         = cells.get(COL_ADM1, '').strip()      # e.g. "ABIA"
        btotl_str    = cells.get(COL_BTOTL, '')

        if not lga_name_raw or not btotl_str:
            continue

        state_key = 'FCT' if adm1 == 'FEDERAL CAPITAL TERRITORY' else adm1
        key = norm(f'{state_key}|{lga_name_raw}')
        key2 = strip_all(f'{state_key}|{lga_name_raw}')
        try:
            pop = int(float(btotl_str))
            census_map[key] = pop
            census_map2[key2] = pop
            count += 1
        except ValueError:
            pass

    print(f'XLSX: {count} LGA population rows extracted')
    return census_map, census_map2

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 3:
        print('Usage: python3 scripts/enrich-lgas.py <xlsx> <sql>')
        sys.exit(1)

    xlsx_path = sys.argv[1]
    sql_path  = sys.argv[2]

    script_dir = Path(__file__).parent
    json_path  = script_dir.parent / 'src' / 'content' / 'localGovernments.json'

    data = json.loads(json_path.read_text(encoding='utf-8'))

    print('Parsing constituency SQL…')
    constituency_map = parse_constituencies(sql_path)

    print('Parsing census XLSX…')
    census_map, census_map2 = parse_census(xlsx_path)

    ward_map = parse_wards()

    pop_found = pop_missed = 0
    cons_found = cons_missed = 0
    ward_found = ward_missed = 0

    enriched_states = []
    for state in data['states']:
        state_name = state['state']
        elec = ELECTION_STATUS.get(state_name, {'status': 'unknown', 'date': None})

        # XLSX state key: uppercase, FCT special-cased
        xlsx_state = 'FCT' if state_name == 'Federal Capital Territory' else state_name.upper()

        enriched_lgas = []
        for lga_entry in state['lgas']:
            lga_name = lga_entry['name'] if isinstance(lga_entry, dict) else lga_entry
            # Census lookup — three tiers:
            # 1. Exact normalised match
            census_key = norm(f'{xlsx_state}|{lga_name}')
            pop = census_map.get(census_key)
            # 2. Aggressive strip (handles hyphens, slashes, apostrophes)
            if pop is None:
                pop = census_map2.get(strip_all(f'{xlsx_state}|{lga_name}'))
            # 3. Hardcoded aliases for genuine spelling differences
            if pop is None:
                xlsx_alias = CENSUS_ALIASES.get(norm(lga_name))
                if xlsx_alias:
                    pop = census_map.get(norm(f'{xlsx_state}|{xlsx_alias}'))
            if pop is not None:
                pop_found += 1
            else:
                pop_missed += 1
                print(f'  POP MISS: {state_name} / {lga_name}')

            # Constituency lookup
            constituency = match_lga(state_name, lga_name, constituency_map)
            if constituency is not None:
                cons_found += 1
            else:
                cons_missed += 1
                print(f'  CON MISS: {state_name} / {lga_name}')

            # Ward count lookup
            ward_count = match_wards(state_name, lga_name, ward_map)
            if ward_count is not None:
                ward_found += 1
            else:
                ward_missed += 1
                print(f'  WARD MISS: {state_name} / {lga_name}')

            enriched_lgas.append({
                'name': lga_name,
                'population2006': pop,
                'constituency': constituency,
                'wardCount': ward_count,
            })

        s = {
            'state': state_name,
            'zone': state['zone'],
            'councilStatus': elec['status'],
            'lgas': enriched_lgas,
        }
        if elec['date']:
            s['electionDate'] = elec['date']
        enriched_states.append(s)

    # Handle both original format (source: {}) and already-enriched format (sources: [])
    lga_names_source = data.get('source') or next(
        (s for s in data.get('sources', []) if s.get('field') == 'lga names'), None
    )
    enriched = {
        'sources': [
            {**lga_names_source, 'field': 'lga names'},
            {
                'name': 'U.S. Census Bureau / HDX',
                'url': 'https://data.humdata.org/dataset/nigeria-subnational-boundaries-and-tabular-data',
                'license': 'CC BY',
                'field': 'population2006',
                'retrieved': '2026-11-01',
            },
            {
                'name': 'nuhu-ibrahim/lga-districs (INEC delimitation 1999)',
                'url': 'https://github.com/nuhu-ibrahim/lga-districs',
                'license': 'unspecified',
                'field': 'constituency',
                'retrieved': '2026-11-01',
            },
            {
                'name': 'ICIR / ShineYourEye / Premium Times',
                'url': 'https://www.shineyoureye.org/info/local-government-elections',
                'license': 'editorial',
                'field': 'councilStatus',
                'retrieved': '2026-11-01',
            },
            {
                'name': 'temikeezy/nigeria-geojson-data (INEC ward boundaries)',
                'url': 'https://github.com/temikeezy/nigeria-geojson-data',
                'license': 'MIT',
                'field': 'wardCount',
                'retrieved': '2026-11-02',
            },
        ],
        'total': data['total'],
        'states': enriched_states,
    }

    json_path.write_text(
        json.dumps(enriched, indent=1, ensure_ascii=False),
        encoding='utf-8',
    )

    print(f'\nDone.')
    print(f'  Population:   {pop_found} matched, {pop_missed} unmatched')
    print(f'  Constituency: {cons_found} matched, {cons_missed} unmatched')
    print(f'  Ward count:   {ward_found} matched, {ward_missed} unmatched')
    print(f'  Written to {json_path}')

if __name__ == '__main__':
    main()
