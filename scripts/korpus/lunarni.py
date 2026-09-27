"""
Lunarni kalendar astrologa: 7 faza x 12 znakova x 5 oblasti = 420 tekstova.

    python3 scripts/korpus/lunarni.py        # CSV za `lunar_texts` + brojanje

Izvor: ~/Desktop/Astroshop App/Lunarni kalendar/ — jedan .docx po fazi. Svaki
ima naslov "<Faza> u <Znaku>" pa pet oblasti ("Ljubav i odnosi", "Zdravlje i
lepota", "Karijera i finansije", "Kuca", "Basta"), svaka sa pasusom uvoda i
listom saveta.

Kljuc: lunar.<faza>.<znak>.<oblast>, npr. lunar.full.taurus.basta. Faza i
znak su isti kljucevi kao `lunarPhase()` u moon.ts i `SIGNS` u zodiac.ts,
oblast kao `LUNAR_AREAS`. Kao i kod tranzita, format kljuca se ne menja posle
prvog uvoza.

Lektura i ujednacene liste idu istim putem kao tranzit: `ispravke.json` pored
.docx fajlova + `ispravke.pravila` + `liste.ujednaci`. .docx se ne dira.
"""
import csv
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from parse_docx import docx_fajlovi, pasusi
import ispravke
import liste

IZVOR = Path('/Users/ivankrstic/Desktop/Astroshop App/Lunarni kalendar')
CILJ = IZVOR / 'lunar-texts.csv'
ISPRAVKE = IZVOR / 'ispravke.json'

# Faza po NASLOVU u dokumentu, ne po imenu fajla. Dva opadajuca se razlikuju
# samo po fajlu ("5. Waning Gibbous" / "7. Waning Crescent"), a naslovi su
# "Opadajuci mesec" i "Opadajuci Mesec" — zato se oni vezuju za broj fajla.
FAZE_PO_FAJLU = {
    '1': 'new', '2': 'waxing', '3': 'first_quarter', '4': 'full',
    '5': 'waning_gibbous', '6': 'last_quarter', '7': 'waning_crescent',
}
FAZE_SR = {
    'new': 'Mlad mesec', 'waxing': 'Rastući mesec', 'first_quarter': 'Prva četvrt',
    'full': 'Pun mesec', 'waning_gibbous': 'Opadajući mesec (posle punog)',
    'last_quarter': 'Poslednja četvrt', 'waning_crescent': 'Opadajući mesec (pred mladi)',
}
# Lokativ -> kljuc znaka. "Skorpionu" je astrologov oblik, "Skorpiji" je nas.
ZNACI = {
    'ovnu': 'aries', 'biku': 'taurus', 'blizancima': 'gemini', 'raku': 'cancer',
    'lavu': 'leo', 'devici': 'virgo', 'vagi': 'libra', 'škorpionu': 'scorpio',
    'škorpiji': 'scorpio', 'strelcu': 'sagittarius', 'jarcu': 'capricorn',
    'vodoliji': 'aquarius', 'ribama': 'pisces',
}
# Oblast po korenu — "Kuće" (omaska kod Opadajuceg u Lavu) je i dalje Kuca.
OBLASTI = [
    (re.compile(r'^ljubav', re.I), 'ljubav'), (re.compile(r'^zdravlj', re.I), 'zdravlje'),
    (re.compile(r'^karijer', re.I), 'karijera'), (re.compile(r'^ku[cć]', re.I), 'kuca'),
    (re.compile(r'^ba[sš]t', re.I), 'basta'),
]
NASLOV = re.compile(r'^(.+?)\s+u\s+(' + '|'.join(ZNACI) + r')\s*$', re.I)


def oblast(t: str):
    if len(t) > 30:
        return None
    return next((k for obrazac, k in OBLASTI if obrazac.match(t.strip())), None)


def parsiraj(putanja: Path) -> list[dict]:
    faza = FAZE_PO_FAJLU[putanja.name.split('.')[0].strip()]
    out, znak, obl, tekst = [], None, None, []

    def zatvori():
        if znak and obl:
            out.append({'key': f'lunar.{faza}.{znak}.{obl}', 'version': 'lunar',
                        'phase': faza, 'sign': znak, 'area': obl, 'body': '\n\n'.join(tekst)})

    for p in pasusi(putanja):
        t = p['text'].strip()
        m = NASLOV.match(t)
        if m and len(t) < 50:
            zatvori()
            znak, obl, tekst = ZNACI[m.group(2).lower()], None, []
        elif znak and oblast(t):
            zatvori()
            obl, tekst = oblast(t), []
        elif znak and obl:
            tekst.append(t)
    zatvori()
    return out


def telo(t: str) -> str:
    """Pasusi ostaju pasusi; uzastopni redovi sa bulletom postaju jedna lista
    u obliku "• Naslov – tekst" / "• tekst" (isto kao duga verzija tranzita)."""
    delovi, lista = [], []
    for red in [r.strip() for r in t.split('\n') if r.strip()]:
        if re.match(r'^[•·▪◦●*]\s*', red):
            lista.append(red)
            continue
        if lista:
            delovi.append(liste.ujednaci('\n'.join(lista)))
            lista = []
        delovi.append(red)
    if lista:
        delovi.append(liste.ujednaci('\n'.join(lista)))
    return '\n\n'.join(delovi)


def ucitaj() -> dict:
    zapisi = {}
    for f in docx_fajlovi(IZVOR):
        for r in parsiraj(f):
            zapisi.setdefault((r['key'], 'lunar'), r)
    return zapisi


def main():
    zapisi = ucitaj()
    nenadjene = ispravke.primeni(zapisi, ISPRAVKE)
    for x in nenadjene:
        print(f"  ispravka nije primenjena: {x['kljuc']} | {x['original']!r}")
    for r in zapisi.values():
        r['body'] = telo(r['body'])

    ocekivano = {(f, z, o) for f in FAZE_SR for z in set(ZNACI.values())
                 for o in ('ljubav', 'zdravlje', 'karijera', 'kuca', 'basta')}
    imamo = {(r['phase'], r['sign'], r['area']) for r in zapisi.values()}
    for f, z, o in sorted(ocekivano - imamo):
        print(f'  FALI: {f} {z} {o}')

    with open(CILJ, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['key', 'phase', 'sign', 'area', 'body'], quoting=csv.QUOTE_ALL)
        w.writeheader()
        for k in sorted(zapisi):
            r = zapisi[k]
            w.writerow({x: r[x] for x in ('key', 'phase', 'sign', 'area', 'body')})
    print(f'{CILJ}\n{len(zapisi)} tekstova od {len(ocekivano)}')


if __name__ == '__main__':
    main()
