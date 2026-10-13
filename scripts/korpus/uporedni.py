"""
Uporedni horoskop (poredjenje po znaku Sunca): 144 USMERENA para x 3 oblasti (Ljubav, Prijateljstvo, Posao).

    python3 scripts/korpus/uporedni.py            # CSV + SQL za `uporedni_texts` + izvestaj
    python3 scripts/korpus/uporedni.py --osvezi   # ponovo skine strane sa sajta (inace kes)

Izvor: astroshop.rs/uporedni-horoskop/<znak>-<znak>/ — tekstovi su javni i vlasnistvo sajta. "Vi" u tekstu je PRVI znak u
adresi ("ovan-bik" = Ovan gleda Bika; "bik-ovan" je drugi tekst), zato su parovi usmereni: 66 parova se razlikuje u obe
strane, 12 istih znakova je po jedan. Aplikacija kaze "ti" = korisnikov znak, pa je prvi znak uvek korisnikov.

Kljuc (kanonski, ne menja se posle uvoza): uporedni.<prvi>.<drugi>.<oblast>, npr. uporedni.aries.taurus.ljubav;
znakovi su `SIGNS[].key` iz zodiac.ts, oblast: ljubav | prijateljstvo | posao.

Sta se NE radi: tekst se ne prepisuje i ne "popravlja" po ukusu. Jedina izmena reci su tacna mesta iz `ispravke.json`
(slovne greske, isti oblik kao kod ostalog korpusa: {kljuc, original, ispravka}), a jedina izmena oblika je PODELA NA PASUSE
(dugacak blok se deli na pasuse od ~70 reci, posle rečenice; provera pada ako se ijedna rec promeni).

Folder sa izvorom i izlazom: ~/Desktop/Astroshop App/Uporedni horoskop/ (sirovo.json, ispravke.json, uporedni-texts.csv, uvoz.sql).
"""
import csv
import html
import json
import re
import sys
import time
import unicodedata
import urllib.request
from pathlib import Path

IZVOR = Path('/Users/ivankrstic/Desktop/Astroshop App/Uporedni horoskop')
SIROVO = IZVOR / 'sirovo.json'
ISPRAVKE = IZVOR / 'ispravke.json'
CSV_CILJ = IZVOR / 'uporedni-texts.csv'
SQL_CILJ = IZVOR / 'uvoz.sql'

# Adresa na sajtu -> SIGNS[].key. Redosled je redosled znakova od Ovna.
ZNACI = [
    ('ovan', 'aries'), ('bik', 'taurus'), ('blizanci', 'gemini'), ('rak', 'cancer'),
    ('lav', 'leo'), ('devica', 'virgo'), ('vaga', 'libra'), ('skorpion', 'scorpio'),
    ('strelac', 'sagittarius'), ('jarac', 'capricorn'), ('vodolija', 'aquarius'), ('ribe', 'pisces'),
]
OBLASTI = [('Ljubav', 'ljubav'), ('Prijateljstvo', 'prijateljstvo'), ('Posao', 'posao')]
# Ocekivano: 12 x 12 x 3 = 432; sajt nema "Posao" za par strelac-rak.
OCEKIVANO = 432
CILJ_REC_PO_PASUSU = 75


def skini():
    out = {}
    for slug_a, _ in ZNACI:
        for slug_b, _ in ZNACI:
            url = f'https://astroshop.rs/uporedni-horoskop/{slug_a}-{slug_b}/'
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            s = urllib.request.urlopen(req, timeout=40).read().decode('utf8')
            out[f'{slug_a}-{slug_b}'] = izvuci(s)
            time.sleep(0.25)
    IZVOR.mkdir(parents=True, exist_ok=True)
    SIROVO.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf8')
    return out


def izvuci(s):
    """Tri teksta sa strane: po naslovu <h3> (Ljubav, Prijateljstvo, Posao), svi <p> do kraja njegove sekcije."""
    res = {}
    for naziv, _ in OBLASTI:
        m = re.search(r'<h3[^>]*>\s*' + naziv + r'\s*</h3>(.*?)</section>', s, re.S)
        if not m:
            continue
        ps = re.findall(r'<p[^>]*>(.*?)</p>', m.group(1), re.S)
        ociscen = [html.unescape(re.sub(r'<[^>]+>', '', p)).strip() for p in ps]
        res[naziv] = [p for p in ociscen if p]  # posle unescape: `&nbsp;` je prazan pasus
    return res


def normalizuj(t):
    t = unicodedata.normalize('NFC', t.replace(' ', ' '))
    return re.sub(r'[ \t]+', ' ', t).strip()


def reci(t):
    return re.findall(r'\S+', t)


def recenice(t):
    """Deli na recenice posle . ! ? kad sledi veliko slovo ili navodnik; kratice u ovom korpusu ne postoje (provereno)."""
    return [x for x in re.split(r'(?<=[.!?])\s+(?=[A-ZŠĐČĆŽ„“"“])', t) if x]


def podeli_na_pasuse(t):
    """Pasusi ~75 reci, granica uvek posle recenice; broj pasusa = zaokruzeno reci/75, a rez tamo gde je zbir reci najblizi."""
    rec = recenice(t)
    ukupno = len(reci(t))
    k = max(1, round(ukupno / CILJ_REC_PO_PASUSU))
    if k == 1 or len(rec) < 2:
        return [t]
    duzine = [len(reci(r)) for r in rec]
    rezovi, zbir, meta = [], 0, 1
    for i, d in enumerate(duzine[:-1]):
        zbir += d
        # sledeci rez je na meta * ukupno / k reci; presecaj kad je ova granica blize meti nego sledeca
        cilj = meta * ukupno / k
        if meta < k and abs(zbir - cilj) <= abs(zbir + duzine[i + 1] - cilj):
            rezovi.append(i + 1)
            meta += 1
    delovi, od = [], 0
    for r in rezovi + [len(rec)]:
        delovi.append(' '.join(rec[od:r]))
        od = r
    return [d for d in delovi if d]


def primeni_ispravke(kljuc, tekst, ispravke, primenjene):
    for i, e in enumerate(ispravke):
        if e.get('kljuc') not in (None, '*', kljuc):
            continue
        o = e['original']
        # Tacna mesta moraju da se poklope kao cela rec ("ozitivni" ne sme da pogodi "Pozitivni").
        obrazac = r'(?<![\wŠšĐđČčĆćŽž])' + re.escape(o) + r'(?![\wŠšĐđČčĆćŽž])'
        tekst, n = re.subn(obrazac, e['ispravka'], tekst)
        if n:
            primenjene[i] = primenjene.get(i, 0) + n
    return tekst


def main():
    osvezi = '--osvezi' in sys.argv
    if osvezi or not SIROVO.exists():
        print('Skidam 144 strane sa astroshop.rs ...')
        sirovo = skini()
    else:
        sirovo = json.loads(SIROVO.read_text(encoding='utf8'))
    ispravke = json.loads(ISPRAVKE.read_text(encoding='utf8')) if ISPRAVKE.exists() else []

    redovi, nema, primenjene, izmena_reci = [], [], {}, 0
    for slug_a, kljuc_a in ZNACI:
        for slug_b, kljuc_b in ZNACI:
            strana = sirovo.get(f'{slug_a}-{slug_b}', {})
            for naziv, oblast in OBLASTI:
                ps = [p for p in (strana.get(naziv) or []) if p.strip()]
                kljuc = f'uporedni.{kljuc_a}.{kljuc_b}.{oblast}'
                if not ps:
                    nema.append(kljuc)
                    continue
                # Sajt drzi tekst u jednom <p>; ako ih ima vise, svaki je vec pasus.
                osnova = normalizuj(' '.join(ps)) if len(ps) == 1 else None
                if osnova is None:
                    delovi = [normalizuj(p) for p in ps]
                else:
                    delovi = [osnova]
                tekst = '\n\n'.join(delovi)
                tekst = primeni_ispravke(kljuc, tekst, ispravke, primenjene)
                tekst_bez = re.sub(r'\s+', ' ', tekst).strip()
                if len(delovi) == 1:
                    pasusi = podeli_na_pasuse(tekst_bez)
                    # Podela ne sme da promeni nijednu rec.
                    if reci(' '.join(pasusi)) != reci(tekst_bez):
                        sys.exit(f'GRESKA: podela na pasuse menja reci u {kljuc}')
                    body = '\n\n'.join(pasusi)
                else:
                    body = tekst
                redovi.append({'key': kljuc, 'jezik': 'sr', 'prvi': kljuc_a, 'drugi': kljuc_b, 'area': oblast, 'body': body})

    # Tekst koji staje usred recenice je odsecen na sajtu (npr. leo-virgo, Ljubav: "...lavlje srce, i"). Takav NE ide u bazu —
    # korisnik bi video pola recenice; ide na spisak za astrologa, a aplikacija za taj par pokazuje samo ostale oblasti.
    nepotpuni = [r['key'] for r in redovi if not re.search(r'[.!?\u201d")]$', r['body'])]
    redovi = [r for r in redovi if r['key'] not in nepotpuni]

    # --- provere ---
    losi = [r['key'] for r in redovi if re.search(r'<|>|&#|&[a-z]+;|\{\{', r['body'])]
    prazni = [r['key'] for r in redovi if len(reci(r['body'])) < 30]
    kratki_kraj = [r['key'] for r in redovi if not re.search(r'[.!?”"”)]$', r['body'])]
    jedinstveni = {r['key'] for r in redovi}

    with CSV_CILJ.open('w', newline='', encoding='utf8') as f:
        w = csv.DictWriter(f, fieldnames=['key', 'jezik', 'prvi', 'drugi', 'area', 'body'])
        w.writeheader()
        w.writerows(redovi)

    # SQL za uvoz: dollar-quoting, pa nista ne treba escape-ovati. UPSERT po (key, jezik).
    with SQL_CILJ.open('w', encoding='utf8') as f:
        f.write('-- Uvoz uporednog horoskopa (uporedni_texts), pravi scripts/korpus/uporedni.py. Ne menjati rucno.\nbegin;\n')
        for i in range(0, len(redovi), 50):
            deo = redovi[i:i + 50]
            f.write('insert into public.uporedni_texts (key, jezik, prvi, drugi, area, body) values\n')
            f.write(',\n'.join(
                f"  ('{r['key']}', 'sr', '{r['prvi']}', '{r['drugi']}', '{r['area']}', $t${r['body']}$t$)" for r in deo
            ))
            f.write('\non conflict (key, jezik) do update set body = excluded.body, prvi = excluded.prvi, drugi = excluded.drugi, area = excluded.area;\n')
        f.write('commit;\n')

    ukupno_reci = sum(len(reci(r['body'])) for r in redovi)
    pas = [r['body'].count('\n\n') + 1 for r in redovi]
    print(f'Tekstova: {len(redovi)} od {OCEKIVANO}  (jedinstvenih kljuceva {len(jedinstveni)}), reci {ukupno_reci}')
    print(f'Pasusa po tekstu: najmanje {min(pas)}, najvise {max(pas)}, prosek {sum(pas) / len(pas):.1f}')
    print(f'Fale ({len(nema)}):', ', '.join(nema) if nema else '-')
    print(f'Ostaci HTML-a: {len(losi)}  |  kraci od 30 reci: {len(prazni)}')
    print(f'NEPOTPUNI (odseceni na sajtu, nisu u CSV-u): {len(nepotpuni)}', ', '.join(nepotpuni) if nepotpuni else '')
    if ispravke:
        nepogodjene = [i for i in range(len(ispravke)) if i not in primenjene]
        print(f'Ispravke: {len(ispravke)}, primenjeno {sum(primenjene.values())} mesta, nepogodjenih {len(nepogodjene)}')
        for i in nepogodjene:
            print('   nije nadjeno:', ispravke[i])
    print('CSV:', CSV_CILJ)
    print('SQL:', SQL_CILJ)
    if losi or len(redovi) + len(nema) + len(nepotpuni) != OCEKIVANO:
        sys.exit(1)


if __name__ == '__main__':
    main()
