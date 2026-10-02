#!/usr/bin/env python3
"""
Deli korpus astrologa na serije za prevod (noc 2.10.2026).

Izvori (srpski, posle lekture — skripta ih samo CITA):
  transit  ~/Desktop/Astroshop App/Tranziti AstroShop/transit-texts.csv
  natal    files/natal-texts.csv (u .gitignore; trazi se u glavnom folderu projekta)
  lunar    ~/Desktop/Astroshop App/Lunarni kalendar/lunar-texts.csv

Izlaz: ~/Desktop/Astroshop App/Prevod korpusa/rad/ulaz/<serija>.json — redovi u obliku
koji prevodilac vraca (sections kao lista, ne JSON string), plus serije.json (redosled)
i pregled-uzorak.json (uzorak za recenzente).

Redosled (najvidljivije prvo): natal free -> transit short -> lunar -> natal ostalo -> transit long.
Korpus NE ide u repo (pravilo 7) — zato sve stoji na Desktopu.

  python3 scripts/prevod/korpus-serije.py
"""
import csv, json, random, sys
from pathlib import Path

DESK = Path.home() / 'Desktop' / 'Astroshop App'
REPO = Path.home() / 'Developer' / 'astroshop'
IZVORI = {
    'transit': DESK / 'Tranziti AstroShop' / 'transit-texts.csv',
    'natal': REPO / 'files' / 'natal-texts.csv',
    'lunar': DESK / 'Lunarni kalendar' / 'lunar-texts.csv',
}
RAD = DESK / 'Prevod korpusa' / 'rad'
ULAZ = RAD / 'ulaz'

# Polja koja se prevode; ostala se prepisuju.
PREVODI = {
    'transit': ['title', 'body', 'positive', 'challenge', 'advice', 'sections'],
    'natal': ['title', 'subtitle', 'body'],
    'lunar': ['body'],
}


def ucitaj(izvor):
    with open(IZVORI[izvor], encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))


def red_za_prevod(izvor, i, r):
    o = {'izvor': izvor, 'red': i}
    for k, v in r.items():
        o[k] = (json.loads(v) if v else []) if k == 'sections' else v
    return o


def reci(izvor, deo):
    n = 0
    for x in deo:
        for k in PREVODI[izvor]:
            if k == 'sections':
                n += sum(len((h['heading'] + ' ' + h['body']).split()) for h in x[k])
            else:
                n += len(x[k].split())
    return n


def main():
    ULAZ.mkdir(parents=True, exist_ok=True)
    rows = {k: ucitaj(k) for k in IZVORI}
    tr, na, lu = rows['transit'], rows['natal'], rows['lunar']
    grupe = [
        # (grupa, izvor, [indeksi], velicina serije)
        ('A-natal-free', 'natal', [i for i, r in enumerate(na) if r['free'] == 'true'], 12),
        ('B-transit-short', 'transit', [i for i, r in enumerate(tr) if r['version'] == 'short'], 40),
        ('C-lunar', 'lunar', list(range(len(lu))), 28),
        ('D-natal-ostalo', 'natal', [i for i, r in enumerate(na) if r['free'] != 'true'], 30),
        ('E-transit-long', 'transit', [i for i, r in enumerate(tr) if r['version'] == 'long'], 14),
    ]
    serije = []
    for g, izvor, idx, n in grupe:
        for s in range(0, len(idx), n):
            ime = f'{g}-{s // n + 1:02d}'
            deo = [red_za_prevod(izvor, i, rows[izvor][i]) for i in idx[s:s + n]]
            (ULAZ / f'{ime}.json').write_text(json.dumps(deo, ensure_ascii=False, indent=1), encoding='utf-8')
            serije.append({'serija': ime, 'grupa': g, 'izvor': izvor, 'redova': len(deo), 'reci': reci(izvor, deo)})

    # Uzorak za pregled (~15%): ono sto korisnik najcesce vidi + nasumicno. Natal free ceo.
    random.seed(20261002)
    BRZE = ('sun', 'moon', 'mercury', 'venus', 'mars')

    def tranzit_cest(r):
        p = r['key'].split('.')
        return p[1] in BRZE and p[4] in ('sun', 'moon', 'ascendant', 'venus', 'mars')

    def uzorak(izvor, idx, cest, ukupno):
        c = [i for i in idx if cest(rows[izvor][i])]
        random.shuffle(c)
        c = c[: int(ukupno * 0.66)]
        ostali = [i for i in idx if i not in c]
        return sorted(c + random.sample(ostali, max(0, ukupno - len(c))))

    pregled = {}
    for g, izvor, idx, n in grupe:
        if g.startswith('A'):
            sel = idx
        elif g.startswith('B') or g.startswith('E'):
            sel = uzorak(izvor, idx, tranzit_cest, round(len(idx) * 0.15))
        elif g.startswith('C'):
            sel = uzorak(izvor, idx, lambda r: r['area'] in ('ljubav', 'zdravlje'), round(len(idx) * 0.15))
        else:
            sel = uzorak(izvor, idx, lambda r: r['kind'] == 'sign', round(len(idx) * 0.15))
        pregled[g] = {'izvor': izvor, 'redovi': sel}
    (RAD / 'pregled-uzorak.json').write_text(json.dumps(pregled, indent=1), encoding='utf-8')
    (RAD / 'serije.json').write_text(json.dumps(serije, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(serije)} serija, {sum(s["redova"] for s in serije)} redova, {sum(s["reci"] for s in serije)} reci')
    for g, *_ in grupe:
        ss = [s for s in serije if s['grupa'] == g]
        print(f'  {g}: {len(ss)} serija, {sum(s["redova"] for s in ss)} redova, '
              f'{sum(s["reci"] for s in ss)} reci, uzorak za pregled {len(pregled[g]["redovi"])}')


if __name__ == '__main__':
    sys.exit(main())
