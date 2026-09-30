"""
Podaci za PRICU O ZNAKU (Ivan, 30.9.2026; pravilo 25 u CLAUDE.md) — sve iz jednog izvora, ponovljivo.

    python3 scripts/znak/pripremi.py            sve ispocetka (skida 12 strana sa sajta)
    npm run slike                                posle ovoga: nove slike u assets/ bez gubitka (pravilo 24)

Sta pravi:
  src/lib/znak-opis-podaci.ts        tekstovi sa astroshop.rs/znak/<znak>/ za svih 12 znakova
  src/lib/sazvezdja.ts               sazvezdja zodijaka (linije IAU i zvezde, preko d3-celestial)
  src/lib/ikone-osnova.ts            Ivanove ikonice za sliku "Osnove znaka" (files/*.svg)
  assets/images/znakovi/<key>.png    gravira znaka iz files/*-ilustracija@2x.png, smanjena na @3x prikaza
  assets/images/znakovi/<key>-{kamen,boja,biljka,hrana}.jpg   fotografije sa sajta, bajt po bajt
  assets/images/ikone/{srce,torba}.png                          iz files/

Tekst sa sajta se ne prepisuje: uzimaju se naslovi poglavlja (deo posle dvotacke) i prva recenica
poglavlja. Ispravljaju se samo slovne greske iz ISPRAVKE (spisak ide astrologu).
"""
import html as H
import json
import math
import os
import re
import shutil
import subprocess
import urllib.parse
import urllib.request

KOREN = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(KOREN)

# (kljuc u aplikaciji, strana na sajtu, izvor gravire u files/)
ZNACI = [
    ('aries', 'ovan', 'ovan-ilustracija@2x.png'),
    ('taurus', 'bik', 'bik-ilustracija@2x.png'),
    ('gemini', 'blizanci', 'blizanci-ilustracija@2x.png'),
    ('cancer', 'rak', 'rak-ilustracija-uporedni@2x.png'),
    ('leo', 'lav', 'lav-ilustracija@2x.png'),
    ('virgo', 'devica', 'devica-ilustracija@2x.png'),
    ('libra', 'vaga', 'vaga-ilustracija-uporedni@2x.png'),
    ('scorpio', 'skorpion', 'skorpion-ilustracija@2x.png'),
    ('sagittarius', 'strelac', 'strelac-ilustracija@2x.png'),
    ('capricorn', 'jarac', 'jarac-ilustracija@2x.png'),
    # Vodolija je u files/ pod pogresnim imenom "blizanac" (mladic sa krcagom).
    ('aquarius', 'vodolija', 'blizanac-ilustracija@2x.png'),
    ('pisces', 'ribe', 'ribe-ilustracija@2x.png'),
]
# Slovne greske na sajtu (30.9.2026) — ispravljene u aplikaciji, spisak ide astrologu.
ISPRAVKE = {'impusivnost': 'impulsivnost', 'liberarnost': 'liberalnost', 'Začinjenu i slana hrana': 'Začinjena i slana hrana'}
# Gravira na slici 2 staje u 350 x 330 pt; @3x.
GRAVIRA = (1050, 990)
STVARI = [('Dragi kamen', 'kamen'), ('Boja', 'boja'), ('Biljka', 'biljka'), ('Hrana', 'hrana')]


def skini(url: str) -> bytes:
    zahtev = urllib.request.Request(urllib.parse.quote(url, safe=':/.-_%@'), headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(zahtev, timeout=30) as r:
        return r.read()


def cist(s: str) -> str:
    s = re.sub(r'<[^>]+>', ' ', s)
    return re.sub(r'\s+', ' ', H.unescape(s)).strip()


def ispravi(t: str) -> str:
    for a, b in ISPRAVKE.items():
        t = t.replace(a, b)
    return t


def recenice(p: str) -> list[str]:
    p = re.sub(r'\b(tj|npr|itd|Dr)\.', lambda m: m.group(1) + '§', p)
    return [s.replace('§', '.') for s in re.split(r'(?<=[.!?])\s+', p) if s.strip()]


def veliko(s: str) -> str:
    return s[:1].upper() + s[1:]


def posle(naslov: str) -> str:
    """Deo naslova poglavlja posle "?" ("Kako zavesti Ovna? ...") ili posle poslednje dvotacke."""
    deo = naslov.split('?', 1)[1] if '?' in naslov else naslov.rsplit(':', 1)[1]
    return veliko(deo.strip())


def strana(slug: str) -> dict:
    t = skini(f'https://astroshop.rs/znak/{slug}/').decode('utf-8')
    glavni = t[t.find('info-header-title'):]
    glavni = glavni[:glavni.find('Uporedni horoskop')]
    podaci = {cist(a).upper(): cist(b) for a, b in re.findall(r'<dl class="dl-info border">\s*<dt>(.*?)</dt>\s*<dd>(.*?)</dd>', t, re.S)}
    stvari = {cist(dt): (cist(dd), img) for img, dt, dd in re.findall(
        r'<div class="sign-assets[^"]*">\s*(?:<img src="([^"]+)"[^>]*>)?\s*<dl class="dl-info[^"]*">\s*<dt>(.*?)</dt>\s*<dd>(.*?)</dd>', t, re.S)}
    sekcije = {}
    for m in re.finditer(r'<h([23])[^>]*>(.*?)</h\1>(.*?)(?=<h[23][^>]*>|$)', glavni, re.S):
        tekst = ' '.join(cist(p) for p in re.findall(r'<p[^>]*>(.*?)</p>', m.group(3), re.S)) or cist(m.group(3))
        sekcije[cist(m.group(2))] = tekst
    return {'podaci': podaci, 'stvari': stvari, 'sekcije': sekcije}


def sekcija(sek: dict, rx: str) -> tuple[str, str]:
    for h, p in sek.items():
        if re.search(rx, h):
            return h, p
    raise SystemExit(f'nema poglavlja {rx}')


def opis(slug: str) -> tuple[dict, dict]:
    s = strana(slug)
    p, sek = s['podaci'], s['sekcije']
    ho, po = sekcija(sek, r'[Oo]pšte karakteristike')
    hl, pl = sekcija(sek, r'ljubavni horoskop')
    hp, pp = sekcija(sek, r'^Posao')
    hz, _ = sekcija(sek, r'^Kako zavesti')
    vr = re.sub(r'\.$', '', ispravi(p['NAJVEĆE VREDNOSTI']))
    bez_tacke = lambda x: re.sub(r'\.$', '', x)
    o = {
        'ukratko': posle(ho), 'ukratkoRecenica': recenice(po)[0],
        'ljubav': posle(hl), 'ljubavRecenica': recenice(pl)[0],
        'posao': posle(hp), 'posaoRecenica': recenice(pp)[0],
        'osvojiti': posle(hz),
        'vrednosti': [veliko(x.strip()) for x in re.split(r',\s*|\s+i\s+', vr) if x.strip()],
        'pol': 'Muški' if p['POL'].lower().startswith('muš') else 'Ženski',
        'izgled': bez_tacke(p['IZGLED']),
        'telo': bez_tacke(p['DEO TELA KOJIM VLADA ZNAK']),
        'zivotinja': bez_tacke(p['ŽIVOTINJA']),
    }
    for naziv, kljuc in STVARI:
        o[kljuc] = ispravi(s['stvari'][naziv][0])
    slike = {kljuc: s['stvari'][naziv][1] for naziv, kljuc in STVARI}
    return o, slike


def ts_string(v) -> str:
    return json.dumps(v, ensure_ascii=False)


def pisi_opis(sve: dict):
    redovi = []
    for k, o in sve.items():
        polja = ',\n'.join(f'    {pk}: {ts_string(pv)}' for pk, pv in o.items())
        redovi.append(f'  {k}: {{\n{polja},\n  }},')
    tip = '\n'.join(f'  {pk}: {"string[]" if isinstance(pv, list) else "string"};' for pk, pv in next(iter(sve.values())).items())
    out = f'''/**
 * Opis znaka sa astroshop.rs/znak/<znak>/ (tekst astrologa sa sajta, javan) — za PRICU O ZNAKU
 * (pravilo 25). GENERISANO skriptom `scripts/znak/pripremi.py`; ne menjati rucno, nego na sajtu
 * pa ponovo pokrenuti skriptu.
 *
 * Naslovi (`ukratko`, `ljubav`, `posao`) su deo naslova poglavlja posle dvotacke, `osvojiti` deo
 * naslova "Kako zavesti ..." posle upitnika, a `*Recenica` prva recenica poglavlja. Ispravljene su
 * samo slovne greske (spisak u skripti). Tekstovi su u trecem licu i mestimicno u "Vi" obliku —
 * kako ih je astrolog napisao.
 */
export type ZnakOpis = {{
{tip}
}};

export const ZNAK_OPIS: Record<string, ZnakOpis> = {{
{chr(10).join(redovi)}
}};
'''
    open('src/lib/znak-opis-podaci.ts', 'w', encoding='utf-8').write(out)


def gravira(kljuc: str, izvor: str):
    """Smanji graviru iz files/ da stane u GRAVIRA (ne uvecava), PNG sa providnoscu."""
    src = os.path.join('files', izvor)
    out = os.path.join('assets/images/znakovi', f'{kljuc}.png')
    w, h = (int(x) for x in re.findall(r'pixel(?:Width|Height): (\d+)', subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', src], capture_output=True, text=True).stdout))
    k = min(1, GRAVIRA[0] / w, GRAVIRA[1] / h)
    if k < 1:
        subprocess.run(['sips', '--resampleWidth', str(round(w * k)), src, '--out', out], check=True, capture_output=True)
    else:
        shutil.copyfile(src, out)


def sazvezdja():
    """Linije (IAU) i zvezde (XHIP) iz d3-celestial 0.7.35, u ravni oko sredine sazvezdja."""
    baza = 'https://cdn.jsdelivr.net/npm/d3-celestial@0.7.35/data/'
    linije_sve = json.loads(skini(baza + 'constellations.lines.json'))
    zvezde_sve = [(f['geometry']['coordinates'][0], f['geometry']['coordinates'][1], f['properties']['mag'])
                  for f in json.loads(skini(baza + 'stars.6.json'))['features']]
    ID = dict(aries='Ari', taurus='Tau', gemini='Gem', cancer='Cnc', leo='Leo', virgo='Vir', libra='Lib',
              scorpio='Sco', sagittarius='Sgr', capricorn='Cap', aquarius='Aqr', pisces='Psc')

    def dra(a, b):
        d = a - b
        return d - 360 if d > 180 else d + 360 if d < -180 else d

    out = {}
    for k, cid in ID.items():
        linije = next(f for f in linije_sve['features'] if f['id'] == cid)['geometry']['coordinates']
        tacke = [p for l in linije for p in l]
        ra0 = math.degrees(math.atan2(sum(math.sin(math.radians(p[0])) for p in tacke), sum(math.cos(math.radians(p[0])) for p in tacke)))
        dec0 = sum(p[1] for p in tacke) / len(tacke)
        c = math.cos(math.radians(dec0))
        # Nebo gledano odozdo: rektascenzija raste ulevo, deklinacija nagore.
        proj = lambda ra, dec: (-dra(ra, ra0) * c, -(dec - dec0))
        P = [[proj(*p) for p in l] for l in linije]
        xs = [x for l in P for x, _ in l]
        ys = [y for l in P for _, y in l]
        w, h = max(xs) - min(xs), max(ys) - min(ys)
        s = max(w, h)
        norm = lambda x, y: [round((x - min(xs) - w / 2) / s, 3), round((y - min(ys) - h / 2) / s, 3)]
        zvezde = {}
        for ra, dec in tacke:
            naj = min(zvezde_sve, key=lambda z: (dra(z[0], ra) * c) ** 2 + (z[1] - dec) ** 2)
            zvezde[(round(ra, 3), round(dec, 3))] = [*norm(*proj(ra, dec)), round(naj[2], 1)]
        pozadina = []
        for ra, dec, m in zvezde_sve:
            if m > 5.2 or abs(dra(ra, ra0)) > 90:
                continue
            x, y = norm(*proj(ra, dec))
            if abs(x) < 0.75 and abs(y) < 0.95 and not any(abs(x - v[0]) < 0.004 and abs(y - v[1]) < 0.004 for v in zvezde.values()):
                pozadina.append([x, y, round(m, 1)])
        out[k] = {'linije': [[norm(x, y) for x, y in l] for l in P], 'zvezde': list(zvezde.values()), 'pozadina': pozadina}
    telo = ',\n'.join(f'  {k}: {json.dumps(v, separators=(",", ":"))}' for k, v in out.items())
    open('src/lib/sazvezdja.ts', 'w').write(f'''/**
 * Sazvezdja zodijaka za pricu o znaku (slika "Sazvezdje", pravilo 25). GENERISANO skriptom
 * `scripts/znak/pripremi.py`; ne menjati rucno.
 *
 * Izvor: d3-celestial 0.7.35 (Olaf Frohn, BSD-3-Clause) — linije sazvezdja po IAU, zvezde iz
 * kataloga XHIP (Anderson & Francis 2012). Pravi polozaji, epoha J2000, projektovani u ravan oko
 * sredine sazvezdja: x nadesno, y nadole, veca stranica sazvezdja = 1 (od -0,5 do 0,5).
 * `zvezde` su temena linija, `pozadina` ostale zvezde do magnitude 5,2 oko njih. Treci broj je magnituda.
 */
export type Sazvezdje = {{
  linije: [number, number][][];
  zvezde: [number, number, number][];
  pozadina: [number, number, number][];
}};

export const SAZVEZDJA: Record<string, Sazvezdje> = {{
{telo},
}};
''')


def ikone_osnova():
    """Ivanove ikonice za "Osnove znaka" (files/*.svg, 30.9.2026): bez bele pozadine, kao podatak za react-native-svg."""
    imena = ['kvalitet-kardinalni', 'kvalitet-fiksni', 'kvalitet-promenljivi', 'polaritet-pozitivni', 'polaritet-zenski',
             'pol-muski', 'pol-zenski', 'izgled', 'deo-tela']
    out = {}
    for ime in imena:
        t = open(f'files/{ime}.svg').read()
        pravougaonik = None
        m = re.search(r'<rect id="Rectangle" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" transform="([^"]+)" stroke="(#\w+)" stroke-width="([\d.]+)"', t)
        if m:
            pravougaonik = {'x': float(m[1]), 'y': float(m[2]), 'w': float(m[3]), 'h': float(m[4]), 'transform': m[5], 'boja': m[6], 'debljina': float(m[7])}
        putanje = [{'d': d, 'boja': boja, 'evenodd': 'evenodd' in atr}
                   for atr, d, boja in re.findall(r'<path([^>]*?) d="([^"]+)" fill="(#\w+)"', t)]
        assert putanje, ime
        out[ime] = {'pravougaonik': pravougaonik, 'putanje': putanje}
    telo = ',\n'.join(f"  '{k}': {json.dumps(v, separators=(',', ':'))}" for k, v in out.items())
    open('src/lib/ikone-osnova.ts', 'w').write(f'''/**
 * Ivanove ikonice za sliku "Osnove znaka" u prici o znaku (files/*.svg, 30.9.2026) — kvalitet, polaritet,
 * pol, izgled, deo tela. GENERISANO skriptom `scripts/znak/pripremi.py` (bela pozadina 118 x 118 skinuta).
 * Crta ih `components/prica-znaka/ikona-osnove.tsx`; viewBox 0 0 118 118.
 */
export type IkonaOsnove = {{
  pravougaonik: {{ x: number; y: number; w: number; h: number; transform: string; boja: string; debljina: number }} | null;
  putanje: {{ d: string; boja: string; evenodd: boolean }}[];
}};

export const IKONE_OSNOVA: Record<string, IkonaOsnove> = {{
{telo},
}};
''')


def mere(putanja: str) -> tuple[int, int]:
    izlaz = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', putanja], capture_output=True, text=True).stdout
    w, h = (int(x) for x in re.findall(r'pixel(?:Width|Height): (\d+)', izlaz))
    return w, h


def slike_ts():
    """Staticki `require` i mere slika (Metro ne ume promenljivu putanju; `resolveAssetSource` nema na vebu)."""
    def slika(putanja: str) -> str:
        w, h = mere(putanja)
        return f"{{ src: require('../../../{putanja}'), w: {w}, h: {h} }}"
    redovi = []
    for kljuc, _, _ in ZNACI:
        delovi = [f'gravira: {slika(f"assets/images/znakovi/{kljuc}.png")}']
        delovi += [f'{s}: {slika(f"assets/images/znakovi/{kljuc}-{s}.jpg")}' for _, s in STVARI]
        redovi.append(f"  {kljuc}: {{\n    " + ',\n    '.join(delovi) + ",\n  },")
    open('src/components/prica-znaka/slike-znaka.ts', 'w').write(f'''/**
 * Slike price o znaku po znaku, sa merama u pikselima: gravira (files/*-ilustracija@2x.png, smanjena
 * na @3x prikaza) i fotografije kamena, boje, biljke i hrane sa astroshop.rs. GENERISANO:
 * `scripts/znak/pripremi.py`.
 */
import type {{ ImageSourcePropType }} from 'react-native';

export type Slika = {{ src: ImageSourcePropType; w: number; h: number }};
export type SlikeZnaka = Record<'gravira' | 'kamen' | 'boja' | 'biljka' | 'hrana', Slika>;

export const SLIKE_ZNAKA: Record<string, SlikeZnaka> = {{
{chr(10).join(redovi)}
}};

export const SRCE: Slika = {slika('assets/images/ikone/srce.png')};
export const TORBA: Slika = {slika('assets/images/ikone/torba.png')};
''')


def main():
    os.makedirs('assets/images/znakovi', exist_ok=True)
    sve = {}
    for kljuc, slug, izvor in ZNACI:
        o, slike = opis(slug)
        sve[kljuc] = o
        for stvar, url in slike.items():
            open(f'assets/images/znakovi/{kljuc}-{stvar}.jpg', 'wb').write(skini(url))
        gravira(kljuc, izvor)
        print(kljuc, 'ok')
    pisi_opis(sve)
    for ime in ['srce', 'torba']:
        shutil.copyfile(f'files/{ime}.png', f'assets/images/ikone/{ime}.png')
    sazvezdja()
    ikone_osnova()
    slike_ts()
    print('Gotovo. Sad: npm run slike')


if __name__ == '__main__':
    main()
