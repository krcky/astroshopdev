"""
Tumacenja NATALNE karte (posiljka 27.9.2026) -> izvestaj + CSV za `natal_texts`.

    python3 scripts/korpus/natal.py            izvestaj, pa CSV ako je sve u redu
    python3 scripts/korpus/natal.py --izvestaj samo izvestaj

Tri foldera u `files/` (van repoa, .gitignore — pravilo 7):
  Planete u znakovima natal files/sign_<N>_<Znak>.docx   Sunce u Ovnu - Podnaslov
  Planete u kucama natal files/house_<N>.doc(x)          Sunce u prvoj kuci - Podnaslov
  Aspekti planeta/<NN> <Planet>.doc(x)                   Sunce kvadrat Mesec - Podnaslov
Ispod naslova je JEDAN pasus teksta. Nema kratke verzije ni polja
pozitivno/izazov/savet kao kod tranzita.

Kljucevi (Ivan, 28.9.2026) — NE MENJATI POSLE UVOZA:
  natal.<telo>.sign.<znak>      natal.sun.sign.aries      (znak = SIGNS[].key)
  natal.<telo>.house.<N>        natal.sun.house.1
  natal.<a>.<aspekt>.<b>        natal.moon.square.sun     = 'natal.' + contentKey
Za aspekt su tela u redosledu iz `BODIES` (Mesec PRE Sunca), isto kao
`findAspects()`; Ascendent je uvek poslednji.

Besplatno (Ivan, 28.9.2026): Sunce, Mesec i podznak U ZNAKU. Sve ostalo je
placeno. Odluka je kolona `free` u CSV-u; RLS u `supabase/natal-texts.sql`.

ZASTO textutil: 19 od 34 fajla je stari binarni Word (.doc), koji zipfile ne
otvara — `parse_docx.docx_fajlovi` bi ih TIHO preskocio. macOS-ov `textutil`
cita oba formata isto, pa ide jedan put za sve. Svaki pasus je jedan red.

Zamke iz ove posiljke (sve bi bile TIHE bez provera ispod):
  - u fajlovima Jupiter..Neptun stoje ostaci spiska: redovi "Sunce", "Mesec"...
    sami za sebe. Bez preskakanja zalepe se na tekst ispred.
  - PUTOKAZI umesto teksta: "Mesec konjunkcija Sunce – pogledati kod Sunca",
    "Venera konjunkcija Mesec – ako treba, kopirati iz Meseca". Isti aspekt je
    opisan kod prve planete; putokaz se preskace, ne sme da pregazi tekst.
  - "ovaj aspekt ne postoji" / "nema" — astronomski nemoguci, bez teksta.
  - dva naslova u jednom redu: "Mars konjunkcija Sunce - kod SuncaMars konj..."
  - omaske u naslovu: "Ascedent", "jedanestoj" — zato koren, ne cela rec.

PROVERA koja drzi parser posten: svaki kratak red (< 140 znakova) mora biti
ili prepoznat naslov ili dozvoljen ostatak spiska. Sve ostalo je greska i
izvoz se NE pravi — nepoznat naslov bi se inace zalepio na prethodni tekst.
"""
import csv
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from ispravke import primeni

KOREN = Path(__file__).resolve().parents[2]
IZVOR = KOREN / 'files'
CILJ = IZVOR / 'natal-texts.csv'
# Lektura po mestu — isto kao `ispravke.json` kod tranzita, verzija je 'natal'.
ISPRAVKE = IZVOR / 'natal-ispravke.json'

ZNAKOVI = 'Planete u znakovima natal files'
# Podznak stigao posebno (28.9.2026), jedan fajl u korenu `files/`.
PODZNAK = 'Ascendent u znakovima.docx'
KUCE = 'Planete u kucama natal files'
ASPEKTI_DIR = 'Aspekti planeta'

# BEZ ASPEKATA NA MC (Ivan, 28.9.2026): u natalnoj karti MC nije meta aspekata —
# ni tekstova, ni u `ocekivano()`. Ascendent jeste. (U TRANZITIMA MC ostaje meta.)

# Redosled iz `BODIES` u src/lib/astro.ts — DEO UGOVORA SA BAZOM (skill korpus).
TELA = ['moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
# Koren od 4 slova je razlicit za svih deset, a hvata i padez i omaske.
IME = {'sunc': 'sun', 'mese': 'moon', 'merk': 'mercury', 'vene': 'venus', 'mars': 'mars',
       'jupi': 'jupiter', 'satu': 'saturn', 'uran': 'uranus', 'nept': 'neptune', 'plut': 'pluto',
       'asce': 'ascendant'}
ASPEKT = {'konj': 'conjunction', 'seks': 'sextile', 'kvad': 'square', 'trig': 'trine', 'opoz': 'opposition'}
# SIGNS[].key iz src/lib/zodiac.ts, redom — broj u imenu fajla je indeks + 1.
ZNACI = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
         'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
# Unakrsna provera naslova sa imenom fajla (lokativ: "u Ovnu", "u Skorpionu").
ZNAK_KOREN = ['ovn', 'bik', 'bliz', 'rak', 'lav', 'devi', 'vag', 'škor', 'strel', 'jar', 'vodo', 'rib']
# Redni broj kuce; "jedan" i "dvan" pre "deset"/"devet" nije potrebno jer se
# trazi pocetak reci, ali "jedanestoj" (omaska) mora da prodje — zato koren.
KUCA_KOREN = ['prv', 'drug', 'treć', 'četv', 'pet', 'šest', 'sedm', 'osm', 'devet', 'deset', 'jedan', 'dvan']

CRTA = r'\s*[-–—]\s*'
_TELO = r'(sunc\w*|mese\w*|merk\w*|vene\w*|mars\w*|jupi\w*|satu\w*|uran\w*|nept\w*|plut\w*)'
NASLOV_ZNAK = re.compile(rf'^{_TELO}\s+u\s+(\w+){CRTA}(.*)$', re.I)
NASLOV_KUCA = re.compile(rf'^{_TELO}\s+u\s+(\w+)\s+kući{CRTA}(.*)$', re.I)
# "ASCENDENT U OVNU - Brzina kao vrlina" — ceo naslov je verzalom.
NASLOV_PODZNAK = re.compile(rf'^ascendent\s+u\s+(\w+){CRTA}(.*)$', re.I)
NASLOV_ASPEKT = re.compile(
    rf'^{_TELO}\s+(konj\w*|seks\w*|kvad\w*|trig\w*|opoz\w*)\s+(?:sa\s+)?({_TELO[1:-1]}|asce\w*){CRTA}(.*)$', re.I)
# Podnaslov koji je poruka nama, ne naslov tumacenja. Takav zapis NE SME da ima tekst.
PUTOKAZ = re.compile(r'\bkod\b|pogledati|kopirati|ne postoji|\bnema\b|neće biti', re.I)
# Ostatak spiska u Jupiter..Neptun: samo ime planete u redu.
OSTATAK = re.compile(rf'^{_TELO}$', re.I)
# Zbirna napomena bez naslova: "Sunce sekstil/ kvadrat/ ... sa Merkurom Venerom ne postoje".
NAPOMENA = re.compile(r'ne postoj', re.I)
KRATAK = 140
# Pasusi objasnjenja ispod NAPOMENA — ne idu u bazu, ali se prikazu u izvestaju.
ODBACENO: list[str] = []


def redovi(putanja: Path) -> list[str]:
    """Pasusi dokumenta, po jedan u redu. NFC — Word ume da zapise c + akcenat zasebno."""
    t = subprocess.run(['textutil', '-convert', 'txt', '-stdout', str(putanja)],
                       check=True, capture_output=True, text=True).stdout
    t = unicodedata.normalize('NFC', t).replace('️', '').replace(' ', ' ')
    return [re.sub(r'\s+', ' ', r).strip() for r in t.split('\n')]


def fajlovi(folder: str) -> list[Path]:
    return sorted(f for f in (IZVOR / folder).iterdir()
                  if f.suffix in ('.doc', '.docx') and not f.name.startswith('~$'))


def broj(f: Path) -> int:
    return int(re.search(r'_(\d+)', f.name).group(1))


def telo(rec: str) -> str:
    return IME[rec.lower()[:4]]


def citaj(f: Path, prepoznaj, uvod: bool = False) -> tuple[list[dict], list[str]]:
    """
    Deli dokument na zapise. `prepoznaj(red)` vraca (kljuc, naslov, podnaslov)
    ili None. Vraca (zapisi, greske). `uvod=True`: pasusi pre prvog naslova su
    opsti uvod dokumenta (podznak: "Ascendent ili podznak je…") i preskacu se.
    """
    zapisi, greske, tekuci = [], [], None
    for r in redovi(f):
        if not r:
            continue
        kratak = len(r) < KRATAK
        n = prepoznaj(r) if kratak else None
        if n:
            tekuci = {'key': n[0], 'title': n[1], 'subtitle': n[2], 'body': [], 'fajl': f.name}
            zapisi.append(tekuci)
        elif kratak and OSTATAK.match(r):
            continue
        elif kratak and NAPOMENA.search(r):
            # Ispod napomene sledi njeno objasnjenje ("Sunce i Venera najvise
            # mogu da budu udaljeni 48°..."). Bez ovoga se zalepi na tekst
            # PRE napomene (Mesec kvadrat Sunce). Odbacuje se do sledeceg
            # naslova, ali se ispisuje u izvestaju.
            tekuci = {'body': ODBACENO, 'fajl': f.name}
        elif kratak:
            greske.append(f'{f.name}: nepoznat kratak red {r!r}')
        elif tekuci is None and uvod:
            continue
        elif tekuci is None:
            greske.append(f'{f.name}: tekst pre prvog naslova {r[:60]!r}')
        else:
            tekuci['body'].append(r)
    for z in zapisi:
        z['body'] = '\n\n'.join(z['body'])
    return zapisi, greske


def u_znaku(f: Path):
    znak = ZNACI[broj(f) - 1]
    def prepoznaj(r):
        m = NASLOV_ZNAK.match(r)
        if not m or 'kuć' in r:
            return None
        if not m[2].lower().startswith(ZNAK_KOREN[broj(f) - 1]):
            raise ValueError(f'{f.name}: znak u naslovu se ne slaze sa fajlom: {r!r}')
        t = telo(m[1])
        return f'natal.{t}.sign.{znak}', r[:m.start(3)].rstrip(' -–—'), m[3].strip()
    return prepoznaj


def podznak(_f: Path):
    def prepoznaj(r):
        m = NASLOV_PODZNAK.match(r)
        if not m:
            return None
        rec = m[1].lower()
        i = next((i for i, k in enumerate(ZNAK_KOREN) if rec.startswith(k)), None)
        if i is None:
            raise ValueError(f'{_f.name}: nepoznat znak u naslovu: {r!r}')
        # Naslov je u dokumentu verzalom; u bazu ide kao ostali: "Ascendent u Ovnu".
        return f'natal.ascendant.sign.{ZNACI[i]}', f'Ascendent u {m[1].capitalize()}', m[2].strip()
    return prepoznaj


def u_kuci(f: Path):
    n = broj(f)
    def prepoznaj(r):
        m = NASLOV_KUCA.match(r)
        if not m:
            return None
        if not m[2].lower().startswith(KUCA_KOREN[n - 1]):
            raise ValueError(f'{f.name}: kuca u naslovu se ne slaze sa fajlom: {r!r}')
        return f'natal.{telo(m[1])}.house.{n}', r[:m.start(3)].rstrip(' -–—'), m[3].strip()
    return prepoznaj


def aspekt(_f: Path):
    def prepoznaj(r):
        m = NASLOV_ASPEKT.match(r)
        if not m:
            return None
        a, b = telo(m[1]), telo(m[3])
        red = TELA + ['ascendant']
        a, b = sorted((a, b), key=red.index)
        return f'natal.{a}.{ASPEKT[m[2].lower()[:4]]}.{b}', r[:m.start(4)].rstrip(' -–—'), m[4].strip()
    return prepoznaj


# ---------------------------------------------------------------- ocekivano

def nemoguc_aspekt(a: str, asp: str, b: str) -> bool:
    """
    Aspekti koji se u natalnoj karti NE MOGU desiti — proverava se astronomijom,
    ne preuzima od astrologa (isto pravilo kao NEMOGUCE u parse_docx.py).
    Merkur je od Sunca najvise ~28°, Venera ~47°, pa je izmedju njih najvise ~76°.
    Neptun–Pluton: od ~1940. do posle 2100. u sekstilu (±orb); ostalo van veka.
    """
    par = {a, b}
    if par in ({'sun', 'mercury'}, {'sun', 'venus'}):
        return asp != 'conjunction'
    if par == {'mercury', 'venus'}:
        return asp not in ('conjunction', 'sextile')
    if par == {'neptune', 'pluto'}:
        return asp != 'sextile'
    return False


# Planeta u znaku koju niko zivi nema (i niko ko se rodi pre ~2039) — ne trazi se.
# Neptun je usao u Ovna tek 26.1.2026: korisnik aplikacije ga nema.
NEMOGUC_ZNAK = {('neptune', 'aries'), ('neptune', 'taurus'), ('pluto', 'aries'), ('pluto', 'taurus')}


def ocekivano() -> dict[str, list[str]]:
    red = TELA + ['ascendant']
    asp = [f'natal.{a}.{x}.{b}' for i, a in enumerate(red) for b in red[i + 1:]
           for x in ASPEKT.values() if not nemoguc_aspekt(a, x, b)]
    return {
        'Planete u znakovima': [f'natal.{t}.sign.{z}' for t in TELA for z in ZNACI
                                if (t, z) not in NEMOGUC_ZNAK],
        'Podznak (Ascendent u znaku)': [f'natal.ascendant.sign.{z}' for z in ZNACI],
        'Planete u kucama': [f'natal.{t}.house.{n}' for t in TELA for n in range(1, 13)],
        'Aspekti': asp,
    }


def besplatno(kljuc: str) -> bool:
    """Ivan, 28.9.2026: velika trojka u znaku je besplatna, sve ostalo placeno."""
    return re.fullmatch(r'natal\.(sun|moon|ascendant)\.sign\.\w+', kljuc) is not None


# ---------------------------------------------------------------- glavno

def ucitaj() -> tuple[dict, list[str]]:
    sve, greske = [], []
    for folder, fn in ((ZNAKOVI, u_znaku), (KUCE, u_kuci), (ASPEKTI_DIR, aspekt)):
        for f in fajlovi(folder):
            try:
                z, g = citaj(f, fn(f))
            except ValueError as e:
                z, g = [], [str(e)]
            sve += z
            greske += g
    f = IZVOR / PODZNAK
    if f.exists():
        try:
            z, g = citaj(f, podznak(f), uvod=True)
        except ValueError as e:
            z, g = [], [str(e)]
        sve += z
        greske += g

    zapisi = {}
    for z in sve:
        putokaz = bool(PUTOKAZ.search(z['subtitle']))
        if putokaz and z['body']:
            greske.append(f"{z['fajl']}: putokaz ima tekst — {z['title']} – {z['subtitle']}")
        if putokaz or not z['body']:
            if not putokaz:
                greske.append(f"{z['fajl']}: naslov bez teksta — {z['title']} – {z['subtitle']}")
            continue
        if z['key'] in zapisi:
            greske.append(f"{z['fajl']}: {z['key']} vec postoji u {zapisi[z['key']]['fajl']}")
            continue
        zapisi[z['key']] = z
    return zapisi, greske


def izvestaj(zapisi: dict, greske: list[str]) -> None:
    moguci = set()
    for grupa, kljucevi in ocekivano().items():
        moguci |= set(kljucevi)
        fale = [k for k in kljucevi if k not in zapisi]
        print(f'{grupa}: {len(kljucevi) - len(fale)}/{len(kljucevi)}')
        for k in fale:
            print(f'    fali {k}')
    visak = sorted(set(zapisi) - moguci)
    for k in visak:
        print(f'  VISAK (nije u ocekivanom spisku): {k}')
    duzine = sorted(len(z['body']) for z in zapisi.values())
    print(f'Ukupno {len(zapisi)} tekstova, od toga besplatnih {sum(map(besplatno, zapisi))}; '
          f'duzina {duzine[0]}–{duzine[-1]} znakova')
    for t in ODBACENO:
        print(f'  odbaceno (objasnjenje ispod napomene): {t[:70]}…')
    for g in greske:
        print(f'  GRESKA {g}')


KOLONE = ['key', 'kind', 'title', 'subtitle', 'body', 'free']


def izvoz(zapisi: dict) -> None:
    po_verziji = {(k, 'natal'): z for k, z in zapisi.items()}
    for x in primeni(po_verziji, ISPRAVKE):
        print(f"  ispravka nije primenjena (nema originala): {x['kljuc']} | {x['original']!r}")
    with open(CILJ, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=KOLONE, quoting=csv.QUOTE_ALL)
        w.writeheader()
        for k in sorted(zapisi):
            z = zapisi[k]
            vrsta = k.split('.')[2] if k.split('.')[2] in ('sign', 'house') else 'aspect'
            w.writerow({'key': k, 'kind': vrsta, 'title': z['title'], 'subtitle': z['subtitle'],
                        'body': z['body'], 'free': 'true' if besplatno(k) else 'false'})
    print(f'{CILJ}\n{len(zapisi)} redova')


def main():
    zapisi, greske = ucitaj()
    izvestaj(zapisi, greske)
    if '--izvestaj' in sys.argv:
        return
    if greske:
        sys.exit('CSV NIJE napravljen — prvo resi greske iznad.')
    izvoz(zapisi)


if __name__ == '__main__':
    main()
