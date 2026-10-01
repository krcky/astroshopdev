"""
Excel za astrologa (lektura + pitanja) i citanje njegovog odgovora.

    .venv/bin/python scripts/korpus/odgovor.py napravi
    .venv/bin/python scripts/korpus/odgovor.py ucitaj "<vracen>.xlsx"           # samo pregled
    .venv/bin/python scripts/korpus/odgovor.py ucitaj "<vracen>.xlsx" --upisi   # upis

Treba `openpyxl`: python3 -m venv .venv && .venv/bin/pip install openpyxl

ZASTO EXCEL: odgovor u Word-u (komentari, pracenje izmena) ne moze pouzdano da
se procita masinski, a ispravki je preko 2.500. Ovde je svaka ispravka jedan
red sa skrivenim kljucem, pa se odluka vraca tacno na mesto odakle je dosla.

Lektura: "cutanje = saglasnost". Kolona Odluka je unapred DA; astrolog upise
NE ili svoju verziju isecka. Redovi "sumnja" (vrsta 'smisao' kod tranzita i
lunarnog, `sumnja: true` kod natala) idu na vrh.

Listovi za upis (`TABELE`, od 30.9.2026): kratki NOVI tekstovi bez parsera —
osobine po znaku, recenice faza Meseca, teme kuca + Mlad/Pun Mesec u kuci,
planete u znacima ("Promene na nebu"), kraci saveti. Privremene vrednosti se
citaju iz koda (`traits.ts`, `moon.ts`), dugi saveti iz `transit-texts.csv`.

`ucitaj --upisi`:
  - ispravke.json (tri fajla) — NE se brise i cuva u `odbijene-ispravke.json`
    pored, "Vasa verzija" zamenjuje ispravku; svaki pregledan red dobija
    `astrolog: "DA" | "izmena"`. Pre upisa ide rezervna kopija.
  - `files/odgovori-astrologa-<datum>.md` — odgovori na pitanja, napomene i
    popunjeni listovi za upis; isti listovi i kao `.json` (id -> polja).
Sledeci `napravi` preskace ispravke koje vec imaju `astrolog`: salje se samo novo.
Posle upisa pusti izvoz: izvoz_csv.py, lunarni.py, natal.py.

Nista od ovoga ne ide u repo osim skripte: ispravke i pitanja su isecci korpusa.
"""
import datetime
import difflib
import json
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

KOREN = Path(__file__).resolve().parents[2]
APP = Path.home() / 'Desktop/Astroshop App'
KORPUSI = {
    # naziv: (ispravke.json, citljiv naziv)
    'tranziti': (APP / 'Tranziti AstroShop/ispravke.json', 'Tranziti'),
    'lunarni': (APP / 'Lunarni kalendar/ispravke.json', 'Lunarni kalendar'),
    'natal': (KOREN / 'files/natal-ispravke.json', 'Natalna karta'),
}
PITANJA = KOREN / 'files/pitanja-astrologu.json'
ZNAKOVI = dict(aries='Ovan', taurus='Bik', gemini='Blizanci', cancer='Rak', leo='Lav', virgo='Devica', libra='Vaga',
               scorpio='Škorpija', sagittarius='Strelac', capricorn='Jarac', aquarius='Vodolija', pisces='Ribe')

LIST_LEKTURA, LIST_PITANJA, LIST_UPUTSTVO = 'Lektura', 'Pitanja', 'Uputstvo'
# Kolone lista Lektura. Poslednje cetiri su skrivene i jedini su izvor istine
# pri citanju — vidljive "Piše"/"Treba" astrolog moze slucajno da izmeni.
KOL = ['Br.', 'Korpus', 'Dokument', 'Tekst', 'Piše', 'Treba', 'Odluka', 'Vaša verzija', 'Napomena',
       'id_korpus', 'id_kljucevi', 'id_original', 'id_ispravka']
K = {naziv: i + 1 for i, naziv in enumerate(KOL)}


# ------------------------------------------------------------------ redovi

def _tranziti():
    import parse_docx
    from parse_docx import docx_fajlovi, parsiraj_kratku, parsiraj_dugu, PLANETE, ASPEKTI
    izvor = APP / 'Tranziti AstroShop'
    srp = {v: k.capitalize() for k, v in PLANETE.items()} | {'ascendant': 'Ascendent', 'midheaven': 'MC'}
    sra = {v: k for k, v in ASPEKTI.items()}
    fajl = {}
    for folder, fn in (('Kraci tranziti', parsiraj_kratku), ('Duzi trazniti', parsiraj_dugu)):
        for f in docx_fajlovi(izvor / folder):
            for r in fn(f):
                fajl.setdefault((r['key'], r['version']), f.stem)
    for k in parse_docx.NAPOMENE:
        fajl.setdefault(k, 'stara verzija 2025')

    def opis(kljuc, verzija):
        _, t, a, _, n = kljuc.split('.')
        return f"{srp[t]} {sra[a]} {srp[n]} · {'kratka' if verzija == 'short' else 'duga'}"
    return lambda x: (fajl[(x['kljuc'], x['verzija'])], opis(x['kljuc'], x['verzija']), x['vrsta'] == 'smisao')


def _lunarni():
    import lunarni
    from parse_docx import docx_fajlovi
    ob = {'ljubav': 'Ljubav', 'zdravlje': 'Zdravlje', 'karijera': 'Karijera', 'kuca': 'Kuća', 'basta': 'Bašta'}
    zn = ZNAKOVI
    fajl = {}
    for f in docx_fajlovi(lunarni.IZVOR):
        for r in lunarni.parsiraj(f):
            fajl.setdefault(r['key'], f.stem)

    def f(x):
        _, _, z, o = x['kljuc'].split('.')
        return fajl[x['kljuc']], f'{ob[o]} · {zn[z]}', x['vrsta'] == 'smisao'
    return f


def _natal():
    import natal
    z, _ = natal.ucitaj()
    return lambda x: (z[x['kljuc']]['fajl'].rsplit('.', 1)[0], z[x['kljuc']]['title'], bool(x.get('sumnja')))


def redovi() -> list[dict]:
    """Jedan red po (korpus, dokument, original, ispravka) — ista ispravka u vise
    tekstova istog dokumenta (lunarni: isti pasus u pet znakova) je JEDAN red."""
    out, spojeni = [], {}
    for korpus, opisi in (('tranziti', _tranziti), ('lunarni', _lunarni), ('natal', _natal)):
        put, _ = KORPUSI[korpus]
        opis = opisi()
        for red_br, x in enumerate(json.loads(put.read_text(encoding='utf-8'))):
            if x.get('astrolog'):
                continue  # vec pregledano u nekom ranijem krugu
            dok, tekst, sumnja = opis(x)
            k = (korpus, dok, x['original'], x['ispravka'])
            if k not in spojeni:
                spojeni[k] = {'korpus': korpus, 'dokument': dok, 'tekstovi': [], 'kljucevi': [],
                              'original': x['original'], 'ispravka': x['ispravka'], 'sumnja': False, 'red': red_br}
                out.append(spojeni[k])
            r = spojeni[k]
            if tekst not in r['tekstovi']:
                r['tekstovi'].append(tekst)
            r['kljucevi'].append([x['kljuc'], x['verzija']])
            r['sumnja'] |= sumnja
    for r in out:
        r['tekst'] = spoji_tekstove(r['tekstovi'])
    red_k = list(KORPUSI)
    out.sort(key=lambda r: (not r['sumnja'], red_k.index(r['korpus']), r['dokument'], r['red']))
    return out


def spoji_tekstove(t: list[str]) -> str:
    """"Karijera · Bik", "Karijera · Ribe" -> "Karijera · Bik, Ribe"."""
    delovi = [x.split(' · ', 1) for x in t]
    if len(t) > 1 and all(len(d) == 2 for d in delovi) and len({d[0] for d in delovi}) == 1:
        return f"{delovi[0][0]} · {', '.join(d[1] for d in delovi)}"
    return '; '.join(t)


# ------------------------------------------------------------------ listovi za upis
#
# Kratki NOVI tekstovi za koje parser ne postoji (osobine, recenice faza, kuce,
# planete u znacima, kraci saveti) — astrolog ih pise direktno u Excel, red po red.
# Tekstovi korpusa (tranziti, natal, lunarni) i dalje idu u Word (parseri ga citaju).
# Privremene vrednosti se citaju IZ KODA, da Excel pokaze tacno ono sto je u aplikaciji.

def _ts_blok(fajl: str, ime: str) -> str:
    """Telo objekta `export const <ime> ... = { ... };` iz TypeScript fajla."""
    s = (KOREN / fajl).read_text(encoding='utf-8')
    m = re.search(rf'export const {ime}\b[^=]*=\s*{{(.*?)\n}};', s, re.S)
    if not m:
        sys.exit(f'{fajl}: nema {ime} — promenjen oblik, popravi _ts_blok')
    return m.group(1)


def _recnik_grana(deo: str, *put: str) -> str:
    """Telo grane `a: { b: { ... } }` iz srpskog recnika (`src/i18n/sr/<deo>.ts`), po putanji kljuceva."""
    fajl = f'src/i18n/sr/{deo}.ts'
    s = (KOREN / fajl).read_text(encoding='utf-8')
    for ime in put:
        m = re.search(rf'\n([ \t]*){ime}: {{(.*?)\n\1}}', s, re.S)
        if not m:
            sys.exit(f'{fajl}: nema {".".join(put)} — promenjen oblik, popravi _recnik_grana')
        s = '\n' + m.group(2)
    return s


def _osobine():
    blok = _ts_blok('src/lib/traits.ts', 'SUN_TRAITS')
    rr = re.findall(r"(\w+):\s*\['([^']*)',\s*'([^']*)',\s*'([^']*)'\]", blok)
    assert [k for k, *_ in rr] == list(ZNAKOVI), 'SUN_TRAITS: ocekivano 12 znakova redom'
    return [[ZNAKOVI[k], ' · '.join(t), None, None, None, f'traits.sun.{k}'] for k, *t in rr]


def _faze():
    ime = dict(re.findall(r"(\w+): '([^']*)'", _recnik_grana('karta', 'luna', 'faze')))
    rec = dict(re.findall(r"(\w+): '([^']*)'", _recnik_grana('karta', 'luna', 'fazaPrivremeno')))
    red = ['new', 'waxing', 'first', 'full', 'waning', 'last']  # redom kroz ciklus
    assert set(red) == set(rec) == set(ime), 'faze u recniku (karta.luna) su se promenile'
    return [[ime[k], rec[k], None, f'phase.{k}'] for k in red]


def _kuce():
    teme = dict(re.findall(r"(\d+): '([^']*)'", _recnik_grana('karta', 'luna', 'temeKuca')))
    assert sorted(map(int, teme)) == list(range(1, 13)), 'HOUSE_THEMES: ocekivano 12 kuca'
    return [[f'{n}. kuća', teme[str(n)], None, None, None, f'house.{n}'] for n in range(1, 13)]


# "Promene na nebu" (Ivan, 30.9.2026): tekst po ZNAKU, ne po kuci (do tada 9 planeta x 12
# kuca = 108), i samo kombinacije koje se u narednih godinu dana stvarno dese — racuna ih
# `promene-godine.ts` istim efemerisom kao aplikacija. Planeta u znaku = ulazak ili ponovo
# direktna; retrogradna u znaku = postaje retrogradna ili retrogradno ulazi u znak.
VRSTE_DOGADJAJA = {'ulazak': 'ulazak', 'ulazak-retro': 'retrogradni ulazak',
                   'retrograde': 'početak retrogradnosti', 'direct': 'kraj retrogradnosti'}


def _promene_godine() -> dict:
    import subprocess
    r = subprocess.run(['npx', 'tsx', 'scripts/korpus/promene-godine.ts'], cwd=KOREN, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f'promene-godine.ts pao:\n{r.stderr}')
    return json.loads(r.stdout)


def _planete_u_znacima():
    return [[x['naslov'], 'retrogradno' if x['retro'] else 'direktno',
             ' · '.join(f"{e['datum']} {VRSTE_DOGADJAJA[e['vrsta']]}" for e in x['dogadjaji']), None, x['kljuc']]
            for x in _promene_godine()['stavke']]


SAVET_MAX = 100  # znakova; duzi savet se na slici price mnogo smanjuje (CLAUDE.md, pravilo 23)


def _dugi_saveti():
    import csv
    from parse_docx import PLANETE, ASPEKTI
    csv.field_size_limit(10 ** 9)
    izvor = APP / 'Tranziti AstroShop'
    nacrti = {x['key'] for x in json.loads((izvor / 'nacrti-kratkih.json').read_text(encoding='utf-8'))}
    srp = {v: k.capitalize() for k, v in PLANETE.items()} | {'ascendant': 'Ascendent', 'midheaven': 'MC'}
    sra = {v: k for k, v in ASPEKTI.items()}
    out = []
    with open(izvor / 'transit-texts.csv', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            s = (r['advice'] or '').strip()
            # Nacrte astrolog ionako pregleda u Word-u — ovde samo njegovi saveti.
            if r['version'] != 'short' or len(s) <= SAVET_MAX or r['key'] in nacrti:
                continue
            _, t, a, _, n = r['key'].split('.')
            out.append([f'{srp[t]} {sra[a]} natalni {srp[n]}', s, len(s), None, r['key']])
    return sorted(out, key=lambda r: -r[2])


# naziv lista: (kolone, sirine, kolone za upis, izvor redova). Poslednja kolona
# svakog lista je skriveni `id` — po njemu se odgovor vraca na mesto.
TABELE = {
    'Osobine po znaku': (['Znak', 'Sada (naše, privremeno)', 'Vaš 1. red', 'Vaš 2. red', 'Vaš 3. red', 'id'],
                         [12, 52, 28, 28, 28, 10], ['Vaš 1. red', 'Vaš 2. red', 'Vaš 3. red'], _osobine),
    'Faze Meseca': (['Faza', 'Sada (naša, privremena)', 'Vaša rečenica', 'id'],
                    [18, 60, 70, 10], ['Vaša rečenica'], _faze),
    'Kuće': (['Kuća', 'Tema sada (iz briefa)', 'Vaša tema', 'Mlad Mesec u ovoj kući', 'Pun Mesec u ovoj kući', 'id'],
             [10, 32, 32, 55, 55, 10], ['Vaša tema', 'Mlad Mesec u ovoj kući', 'Pun Mesec u ovoj kući'], _kuce),
    'Planete u znacima': (['Tekst', 'Kretanje', 'Kad se pojavljuje na kartici', 'Vaš tekst', 'id'],
                          [28, 12, 42, 90, 10], ['Vaš tekst'], _planete_u_znacima),
    'Dugi saveti': (['Tranzit', 'Savet sada', 'Znakova', 'Vaša kraća verzija (do ~100 znakova)', 'id'],
                    [30, 70, 9, 70, 10], ['Vaša kraća verzija (do ~100 znakova)'], _dugi_saveti),
}


# ------------------------------------------------------------------ napravi

def _bogat(a: str, b: str, boja: str):
    """Isecak `a` sa podebljanim delovima koji se razlikuju od `b`."""
    from openpyxl.cell.rich_text import CellRichText, TextBlock
    from openpyxl.cell.text import InlineFont
    tok = lambda s: re.findall(r'\w+|\s+|[^\w\s]', s)
    ta, tb = tok(a), tok(b)
    delovi, obicno = [], InlineFont(rFont='Arial', sz=10)
    jaka = InlineFont(rFont='Arial', sz=10, b=True, color=boja)
    for op, i1, i2, _, _ in difflib.SequenceMatcher(None, ta, tb, autojunk=False).get_opcodes():
        s = ''.join(ta[i1:i2])
        if not s:
            continue
        if op != 'equal' and s.isspace():
            s = s.replace(' ', '·')
        delovi.append(TextBlock(obicno if op == 'equal' else jaka, s))
    return CellRichText(delovi) if delovi else a


def napravi(cilj: Path):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.worksheet.datavalidation import DataValidation

    rr = redovi()
    pitanja = json.loads(PITANJA.read_text(encoding='utf-8'))

    F = lambda **kw: Font(**({'name': 'Arial', 'size': 10} | kw))
    SIVA, ZUTA, PLAVA = PatternFill('solid', fgColor='EDEDED'), PatternFill('solid', fgColor='FFF3C4'), PatternFill('solid', fgColor='DDEBF7')
    tanka = Side(style='thin', color='BFBFBF')
    okvir = Border(left=tanka, right=tanka, top=tanka, bottom=tanka)
    omot = Alignment(wrap_text=True, vertical='top')

    wb = Workbook()

    # ---- Uputstvo
    u = wb.active
    u.title = LIST_UPUTSTVO
    u.column_dimensions['A'].width = 3
    # Tekst uputstva stoji u koloni B bez preloma i prelije se udesno; ispod je
    # primer u kolonama B..F.
    for j, w in zip('BCDEF', (38, 38, 9, 24, 22)):
        u.column_dimensions[j].width = w
    sumnjivih = sum(r['sumnja'] for r in rr)
    tabele = {naziv: izvor() for naziv, (*_, izvor) in TABELE.items()}
    danas = datetime.date.today()
    tekst = [
        (f'Astroshop — za astrologa, {danas.day}. {danas.month}. {danas.year}.', F(bold=True, size=14)),
        ('', None),
        ('Sve što vas molimo je u ovom fajlu, svaka stvar na svom listu (jezičci dole). Plavo polje = tu pišete.', F()),
        ('Ostale kolone i redosled nemojte menjati; fajl se čita automatski. Sortiranje i filter su slobodni. Prazno polje znači „bez izmene“.', F()),
        ('', None),
        (f'1. „{LIST_LEKTURA}“ — {len(rr)} ispravki u vašim tekstovima (tranziti, lunarni kalendar, natal).', F(bold=True)),
        ('Kolona „Odluka“ je unapred popunjena sa DA. Ako se slažete, ne radite ništa.', F()),
        ('Ako se NE slažete, upišite NE — tekst ostaje kako ste ga vi napisali.', F()),
        ('Ako hoćete drugačiju ispravku, upišite u „Vaša verzija“ CEO isečak onako kako treba da glasi (kao u koloni „Treba“).', F()),
        ('„Piše“ je doslovni isečak iz vašeg dokumenta, greška je podebljana crveno; „Treba“ je predlog, izmena podebljana zeleno. Tačkica (·) je razmak koji fali ili je višak.', F()),
        (f'Na vrhu je {sumnjivih} žutih redova: tu je greška sigurna, ali nismo sigurni koju ste reč hteli. Njih molimo da pogledate.', F()),
        ('Dva pravila smo primenili svuda, pa nisu nabrojana: „vi“, „vaš“, „vama“ usred rečenice malim slovom (vaš pristanak od 27. 9.) i brisanje duplog razmaka.', F()),
        ('', None),
        (f'2. „{LIST_PITANJA}“ — {len(pitanja)} pitanja: molbe (M), sadržaj vaših tekstova (S) i pravila koja smo sami postavili (P). Odgovor u kolonu „Vaš odgovor“.', F(bold=True)),
        ('Duži tekstovi za tranzite (Pluton…) i pregled 160 sažetih kratkih verzija idu u Word, kao do sada — pitanja M1–M5 kažu koji.', F()),
        ('', None),
        ('3. Novi kratki tekstovi — pišete direktno u listove:', F(bold=True)),
        (f'„Osobine po znaku“ — 12 znakova × 3 kratka reda (ekran sa znakom Sunca posle unosa podataka o rođenju).', F()),
        (f'„Faze Meseca“ — {len(tabele["Faze Meseca"])} rečenica, po jedna za svaku fazu (kartica „Mesec danas“).', F()),
        ('„Kuće“ — tema svake kuće i kratak tekst za Mlad i Pun Mesec u toj kući (12 kuća).', F()),
        (f'„Planete u znacima“ — {len(tabele["Planete u znacima"])} kratkih tekstova: planeta u znaku i retrogradna planeta u znaku, samo ono što se desi u narednih godinu dana (ekran „Promene na nebu“).', F()),
        (f'„Dugi saveti“ — {len(tabele["Dugi saveti"])} saveta dužih od {SAVET_MAX} znakova; napišite kraću verziju, jednu rečenicu.', F()),
        ('Gde stoji „Sada“, to je naš privremeni tekst koji je trenutno u aplikaciji — samo da vidite o čemu je reč, ne morate ga pratiti.', F()),
        ('', None),
        ('Primer lekture (kako izgleda popunjen red):', F(bold=True)),
    ]
    for i, (t, font) in enumerate(tekst, 1):
        c = u.cell(i, 2, t)
        if font:
            c.font = font
    prim = len(tekst) + 1
    prim_red = [('Piše', 'Treba', 'Odluka', 'Vaša verzija', 'Značenje'),
                ('kako bi višak energije oslobodili', 'kako biste višak energije oslobodili', 'DA', '', 'slažete se'),
                ('Ovan je, međutim, planeta', 'Mars je, međutim, planeta', 'NE', '', 'ostaje vaš tekst'),
                ('raslolašnoj Vodoliji', 'raspojasanoj Vodoliji', 'DA', 'razuzdanoj Vodoliji', 'vaša reč umesto naše')]
    for i, red in enumerate(prim_red):
        for j, v in enumerate(red):
            c = u.cell(prim + i, 2 + j, v)
            c.font, c.border = F(bold=(i == 0)), okvir
            if i == 0:
                c.fill = SIVA
            elif j in (2, 3):
                c.fill = PLAVA

    # ---- Lektura
    ws = wb.create_sheet(LIST_LEKTURA)
    sirine = [6, 12, 26, 26, 42, 42, 9, 36, 30, 10, 10, 10, 10]
    for i, (naziv, w) in enumerate(zip(KOL, sirine), 1):
        c = ws.cell(1, i, naziv)
        c.font, c.fill, c.border, c.alignment = F(bold=True), SIVA, okvir, omot
        ws.column_dimensions[c.column_letter].width = w
    naziv_k = {k: v[1] for k, v in KORPUSI.items()}
    for n, r in enumerate(rr, 1):
        red = n + 1
        vrednosti = [n, naziv_k[r['korpus']], r['dokument'], r['tekst'],
                     _bogat(r['original'], r['ispravka'], 'C00000'), _bogat(r['ispravka'], r['original'], '1E7B34'),
                     'DA', None, None,
                     r['korpus'], json.dumps(r['kljucevi'], ensure_ascii=False),
                     # JSON, ne sirov tekst: Excel vraca prazan string kao None i
                     # ume da skrati razmak na kraju — onda se red ne bi prepoznao.
                     json.dumps(r['original'], ensure_ascii=False), json.dumps(r['ispravka'], ensure_ascii=False)]
        for i, v in enumerate(vrednosti, 1):
            c = ws.cell(red, i, v)
            if i not in (K['Piše'], K['Treba']):
                c.font = F()
            # Skrivene id kolone bez preloma — inace dugi JSON digne visinu reda.
            c.alignment, c.border = (Alignment(vertical='top') if i >= K['id_korpus'] else omot), okvir
            if i in (K['Odluka'], K['Vaša verzija'], K['Napomena']):
                c.fill = PLAVA
            elif r['sumnja']:
                c.fill = ZUTA
        ws.cell(red, K['Odluka']).alignment = Alignment(horizontal='center', vertical='top')
    for naziv in ('id_korpus', 'id_kljucevi', 'id_original', 'id_ispravka'):
        ws.column_dimensions[ws.cell(1, K[naziv]).column_letter].hidden = True
    dv = DataValidation(type='list', formula1='"DA,NE"', allow_blank=True, showErrorMessage=True,
                        errorTitle='Odluka', error='Upišite DA ili NE. Za svoju verziju koristite kolonu „Vaša verzija“.')
    ws.add_data_validation(dv)
    kol_odluka = ws.cell(1, K['Odluka']).column_letter
    if rr:  # u sledecem krugu moze da ne bude nijedne nove ispravke
        dv.add(f'{kol_odluka}2:{kol_odluka}{len(rr) + 1}')
    ws.freeze_panes = 'E2'
    ws.auto_filter.ref = f'A1:{ws.cell(1, K["Napomena"]).column_letter}{len(rr) + 1}'

    # ---- Pitanja
    wp = wb.create_sheet(LIST_PITANJA)
    for i, (naziv, w) in enumerate(zip(['Br.', 'Oblast', 'Tema', 'Pitanje', 'Vaš odgovor'], [6, 11, 30, 70, 60]), 1):
        c = wp.cell(1, i, naziv)
        c.font, c.fill, c.border, c.alignment = F(bold=True), SIVA, okvir, omot
        wp.column_dimensions[c.column_letter].width = w
    for n, q in enumerate(pitanja, 2):
        for i, v in enumerate([q['id'], q['oblast'], q['tema'], q['pitanje'], None], 1):
            c = wp.cell(n, i, v)
            c.font, c.alignment, c.border = F(bold=(i == 3)), omot, okvir
            if i == 5:
                c.fill = PLAVA
    wp.freeze_panes = 'A2'

    # ---- Listovi za upis
    for naziv, (kolone, sirine, za_upis, _) in TABELE.items():
        wt = wb.create_sheet(naziv)
        for i, (k, w) in enumerate(zip(['Br.'] + kolone, [6] + sirine), 1):
            c = wt.cell(1, i, k)
            c.font, c.fill, c.border, c.alignment = F(bold=True), SIVA, okvir, omot
            wt.column_dimensions[c.column_letter].width = w
        for n, red in enumerate(tabele[naziv], 1):
            for i, (k, v) in enumerate(zip(kolone, red), 2):
                c = wt.cell(n + 1, i, v)
                c.font, c.border = F(bold=(i == 2)), okvir
                c.alignment = Alignment(vertical='top') if k == 'id' else omot
                if k in za_upis:
                    c.fill = PLAVA
            wt.cell(n + 1, 1, n).font = F()
            wt.cell(n + 1, 1).border, wt.cell(n + 1, 1).alignment = okvir, omot
        wt.column_dimensions[wt.cell(1, len(kolone) + 1).column_letter].hidden = True
        wt.freeze_panes = 'C2'

    wb.active = wb.index(u)
    wb.save(cilj)
    print(f'{cilj}\n{len(rr)} redova lekture ({sumnjivih} žutih), {len(pitanja)} pitanja; '
          + ', '.join(f'{naziv} {len(v)}' for naziv, v in tabele.items()))


# ------------------------------------------------------------------ ucitaj

def ucitaj(put: Path, upisi: bool):
    from openpyxl import load_workbook
    wb = load_workbook(put)
    greske, odluke = [], []
    # Zaseban fajl samo sa listovima za upis (npr. "Planete u znacima", 30.9.2026)
    # nema lekturu ni pitanja — tada se ti delovi preskacu.
    ws = wb[LIST_LEKTURA] if LIST_LEKTURA in wb.sheetnames else None
    zaglavlje = [c.value for c in ws[1]] if ws else KOL
    if zaglavlje[:len(KOL)] != KOL:
        sys.exit(f'List {LIST_LEKTURA}: kolone su promenjene — ocekivano {KOL}')
    for red in (ws.iter_rows(min_row=2) if ws else []):
        v = {naziv: red[K[naziv] - 1].value for naziv in KOL}
        if not v['id_korpus']:
            continue
        br = v['Br.']
        odl = str(v['Odluka'] or '').strip().upper()
        vasa = str(v['Vaša verzija'] or '').strip()
        if vasa:
            akcija = 'izmena'
        elif odl in ('', 'DA'):
            akcija = 'DA'
        elif odl == 'NE':
            akcija = 'NE'
        else:
            greske.append(f'red {br}: Odluka {v["Odluka"]!r} (treba DA ili NE)')
            continue
        odluke.append({'br': br, 'korpus': v['id_korpus'], 'kljucevi': json.loads(v['id_kljucevi']),
                       'original': json.loads(v['id_original']), 'ispravka': json.loads(v['id_ispravka']), 'akcija': akcija,
                       'vasa': vasa, 'napomena': str(v['Napomena'] or '').strip(), 'tekst': v['Tekst']})

    odgovori = []
    wp = wb[LIST_PITANJA] if LIST_PITANJA in wb.sheetnames else None
    for red in (wp.iter_rows(min_row=2, values_only=True) if wp else []):
        if red[0]:
            odgovori.append({'id': red[0], 'tema': red[2], 'pitanje': red[3], 'odgovor': str(red[4] or '').strip()})

    # Listovi za upis (Excel od 30.9.2026 nadalje; stariji ih nema). Uzimaju se samo
    # popunjeni redovi; kolone se traze po imenu, id je poslednja (skrivena).
    upisano = {}
    for naziv, (kolone, _, za_upis, _) in TABELE.items():
        if naziv not in wb.sheetnames:
            continue
        wt = wb[naziv]
        zaglavlje = [c.value for c in wt[1]]
        if zaglavlje != ['Br.'] + kolone:
            greske.append(f'list {naziv}: kolone su promenjene — ocekivano {["Br."] + kolone}')
            continue
        for red in wt.iter_rows(min_row=2, values_only=True):
            v = dict(zip(zaglavlje, red))
            polja = {k: str(v[k]).strip() for k in za_upis if v.get(k) is not None and str(v[k]).strip()}
            if v.get('id') and polja:
                upisano.setdefault(naziv, []).append({'id': v['id'], 'naziv': v[kolone[0]], **polja})

    # Primena na ispravke.json
    izmene = {}
    for korpus, (put_j, _) in KORPUSI.items():
        izmene[korpus] = {'lista': json.loads(put_j.read_text(encoding='utf-8')), 'odbijene': [], 'nije_nadjeno': []}
    for o in odluke:
        lista = izmene[o['korpus']]['lista']
        for kljuc, verzija in o['kljucevi']:
            x = next((x for x in lista if x['kljuc'] == kljuc and x['verzija'] == verzija
                      and x['original'] == o['original'] and x['ispravka'] == o['ispravka']), None)
            if x is None:
                izmene[o['korpus']]['nije_nadjeno'].append((o['br'], kljuc))
                continue
            if o['akcija'] == 'NE':
                lista.remove(x)
                izmene[o['korpus']]['odbijene'].append({**x, 'astrolog': 'NE', 'napomena': o['napomena']})
            else:
                x['astrolog'] = o['akcija']
                if o['akcija'] == 'izmena':
                    x['nasa_ispravka'] = x['ispravka']
                    x['ispravka'] = o['vasa']
                if o['napomena']:
                    x['napomena'] = o['napomena']

    # Izvestaj
    from collections import Counter
    c = Counter(o['akcija'] for o in odluke)
    print(f"Lektura: {len(odluke)} redova — DA {c['DA']}, NE {c['NE']}, svoja verzija {c['izmena']}")
    for o in odluke:
        if o['akcija'] != 'DA' or o['napomena']:
            dodatak = f" -> {o['vasa']!r}" if o['vasa'] else ''
            print(f"  {o['br']:>5} {o['akcija']:<6} {o['tekst']}: {o['original']!r}{dodatak}"
                  + (f"  [{o['napomena']}]" if o['napomena'] else ''))
    odgovoreno = [q for q in odgovori if q['odgovor']]
    print(f'Pitanja: odgovoreno {len(odgovoreno)} od {len(odgovori)}')
    for naziv, redovi_t in upisano.items():
        print(f'{naziv}: popunjeno {len(redovi_t)} redova')
    for korpus, s in izmene.items():
        for br, kljuc in s['nije_nadjeno']:
            greske.append(f'red {br}: ispravka za {kljuc} vise ne postoji u {KORPUSI[korpus][0].name} ({korpus})')
    for g in greske:
        print(f'  GRESKA {g}')

    if not upisi:
        print('\nNista nije upisano. Za upis dodaj --upisi.')
        return
    if greske:
        sys.exit('NIJE upisano — prvo resi greske iznad.')

    vreme = datetime.datetime.now().strftime('%Y%m%d-%H%M')
    for korpus, s in izmene.items():
        if not any(o['korpus'] == korpus for o in odluke):
            continue  # nista iz lekture — fajl ostaje netaknut
        put_j = KORPUSI[korpus][0]
        shutil.copy(put_j, put_j.with_name(f'{put_j.stem}.pre-odgovora-{vreme}.json'))
        put_j.write_text(json.dumps(s['lista'], ensure_ascii=False, indent=1), encoding='utf-8')
        if s['odbijene']:
            put_o = put_j.with_name('odbijene-ispravke.json')
            stare = json.loads(put_o.read_text(encoding='utf-8')) if put_o.exists() else []
            put_o.write_text(json.dumps(stare + s['odbijene'], ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'upisano: {put_j}')

    datum = datetime.date.today().isoformat()
    md = KOREN / f'files/odgovori-astrologa-{datum}.md'
    L = [f'# Odgovori astrologa ({datum})', '', f'Izvor: `{put.name}`', '']
    if odgovori:
        L += ['## Pitanja', '']
    for q in odgovori:
        L += [f"### {q['id']} — {q['tema']}", '', f"> {q['pitanje']}", '', q['odgovor'] or '*(bez odgovora)*', '']
    napomene = [o for o in odluke if o['napomena']]
    if napomene:
        L += ['## Napomene uz lekturu', '']
        L += [f"- red {o['br']}, {o['tekst']}: {o['napomena']}" for o in napomene]
    for naziv, redovi_t in upisano.items():
        L += [f'## {naziv}', '']
        for r in redovi_t:
            polja = {k: v for k, v in r.items() if k not in ('id', 'naziv')}
            L += [f"- **{r['naziv']}** (`{r['id']}`): " + ' · '.join(f'{k}: {v}' for k, v in polja.items())]
        L += ['']
    md.write_text('\n'.join(L) + '\n', encoding='utf-8')
    print(f'upisano: {md}')
    if upisano:
        # Isto i kao JSON (id -> polja), za unos u kod ili bazu.
        js = md.with_suffix('.json')
        js.write_text(json.dumps(upisano, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'upisano: {js}')
    print('\nSledece: python3 scripts/korpus/izvoz_csv.py && python3 scripts/korpus/lunarni.py && python3 scripts/korpus/natal.py')


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ('napravi', 'ucitaj'):
        sys.exit(__doc__)
    if sys.argv[1] == 'napravi':
        datum = datetime.date.today().strftime('%-d.%-m.%Y')
        napravi(Path(sys.argv[2]) if len(sys.argv) > 2 else APP / f'Odgovor astrologa {datum}.xlsx')
    else:
        ucitaj(Path(sys.argv[2]), '--upisi' in sys.argv)


if __name__ == '__main__':
    main()
